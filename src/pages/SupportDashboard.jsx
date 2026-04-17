import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// const BASE_URL = "http://localhost:3001";
const BASE_URL = "https://syrotech-backend.onrender.com";


const STATUS_COLOR = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed" };
const STATUS_BG    = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff" };

const RMA_REASONS = [
  "Damaged Product",
  "Hardware Fault",
  "Physical Damage",
  "Water Damage",
  "Burnt Component",
  "Manufacturing Defect",
  "Other",
];

function getTimerInfo(ticket) {
  if (!ticket.createdAt || ticket.status === "resolved" || ticket.status === "rma") return null;
  const raisedAt  = new Date(ticket.createdAt).getTime();
  const deadline  = raisedAt + 24 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();
  if (remaining <= 0) return { label: "OVERDUE", color: "#dc2626", bg: "#fef2f2", overdue: true };
  const hours   = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const urgent  = remaining < 4 * 60 * 60 * 1000;
  return { label: `${hours}h ${minutes}m left`, color: urgent ? "#dc2626" : "#059669", bg: urgent ? "#fef2f2" : "#ecfdf5", overdue: false };
}

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
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 *Ticket Summary*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `• Product   : ${ticket.category}\n` +
    `• Serial No : ${ticket.serialNo}\n` +
    `• Issue     : ${(ticket.description || "").slice(0, 60)}...\n` +
    `• Handled by: ${supportName}\n` +
    `• Date      : ${resolvedDate}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `⭐ *Please share your feedback:*\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `1️⃣  Was your issue fully resolved?\n    Reply: *Yes* or *No*\n\n` +
    `2️⃣  Rate our service out of 5:\n    Reply: ⭐⭐⭐⭐⭐ (1 to 5)\n\n` +
    `3️⃣  Any comments or suggestions?\n    Feel free to share!\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Thank you for choosing *Syrotech Networks* 🙏\n` +
    `📞 Support: +91 9205229997\n` +
    `🌐 www.Syrotech.com`;
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
  return true;
}

// ✅ NEW: RMA WhatsApp message
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
    `━━━━━━━━━━━━━━━━━━\n` +
    `📦 *Product Details*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `• Product    : ${ticket.category}\n` +
    `• Serial No  : ${ticket.serialNo}\n` +
    `• MAC Address: ${ticket.mac || "—"}\n` +
    `• Issue Type : ${reason}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🔧 *Please Visit RMA Center*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `• Center  : ${rmaCenter.name}\n` +
    `• City    : ${rmaCenter.city}\n` +
    `• Address : ${rmaCenter.address}\n` +
    `• Phone   : ${rmaCenter.phone}\n\n` +
    `📌 *Please carry:*\n` +
    `  ✅ Your product\n` +
    `  ✅ This message / ticket reference\n` +
    `  ✅ Purchase invoice (if available)\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Thank you for choosing *Syrotech Networks* 🙏\n` +
    `📞 Support: +91 9205229997\n` +
    `🌐 www.Syrotech.com`;
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
  return true;
}

function TicketTable({ rows }) {
  return (
    <div style={{
      margin: "14px 0", borderRadius: 10, overflow: "hidden",
      border: "2.5px solid #c94500", boxShadow: "0 2px 10px rgba(201,69,0,0.10)",
    }}>
      <div style={{ display: "flex", background: "linear-gradient(135deg, #c94500 0%, #ff5a00 100%)", borderBottom: "2.5px solid #c94500" }}>
        {rows.map(([label], i) => (
          <div key={i} style={{
            flex: 1, minWidth: 0, padding: "9px 12px",
            borderRight: i < rows.length - 1 ? "2px solid rgba(255,255,255,0.25)" : "none",
            fontSize: 10, fontWeight: 800, color: "white",
            textTransform: "uppercase", letterSpacing: "0.07em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{label}</div>
        ))}
      </div>
      <div style={{ display: "flex", background: "#ffffff" }}>
        {rows.map(([, value], i) => (
          <div key={i} style={{
            flex: 1, minWidth: 0, padding: "11px 12px",
            borderRight: i < rows.length - 1 ? "2px solid #e8ddd4" : "none",
            fontSize: 13, fontWeight: 600, color: "#1a1a1a",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            background: i % 2 === 0 ? "#faf7f4" : "#ffffff",
          }}>{value}</div>
        ))}
      </div>
    </div>
  );
}

// Smart filter for reassign
function getFilteredReassignPersons(allPersons, ticket, currentUserName) {
  const others  = allPersons.filter(u =>
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

function getReassignFilterMessage(allPersons, ticket, currentUserName) {
  const others  = allPersons.filter(u => u.role === "support" && u.approved && u.name.toLowerCase().trim() !== (currentUserName || "").toLowerCase().trim());
  const product = (ticket.category || "").toLowerCase();
  const city    = (ticket.city    || "").toLowerCase().trim();
  const country = (ticket.country || "").toLowerCase().trim();
  if (!product) return null;
  const level1 = others.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return specs.map(s => s.toLowerCase()).includes(product) && city && p.city && p.city.toLowerCase().trim() === city;
  });
  if (level1.length > 0 && city)
    return { msg: `✅ Showing ${ticket.category} specialists in ${ticket.city}`, color: "#10b981", bg: "#ecfdf5" };
  const level2 = others.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return specs.map(s => s.toLowerCase()).includes(product) && country && p.country && p.country.toLowerCase().trim() === country;
  });
  if (level2.length > 0 && country)
    return { msg: `⚠️ No specialist in ${ticket.city || "customer city"} — showing ${ticket.category} specialists in ${ticket.country}`, color: "#f59e0b", bg: "#fffbeb" };
  const level3 = others.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return specs.map(s => s.toLowerCase()).includes(product);
  });
  if (level3.length > 0)
    return { msg: `ℹ️ No location match — showing all ${ticket.category} specialists`, color: "#3b82f6", bg: "#eff6ff" };
  return { msg: `⚠️ No ${ticket.category} specialist found — showing all`, color: "#ef4444", bg: "#fef2f2" };
}

// ✅ NEW: Get filtered RMA centers based on customer city/country
function getFilteredRMACenters(rmaCenters, ticket) {
  if (!rmaCenters || rmaCenters.length === 0) return [];
  const city    = (ticket.city    || "").toLowerCase().trim();
  const country = (ticket.country || "").toLowerCase().trim();
  // Level 1: same city
  const level1 = rmaCenters.filter(c => c.city && c.city.toLowerCase().trim() === city);
  if (level1.length > 0) return level1;
  // Level 2: same country
  const level2 = rmaCenters.filter(c => c.country && c.country.toLowerCase().trim() === country);
  if (level2.length > 0) return level2;
  // Level 3: all
  return rmaCenters;
}

export default function SupportDashboard() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [tickets, setTickets]                     = useState([]);
  const [filter, setFilter]                       = useState("all");
  const [tick, setTick]                           = useState(0);
  const [allSupportPersons, setAllSupportPersons] = useState([]);
  const [rmaCenters, setRmaCenters]               = useState([]); // ✅ NEW
  const [reassignForm, setReassignForm]           = useState({});
  const [rmaForm, setRmaForm]                     = useState({}); // ✅ NEW
  const [reassigning, setReassigning]             = useState(null);
  const [submittingRma, setSubmittingRma]         = useState(null); // ✅ NEW

  const fetchTickets = () => {
    fetch(`${BASE_URL}/tickets`)
      .then(r => r.json())
      .then(data => {
        const mine = data.filter(t =>
          t.assignTo && currentUser?.name &&
          t.assignTo.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
        );
        setTickets(mine);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchTickets();
    const poll  = setInterval(fetchTickets, 8000);
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => { clearInterval(poll); clearInterval(timer); };
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(users => setAllSupportPersons(users.filter(u => u.role === "support" && u.approved)))
      .catch(console.error);
  }, []);

  // ✅ NEW: Fetch RMA centers
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
    if (!rf.reason?.trim() || rf.reason.trim().length < 5) { alert("Please enter a reason for reassignment (minimum 5 characters)."); return; }
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
        alert(`✅ Ticket reassigned to ${rf.newPerson} successfully!\n\nReason: ${rf.reason}`);
      })
      .catch(err => { console.error("Reassign failed:", err); setReassigning(null); });
  };

  // ✅ NEW: Handle RMA submission
  const handleRMASubmit = (ticketId) => {
    const rf     = rmaForm[ticketId] || {};
    const ticket = tickets.find(t => t.id === ticketId);
    if (!rf.reason)  { alert("Please select a reason for RMA."); return; }
    if (!rf.centerId) { alert("Please select an RMA center."); return; }
    const center = rmaCenters.find(c => c.id === parseInt(rf.centerId));
    if (!center) { alert("Invalid RMA center selected."); return; }

    // Send WhatsApp first
    const sent = sendRMAWhatsApp(ticket, center, rf.reason);
    if (!sent) return;

    setSubmittingRma(ticketId);
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:           "rma",
        rmaStatus:        true,
        rmaReason:        rf.reason,
        rmaCenterName:    center.name,
        rmaCenterCity:    center.city,
        rmaCenterAddress: center.address,
        rmaCenterPhone:   center.phone,
        rmaSentAt:        new Date().toISOString(),
        rmaSentBy:        currentUser?.name,
        resolvedAt:       null,
      })
    })
      .then(r => r.json())
      .then(updated => {
        setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
        setSubmittingRma(null);
        setRmaForm(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
        alert(`✅ RMA processed successfully!\n\nReason: ${rf.reason}\nCenter: ${center.name}\nWhatsApp sent to customer ✅`);
      })
      .catch(err => { console.error("RMA failed:", err); setSubmittingRma(null); });
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

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);
  const counts   = {
    all:      tickets.length,
    pending:  tickets.filter(t => t.status === "pending").length,
    open:     tickets.filter(t => t.status === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    rma:      tickets.filter(t => t.status === "rma").length,
  };
  const resolved = tickets.filter(t => t.status === "resolved" && t.createdAt && t.resolvedAt);
  const within24 = resolved.filter(t => new Date(t.resolvedAt) - new Date(t.createdAt) <= 24 * 60 * 60 * 1000).length;
  const avgHours = resolved.length === 0 ? 0 : (
    resolved.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0)
    / resolved.length / (1000 * 60 * 60)
  ).toFixed(1);
  const score = counts.resolved === 0 ? "—" : `${Math.round((within24 / counts.resolved) * 10)}/10`;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8" }}>

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

      <div style={{ maxWidth: 1000, margin: "28px auto", padding: "0 16px" }}>

        {/* Performance Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            ["Total Tickets",     counts.all,      "🎫", "#3b82f6", "#eff6ff"],
            ["Resolved",          counts.resolved,  "✅", "#10b981", "#ecfdf5"],
            ["Avg Resolution",    `${avgHours}h`,   "⏱️", "#f59e0b", "#fffbeb"],
            ["Performance Score", score,            "🏆", "#8b5cf6", "#f5f3ff"],
          ].map(([label, val, icon, col, bg]) => (
            <div key={label} style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderTop: `4px solid ${col}` }}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: col, marginTop: 6 }}>{val}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ✅ NEW: RMA count banner */}
        {counts.rma > 0 && (
          <div style={{ background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 10, padding: "12px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔧</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5b21b6" }}>
              {counts.rma} ticket{counts.rma > 1 ? "s" : ""} sent to RMA center
            </span>
          </div>
        )}

        {/* 24hr Banner */}
        {counts.resolved > 0 && (
          <div style={{ background: within24 === counts.resolved ? "#ecfdf5" : "#fffbeb", border: `1px solid ${within24 === counts.resolved ? "#6ee7b7" : "#fcd34d"}`, borderRadius: 10, padding: "12px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{within24 === counts.resolved ? "🎯" : "⚠️"}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              24hr Compliance: {within24}/{counts.resolved} tickets resolved within 24 hours of raising
              {within24 < counts.resolved && " — Some tickets exceeded the 24hr limit"}
            </span>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            ["all","All"],
            ["pending","⏳ Pending"],
            ["open","🔓 Open"],
            ["resolved","✅ Resolved"],
            ["rma","🔧 RMA"],
          ].map(([key, label]) => (
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

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 14, color: "#aaa" }}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p style={{ marginTop: 12 }}>No tickets in this category.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(ticket => {
            const s            = (ticket.status || "pending").toLowerCase();
            const timer        = getTimerInfo(ticket);
            const rf           = reassignForm[ticket.id] || {};
            const rmaf         = rmaForm[ticket.id] || {};
            const showReassign = rf.show || false;
            const showRma      = rmaf.show || false;
            const isReassigned = !!ticket.reassignedFrom;

            const filteredReassignPersons = getFilteredReassignPersons(allSupportPersons, ticket, currentUser?.name);
            const reassignFilterMsg       = getReassignFilterMessage(allSupportPersons, ticket, currentUser?.name);

            // ✅ NEW: Get nearby RMA centers
            const nearbyRmaCenters = getFilteredRMACenters(rmaCenters, ticket);

            const row1 = [
              ["Serial No",   ticket.serialNo || "—"],
              ["Customer",    ticket.customer || "—"],
              ["Contact",     ticket.phone ? ticket.phone : <span style={{ color: "#ef4444", fontWeight: 700 }}>⚠ Missing</span>],
              ["MAC",         ticket.mac || "—"],
              ["Date Raised", ticket.date || "—"],
            ];
            const row2 = [];
            if (ticket.city)       row2.push(["City",     ticket.city]);
            if (ticket.country)    row2.push(["Country",  ticket.country]);
            if (ticket.pincode)    row2.push(["Pincode",  ticket.pincode]);
            if (ticket.acceptedAt) row2.push(["Accepted", new Date(ticket.acceptedAt).toLocaleString()]);
            if (ticket.resolvedAt) row2.push(["Resolved", new Date(ticket.resolvedAt).toLocaleString()]);

            return (
              <div key={ticket.id} style={{
                borderRadius: 12,
                borderLeft: `5px solid ${s === "rma" ? "#7c3aed" : isReassigned ? "#f59e0b" : (STATUS_COLOR[s] || "#ccc")}`,
                padding: "18px 22px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                background: s === "rma" ? "linear-gradient(to right, #f5f3ff, white 120px)" :
                            isReassigned ? "linear-gradient(to right, #fffdf0, white 120px)" : "white",
              }}>

                {/* ✅ NEW: RMA banner */}
                {s === "rma" && (
                  <div style={{
                    background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                    border: "1.5px solid #c4b5fd", borderRadius: 10, padding: "12px 16px", marginBottom: 14,
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>🔧</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6", marginBottom: 4 }}>
                        Product sent to RMA Center
                      </div>
                      <div style={{ fontSize: 12, color: "#6d28d9", lineHeight: 1.8 }}>
                        <div>Reason: <strong>{ticket.rmaReason}</strong></div>
                        <div>Center: <strong>{ticket.rmaCenterName}</strong> — {ticket.rmaCenterCity}</div>
                        <div>Address: {ticket.rmaCenterAddress}</div>
                        <div>📞 {ticket.rmaCenterPhone}</div>
                        {ticket.rmaSentAt && <div style={{ fontSize: 11, color: "#9ca3af" }}>Sent on: {new Date(ticket.rmaSentAt).toLocaleString()}</div>}
                      </div>
                    </div>
                    <span style={{ marginLeft: "auto", background: "#7c3aed", color: "white", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      🔧 RMA
                    </span>
                  </div>
                )}

                {isReassigned && (
                  <div style={{
                    background: "linear-gradient(135deg, #fffbeb, #fef9c3)",
                    border: "1.5px solid #f59e0b", borderRadius: 10, padding: "10px 16px", marginBottom: 14,
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>🔄</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginBottom: 2 }}>
                        Reassigned Ticket — from <strong>{ticket.reassignedFrom}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: "#b45309" }}>
                        Reason: "<em>{ticket.reassignReason}</em>"
                        {ticket.reassignedAt && (
                          <span style={{ color: "#9ca3af", marginLeft: 8, fontSize: 11 }}>
                            {new Date(ticket.reassignedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ marginLeft: "auto", background: "#f59e0b", color: "white", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      🔄 REASSIGNED
                    </span>
                  </div>
                )}

                {/* ✅ NEW: Issue history banner */}
                {ticket.issueHistory && ticket.issueHistory.length > 0 && (
                  <div style={{
                    background: "#eff6ff", border: "1px solid #93c5fd",
                    borderRadius: 8, padding: "8px 14px", marginBottom: 12,
                    fontSize: 12, color: "#1e40af",
                  }}>
                    🔁 <strong>Repeat Customer</strong> — {ticket.issueHistory.length} previous issue{ticket.issueHistory.length > 1 ? "s" : ""} on this product
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 17 }}>{ticket.category}</span>
                    <span style={{ color: "#9ca3af", fontSize: 12, marginLeft: 8 }}>#{ticket.id?.slice(-8)}</span>
                    <span style={{ fontSize: 12, color: "#555", marginLeft: 10 }}>raised by <strong>{ticket.raisedByName || ticket.raisedBy}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {timer && (
                      <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: timer.color, background: timer.bg }}>
                        ⏱️ {timer.label}
                      </span>
                    )}
                    <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s] }}>
                      {s.toUpperCase()}
                    </span>
                  </div>
                </div>

                <TicketTable rows={row1} />
                {row2.length > 0 && <TicketTable rows={row2} />}

                {/* ✅ NEW: Product Image */}
                {ticket.productImage && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#b0a898", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                      📷 Product Image
                    </div>
                    <img src={ticket.productImage} alt="Product"
                      style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, border: "2px solid #e0d8d0", cursor: "pointer" }}
                      onClick={() => window.open(ticket.productImage, "_blank")}
                    />
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Click to view full size</div>
                  </div>
                )}

                <div style={{
                  fontSize: 13, color: "#444", marginBottom: 14,
                  background: "#fff8f2", padding: "10px 14px", borderRadius: 8,
                  borderLeft: "4px solid #ff5a00", border: "1px solid #fad8be",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#b0a898", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 4 }}>Issue</span>
                  {ticket.description}
                </div>

                {/* Action Section */}
                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Update Status:</span>

                    {s === "pending" && (
                      <button onClick={() => updateStatus(ticket.id, "open")}
                        style={{ background: "#e04e00", color: "white", border: "none", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        🔓 Accept Ticket
                      </button>
                    )}
                    {s === "open" && (
                      <button onClick={() => updateStatus(ticket.id, "resolved")}
                        style={{ background: "#10b981", color: "white", border: "none", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        ✅ Mark as Resolved
                      </button>
                    )}
                    {s === "resolved" && (
                      <span style={{ color: "#10b981", fontWeight: 600, fontSize: 13 }}>✅ Issue resolved successfully.</span>
                    )}
                    {s === "rma" && (
                      <span style={{ color: "#7c3aed", fontWeight: 600, fontSize: 13 }}>🔧 Sent to RMA Center.</span>
                    )}

                    {/* ✅ NEW: Cannot Resolve button */}
                    {(s === "open" || s === "pending") && (
                      <button
                        onClick={() => setRmaForm(prev => ({
                          ...prev, [ticket.id]: { ...prev[ticket.id], show: !showRma }
                        }))}
                        style={{
                          background: showRma ? "#ede9fe" : "#f5f3ff",
                          border: `1.5px solid ${showRma ? "#7c3aed" : "#c4b5fd"}`,
                          color: "#5b21b6", padding: "7px 14px",
                          borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
                        }}
                      >
                        🔧 {showRma ? "Cancel RMA" : "Cannot Resolve (RMA)"}
                      </button>
                    )}

                    {s !== "resolved" && s !== "rma" && (
                      <button
                        onClick={() => setReassignForm(prev => ({
                          ...prev, [ticket.id]: { ...prev[ticket.id], show: !showReassign }
                        }))}
                        style={{
                          marginLeft: "auto",
                          background: showReassign ? "#fef9c3" : "#fff7ed",
                          border: `1.5px solid ${showReassign ? "#f59e0b" : "#fed7aa"}`,
                          color: "#92400e", padding: "7px 14px",
                          borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
                        }}
                      >
                        🔄 {showReassign ? "Cancel Reassign" : "Reassign Ticket"}
                      </button>
                    )}
                  </div>

                  {/* ✅ NEW: RMA Form */}
                  {showRma && (s === "open" || s === "pending") && (
                    <div style={{
                      background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                      border: "2px solid #7c3aed", borderRadius: 12,
                      padding: "18px 20px", marginBottom: 14,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6", marginBottom: 4 }}>🔧 Cannot Resolve — Send to RMA</div>
                      <div style={{ fontSize: 12, color: "#6d28d9", marginBottom: 16 }}>
                        Select reason and nearest RMA center. WhatsApp will be sent to customer automatically.
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

                        {/* Reason */}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                            Reason <span style={{ color: "#ef4444" }}>*</span>
                          </div>
                          <select
                            value={rmaf.reason || ""}
                            onChange={e => setRmaForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], reason: e.target.value } }))}
                            style={{ width: "100%", padding: "10px 12px", border: "2px solid #c4b5fd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", cursor: "pointer" }}
                          >
                            <option value="">Select reason</option>
                            {RMA_REASONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>

                        {/* RMA Center */}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                            Nearest RMA Center <span style={{ color: "#ef4444" }}>*</span>
                          </div>
                          {nearbyRmaCenters.length > 0 && nearbyRmaCenters[0].city?.toLowerCase() === (ticket.city || "").toLowerCase() && (
                            <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginBottom: 6 }}>
                              ✅ Showing centers near {ticket.city}
                            </div>
                          )}
                          <select
                            value={rmaf.centerId || ""}
                            onChange={e => setRmaForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], centerId: e.target.value } }))}
                            style={{ width: "100%", padding: "10px 12px", border: "2px solid #c4b5fd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", cursor: "pointer" }}
                          >
                            <option value="">Select RMA center</option>
                            {nearbyRmaCenters.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name} — {c.city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Show selected center details */}
                      {rmaf.centerId && (() => {
                        const center = rmaCenters.find(c => c.id === parseInt(rmaf.centerId));
                        if (!center) return null;
                        return (
                          <div style={{
                            background: "white", border: "1px solid #c4b5fd",
                            borderRadius: 8, padding: "10px 14px", marginTop: 12,
                            fontSize: 12, color: "#374151", lineHeight: 1.8,
                          }}>
                            <strong>📍 {center.name}</strong><br/>
                            Address: {center.address}<br/>
                            City: {center.city} | Phone: 📞 {center.phone}
                          </div>
                        );
                      })()}

                      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
                        <button
                          onClick={() => handleRMASubmit(ticket.id)}
                          disabled={submittingRma === ticket.id}
                          style={{
                            background: submittingRma === ticket.id ? "#94a3b8" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                            color: "white", border: "none", padding: "10px 28px",
                            borderRadius: 8, cursor: submittingRma === ticket.id ? "not-allowed" : "pointer",
                            fontSize: 13, fontWeight: 800, fontFamily: "inherit",
                            boxShadow: submittingRma === ticket.id ? "none" : "0 3px 12px rgba(124,58,237,0.4)",
                          }}
                        >
                          {submittingRma === ticket.id ? "⏳ Processing..." : "🔧 Confirm RMA + Send WhatsApp"}
                        </button>
                        <span style={{ fontSize: 11, color: "#6d28d9" }}>WhatsApp sent to customer automatically ✅</span>
                      </div>
                    </div>
                  )}

                  {/* Reassign Form */}
                  {showReassign && s !== "resolved" && s !== "rma" && (
                    <div style={{
                      background: "linear-gradient(135deg, #fffbeb, #fef9c3)",
                      border: "2px solid #f59e0b", borderRadius: 12,
                      padding: "18px 20px", marginBottom: 14,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginBottom: 4 }}>🔄 Reassign This Ticket</div>
                      <div style={{ fontSize: 12, color: "#b45309", marginBottom: 16 }}>
                        Select a support person and provide a reason. Ticket will be removed from your list immediately.
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                            Reassign To <span style={{ color: "#ef4444" }}>*</span>
                          </div>
                          {reassignFilterMsg && (
                            <div style={{ fontSize: 11, fontWeight: 600, color: reassignFilterMsg.color, background: reassignFilterMsg.bg, padding: "5px 8px", borderRadius: 6, marginBottom: 6, border: `1px solid ${reassignFilterMsg.color}22` }}>
                              {reassignFilterMsg.msg}
                            </div>
                          )}
                          <select
                            value={rf.newPerson || ""}
                            onChange={e => setReassignForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], newPerson: e.target.value } }))}
                            style={{ width: "100%", padding: "10px 12px", border: "2px solid #fcd34d", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", cursor: "pointer" }}
                          >
                            <option value="">Select specialist</option>
                            {filteredReassignPersons.map(p => (
                              <option key={p.email} value={p.name}>
                                {p.name} — {p.city || "—"}
                                {p.specialization && p.specialization.length > 0 ? ` (${p.specialization.join(", ")})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                            Reason <span style={{ color: "#ef4444" }}>*</span>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. Busy with other tickets..."
                            value={rf.reason || ""}
                            onChange={e => setReassignForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], reason: e.target.value } }))}
                            style={{ width: "100%", padding: "10px 12px", border: "2px solid #fcd34d", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", boxSizing: "border-box", color: "#111" }}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
                        <button
                          onClick={() => handleReassign(ticket.id)}
                          disabled={reassigning === ticket.id}
                          style={{
                            background: reassigning === ticket.id ? "#94a3b8" : "linear-gradient(135deg, #f59e0b, #d97706)",
                            color: "white", border: "none", padding: "10px 28px",
                            borderRadius: 8, cursor: reassigning === ticket.id ? "not-allowed" : "pointer",
                            fontSize: 13, fontWeight: 800, fontFamily: "inherit",
                          }}
                        >
                          {reassigning === ticket.id ? "⏳ Reassigning..." : "🔄 Confirm Reassign"}
                        </button>
                        <span style={{ fontSize: 11, color: "#92400e" }}>Ticket disappears from your list immediately ✅</span>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp + Feedback — resolved only */}
                  {s === "resolved" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{
                        background: ticket.feedbackSent ? "#f0fdf4" : "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                        border: "1.5px solid #86efac", borderRadius: 10, padding: "14px 18px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#14532d", marginBottom: 4 }}>
                            {ticket.feedbackSent ? "✅ Feedback Request Sent" : "📱 Send Feedback Request to Customer"}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#6b7280" }}>
                            {ticket.feedbackSent
                              ? <>Sent to <strong>{ticket.customer}</strong> on {new Date(ticket.feedbackSentAt).toLocaleString()}</>
                              : <>Opens WhatsApp → message goes to <strong>{ticket.customer || "Customer"}</strong>
                                {" — "}
                                {ticket.phone
                                  ? <span style={{ color: "#10b981", fontWeight: 600 }}>📞 {ticket.phone}</span>
                                  : <span style={{ color: "#ef4444", fontWeight: 600 }}>⚠ No phone number</span>
                                }
                              </>
                            }
                          </div>
                        </div>
                        <button
                          onClick={() => markWhatsAppSent(ticket.id)}
                          style={{
                            background: ticket.feedbackSent ? "#d1fae5" : "#25D366",
                            color: ticket.feedbackSent ? "#065f46" : "white",
                            border: ticket.feedbackSent ? "1.5px solid #6ee7b7" : "none",
                            padding: "10px 22px", borderRadius: 8, cursor: "pointer",
                            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 32 32" fill={ticket.feedbackSent ? "#065f46" : "white"}>
                            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.415.638 4.683 1.753 6.648L2 30l7.565-1.726A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.43 11.43 0 0 1-5.82-1.587l-.418-.248-4.33.988 1.012-4.21-.272-.433A11.46 11.46 0 0 1 4.5 16C4.5 9.648 9.648 4.5 16 4.5S27.5 9.648 27.5 16 22.352 27.5 16 27.5zm6.29-8.424c-.344-.172-2.036-1.004-2.351-1.119-.316-.115-.546-.172-.776.172-.23.344-.891 1.119-1.093 1.35-.201.23-.402.258-.747.086-.344-.172-1.453-.536-2.768-1.708-1.023-.913-1.713-2.04-1.914-2.384-.201-.344-.021-.53.151-.701.155-.154.344-.402.516-.603.172-.2.23-.344.344-.573.115-.23.058-.43-.029-.603-.086-.172-.776-1.87-1.063-2.562-.28-.673-.564-.582-.776-.592l-.66-.011c-.23 0-.603.086-.919.43-.316.344-1.207 1.178-1.207 2.872s1.236 3.33 1.408 3.56c.172.23 2.433 3.713 5.895 5.208.824.355 1.467.568 1.969.727.827.263 1.58.226 2.174.137.663-.1 2.036-.832 2.323-1.635.287-.804.287-1.493.201-1.636-.086-.143-.316-.23-.66-.402z"/>
                          </svg>
                          {ticket.feedbackSent ? "Resend WhatsApp" : "Send on WhatsApp"}
                        </button>
                      </div>

                      {ticket.feedbackRating ? (
                        <div style={{ background: "#eff6ff", border: "1.5px solid #93c5fd", borderRadius: 10, padding: "14px 18px" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e40af", marginBottom: 8 }}>
                            📊 Customer Feedback (Recorded by Admin)
                          </div>
                          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
                            <span>⭐ Rating: <strong style={{ color: "#f59e0b" }}>
                              {"★".repeat(ticket.feedbackRating)}{"☆".repeat(5 - ticket.feedbackRating)} ({ticket.feedbackRating}/5)
                            </strong></span>
                            {ticket.feedbackResolved && <span>✅ Resolved: <strong>{ticket.feedbackResolved}</strong></span>}
                            {ticket.feedbackComment  && <span>💬 Comment: <strong>{ticket.feedbackComment}</strong></span>}
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e" }}>
                          ℹ️ Customer feedback will be recorded by <strong>Admin</strong> after customer replies on WhatsApp.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}