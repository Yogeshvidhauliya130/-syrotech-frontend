import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://syrotech-backend.onrender.com";
const STATUS_COLOR = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed" };
const STATUS_BG    = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff" };

const RMA_REASONS = [
  "Damaged Product","Hardware Fault","Physical Damage",
  "Water Damage","Burnt Component","Manufacturing Defect","Other",
];

function sendWhatsAppFeedback(ticket, supportName) {
  const phone = (ticket.phone || "").replace(/\D/g, "");
  if (!phone || phone.length < 10) {
    alert("❌ Cannot send WhatsApp!\n\nCustomer phone number is missing or invalid.");
    return false;
  }
  const fullPhone    = phone.startsWith("91") ? phone : `91${phone}`;
  const resolvedDate = ticket.resolvedAt
    ? new Date(ticket.resolvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-IN");
  const message =
    `Hello ${ticket.customer || "Customer"} 👋\n\n` +
    `Your support request has been resolved ✅\n\n` +
    `━━━━━━━━━━━━━━━━━━\n📋 *Ticket Summary*\n━━━━━━━━━━━━━━━━━━\n` +
    `• Product   : ${ticket.category}\n• Serial No : ${ticket.serialNo}\n` +
    `• Issue     : ${(ticket.description || "").slice(0, 60)}...\n` +
    `• Handled by: ${supportName}\n• Date      : ${resolvedDate}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n⭐ *Please share your feedback:*\n━━━━━━━━━━━━━━━━━━\n\n` +
    `1️⃣  Was your issue fully resolved?\n    Reply: *Yes* or *No*\n\n` +
    `2️⃣  Rate our service out of 5:\n    Reply: ⭐⭐⭐⭐⭐ (1 to 5)\n\n` +
    `3️⃣  Any comments or suggestions?\n    Feel free to share!\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Thank you for choosing *Syrotech Networks* 🙏\n📞 Support: +91 9205229997\n🌐 www.Syrotech.com`;
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
  return true;
}

function sendRMAWhatsApp(ticket, rmaCenter, reason) {
  const phone = (ticket.phone || "").replace(/\D/g, "");
  if (!phone || phone.length < 10) {
    alert("❌ Cannot send WhatsApp!\n\nCustomer phone number is missing or invalid.");
    return false;
  }
  const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
  const message =
    `Hello ${ticket.customer || "Customer"} 👋\n\n` +
    `We have assessed your product and unfortunately it requires physical repair at our RMA center.\n\n` +
    `━━━━━━━━━━━━━━━━━━\n📦 *Product Details*\n━━━━━━━━━━━━━━━━━━\n` +
    `• Product    : ${ticket.category}\n• Serial No  : ${ticket.serialNo}\n` +
    `• MAC Address: ${ticket.mac || "—"}\n• Issue Type : ${reason}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n🔧 *Please Visit RMA Center*\n━━━━━━━━━━━━━━━━━━\n` +
    `• Center  : ${rmaCenter.name}\n• City    : ${rmaCenter.city}\n` +
    `• Address : ${rmaCenter.address}\n• Phone   : ${rmaCenter.phone}\n\n` +
    `📌 *Please carry:*\n  ✅ Your product\n  ✅ This message / ticket reference\n  ✅ Purchase invoice (if available)\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Thank you for choosing *Syrotech Networks* 🙏\n📞 Support: +91 9205229997\n🌐 www.Syrotech.com`;
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
  return true;
}

function getFilteredReassignPersons(allPersons, ticket, currentUserName) {
  const others = allPersons.filter(u =>
    u.role === "support" && u.approved &&
    u.name.toLowerCase().trim() !== (currentUserName || "").toLowerCase().trim()
  );
  const product = (ticket.category || "").toLowerCase();
  const city    = (ticket.city    || "").toLowerCase().trim();
  const country = (ticket.country || "").toLowerCase().trim();
  if (!product) return others;
  const level1 = others.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return specs.map(s => s.toLowerCase()).includes(product) && city && p.city && p.city.toLowerCase().trim() === city;
  });
  if (level1.length > 0) return level1;
  const level2 = others.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return specs.map(s => s.toLowerCase()).includes(product) && country && p.country && p.country.toLowerCase().trim() === country;
  });
  if (level2.length > 0) return level2;
  const level3 = others.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return specs.map(s => s.toLowerCase()).includes(product);
  });
  if (level3.length > 0) return level3;
  return others;
}

function getFilteredRMACenters(rmaCenters, ticket) {
  if (!rmaCenters || rmaCenters.length === 0) return [];
  const city    = (ticket.city    || "").toLowerCase().trim();
  const country = (ticket.country || "").toLowerCase().trim();
  const level1  = rmaCenters.filter(c => c.city && c.city.toLowerCase().trim() === city);
  if (level1.length > 0) return level1;
  const level2  = rmaCenters.filter(c => c.country && c.country.toLowerCase().trim() === country);
  if (level2.length > 0) return level2;
  return rmaCenters;
}

export default function SupportDashboard() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const autoAcceptingRef = useRef(new Set());

  const [tickets, setTickets]                 = useState([]);
  const [filter, setFilter]                   = useState("all");
  const [allSupportPersons, setAllSupportPersons] = useState([]);
  const [rmaCenters, setRmaCenters]           = useState([]);
  const [reassignForm, setReassignForm]       = useState({});
  const [rmaForm, setRmaForm]                 = useState({});
  const [reassigning, setReassigning]         = useState(null);
  const [submittingRma, setSubmittingRma]     = useState(null);
  const [expandedRow, setExpandedRow]         = useState(null);
  const [expandedImage, setExpandedImage]     = useState(null);
  const [dateSort, setDateSort]               = useState("newest");
  const [resolveForm, setResolveForm]         = useState({});
  const [issuePopup, setIssuePopup]           = useState(null);

  const fetchTickets = () => {
    fetch(`${BASE_URL}/tickets`)
      .then(r => r.json())
      .then(data => {
        const mine = data.filter(t =>
          t.assignTo && currentUser?.name &&
          t.assignTo.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
        );
        setTickets(mine);
        mine.filter(t => t.status === "pending" && !autoAcceptingRef.current.has(t.id))
          .forEach(ticket => {
            autoAcceptingRef.current.add(ticket.id);
            fetch(`${BASE_URL}/tickets/${ticket.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "open", acceptedAt: new Date().toISOString() })
            })
              .then(r => r.json())
              .then(updated => {
                setTickets(prev => prev.map(t => t.id === ticket.id ? updated : t));
                autoAcceptingRef.current.delete(ticket.id);
              })
              .catch(() => autoAcceptingRef.current.delete(ticket.id));
          });
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchTickets();
    const poll = setInterval(fetchTickets, 8000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(users => setAllSupportPersons(users.filter(u => u.role === "support" && u.approved)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/rma-centers`)
      .then(r => r.json())
      .then(setRmaCenters)
      .catch(console.error);
  }, []);

  const updateStatus = (id, status) => {
    const ticket  = tickets.find(t => t.id === id);
    const now     = new Date().toISOString();
    const updates = { status };
    if (status === "open"     && !ticket?.acceptedAt) updates.acceptedAt = now;
    if (status === "resolved" && !ticket?.resolvedAt) updates.resolvedAt = now;
    fetch(`${BASE_URL}/tickets/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    })
      .then(r => r.json())
      .then(updated => setTickets(prev => prev.map(t => t.id === id ? updated : t)))
      .catch(err => console.error("Update failed:", err));
  };

  const handleReassign = (ticketId) => {
    const rf = reassignForm[ticketId] || {};
    if (!rf.newPerson) { alert("Please select a support person to reassign to."); return; }
    if (!rf.reason?.trim() || rf.reason.trim().length < 5) { alert("Please enter a reason (minimum 5 characters)."); return; }
    const ticket = tickets.find(t => t.id === ticketId);
    setReassigning(ticketId);
    const historyEntry = { from: currentUser?.name, to: rf.newPerson, reason: rf.reason.trim(), timestamp: new Date().toISOString() };
    const existingHistory = Array.isArray(ticket?.reassignHistory) ? ticket.reassignHistory : [];
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignTo: rf.newPerson, reassignedFrom: currentUser?.name,
        reassignReason: rf.reason.trim(), reassignedAt: new Date().toISOString(),
        reassignHistory: [...existingHistory, historyEntry],
        acceptedAt: null, status: "pending",
      })
    })
      .then(r => r.json())
      .then(() => {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        setReassigning(null);
        setReassignForm(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
        alert(`✅ Ticket reassigned to ${rf.newPerson}!\n\nReason: ${rf.reason}`);
      })
      .catch(err => { console.error("Reassign failed:", err); setReassigning(null); });
  };

  const handleRMASubmit = (ticketId) => {
    const rf     = rmaForm[ticketId] || {};
    const ticket = tickets.find(t => t.id === ticketId);
    if (!rf.reason)   { alert("Please select a reason for RMA."); return; }
    if (!rf.centerId) { alert("Please select an RMA center."); return; }
    const center = rmaCenters.find(c => c.id === parseInt(rf.centerId));
    if (!center) { alert("Invalid RMA center."); return; }
    const sent = sendRMAWhatsApp(ticket, center, rf.reason);
    if (!sent) return;
    setSubmittingRma(ticketId);
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "rma", rmaStatus: true, rmaReason: rf.reason,
        rmaCenterName: center.name, rmaCenterCity: center.city,
        rmaCenterAddress: center.address, rmaCenterPhone: center.phone,
        rmaSentAt: new Date().toISOString(), rmaSentBy: currentUser?.name, resolvedAt: null,
      })
    })
      .then(r => r.json())
      .then(updated => {
        setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
        setSubmittingRma(null);
        setRmaForm(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
        alert(`✅ RMA processed!\n\nReason: ${rf.reason}\nCenter: ${center.name}\nWhatsApp sent ✅`);
      })
      .catch(err => { console.error("RMA failed:", err); setSubmittingRma(null); });
  };

  const handleResolveSubmit = (ticketId) => {
    const rf = resolveForm[ticketId] || {};
    if (!rf.notes?.trim()) { alert("Please describe what issue was solved."); return; }
    if (!rf.timeTaken)     { alert("Please select how much time it took."); return; }
    const now = new Date().toISOString();
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "resolved",
        resolvedAt: now,
        resolutionNotes: rf.notes.trim(),
        resolutionTimeTaken: rf.timeTaken,
        resolvedBy: currentUser?.name,
      })
    })
      .then(r => r.json())
      .then(updated => {
        setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
        setResolveForm(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
      })
      .catch(err => console.error("Resolve failed:", err));
  };

  const markWhatsAppSent = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const sent   = sendWhatsAppFeedback(ticket, currentUser?.name);
    if (!sent) return;
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackSent: true, feedbackSentAt: new Date().toISOString(), feedbackSentBy: currentUser?.name })
    })
      .then(r => r.json())
      .then(updated => setTickets(prev => prev.map(t => t.id === ticketId ? updated : t)))
      .catch(err => console.error("Failed:", err));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  const counts = {
    all:      tickets.length,
    pending:  tickets.filter(t => t.status === "pending").length,
    open:     tickets.filter(t => t.status === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    rma:      tickets.filter(t => t.status === "rma").length,
  };
  const resolutionPct = counts.all === 0 ? 0 : Math.round((counts.resolved / counts.all) * 100);
  const resolved      = tickets.filter(t => t.status === "resolved" && t.createdAt && t.resolvedAt);
  const within24      = resolved.filter(t => new Date(t.resolvedAt) - new Date(t.createdAt) <= 24 * 60 * 60 * 1000).length;
  const avgHours      = resolved.length === 0 ? 0 : (
    resolved.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0)
    / resolved.length / (1000 * 60 * 60)
  ).toFixed(1);

  const supportTicketNumberMap = {};
  [...tickets]
    .sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))
    .forEach((t, i) => { supportTicketNumberMap[t.id] = i + 1; });

  const filtered = (filter === "all" ? tickets : tickets.filter(t => t.status === filter))
    .slice()
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.date).getTime();
      const db = new Date(b.createdAt || b.date).getTime();
      return dateSort === "newest" ? db - da : da - db;
    });

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8" }}>

      {/* ✅ Issue Popup Modal — shows resolutionNotes FIRST */}
      {issuePopup && (
        <div
          onClick={() => setIssuePopup(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 14, padding: "24px 28px",
              maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: `2px solid ${issuePopup.resolutionNotes ? "#d1fae5" : "#e5e7eb"}`
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: issuePopup.resolutionNotes ? "#1a7a46" : "#059669" }}>
                {issuePopup.resolutionNotes ? "✅ Ticket Resolved" : "📋 Issue Description"}
              </div>
              <button onClick={() => setIssuePopup(null)}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                ✕ Close
              </button>
            </div>

            {/* ✅ If resolved — show WHAT WAS SOLVED first, then original issue below */}
            {issuePopup.resolutionNotes ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  🔧 What was solved:
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#ecfdf5", padding: "14px 16px", borderRadius: 10, border: "1px solid #6ee7b7", borderLeft: "4px solid #10b981", marginBottom: 14 }}>
                  {issuePopup.resolutionNotes}
                </div>
                {issuePopup.resolutionTimeTaken && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                    ⏱️ Time taken: <strong>{issuePopup.resolutionTimeTaken}</strong>
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  📋 Original Issue Raised:
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, background: "#f9fafb", padding: "12px 14px", borderRadius: 8, border: "1px solid #e5e7eb", borderLeft: "3px solid #10b981" }}>
                  {issuePopup.description}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#f9fafb", padding: "14px 16px", borderRadius: 10, border: "1px solid #e5e7eb", borderLeft: "4px solid #10b981" }}>
                {issuePopup.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
        padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 2px 12px rgba(16,185,129,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "white", color: "#10b981", width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>S</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Syrotech — Support Portal</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>🛠️ {currentUser?.name}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", color: "white", padding: "6px 16px", borderRadius: 6, cursor: "pointer" }}>
          Logout
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: "28px auto", padding: "0 16px" }}>

        {/* Top Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            ["Total Tickets",  counts.all,         "🎫", "#3b82f6", "#eff6ff"],
            ["Resolved",       counts.resolved,     "✅", "#10b981", "#ecfdf5"],
            ["Avg Resolution", `${avgHours}h`,      "⏱️", "#f59e0b", "#fffbeb"],
            ["Resolution %",   `${resolutionPct}%`, "📊", "#8b5cf6", "#f5f3ff"],
          ].map(([label, val, icon, col, bg]) => (
            <div key={label} style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderTop: `4px solid ${col}` }}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: col, marginTop: 6 }}>{val}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 24hr Banner */}
        {counts.resolved > 0 && (
          <div style={{ background: within24 === counts.resolved ? "#ecfdf5" : "#fffbeb", border: `1px solid ${within24 === counts.resolved ? "#6ee7b7" : "#fcd34d"}`, borderRadius: 10, padding: "12px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{within24 === counts.resolved ? "🎯" : "⚠️"}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              24hr Compliance: {within24}/{counts.resolved} tickets resolved within 24 hours
              {within24 < counts.resolved && " — Some tickets exceeded the 24hr limit"}
            </span>
          </div>
        )}

        {/* RMA Banner */}
        {counts.rma > 0 && (
          <div style={{ background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 10, padding: "12px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔧</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5b21b6" }}>
              {counts.rma} ticket{counts.rma > 1 ? "s" : ""} sent to RMA center
            </span>
          </div>
        )}

        {/* Filter + Date Sort Bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["all","All"],["pending","⏳ Pending"],["open","🔓 Open"],["resolved","✅ Resolved"],["rma","🔧 RMA"]].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: "8px 16px", borderRadius: 20,
                border: filter === key ? "none" : "1px solid #d1d5db",
                background: filter === key ? (key === "rma" ? "#7c3aed" : "#10b981") : "white",
                color: filter === key ? "white" : "#555",
                fontWeight: filter === key ? 700 : 400,
                fontSize: 13, cursor: "pointer"
              }}>
                {label} ({counts[key] ?? 0})
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>📅 Sort:</span>
            <select value={dateSort} onChange={e => setDateSort(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 12, cursor: "pointer", background: "white", color: "#374151" }}>
              <option value="newest">Newest First ↓</option>
              <option value="oldest">Oldest First ↑</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 14, color: "#aaa" }}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p style={{ marginTop: 12 }}>No tickets in this category.</p>
          </div>
        )}

        {/* TABLE */}
        {filtered.length > 0 && (
          <div style={{ overflowX: "scroll", overflowY: "auto", maxHeight: "72vh", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100, background: "white" }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}>
                  {["Ticket No","Raised By","Product / S/N","MAC ID","Customer / KYC","Issue","Status","Image","RMA","Actions"].map((h, i) => (
                    <th key={i} style={{
                      padding: "12px 14px", fontSize: 10, fontWeight: 800, color: "white",
                      textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left",
                      borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket, idx) => {
                  const s            = (ticket.status || "pending").toLowerCase();
                  const isReassigned = !!ticket.reassignedFrom;
                  const rf           = reassignForm[ticket.id] || {};
                  const rmaf         = rmaForm[ticket.id] || {};
                  const showReassign = rf.show || false;
                  const showRma      = rmaf.show || false;
                  const showResolve  = resolveForm[ticket.id]?.show || false;
                  const filteredReassignPersons = getFilteredReassignPersons(allSupportPersons, ticket, currentUser?.name);
                  const nearbyRmaCenters        = getFilteredRMACenters(rmaCenters, ticket);

                  return (
                    <>
                      <tr key={ticket.id} style={{
                        borderBottom: "1px solid #f0ede8",
                        background: s === "rma" ? "#faf5ff" : isReassigned ? "#fffdf0" : idx % 2 === 0 ? "#f9f9f9" : "white",
                        borderLeft: `4px solid ${s === "rma" ? "#7c3aed" : isReassigned ? "#f59e0b" : (STATUS_COLOR[s] || "#ccc")}`,
                      }}>

                        {/* Ticket No */}
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>Syro{supportTicketNumberMap[ticket.id]}</div>
                          <div style={{ fontSize: 9, color: "#9ca3af" }}>Row {idx + 1}</div>
                          {ticket.issueHistory && ticket.issueHistory.length > 0 && (
                            <div style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, marginTop: 2 }}>🔁 repeat</div>
                          )}
                        </td>

                        {/* Raised By */}
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{ticket.raisedByName || "—"}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>{ticket.date}</div>
                        </td>

                        {/* Product / S/N */}
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{ticket.category}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>S/N: {ticket.serialNo}</div>
                        </td>

                        {/* MAC ID */}
                        <td style={{ padding: "12px 14px", fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>
                          {ticket.mac || <span style={{ color: "#d1d5db" }}>—</span>}
                        </td>

                        {/* Customer / KYC */}
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{ticket.customer || "—"}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>📞 {ticket.phone || <span style={{ color: "#ef4444" }}>⚠ Missing</span>}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>📍 {[ticket.city, ticket.country].filter(Boolean).join(", ") || "—"}</div>
                        </td>

                        {/* ✅ Issue — click to open popup */}
                        <td style={{ padding: "12px 14px", maxWidth: 180 }}>
                          <div
                            onClick={() => setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken })}
                            style={{
                              fontSize: 12, color: "#374151",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160,
                              cursor: "pointer",
                              textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#9ca3af"
                            }}
                            title="Click to view full issue"
                          >
                            {ticket.description?.length > 35
                              ? ticket.description.slice(0, 35) + "…"
                              : ticket.description || "—"}
                          </div>
                          {isReassigned && (
                            <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, marginTop: 2 }}>🔄 from {ticket.reassignedFrom}</div>
                          )}
                          {s === "resolved" && ticket.resolutionNotes && (
                            <div
                              onClick={() => setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken })}
                              style={{ fontSize: 10, color: "#059669", fontWeight: 600, marginTop: 3, cursor: "pointer" }}>
                              ✅ Resolved — click to view
                            </div>
                          )}
                        </td>

                        {/* ✅ Status — click RESOLVED to see what was solved */}
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <span
                            onClick={() => {
                              if (s === "resolved" && ticket.resolutionNotes) {
                                setIssuePopup({
                                  description: ticket.description,
                                  resolutionNotes: ticket.resolutionNotes,
                                  resolutionTimeTaken: ticket.resolutionTimeTaken,
                                });
                              }
                            }}
                            style={{
                              padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                              color: STATUS_COLOR[s], background: STATUS_BG[s],
                              cursor: s === "resolved" && ticket.resolutionNotes ? "pointer" : "default",
                              border: s === "resolved" && ticket.resolutionNotes ? "1.5px solid #6ee7b7" : "none",
                              display: "inline-block"
                            }}
                            title={s === "resolved" && ticket.resolutionNotes ? "Click to see what was resolved" : ""}
                          >
                            {s.toUpperCase()}
                          </span>
                          {s === "resolved" && ticket.resolutionNotes && (
                            <div
                              onClick={() => setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken })}
                              style={{ fontSize: 9, color: "#059669", marginTop: 3, cursor: "pointer", fontWeight: 600 }}>
                              📋 View details
                            </div>
                          )}
                          {ticket.createdAt && s !== "resolved" && s !== "rma" && (() => {
                            const remaining = new Date(ticket.createdAt).getTime() + 24 * 60 * 60 * 1000 - Date.now();
                            if (remaining <= 0) return <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, marginTop: 2 }}>⏱️ OVERDUE</div>;
                            const hrs  = Math.floor(remaining / (1000 * 60 * 60));
                            const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                            return <div style={{ fontSize: 10, color: remaining < 4 * 60 * 60 * 1000 ? "#dc2626" : "#059669", marginTop: 2 }}>⏱️ {hrs}h {mins}m left</div>;
                          })()}
                          {s === "resolved" && ticket.resolutionTimeTaken && (
                            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 3 }}>⏱️ {ticket.resolutionTimeTaken}</div>
                          )}
                        </td>

                        {/* Image */}
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          {ticket.productImage ? (
                            <button onClick={() => setExpandedImage(expandedImage === ticket.id ? null : ticket.id)}
                              style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#065f46" }}>
                              📷 {expandedImage === ticket.id ? "Hide" : "View"}
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                          )}
                        </td>

                        {/* RMA */}
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          {ticket.rmaStatus ? (
                            <div>
                              <span style={{ background: "#f5f3ff", color: "#7c3aed", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>🔧 RMA</span>
                              <div style={{ fontSize: 10, color: "#6d28d9", marginTop: 2 }}>{ticket.rmaCenterName}</div>
                              <div style={{ fontSize: 10, color: "#9ca3af" }}>{ticket.rmaCenterCity}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {s === "open" && (
                              <button
                                onClick={() => setResolveForm(prev => ({
                                  ...prev,
                                  [ticket.id]: { ...prev[ticket.id], show: !prev[ticket.id]?.show }
                                }))}
                                style={{
                                  background: showResolve ? "#ecfdf5" : "#10b981",
                                  color: showResolve ? "#065f46" : "white",
                                  border: showResolve ? "1.5px solid #6ee7b7" : "none",
                                  padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                                  fontSize: 11, fontWeight: 600, whiteSpace: "nowrap"
                                }}>
                                ✅ {showResolve ? "Cancel" : "Resolve"}
                              </button>
                            )}
                            {s === "resolved" && (
                              <button onClick={() => markWhatsAppSent(ticket.id)}
                                style={{ background: "#25D366", color: "white", border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                                📱 WhatsApp
                              </button>
                            )}
                            {(s === "open" || s === "pending") && (
                              <button
                                onClick={() => setRmaForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: !showRma } }))}
                                style={{ background: showRma ? "#ede9fe" : "#f5f3ff", border: `1.5px solid ${showRma ? "#7c3aed" : "#c4b5fd"}`, color: "#5b21b6", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                                🔧 RMA
                              </button>
                            )}
                            {s !== "resolved" && s !== "rma" && (
                              <button
                                onClick={() => setReassignForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: !showReassign } }))}
                                style={{ background: showReassign ? "#fef9c3" : "#fff7ed", border: `1.5px solid ${showReassign ? "#f59e0b" : "#fed7aa"}`, color: "#92400e", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                                🔄
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Image expanded row */}
                      {expandedImage === ticket.id && ticket.productImage && (
                        <tr key={`img-${ticket.id}`} style={{ background: "#f0fdf4" }}>
                          <td colSpan={10} style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                              <img src={ticket.productImage} alt="Product"
                                style={{ maxHeight: 200, maxWidth: 300, borderRadius: 8, border: "2px solid #86efac", cursor: "pointer" }}
                                onClick={() => {
                                  const win = window.open("", "_blank");
                                  win.document.write(`<html><head><title>Product Image</title></head><body style="margin:0;background:#111;display:flex;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;"><img src="${ticket.productImage}" style="max-width:100%;height:auto;border-radius:8px;" /></body></html>`);
                                  win.document.close();
                                }}
                              />
                              <div style={{ fontSize: 12, color: "#065f46" }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>📷 Product Image</div>
                                <div style={{ color: "#6b7280" }}>Click image to open full size</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Resolve Form row */}
                      {showResolve && s === "open" && (
                        <tr key={`resolveform-${ticket.id}`} style={{ background: "#f0fdf4" }}>
                          <td colSpan={10} style={{ padding: "16px 20px" }}>
                            <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", border: "2px solid #10b981", borderRadius: 12, padding: "18px 20px" }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46", marginBottom: 4 }}>✅ Confirm Resolution</div>
                              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Fill in resolution details before marking as resolved.</div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>
                                    What issue was solved? <span style={{ color: "#ef4444" }}>*</span>
                                  </div>
                                  <textarea
                                    rows={3}
                                    placeholder="e.g. Router was not connecting — reset factory settings and reconfigured PPPoE..."
                                    value={resolveForm[ticket.id]?.notes || ""}
                                    onChange={e => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], notes: e.target.value } }))}
                                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #6ee7b7", borderRadius: 8, fontSize: 12, outline: "none", fontFamily: "inherit", background: "white", resize: "vertical", color: "#111", lineHeight: 1.5, boxSizing: "border-box" }}
                                  />
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>
                                    Time Taken to Resolve <span style={{ color: "#ef4444" }}>*</span>
                                  </div>
                                  <select
                                    value={resolveForm[ticket.id]?.timeTaken || ""}
                                    onChange={e => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], timeTaken: e.target.value } }))}
                                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #6ee7b7", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", cursor: "pointer" }}>
                                    <option value="">Select time taken</option>
                                    <option value="Less than 30 minutes">Less than 30 minutes</option>
                                    <option value="30 minutes - 1 hour">30 minutes – 1 hour</option>
                                    <option value="1 - 2 hours">1 – 2 hours</option>
                                    <option value="2 - 4 hours">2 – 4 hours</option>
                                    <option value="4 - 8 hours">4 – 8 hours</option>
                                    <option value="8 - 12 hours">8 – 12 hours</option>
                                    <option value="12 - 24 hours">12 – 24 hours</option>
                                    <option value="More than 24 hours">More than 24 hours</option>
                                  </select>
                                  {ticket.createdAt && (
                                    <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280" }}>⏱️ Raised: <strong>{new Date(ticket.createdAt).toLocaleString()}</strong></div>
                                  )}
                                  {ticket.acceptedAt && (
                                    <div style={{ marginTop: 4, fontSize: 11, color: "#6b7280" }}>🔓 Accepted: <strong>{new Date(ticket.acceptedAt).toLocaleString()}</strong></div>
                                  )}
                                </div>
                              </div>
                              {resolveForm[ticket.id]?.notes && resolveForm[ticket.id]?.timeTaken && (
                                <div style={{ background: "white", border: "1px solid #6ee7b7", borderRadius: 8, padding: "10px 14px", marginTop: 14, fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
                                  <strong>📋 Summary:</strong><br />
                                  🔧 Resolved: {resolveForm[ticket.id].notes}<br />
                                  ⏱️ Time taken: {resolveForm[ticket.id].timeTaken}
                                </div>
                              )}
                              <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
                                <button
                                  onClick={() => handleResolveSubmit(ticket.id)}
                                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", padding: "10px 28px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "inherit", boxShadow: "0 3px 12px rgba(16,185,129,0.4)" }}>
                                  ✅ Confirm Resolved
                                </button>
                                <button
                                  onClick={() => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: false } }))}
                                  style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, color: "#64748b" }}>
                                  Cancel
                                </button>
                                <span style={{ fontSize: 11, color: "#6b7280" }}>Both fields required ✅</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* RMA Form row */}
                      {showRma && (s === "open" || s === "pending") && (
                        <tr key={`rmaform-${ticket.id}`} style={{ background: "#faf5ff" }}>
                          <td colSpan={10} style={{ padding: "16px 20px" }}>
                            <div style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "2px solid #7c3aed", borderRadius: 12, padding: "16px 20px" }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6", marginBottom: 12 }}>🔧 Cannot Resolve — Send to RMA</div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Reason *</div>
                                  <select value={rmaf.reason || ""}
                                    onChange={e => setRmaForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], reason: e.target.value } }))}
                                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #c4b5fd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", cursor: "pointer" }}>
                                    <option value="">Select reason</option>
                                    {RMA_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Nearest RMA Center *</div>
                                  {nearbyRmaCenters.length > 0 && nearbyRmaCenters[0].city?.toLowerCase() === (ticket.city || "").toLowerCase() && (
                                    <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>✅ Showing centers near {ticket.city}</div>
                                  )}
                                  <select value={rmaf.centerId || ""}
                                    onChange={e => setRmaForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], centerId: e.target.value } }))}
                                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #c4b5fd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", cursor: "pointer" }}>
                                    <option value="">Select RMA center</option>
                                    {nearbyRmaCenters.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
                                  </select>
                                </div>
                              </div>
                              {rmaf.centerId && (() => {
                                const center = rmaCenters.find(c => c.id === parseInt(rmaf.centerId));
                                if (!center) return null;
                                return (
                                  <div style={{ background: "white", border: "1px solid #c4b5fd", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
                                    <strong>📍 {center.name}</strong> — {center.city} | 📞 {center.phone}<br />{center.address}
                                  </div>
                                );
                              })()}
                              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                                <button onClick={() => handleRMASubmit(ticket.id)} disabled={submittingRma === ticket.id}
                                  style={{ background: submittingRma === ticket.id ? "#94a3b8" : "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "inherit" }}>
                                  {submittingRma === ticket.id ? "⏳ Processing..." : "🔧 Confirm RMA + Send WhatsApp"}
                                </button>
                                <button onClick={() => setRmaForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: false } }))}
                                  style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, color: "#64748b" }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Reassign Form row */}
                      {showReassign && s !== "resolved" && s !== "rma" && (
                        <tr key={`reassignform-${ticket.id}`} style={{ background: "#fffdf0" }}>
                          <td colSpan={10} style={{ padding: "16px 20px" }}>
                            <div style={{ background: "linear-gradient(135deg, #fffbeb, #fef9c3)", border: "2px solid #f59e0b", borderRadius: 12, padding: "16px 20px" }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginBottom: 12 }}>🔄 Reassign This Ticket</div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Reassign To *</div>
                                  <select value={rf.newPerson || ""}
                                    onChange={e => setReassignForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], newPerson: e.target.value } }))}
                                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #fcd34d", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", cursor: "pointer" }}>
                                    <option value="">Select specialist</option>
                                    {filteredReassignPersons.map(p => (
                                      <option key={p.email} value={p.name}>
                                        {p.name} — {p.city || "—"}{p.specialization?.length > 0 ? ` (${p.specialization.join(", ")})` : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Reason *</div>
                                  <input type="text" placeholder="e.g. Busy with other tickets..."
                                    value={rf.reason || ""}
                                    onChange={e => setReassignForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], reason: e.target.value } }))}
                                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #fcd34d", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", boxSizing: "border-box", color: "#111" }}
                                  />
                                </div>
                              </div>
                              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                                <button onClick={() => handleReassign(ticket.id)} disabled={reassigning === ticket.id}
                                  style={{ background: reassigning === ticket.id ? "#94a3b8" : "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "inherit" }}>
                                  {reassigning === ticket.id ? "⏳ Reassigning..." : "🔄 Confirm Reassign"}
                                </button>
                                <button onClick={() => setReassignForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: false } }))}
                                  style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, color: "#64748b" }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Feedback row */}
                      {s === "resolved" && (
                        <tr key={`fb-${ticket.id}`} style={{ background: "#f0fdf4" }}>
                          <td colSpan={10} style={{ padding: "8px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                              {ticket.feedbackRating ? (
                                <span style={{ fontSize: 12, color: "#065f46", fontWeight: 600 }}>
                                  ⭐ Customer Rating: {"★".repeat(ticket.feedbackRating)}{"☆".repeat(5 - ticket.feedbackRating)} ({ticket.feedbackRating}/5)
                                  {ticket.feedbackComment && ` — "${ticket.feedbackComment}"`}
                                </span>
                              ) : (
                                <span style={{ fontSize: 12, color: "#6b7280" }}>
                                  {ticket.feedbackSent
                                    ? `✅ WhatsApp sent to ${ticket.customer} — waiting for admin to record feedback`
                                    : "📱 Send WhatsApp to request customer feedback"
                                  }
                                </span>
                              )}
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
    </div>
  );
}