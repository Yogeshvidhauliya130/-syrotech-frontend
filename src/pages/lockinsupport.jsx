import { useState, useEffect, useRef } from "react";
import RaiseLockinTicket from "./raiselockinticket";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://api.syrotech.com";

const STATUS_COLOR = {
  open: "#e04e00", pending: "#b45309",
  resolved: "#1a7a46", reopened: "#dc2626",
};
const STATUS_BG = {
  open: "#fff4ee", pending: "#fffbeb",
  resolved: "#edfaf3", reopened: "#fee2e2",
};

function sendWhatsAppFeedback(ticket, supportName) {
  const phone = (ticket.phone || "").replace(/\D/g, "");
  if (!phone || phone.length < 10) {
    alert("❌ Cannot send WhatsApp!\n\nCustomer phone number is missing or invalid.");
    return false;
  }
  const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
  const ticketId = ticket.id || ticket._id;

  fetch(`https://api.syrotech.com/api/feedback/generate-token/${ticketId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then(r => r.json())
    .then(data => {
      const token = data.token;
      const feedbackLink = `https://ticketing.syrotech.com/feedback?ticket=${ticketId}&token=${token}`;
      const message =
  `🎉 *Issue Resolved Successfully!*\n\n` +
  `Hello *${ticket.customer || "Customer"}* 👋\n\n` +
  `✅ Your *${ticket.category || ""}* issue has been resolved!\n\n` +
  `━━━━━━━━━━━━━━━━━━━━\n` +
  `📋 *Ticket Details*\n` +
  `━━━━━━━━━━━━━━━━━━━━\n` +
  `👤 Customer   : *${ticket.customer || "—"}*\n` +
  `📦 Product    : *${ticket.category || "—"}*\n` +
  `🎫 Ticket No  : *#${ticket.ticketNumber || "—"}*\n\n` +
  `⭐ *We'd love your feedback!*\n` +
  `Please take 30 seconds to rate our service:\n` +
  `👉 ${feedbackLink}\n\n` +
  `━━━━━━━━━━━━━━━━━━━━\n` +
  `📞 *Need more help?*\n` +
  `━━━━━━━━━━━━━━━━━━━━\n` +
  `📧 support@syrotech.com\n` +
  `☎️  +91-9870295096\n` +
  `🌐 www.syrotech.com\n\n` +
  `💙 Thank you for choosing *Syrotech Networks!* 🙏`;
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
    })
    .catch(() => {
      alert("❌ Failed to generate feedback link. Please try again.");
    });
  return true;
}
export default function LockinSupport() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [tickets, setTickets]         = useState([]);
  const [resolveForm, setResolveForm] = useState({});
  const [submitting, setSubmitting]   = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [productPopup, setProductPopup] = useState(null);
  const [customerPopup, setCustomerPopup] = useState(null);
  const [raisedByPopup, setRaisedByPopup] = useState(null);
  const [issuePopup, setIssuePopup] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusUpdateForm, setStatusUpdateForm] = useState({});
const [statusUpdatePopup, setStatusUpdatePopup] = useState(null);
const [activeTab, setActiveTab] = useState("tickets");
  const [dateSort, setDateSort]       = useState("newest");

  const fetchTickets = () => {
 fetch(`${BASE_URL}/tickets?assignTo=${encodeURIComponent(currentUser?.name || "")}&ticketType=lockin&limit=2000`)
  .then((r) => r.json())
  .then((data) => {
    setTickets(data.tickets || []);
  })
  .catch(console.error);
  };

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 30000);
    return () => clearInterval(id);
  }, []);

const handleResolve = async (ticketId) => {
  const rf = resolveForm[ticketId] || {};
  if (!rf.notes?.trim()) {
    alert("Please describe what was resolved.");
    return;
  }

  const now = new Date().toISOString();
  const currentTicket = tickets.find(t => (t.id || t._id) === ticketId);

  // ✅ Send WhatsApp FIRST before resolving
  const ticketWithNotes = { ...currentTicket, resolutionNotes: rf.notes.trim(), resolvedAt: now };
  const sent = sendWhatsAppFeedback(ticketWithNotes, currentUser?.name || "Tejvir Singh");
  if (!sent) return; // stop if phone number is invalid

  const existingHistory = Array.isArray(currentTicket?.issueHistory) ? currentTicket.issueHistory : [];
  const updatedHistory = existingHistory.map((entry, i) => {
    if (i === existingHistory.length - 1) {
      return { ...entry, resolvedNotes: rf.notes.trim(), resolvedAt: now, resolvedBy: currentUser?.name || "Tejvir Singh" };
    }
    return entry;
  });

  setSubmitting(ticketId);
  try {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "resolved",
        resolvedAt: now,
        resolvedBy: currentUser?.name || "Tejvir Singh",
        resolutionNotes: rf.notes.trim(),
        resolutionStatus: rf.status,
        issueHistory: updatedHistory,
        feedbackSent: true,
        feedbackSentAt: now,
        feedbackSentBy: currentUser?.name || "Tejvir Singh",
        ...(!(currentTicket?.firstResolvedNotes) ? {
          firstResolvedNotes: rf.notes.trim(),
          firstResolvedAt: now,
          firstResolvedBy: currentUser?.name || "Tejvir Singh",
        } : {}),
      }),
    });
    if (!res.ok) throw new Error();
    setResolveForm((p) => { const n = { ...p }; delete n[ticketId]; return n; });
    fetchTickets();
    alert("✅ Ticket resolved and WhatsApp sent!");
  } catch {
    alert("❌ Failed to resolve.");
  } finally {
    setSubmitting(null);
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  const displayed = tickets
    .filter((t) => statusFilter === "all" || t.status === statusFilter)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (t.customer  || "").toLowerCase().includes(q) ||
        (t.model     || "").toLowerCase().includes(q) ||
        (t.category  || "").toLowerCase().includes(q) ||
        (t.city      || "").toLowerCase().includes(q) ||
        (t.raisedByName || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.date).getTime();
      const db = new Date(b.createdAt || b.date).getTime();
      return dateSort === "newest" ? db - da : da - db;
    });

  const counts = {
  all:      tickets.length,
  open:     tickets.filter((t) => t.status === "open").length,
  resolved: tickets.filter((t) => t.status === "resolved").length,
  reopened: tickets.filter((t) => t.status === "reopened").length,
};

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8" }}>
      {productPopup && (
  <div onClick={() => setProductPopup(null)} style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    zIndex: 1000, display: "flex", alignItems: "center",
    justifyContent: "center", padding: 20,
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      background: "white", borderRadius: 14, padding: "24px 28px",
      maxWidth: 420, width: "100%",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      border: "2px solid #bfdbfe",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8" }}>📦 Product Details</div>
        <button onClick={() => setProductPopup(null)} style={{
          background: "#f3f4f6", border: "none", borderRadius: 8,
          padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151",
        }}>✕ Close</button>
      </div>
      <div style={{ background: "#eff6ff", borderRadius: 10, padding: "14px 16px", border: "1px solid #bfdbfe" }}>
        {[
          ["📂 Sub Category",     productPopup.subCategory],
          ["📐 Model",            productPopup.model],
          ["🔧 Hardware Version", productPopup.hardwareVersion],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 140 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{issuePopup && (
  <div onClick={() => setIssuePopup(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"24px 28px", maxWidth:520, width:"100%", maxHeight:"85vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #c4b5fd", scrollbarWidth:"thin", scrollbarColor:"#7c3aed #f5f3ff" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#5b21b6" }}>📋 Ticket History</div>
        <button onClick={() => setIssuePopup(null)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
      </div>
      {(() => {
        const allHistory = [];
        allHistory.push({
          description: issuePopup.firstDescription || issuePopup.description,
          raisedAt: issuePopup.firstCreatedAt || issuePopup.createdAt,
          raisedByName: issuePopup.firstRaisedByName || issuePopup.raisedByName,
          resolvedNotes: issuePopup.firstResolvedNotes || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolutionNotes : null) || null,
          resolvedAt: issuePopup.firstResolvedAt || null,
          resolvedBy: issuePopup.firstResolvedBy || null,
        });
        if (Array.isArray(issuePopup.issueHistory)) {
          issuePopup.issueHistory.forEach((h) => {
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
         <div style={{ display:"flex", flexDirection:"column", gap:8, paddingRight:4 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", marginBottom:4 }}>
              📋 Ticket History — {allHistory.length} Stage{allHistory.length > 1 ? "s" : ""}
            </div>
            {allHistory.map((h, i) => (
              <div key={i} style={{ borderRadius:8, overflow:"hidden", border:"1px solid #e5e7eb", fontSize:12 }}>
                <div style={{ background:"#f9fafb", padding:"7px 10px", borderLeft:"3px solid #6b7280" }}>
                  <div style={{ fontWeight:700, color:"#374151", marginBottom:2 }}>
                    🔴 Stage {i + 1}
                    {h.raisedAt && <span style={{ fontSize:10, color:"#9ca3af", fontWeight:400, marginLeft:6 }}>{new Date(h.raisedAt).toLocaleString()}</span>}
                    {h.raisedByName && <span style={{ fontSize:10, color:"#6b7280", marginLeft:6 }}>· {h.raisedByName}</span>}
                  </div>
                  <div style={{ color:"#374151" }}>{h.description || "—"}</div>
                </div>
                {h.resolvedNotes ? (
                  <div style={{ background:"#f0fdf4", padding:"6px 10px", borderLeft:"3px solid #10b981" }}>
                    <div style={{ fontWeight:700, color:"#059669", fontSize:11, marginBottom:2 }}>
                      ✅ Resolved
                      {h.resolvedAt && <span style={{ fontSize:10, color:"#9ca3af", fontWeight:400, marginLeft:6 }}>{new Date(h.resolvedAt).toLocaleString()}</span>}
                      {h.resolvedBy && <span style={{ fontSize:10, color:"#6b7280", marginLeft:6 }}>· {h.resolvedBy}</span>}
                    </div>
                    <div style={{ color:"#374151" }}>{h.resolvedNotes}</div>
                  </div>
                ) : (
                  <div style={{ background:"#fffbeb", padding:"5px 10px", borderLeft:"3px solid #f59e0b" }}>
                    <div style={{ color:"#92400e", fontSize:11 }}>⏳ Pending...</div>
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
{raisedByPopup && (
  <div onClick={() => setRaisedByPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #d1fae5" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>🙋 Raised By</div>
        <button onClick={() => setRaisedByPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
      </div>
      <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "14px 16px", border: "1px solid #bbf7d0" }}>
        {[
          ["👤 Name",  raisedByPopup.name],
          ["✉️ Email", raisedByPopup.email],
          ["🎭 Role",  raisedByPopup.role],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 100 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{customerPopup && (
  <div onClick={() => setCustomerPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #bfdbfe" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8" }}>👤 Customer Details</div>
        <button onClick={() => setCustomerPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
      </div>
      <div style={{ background: "#eff6ff", borderRadius: 10, padding: "14px 16px", border: "1px solid #bfdbfe" }}>
        {[
  ["👤 Name",    customerPopup.customer],
  ["✉️ Email",   customerPopup.email],
  ["📞 Phone",   customerPopup.phone],
  ["🏢 Company", customerPopup.companyName],
  ["🏙️ City",    customerPopup.city],
  ["🗺️ State",   customerPopup.state],
  ["📮 Pincode", customerPopup.pincode],
].map(([label, val]) => (
          <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 100 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{statusUpdateForm?.show && (
  <div onClick={() => setStatusUpdateForm({})} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"28px 32px", maxWidth:560, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #bfdbfe" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:"#1d4ed8" }}>📝 Status Update</div>
        <button onClick={() => setStatusUpdateForm({})} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>Resolution Status <span style={{ color:"#ef4444" }}>*</span></div>
        <select value={statusUpdateForm.status || ""} onChange={e => setStatusUpdateForm(prev => ({ ...prev, status: e.target.value }))}
          style={{ width:"100%", padding:"11px 14px", border:"2px solid #bfdbfe", borderRadius:10, fontSize:14, outline:"none", fontFamily:"inherit", background:"white", cursor:"pointer", color:"#111" }}>
          <option value="">-- Select Status --</option>
          <option value="Under Discussion">Under Discussion</option>
          <option value="Under Process">Under Process</option>
          <option value="With OEM">With OEM</option>    
        </select>
      </div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#ffffff", marginBottom:8 }}>Update Note <span style={{ color:"#ef4444" }}>*</span></div>
        <textarea rows={5} placeholder="Why is this ticket not resolved yet..."
          value={statusUpdateForm.note || ""}
          onChange={e => setStatusUpdateForm(prev => ({ ...prev, note: e.target.value }))}
          style={{ width:"100%", padding:"11px 14px", border:"2px solid #bfdbfe", borderRadius:10, fontSize:13, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box", color:"#000000", lineHeight:1.6 }} />
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={() => {
          const note = statusUpdateForm.note?.trim();
          const status = statusUpdateForm.status;
          if (!status) { alert("Please select a status."); return; }
          if (!note) { alert("Please write an update note."); return; }
          const ticketId = statusUpdateForm.id;
          const ticket = tickets.find(t => (t.id || t._id) === ticketId);
          const newEntry = { note, status, updatedBy: currentUser?.name, updatedAt: new Date().toISOString() };
          const existing = Array.isArray(ticket?.statusUpdates) ? ticket.statusUpdates : [];
          fetch(`${BASE_URL}/tickets/${ticketId}`, {
            method:"PATCH", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ statusUpdates: [...existing, newEntry], latestStatusUpdate: `${status} — ${note}`, status: "open" })
          }).then(() => { setStatusUpdateForm({}); fetchTickets(); });
        }} style={{ flex:1, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", padding:"12px 24px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:800, fontFamily:"inherit" }}>
          ✅ Submit Update
        </button>
        <button onClick={() => setStatusUpdateForm({})}
          style={{ background:"#e2e8f0", border:"none", borderRadius:10, padding:"12px 20px", cursor:"pointer", fontSize:13, color:"#64748b", fontFamily:"inherit" }}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{/* Status Update History Popup */}
{statusUpdatePopup && (
  <div onClick={() => setStatusUpdatePopup(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"24px 28px", maxWidth:500, width:"100%", maxHeight:"80vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #bfdbfe" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#1d4ed8" }}>📝 Status Update History</div>
        <button onClick={() => setStatusUpdatePopup(null)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
      </div>
      {Array.isArray(statusUpdatePopup) && statusUpdatePopup.length > 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {statusUpdatePopup.map((entry, i) => (
            <div key={i} style={{ borderRadius:8, border:"1px solid #e5e7eb", overflow:"hidden", fontSize:12 }}>
              <div style={{ background:"#eff6ff", padding:"6px 12px", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontWeight:700, color:"#1d4ed8" }}>Update {i+1}</span>
                <span style={{ fontSize:10, color:"#9ca3af" }}>{new Date(entry.updatedAt).toLocaleString()}</span>
              </div>
              <div style={{ padding:"8px 12px", background:"white" }}>
                <div style={{ fontSize:11, color:"#6b7280", marginBottom:3 }}>By: <strong>{entry.updatedBy}</strong></div>
                {entry.status && (
                  <div style={{ fontSize:11, fontWeight:700, color:"#1d4ed8", background:"#eff6ff", padding:"2px 8px", borderRadius:4, display:"inline-block", marginBottom:4 }}>
                    🔖 {entry.status}
                  </div>
                )}
                <div style={{ color:"#374151", lineHeight:1.5 }}>{entry.note}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign:"center", color:"#9ca3af", padding:20 }}>No status updates yet.</div>
      )}
    </div>
  </div>
)}
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
        color: "white", padding: "14px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 2px 12px rgba(59,130,246,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="Syrotech" style={{
            width: 50, height: 50, borderRadius: 8,
            objectFit: "contain", background: "white", padding: 2,
          }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Syrotech Networks — Lockin Support</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>
  🔒 {currentUser?.name}
  <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.25)", padding: "1px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
    L1
  </span>
</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.35)",
          color: "white", padding: "6px 16px", borderRadius: 6, cursor: "pointer",
        }}>
          Logout
        </button>
      </div>
<div style={{ background: "white", borderBottom: "2px solid #e5e7eb", padding: "0 28px", display: "flex", gap: 0 }}>
  {[
    ["tickets", "🔒 My Lockin Tickets"],
    ["raise",   "Raise Lockin Ticket"],
  ].map(([key, label]) => (
    <button key={key} onClick={() => setActiveTab(key)} style={{
      padding: "14px 22px", fontSize: 13,
      fontWeight: activeTab === key ? 800 : 500,
      color: activeTab === key ? "#1d4ed8" : "#6b7280",
      background: "none", border: "none",
      borderBottom: activeTab === key ? "3px solid #1d4ed8" : "3px solid transparent",
      cursor: "pointer", whiteSpace: "nowrap", marginBottom: -2,
    }}>{label}</button>
  ))}
</div>
    {activeTab === "raise" && (
  <div style={{ maxWidth: 700, margin: "28px auto", padding: "0 16px" }}>
    <RaiseLockinTicket onSuccess={() => setActiveTab("tickets")} />
  </div>
)}

{activeTab === "tickets" && (
<div style={{ maxWidth: 1200, margin: "28px auto", padding: "0 16px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            ["Total Tickets", counts.all,      "🔒", "#3b82f6", "#eff6ff"],
            ["Open",          counts.open,     "🔓", "#e04e00", "#fff4ee"],
            ["Resolved",      counts.resolved, "✅", "#10b981", "#ecfdf5"],
          ].map(([label, val, icon, col, bg]) => (
            <div key={label} style={{
              background: "white", borderRadius: 12, padding: "18px 20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderTop: `4px solid ${col}`,
            }}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: col, marginTop: 6 }}>{val}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          background: "white", borderRadius: 12, border: "1.5px solid #e0d8d0",
          padding: "14px 16px", marginBottom: 14,
          display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>📋 Status:</span>
          {[["all","All"],["open","🔓 Open"],["resolved","✅ Resolved"],["reopened","🔄 Reopened"]].map(([key,label]) => (
            <button key={key} onClick={() => setStatusFilter(key)} style={{
              padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
              border: statusFilter === key ? `2px solid ${STATUS_COLOR[key] || "#374151"}` : "1px solid #d1d5db",
              background: statusFilter === key ? (STATUS_BG[key] || "#f3f4f6") : "white",
              color: statusFilter === key ? (STATUS_COLOR[key] || "#374151") : "#555",
              fontWeight: statusFilter === key ? 700 : 400,
            }}>
              {label} <span style={{
                marginLeft: 4, fontSize: 10, fontWeight: 700,
                background: statusFilter === key ? (STATUS_COLOR[key] || "#374151") : "#e5e7eb",
                color: statusFilter === key ? "white" : "#555",
                borderRadius: 10, padding: "1px 6px",
              }}>{counts[key] ?? 0}</span>
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: "#e0d8d0" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>📅 Sort:</span>
          <select value={dateSort} onChange={(e) => setDateSort(e.target.value)} style={{
            padding: "6px 12px", borderRadius: 8, border: "1.5px solid #d1d5db",
            fontSize: 12, outline: "none", fontFamily: "inherit",
          }}>
            <option value="newest">Newest First ↓</option>
            <option value="oldest">Oldest First ↑</option>
          </select>

          <input
            placeholder="🔍 Search customer, model, city, raised by..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, minWidth: 220, padding: "8px 14px", borderRadius: 9,
              border: "1.5px solid #d1d5db", fontSize: 12,
              outline: "none", fontFamily: "inherit",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{
              background: "#f3f4f6", border: "1px solid #d1d5db",
              borderRadius: 8, padding: "6px 12px",
              cursor: "pointer", fontSize: 12, color: "#6b7280",
            }}>✕</button>
          )}
        </div>

        {/* Table */}
        {tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 14, color: "#aaa" }}>
            <div style={{ fontSize: 48 }}>🔒</div>
            <p>No lockin tickets assigned yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "scroll", overflowY: "auto", maxHeight: "72vh", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "white", minWidth: 1100 }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", position: "sticky", top: 0, zIndex: 2 }}>
        {["Ticket No","Date","Category","Product Details","Customer","Issue","Raised By","File","Logo","History","Status","Status Update","Action"].map((h, i) => (
                    <th key={i} style={{
                      padding: "12px 12px", fontSize: 10, fontWeight: 800,
                      color: "white", textTransform: "uppercase",
                      textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((t, idx) => {
                  const s  = (t.status || "open").toLowerCase();
                  const id = t.id || t._id;
                  return (
                    <>
                      <tr key={id} style={{
                        borderBottom: "1px solid #f0ede8",
                        background: idx % 2 === 0 ? "#f0f6ff" : "white",
                        borderLeft: `4px solid ${STATUS_COLOR[s] || "#ccc"}`,
                      }}>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#3b82f6" }}>
                            #{t.ticketNumber || "—"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 11, color: "#374151" }}>{t.date || "—"}</div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                            {t.category || "—"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
  <div
    onClick={() => setProductPopup({
      subCategory: t.subCategory,
      model: t.model,
      hardwareVersion: t.hardwareVersion,
    })}
    style={{
      fontSize: 11, fontWeight: 700, color: "#3b82f6",
      cursor: "pointer", textDecoration: "underline",
      textDecorationStyle: "dotted", textDecorationColor: "#93c5fd",
      whiteSpace: "nowrap",
    }}
  >
    {t.model || "—"}
  </div>
  <div style={{ fontSize: 10, color: "#6b7280" }}>{t.subCategory || ""}</div>
</td>
                       <td style={{ padding: "10px 12px" }}>
  <div
    onClick={() => setCustomerPopup({
      customer: t.customer,
      email: t.email,
      phone: t.phone,
      city: t.city,
      state: t.state,
      pincode: t.pincode,
      companyName: t.companyName,
    })}
    style={{
      fontSize: 12, fontWeight: 700, color: "#1d4ed8",
      cursor: "pointer", textDecoration: "underline",
      textDecorationStyle: "dotted", textDecorationColor: "#93c5fd",
      whiteSpace: "nowrap",
    }}
  >
    {t.customer || "—"}
  </div>
  <div style={{ fontSize: 10, color: "#6b7280" }}>{t.companyName || ""}</div>
</td>

{/* Issue */}
                        <td style={{ padding: "10px 12px" }}>
                          <div
                            onClick={() => setIssuePopup({
                              description: t.description,
                              firstDescription: t.firstDescription || t.description,
                              firstCreatedAt: t.firstCreatedAt || t.createdAt,
                              firstRaisedByName: t.firstRaisedByName || t.raisedByName,
                              firstResolvedNotes: t.firstResolvedNotes || (Array.isArray(t.issueHistory) && t.issueHistory.length === 0 ? t.resolutionNotes : null) || null,
                              firstResolvedAt: t.firstResolvedAt || null,
                              firstResolvedBy: t.firstResolvedBy || null,
                              issueHistory: t.issueHistory,
                              resolutionNotes: t.resolutionNotes,
                            })}
                            style={{ fontSize: 12, color: "#374151", cursor: "pointer", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#9ca3af" }}
                            title="Click to view full issue">
                            {t.description?.length > 35 ? t.description.slice(0, 35) + "…" : t.description || "—"}
                          </div>
                        </td>
                        
                        <td style={{ padding: "10px 12px" }}>
  <div
    onClick={() => setRaisedByPopup({
      name: t.raisedByName,
      email: t.raisedBy,
      role: "Sales",
    })}
    style={{
      fontSize: 11, fontWeight: 700, color: "#059669",
      cursor: "pointer", textDecoration: "underline",
      textDecorationStyle: "dotted", textDecorationColor: "#6ee7b7",
      whiteSpace: "nowrap",
    }}
  >
    {t.raisedByName || "—"}
  </div>
</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {t.fileName ? (
                            <a href={t.fileBase64} download={t.fileName} style={{
                              fontSize: 11, color: "#2563eb",
                              fontWeight: 600, textDecoration: "underline",
                            }}>
                              📎 {t.fileName.length > 12 ? t.fileName.slice(0,12)+"…" : t.fileName}
                            </a>
                          ) : (
                            <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                          )}
                        </td>

                       {/* Logo */}
<td style={{ padding: "10px 12px", textAlign: "center" }}>
  {t.logoType === "syrotech" || t.logoImage === "syrotech" ? (
    <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
  ) : t.logoImage ? (
    <img src={t.logoImage} alt="Logo"
      style={{ maxHeight: 40, maxWidth: 80, objectFit: "contain", borderRadius: 4, cursor: "pointer" }}
      onClick={() => {
        const win = window.open("", "_blank");
        win.document.write(`<html><body style="margin:0;background:#111;display:flex;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;"><img src="${t.logoImage}" style="max-width:100%;height:auto;border-radius:8px;" /></body></html>`);
        win.document.close();
      }}
    />
  ) : (
    <span style={{ fontSize: 11, color: "#d1d5db" }}>----—</span>
  )}
</td>


{/* History */}
                        <td style={{ padding: "10px 12px" }}>
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
                          })} style={{ fontSize:10, color:"#7c3aed", cursor:"pointer", fontWeight:700, background:"#f5f3ff", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
                            📋 {(Array.isArray(t.issueHistory) ? t.issueHistory.length : 0) + 1} History
                          </div>
                        </td>


                        <td style={{ padding: "10px 12px" }}>
                          <span style={{
                            padding: "3px 8px", borderRadius: 10, fontSize: 10,
                            fontWeight: 700, color: STATUS_COLOR[s],
                            background: STATUS_BG[s], display: "inline-block",
                          }}>
                            {s.toUpperCase()}
                          </span>
                      
                        </td>


{/* Status Update Column */}
<td style={{ padding:"10px 12px", borderRight:"1px solid #e0d8d0" }}>
  {Array.isArray(t.statusUpdates) && t.statusUpdates.length > 0 && (
    <div onClick={() => setStatusUpdatePopup(t.statusUpdates)}
      style={{ fontSize:10, color:"#1d4ed8", cursor:"pointer", fontWeight:700, background:"#eff6ff", padding:"2px 6px", borderRadius:4, display:"inline-block", marginBottom:6 }}>
      📝 {t.statusUpdates.length} Update{t.statusUpdates.length > 1 ? "s" : ""} — View
    </div>
  )}
 {!["resolved"].includes(s) && (
  <button onClick={() => setStatusUpdateForm({ show: true, id, note: "", status: "" })}
    style={{ background:"#1d4ed8", color:"white", border:"none", padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, display:"block", marginTop:4 }}>
    📝 Update
  </button>
)}
</td>


                        <td style={{ padding: "10px 12px" }}>
                          {s !== "resolved" && (
                            <button
                              onClick={() => setResolveForm((p) => ({
                                ...p,
                                [id]: { ...p[id], show: !p[id]?.show },
                              }))}
                              style={{
                                background: resolveForm[id]?.show ? "#ecfdf5" : "#10b981",
                                color: resolveForm[id]?.show ? "#065f46" : "white",
                                border: resolveForm[id]?.show ? "1.5px solid #6ee7b7" : "none",
                                padding: "5px 12px", borderRadius: 6,
                                cursor: "pointer", fontSize: 11, fontWeight: 600,
                              }}
                            >
                              ✅ {resolveForm[id]?.show ? "Cancel" : "Resolve"}
                            </button>
                          )}
                          {s === "resolved" && (
                            <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>
                              ✅ Done
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Resolve Form Row */}
                      {resolveForm[id]?.show && s !== "resolved" && (
                        <tr key={`resolve-${id}`} style={{ background: "#f0fdf4" }}>
                        <td colSpan={11} style={{ padding: "16px 20px" }}>
                            <div style={{
                              background: "linear-gradient(135deg,#ecfdf5,#d1fae5)",
                              border: "2px solid #10b981", borderRadius: 12,
                              padding: "16px 20px", maxWidth: 600,
                            }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46", marginBottom: 10 }}>
                                ✅ Resolve Ticket #{t.ticketNumber}
                              </div>


                             
                              <textarea
                                rows={3}
                                placeholder="Describe what was resolved..."
                                value={resolveForm[id]?.notes || ""}
                                onChange={(e) => setResolveForm((p) => ({
                                  ...p, [id]: { ...p[id], notes: e.target.value },
                                }))}
                                style={{
                                  width: "100%", padding: "10px 12px",
                                  border: "2px solid #6ee7b7", borderRadius: 8,
                                  fontSize: 12, outline: "none", fontFamily: "inherit",
                                  background: "white", resize: "vertical",
                                  color: "#111", lineHeight: 1.5, boxSizing: "border-box",
                                }}
                              />
                              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                                <button
                                  onClick={() => handleResolve(id)}
                                  disabled={submitting === id}
                                  style={{
                                    background: "linear-gradient(135deg,#10b981,#059669)",
                                    color: "white", border: "none",
                                    padding: "10px 24px", borderRadius: 8,
                                    cursor: "pointer", fontSize: 13, fontWeight: 800,
                                  }}
                                >
                                  {submitting === id ? "⏳ Saving..." : "✅ Confirm Resolve"}
                                </button>
                                <button
                                  onClick={() => setResolveForm((p) => ({
                                    ...p, [id]: { ...p[id], show: false },
                                  }))}
                                  style={{
                                    background: "#e2e8f0", border: "none",
                                    borderRadius: 8, padding: "10px 16px",
                                    cursor: "pointer", fontSize: 12, color: "#64748b",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Resolved info row */}
                      {s === "resolved" && (
                        <tr key={`res-info-${id}`} style={{ background: "#f0fdf4" }}>
                          <td colSpan={11} style={{ padding: "8px 20px" }}>
                            <span style={{ fontSize: 12, color: "#065f46", fontWeight: 600 }}>
                              ✅ Resolved by <strong>{t.resolvedBy}</strong>
                              {t.resolutionNotes ? ` — ${t.resolutionNotes}` : ""}
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