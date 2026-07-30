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

export default function LogisticSupport() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [tickets, setTickets] = useState([]);
  const [allSupportPersons, setAllSupportPersons] = useState([]);
  const [activeTab, setActiveTab] = useState("tickets");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [resolveForm, setResolveForm] = useState({});
  const [reassignForm, setReassignForm] = useState({});
  const [reassigning, setReassigning] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);

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
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => (t.status || "open") === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "DM Sans, sans-serif" }}>
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
            {[["all", "All"], ["open", "🔓 Open"], ["resolved", "✅ Resolved"]].map(([key, label]) => (
              <button key={key} onClick={() => setStatusFilter(key)} style={{
                padding: "6px 14px", borderRadius: 18, fontSize: 12, cursor: "pointer",
                border: statusFilter === key ? "none" : "1px solid #d1d5db",
                background: statusFilter === key ? "#0ea5e9" : "white",
                color: statusFilter === key ? "white" : "#555", fontWeight: statusFilter === key ? 700 : 400,
              }}>{label} ({counts[key] ?? 0})</button>
            ))}
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
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "white", minWidth: 1000 }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#0369a1,#0ea5e9)", position: "sticky", top: 0 }}>
                    {["Ticket No", "Date", "Category", "Customer", "Raised By", "Issue", "Image", "Status", "Action"].map((h, i) => (
                      <th key={i} style={{ padding: "12px 12px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
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
                          <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 11, fontWeight: 800, color: "#0369a1" }}>#{t.ticketNumber || "—"}</div></td>
                          <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 11 }}>{t.date || "—"}</div></td>
                          <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 12, fontWeight: 700 }}>{t.category || "—"}</div></td>
                          <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8" }}>{t.customer || "—"}</div></td>
                          <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 11, fontWeight: 700 }}>{t.raisedByName || "—"}</div></td>
                          <td style={{ padding: "10px 12px", maxWidth: 200 }}><div style={{ fontSize: 11, color: "#374151" }}>{t.description}</div></td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            {t.productImage ? (
                              <button onClick={() => setExpandedImage(prev => prev === id ? null : id)}
                                style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10 }}>
                                📷 {expandedImage === id ? "Hide" : "View"}
                              </button>
                            ) : <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s] }}>{s.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {s !== "resolved" && (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => setResolveForm(p => ({ ...p, [id]: { ...p[id], show: !p[id]?.show } }))}
                                  style={{ background: "#10b981", color: "white", border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✅ Resolve</button>
                                <button onClick={() => setReassignForm(p => ({ ...p, [id]: { ...p[id], show: !p[id]?.show } }))}
                                  style={{ background: "#f59e0b", color: "white", border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>🔄 Reassign</button>
                              </div>
                            )}
                            {s === "resolved" && <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>✅ Done</div>}
                          </td>
                        </tr>

                        {expandedImage === id && t.productImage && (
                          <tr><td colSpan={9} style={{ padding: "12px 20px", background: "#f0fdf4" }}>
                            <img src={t.productImage} alt="Product" style={{ maxHeight: 200, borderRadius: 8, border: "2px solid #86efac" }} />
                          </td></tr>
                        )}

                        {resolveForm[id]?.show && s !== "resolved" && (
                          <tr style={{ background: "#f0fdf4" }}>
                            <td colSpan={9} style={{ padding: "16px 20px" }}>
                              <div style={{ background: "#ecfdf5", border: "2px solid #10b981", borderRadius: 12, padding: "16px 20px", maxWidth: 600 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46", marginBottom: 10 }}>✅ Resolve Ticket #{t.ticketNumber}</div>
                                <textarea rows={3} placeholder="Write what was resolved..."
                                  value={resolveForm[id]?.notes || ""}
                                  onChange={e => setResolveForm(p => ({ ...p, [id]: { ...p[id], notes: e.target.value } }))}
                                  style={{ width: "100%", padding: "10px 12px", border: "2px solid #6ee7b7", borderRadius: 8, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                                  <button onClick={() => handleResolve(id)} style={{ background: "#10b981", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800 }}>✅ Confirm Resolve</button>
                                  <button onClick={() => setResolveForm(p => ({ ...p, [id]: { ...p[id], show: false } }))} style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12 }}>Cancel</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {reassignForm[id]?.show && s !== "resolved" && (
                          <tr style={{ background: "#fffdf0" }}>
                            <td colSpan={9} style={{ padding: "16px 20px" }}>
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