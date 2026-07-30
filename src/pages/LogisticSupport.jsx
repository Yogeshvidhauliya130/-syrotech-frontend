import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RaiseLogisticTicket from "./RaiseLogisticTicket";

const BASE_URL = "https://api.syrotech.com";

const STATUS_COLOR = { open: "#e04e00", resolved: "#1a7a46", reopened: "#dc2626" };
const STATUS_BG    = { open: "#fff4ee", resolved: "#edfaf3", reopened: "#fee2e2" };

// Same style auto-next-level logic as SupportDashboard.jsx, restricted to "Logistics" specialization
function getAutoNextLogisticLevel(allPersons, currentUserName, allTickets) {
  const me = allPersons.find(p => p.name && currentUserName && p.name.toLowerCase().trim() === currentUserName.toLowerCase().trim());
  const currentLevel = me?.level || 1;
  const nextLevel = currentLevel + 1;
  if (nextLevel > 3) return null;

  const countOpen = (name) => allTickets.filter(t => t.assignTo === name).length;
  const matched = allPersons.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return p.level === nextLevel && specs.includes("Logistics");
  });
  if (matched.length === 0) return null;
  return matched.reduce((best, p) => countOpen(p.name) < countOpen(best.name) ? p : best, matched[0]);
}

const openImageInNewTab = (imgSrc) => {
  const win = window.open("", "_blank");
  win.document.write(`<html><body style="margin:0;background:#111;display:flex;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;"><img src="${imgSrc}" style="max-width:100%;height:auto;border-radius:8px;" /></body></html>`);
  win.document.close();
};

export default function LogisticSupport() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [tickets, setTickets] = useState([]);
  const [allSupportPersons, setAllSupportPersons] = useState([]);
  const [activeTab, setActiveTab] = useState("tickets");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateSort, setDateSort] = useState("newest");
  const [resolveForm, setResolveForm] = useState({});
  const [reassignForm, setReassignForm] = useState({});
  const [reassigning, setReassigning] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);

  // ✅ New popups (matching Production style)
  const [productPopup, setProductPopup] = useState(null);
  const [customerPopup, setCustomerPopup] = useState(null);
  const [raisedByPopup, setRaisedByPopup] = useState(null);
  const [issuePopup, setIssuePopup] = useState(null);
  const [statusUpdatePopup, setStatusUpdatePopup] = useState(null);
  const [statusUpdateForm, setStatusUpdateForm] = useState({});

  const fetchTickets = () => {
    fetch(`${BASE_URL}/tickets?assignTo=${encodeURIComponent(currentUser?.name || "")}&ticketType=logistic&limit=2000`)
      .then(r => r.json())
      .then(data => setTickets(data.tickets || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(users => setAllSupportPersons(users.filter(u => u.role === "support" && u.approved)))
      .catch(console.error);
  }, []);

  const handleResolve = (ticketId) => {
    const notes = resolveForm[ticketId]?.notes?.trim();
    if (!notes) { alert("Please write what was resolved."); return; }
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "resolved",
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser?.name,
        resolutionNotes: notes,
      }),
    })
      .then(r => r.json())
      .then(() => { setResolveForm(p => { const n = { ...p }; delete n[ticketId]; return n; }); fetchTickets(); })
      .catch(console.error);
  };

  const handleReassign = (ticketId) => {
    const reason = reassignForm[ticketId]?.reason?.trim();
    if (!reason || reason.length < 5) { alert("Please enter a reason (min 5 characters)."); return; }
    const ticket = tickets.find(t => (t.id || t._id) === ticketId);
    const next = getAutoNextLogisticLevel(allSupportPersons, currentUser?.name, tickets);
    if (!next) { alert("❌ No higher level logistic engineer available."); return; }

    setReassigning(ticketId);
    const historyEntry = { from: currentUser?.name, to: next.name, reason, timestamp: new Date().toISOString() };
    const existingHistory = Array.isArray(ticket?.reassignHistory) ? ticket.reassignHistory : [];

    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignTo: next.name,
        reassignedFrom: currentUser?.name,
        reassignReason: reason,
        reassignedAt: new Date().toISOString(),
        reassignHistory: [...existingHistory, historyEntry],
        status: "open",
      }),
    })
      .then(r => r.json())
      .then(() => {
        setReassigning(null);
        setReassignForm(p => { const n = { ...p }; delete n[ticketId]; return n; });
        alert(`✅ Reassigned to ${next.name} (Level ${next.level})`);
        fetchTickets();
      })
      .catch(() => setReassigning(null));
  };

  // ✅ Submit a status update (like Production's status update form)
  const submitStatusUpdate = () => {
    const note = statusUpdateForm.note?.trim();
    if (!note) { alert("Please write an update note."); return; }
    const ticketId = statusUpdateForm.id;
    const ticket = tickets.find(t => (t.id || t._id) === ticketId);
    const newEntry = { note, updatedBy: currentUser?.name, updatedAt: new Date().toISOString() };
    const existing = Array.isArray(ticket?.statusUpdates) ? ticket.statusUpdates : [];
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusUpdates: [...existing, newEntry], latestStatusUpdate: note }),
    })
      .then(() => { setStatusUpdateForm({}); fetchTickets(); })
      .catch(console.error);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  const displayed = tickets
    .filter(t => statusFilter === "all" || (t.status || "open") === statusFilter)
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (t.category || "").toLowerCase().includes(q) || (t.customer || "").toLowerCase().includes(q) || (t.raisedByName || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.date).getTime();
      const db = new Date(b.createdAt || b.date).getTime();
      return dateSort === "newest" ? db - da : da - db;
    });

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => (t.status || "open") === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    reopened: tickets.filter(t => (t.status || "").toLowerCase() === "reopened").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "DM Sans, sans-serif" }}>

      {/* Product Popup */}
      {productPopup && (
        <div onClick={() => setProductPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fad8be" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#c94500" }}>📦 Product Details</div>
              <button onClick={() => setProductPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#fff8f2", borderRadius: 10, padding: "14px 16px", border: "1px solid #fad8be" }}>
              {[["🔧 Category", productPopup.category], ["📂 Sub Category", productPopup.subCategory], ["📐 Item Name", productPopup.model], ["🔢 Serial No", productPopup.serialNo], ["📡 MAC Address", productPopup.mac]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 120 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer Popup */}
      {customerPopup && (
        <div onClick={() => setCustomerPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #bfdbfe" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8" }}>👤 Customer Details</div>
              <button onClick={() => setCustomerPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#eff6ff", borderRadius: 10, padding: "14px 16px", border: "1px solid #bfdbfe" }}>
              {[["👤 Name", customerPopup.customer], ["🏢 Company", customerPopup.companyName], ["✉️ Email", customerPopup.email], ["📞 Phone", customerPopup.phone], ["🏙️ City", customerPopup.city], ["🗺️ State", customerPopup.state], ["🌍 Country", customerPopup.country], ["📮 Pincode", customerPopup.pincode]].map(([label, val]) => val ? (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 90 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val}</div>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      )}

      {/* Raised By Popup */}
      {raisedByPopup && (
        <div onClick={() => setRaisedByPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #d1fae5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>🙋 Raised By</div>
              <button onClick={() => setRaisedByPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "14px 16px", border: "1px solid #bbf7d0" }}>
              {[["👤 Name", raisedByPopup.name], ["✉️ Email", raisedByPopup.email], ["🎭 Role", raisedByPopup.role]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 100 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History (Issue) Popup */}
      {issuePopup && (
        <div onClick={() => setIssuePopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #c4b5fd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#5b21b6" }}>📋 Ticket History</div>
              <button onClick={() => setIssuePopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            {(() => {
              const allHistory = [{
                description: issuePopup.firstDescription || issuePopup.description,
                raisedAt: issuePopup.firstCreatedAt || issuePopup.createdAt,
                raisedByName: issuePopup.firstRaisedByName || issuePopup.raisedByName,
                resolvedNotes: issuePopup.firstResolvedNotes || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolutionNotes : null) || null,
                resolvedAt: issuePopup.firstResolvedAt || null,
                resolvedBy: issuePopup.firstResolvedBy || null,
              }];
              if (Array.isArray(issuePopup.issueHistory)) {
                issuePopup.issueHistory.forEach(h => {
                  allHistory.push({
                    description: h.description,
                    raisedAt: h.raisedAt,
                    raisedByName: h.raisedByName,
                    resolvedNotes: h.resolvedNotes || null,
                    resolvedAt: h.resolvedAt || null,
                    resolvedBy: h.resolvedBy || null,
                  });
                });
              }
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>
                    📋 Ticket History — {allHistory.length} Stage{allHistory.length > 1 ? "s" : ""}
                  </div>
                  {allHistory.map((h, i) => (
                    <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", fontSize: 12 }}>
                      <div style={{ background: "#f9fafb", padding: "7px 10px", borderLeft: "3px solid #6b7280" }}>
                        <div style={{ fontWeight: 700, color: "#374151", marginBottom: 2 }}>
                          🔴 Stage {i + 1}
                          {h.raisedAt && <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400, marginLeft: 6 }}>{new Date(h.raisedAt).toLocaleString()}</span>}
                          {h.raisedByName && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>· {h.raisedByName}</span>}
                        </div>
                        <div style={{ color: "#374151" }}>{h.description || "—"}</div>
                      </div>
                      {h.resolvedNotes ? (
                        <div style={{ background: "#f0fdf4", padding: "6px 10px", borderLeft: "3px solid #10b981" }}>
                          <div style={{ fontWeight: 700, color: "#059669", fontSize: 11, marginBottom: 2 }}>
                            ✅ Resolved
                            {h.resolvedAt && <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400, marginLeft: 6 }}>{new Date(h.resolvedAt).toLocaleString()}</span>}
                            {h.resolvedBy && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>· {h.resolvedBy}</span>}
                          </div>
                          <div style={{ color: "#374151" }}>{h.resolvedNotes}</div>
                        </div>
                      ) : (
                        <div style={{ background: "#fffbeb", padding: "5px 10px", borderLeft: "3px solid #f59e0b" }}>
                          <div style={{ color: "#92400e", fontSize: 11 }}>⏳ Pending...</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Status Update Form Popup */}
      {statusUpdateForm?.show && (
        <div onClick={() => setStatusUpdateForm({})} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "28px 32px", maxWidth: 560, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #bfdbfe" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1d4ed8" }}>📝 Status Update</div>
              <button onClick={() => setStatusUpdateForm({})} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Update Note <span style={{ color: "#ef4444" }}>*</span></div>
              <textarea rows={5} placeholder="Describe the current status..."
                value={statusUpdateForm.note || ""}
                onChange={e => setStatusUpdateForm(p => ({ ...p, note: e.target.value }))}
                style={{ width: "100%", padding: "11px 14px", border: "2px solid #bfdbfe", borderRadius: 10, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", color: "#111", lineHeight: 1.6 }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={submitStatusUpdate} style={{ flex: 1, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "white", border: "none", padding: "12px 24px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 800, fontFamily: "inherit" }}>
                ✅ Submit Update
              </button>
              <button onClick={() => setStatusUpdateForm({})} style={{ background: "#e2e8f0", border: "none", borderRadius: 10, padding: "12px 20px", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update History Popup */}
      {statusUpdatePopup && (
        <div onClick={() => setStatusUpdatePopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 500, width: "100%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #bfdbfe" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8" }}>📝 Status Update History</div>
              <button onClick={() => setStatusUpdatePopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            {Array.isArray(statusUpdatePopup) && statusUpdatePopup.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {statusUpdatePopup.map((entry, i) => (
                  <div key={i} style={{ borderRadius: 8, border: "1px solid #e5e7eb", overflow: "hidden", fontSize: 12 }}>
                    <div style={{ background: "#eff6ff", padding: "6px 12px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, color: "#1d4ed8" }}>Update {i + 1}</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{new Date(entry.updatedAt).toLocaleString()}</span>
                    </div>
                    <div style={{ padding: "8px 12px", background: "white" }}>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>By: <strong>{entry.updatedBy}</strong></div>
                      <div style={{ color: "#374151", lineHeight: 1.5 }}>{entry.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>No status updates yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0369a1,#0ea5e9)", color: "white", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Syrotech Networks — Logistics Support</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>📦 {currentUser?.name}</div>
        </div>
        <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", color: "white", padding: "6px 16px", borderRadius: 6, cursor: "pointer" }}>Logout</button>
      </div>

      <div style={{ background: "white", borderBottom: "2px solid #e5e7eb", padding: "0 28px", display: "flex" }}>
        {[["tickets", `📦 Assigned Tickets (${counts.all})`], ["raise", "➕ Raise Logistic Ticket"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: "14px 22px", fontSize: 13, fontWeight: activeTab === key ? 800 : 500,
            color: activeTab === key ? "#0369a1" : "#6b7280", background: "none", border: "none",
            borderBottom: activeTab === key ? "3px solid #0ea5e9" : "3px solid transparent", cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {activeTab === "raise" && (
        <div style={{ maxWidth: 700, margin: "28px auto", padding: "0 16px" }}>
          <RaiseLogisticTicket onSuccess={() => setActiveTab("tickets")} />
        </div>
      )}

      {activeTab === "tickets" && (
        <div style={{ maxWidth: 1200, margin: "28px auto", padding: "0 16px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            {[["all", "All"], ["open", "🔓 Open"], ["resolved", "✅ Resolved"], ["reopened", "🔄 Reopened"]].map(([key, label]) => (
              <button key={key} onClick={() => setStatusFilter(key)} style={{
                padding: "6px 14px", borderRadius: 18, fontSize: 12, cursor: "pointer",
                border: statusFilter === key ? "none" : "1px solid #d1d5db",
                background: statusFilter === key ? "#0ea5e9" : "white",
                color: statusFilter === key ? "white" : "#555", fontWeight: statusFilter === key ? 700 : 400,
              }}>{label} ({counts[key] ?? 0})</button>
            ))}
            <div style={{ width: 1, height: 20, background: "#e0d8d0" }} />
            <select value={dateSort} onChange={e => setDateSort(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 12, cursor: "pointer" }}>
              <option value="newest">Newest First ↓</option>
              <option value="oldest">Oldest First ↑</option>
            </select>
            <input placeholder="🔍 Search category, customer, raised by..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: 220, padding: "7px 14px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: 12, outline: "none" }} />
          </div>

          {tickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 14, color: "#aaa" }}>
              <div style={{ fontSize: 48 }}>📦</div>
              <p>No logistic tickets assigned yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: "scroll", overflowY: "auto", maxHeight: "72vh", borderRadius: 12, border: "1.5px solid #e0d8d0" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "white", minWidth: 1100 }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#0369a1,#0ea5e9)", position: "sticky", top: 0, zIndex: 2 }}>
                    {["Ticket No", "Date", "Category", "Product Details", "Customer", "Raised By", "Image", "History", "Status", "Status Update", "Action"].map((h, i) => (
                      <th key={i} style={{ padding: "12px 12px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((t, idx) => {
                    const s = (t.status || "open").toLowerCase();
                    const id = t.id || t._id;
                    return (
                      <>
                        <tr key={id} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f0f9ff" : "white", borderLeft: `4px solid ${STATUS_COLOR[s] || "#ccc"}` }}>

                          {/* Ticket No */}
                          <td style={{ padding: "10px 12px", whiteSpace: "nowrap", borderRight: "1px solid #e0d8d0" }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: "#0369a1" }}>#{t.ticketNumber || "—"}</div>
                          </td>

                          {/* Date */}
                          <td style={{ padding: "10px 12px", whiteSpace: "nowrap", borderRight: "1px solid #e0d8d0" }}>
                            <div style={{ fontSize: 11, color: "#374151" }}>{t.date || "—"}</div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: "10px 12px", borderRight: "1px solid #e0d8d0" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{t.category || "—"}</div>
                          </td>

                          {/* Product Details — popup */}
                          <td style={{ padding: "10px 12px", borderRight: "1px solid #e0d8d0", cursor: "pointer" }}
                            onClick={() => setProductPopup({ category: t.category, subCategory: t.subCategory, model: t.model, serialNo: t.serialNo, mac: t.mac })}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textDecoration: "underline", textDecorationStyle: "dotted", whiteSpace: "nowrap" }}>
                              {t.model || "—"}
                            </div>
                            <div style={{ fontSize: 10, color: "#6b7280" }}>{t.subCategory || ""}</div>
                          </td>

                          {/* Customer — popup */}
                          <td style={{ padding: "10px 12px", borderRight: "1px solid #e0d8d0", cursor: "pointer" }}
                            onClick={() => setCustomerPopup({ customer: t.customer, companyName: t.companyName, email: t.email, phone: t.phone, city: t.city, state: t.state, country: t.country, pincode: t.pincode })}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#93c5fd" }}>
                              {t.customer || "—"}
                            </div>
                          </td>

                          {/* Raised By — popup */}
                          <td style={{ padding: "10px 12px", borderRight: "1px solid #e0d8d0", cursor: "pointer" }}
                            onClick={() => {
                              const raiserPerson = allSupportPersons.find(p => p.email && t.raisedBy && p.email.toLowerCase().trim() === t.raisedBy.toLowerCase().trim());
                              setRaisedByPopup({ name: t.raisedByName || "—", email: t.raisedBy || raiserPerson?.email || "—", role: raiserPerson?.role || "Sales" });
                            }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textDecoration: "underline", textDecorationStyle: "dotted", whiteSpace: "nowrap" }}>
                              {t.raisedByName || "—"}
                            </div>
                          </td>

                          {/* Image */}
                          <td style={{ padding: "10px 12px", textAlign: "center", borderRight: "1px solid #e0d8d0" }}>
                            {t.productImage ? (
                              <button onClick={() => setExpandedImage(prev => prev === id ? null : id)}
                                style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#065f46" }}>
                                📷 {expandedImage === id ? "Hide" : "View"}
                              </button>
                            ) : <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>}
                          </td>

                          {/* History (renamed from Issue) — popup */}
                          <td style={{ padding: "10px 12px", borderRight: "1px solid #e0d8d0" }}>
                            <div onClick={() => setIssuePopup({
                              description: t.description,
                              firstDescription: t.firstDescription || t.description,
                              firstCreatedAt: t.firstCreatedAt || t.createdAt,
                              firstRaisedByName: t.firstRaisedByName || t.raisedByName,
                              firstResolvedNotes: t.firstResolvedNotes || (Array.isArray(t.issueHistory) && t.issueHistory.length === 0 ? t.resolutionNotes : null) || null,
                              firstResolvedAt: t.firstResolvedAt || null,
                              firstResolvedBy: t.firstResolvedBy || null,
                              issueHistory: t.issueHistory,
                              resolutionNotes: t.resolutionNotes,
                            })} style={{ fontSize: 10, color: "#7c3aed", cursor: "pointer", fontWeight: 700, background: "#f5f3ff", padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>
                              📋 {(Array.isArray(t.issueHistory) ? t.issueHistory.length : 0) + 1} History
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: "10px 12px", borderRight: "1px solid #e0d8d0" }}>
                            <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s], display: "inline-block" }}>
                              {s.toUpperCase()}
                            </span>
                          </td>

                          {/* Status Update column */}
                          <td style={{ padding: "10px 12px", borderRight: "1px solid #e0d8d0" }}>
                            {Array.isArray(t.statusUpdates) && t.statusUpdates.length > 0 && (
                              <div onClick={() => setStatusUpdatePopup(t.statusUpdates)}
                                style={{ fontSize: 10, color: "#1d4ed8", cursor: "pointer", fontWeight: 700, background: "#eff6ff", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginBottom: 6 }}>
                                📝 {t.statusUpdates.length} Update{t.statusUpdates.length > 1 ? "s" : ""} — View
                              </div>
                            )}
                            {s !== "resolved" && (
                              <button onClick={() => setStatusUpdateForm({ show: true, id, note: "" })}
                                style={{ background: "#1d4ed8", color: "white", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, display: "block", marginTop: 4 }}>
                                📝 Update
                              </button>
                            )}
                          </td>

                          {/* Action */}
                          <td style={{ padding: "10px 12px" }}>
                            {s !== "resolved" && (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => setResolveForm(p => ({ ...p, [id]: { ...p[id], show: !p[id]?.show } }))}
                                  style={{ background: resolveForm[id]?.show ? "#ecfdf5" : "#10b981", color: resolveForm[id]?.show ? "#065f46" : "white", border: resolveForm[id]?.show ? "1.5px solid #6ee7b7" : "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                                  ✅ {resolveForm[id]?.show ? "Cancel" : "Resolve"}
                                </button>
                                <button onClick={() => setReassignForm(p => ({ ...p, [id]: { ...p[id], show: !p[id]?.show } }))}
                                  style={{ background: "#f59e0b", color: "white", border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                                  🔄 Reassign
                                </button>
                              </div>
                            )}
                            {s === "resolved" && <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>✅ Done</div>}
                          </td>
                        </tr>

                        {/* Expanded Image */}
                        {expandedImage === id && t.productImage && (
                          <tr key={`img-${id}`}>
                            <td colSpan={11} style={{ padding: 0, background: "#f0fdf4", borderBottom: "1px solid #86efac" }}>
                              <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16, borderLeft: "4px solid #10b981" }}>
                                <img src={t.productImage} alt="Product" style={{ maxHeight: 220, maxWidth: 300, borderRadius: 10, border: "2px solid #86efac", cursor: "pointer", objectFit: "contain", background: "white" }}
                                  onClick={() => openImageInNewTab(t.productImage)} />
                                <div style={{ fontSize: 13, color: "#065f46" }}>
                                  <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 14 }}>📷 Product Image</div>
                                  <div style={{ color: "#6b7280", marginBottom: 4 }}>Product: <strong>{t.category}</strong></div>
                                  <div style={{ color: "#6b7280", marginBottom: 4 }}>Serial No: <strong>{t.serialNo || "—"}</strong></div>
                                  {t.mac && <div style={{ color: "#6b7280", marginBottom: 4 }}>MAC: <strong>{t.mac}</strong></div>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Resolve Form */}
                        {resolveForm[id]?.show && s !== "resolved" && (
                          <tr key={`resolve-${id}`} style={{ background: "#f0fdf4" }}>
                            <td colSpan={11} style={{ padding: "16px 20px" }}>
                              <div style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "2px solid #10b981", borderRadius: 12, padding: "16px 20px", maxWidth: 600 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46", marginBottom: 10 }}>✅ Resolve Ticket #{t.ticketNumber}</div>
                                <textarea rows={3} placeholder="Write what was resolved..."
                                  value={resolveForm[id]?.notes || ""}
                                  onChange={e => setResolveForm(p => ({ ...p, [id]: { ...p[id], notes: e.target.value } }))}
                                  style={{ width: "100%", padding: "10px 12px", border: "2px solid #6ee7b7", borderRadius: 8, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box", color: "#111" }} />
                                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                                  <button onClick={() => handleResolve(id)} style={{ background: "#10b981", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800 }}>✅ Confirm Resolve</button>
                                  <button onClick={() => setResolveForm(p => ({ ...p, [id]: { ...p[id], show: false } }))} style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12 }}>Cancel</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Reassign Form */}
                        {reassignForm[id]?.show && s !== "resolved" && (
                          <tr key={`reassign-${id}`} style={{ background: "#fffdf0" }}>
                            <td colSpan={11} style={{ padding: "16px 20px" }}>
                              <div style={{ background: "#fffbeb", border: "2px solid #f59e0b", borderRadius: 12, padding: "16px 20px", maxWidth: 600 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginBottom: 12 }}>🔄 Reassign Ticket</div>
                                {(() => {
                                  const next = getAutoNextLogisticLevel(allSupportPersons, currentUser?.name, tickets);
                                  return next ? (
                                    <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>✅ Will auto-assign to:</div>
                                      <div style={{ fontSize: 13, fontWeight: 800 }}>{next.name} (Level {next.level})</div>
                                    </div>
                                  ) : (
                                    <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>❌ No higher level logistic engineer available</div>
                                    </div>
                                  );
                                })()}
                                <input placeholder="Reason for reassign (min 5 chars)..."
                                  value={reassignForm[id]?.reason || ""}
                                  onChange={e => setReassignForm(p => ({ ...p, [id]: { ...p[id], reason: e.target.value } }))}
                                  style={{ width: "100%", padding: "10px 12px", border: "2px solid #fcd34d", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                                  <button onClick={() => handleReassign(id)} disabled={reassigning === id}
                                    style={{ background: "#f59e0b", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800 }}>
                                    {reassigning === id ? "⏳ Reassigning..." : "🔄 Confirm Reassign"}
                                  </button>
                                  <button onClick={() => setReassignForm(p => ({ ...p, [id]: { ...p[id], show: false } }))} style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12 }}>Cancel</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Resolved info row */}
                        {s === "resolved" && (
                          <tr key={`res-${id}`} style={{ background: "#f0fdf4" }}>
                            <td colSpan={11} style={{ padding: "8px 20px" }}>
                              <span style={{ fontSize: 12, color: "#065f46", fontWeight: 600 }}>
                                ✅ Resolved by <strong>{t.resolvedBy}</strong>{t.resolutionNotes ? ` — ${t.resolutionNotes}` : ""}
                              </span>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}