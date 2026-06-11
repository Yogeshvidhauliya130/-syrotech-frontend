import { useState, useEffect } from "react";
import "./reassignTicket.css";


const BASE_URL = "https://api.syrotech.com";

const STATUS_COLOR = {
  open: "#e04e00", resolved: "#1a7a46", rma: "#7c3aed", reopened: "#dc2626", pending: "#b45309",
};
const STATUS_BG = {
  open: "#fff4ee", resolved: "#edfaf3", rma: "#f5f3ff", reopened: "#fee2e2", pending: "#fffbeb",
};

export default function ReassignTicket() {
  const [tickets, setTickets]               = useState([]);
  const [supportPersons, setSupportPersons] = useState([]);
  const [searchQuery, setSearchQuery]       = useState("");
  const [statusFilter, setStatusFilter]     = useState("open");
  const [sourceFilter, setSourceFilter]     = useState("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter]       = useState("all");
  const [dateSort, setDateSort]             = useState("newest");
  const [reassignPopup, setReassignPopup]   = useState(null);
  const [selectedPerson, setSelectedPerson] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [successMsg, setSuccessMsg]         = useState("");
  const [filterYear, setFilterYear]         = useState("");
const [filterMonth, setFilterMonth]             = useState("");
const [customerPopup, setCustomerPopup]         = useState(null);
const [priorityCompanies, setPriorityCompanies] = useState([]);
const [companyFilter, setCompanyFilter]       = useState("all");
const [showPriorityList, setShowPriorityList] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const PAGE_SIZE = 500;

 const fetchAll = () => {
  fetch(`${BASE_URL}/tickets?page=1&limit=2000`)
    .then(r => r.json())
    .then(data => { 
      const list = data.tickets || [];
      setTickets(list); 
    })
    .catch(console.error);
  fetch(`${BASE_URL}/api/users`)
    .then(r => r.json())
    .then(users => setSupportPersons(users.filter(u => u.role === "support" && u.approved)))
    .catch(console.error);
  fetch(`${BASE_URL}/api/priority-companies`)
    .then(r => r.json())
    .then(data => { if (Array.isArray(data)) setPriorityCompanies(data); })
    .catch(console.error);
};

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, sourceFilter, customerTypeFilter, levelFilter, filterYear, filterMonth, dateSort, companyFilter, searchQuery]);

  const getPersonLevel = (name) => {
    const p = supportPersons.find(x => x.name && name && x.name.toLowerCase().trim() === name.toLowerCase().trim());
    return p ? p.level : null;
  };

  const filtered = tickets
    .filter(t => {
      if (statusFilter === "all") return true;
      return (t.status || "open").toLowerCase() === statusFilter;
    })
    .filter(t => {
      if (sourceFilter === "all") return true;
      if (sourceFilter === "customer") return t.source === "customer";
      if (sourceFilter === "sales")    return !t.source || (t.source !== "customer" && t.source !== "support");
      if (sourceFilter === "support")  return t.source === "support";
      return true;
    })
    .filter(t => {
      if (customerTypeFilter === "all") return true;
      return (t.customerType || "").toLowerCase() === customerTypeFilter.toLowerCase();
    })
    .filter(t => {
      if (levelFilter === "all") return true;
      const lvl = getPersonLevel(t.assignTo);
      return lvl === parseInt(levelFilter);
    })
    .filter(t => {
      if (!filterYear && !filterMonth) return true;
      const d = new Date(t.createdAt || t.date);
      if (filterYear && filterMonth) return d.getFullYear() === parseInt(filterYear) && d.getMonth() + 1 === parseInt(filterMonth);
      if (filterYear)  return d.getFullYear() === parseInt(filterYear);
      if (filterMonth) return d.getMonth() + 1 === parseInt(filterMonth);
      return true;
    })

    .filter(t => {
  if (companyFilter === "all") return true;
  if (companyFilter === "high") return priorityCompanies.some(p => p.companyName.toLowerCase() === (t.companyName || "").toLowerCase());
  return true;
})
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (t.customer     || "").toLowerCase().includes(q) ||
        (t.serialNo     || "").toLowerCase().includes(q) ||
        (t.category     || "").toLowerCase().includes(q) ||
        (t.subCategory  || "").toLowerCase().includes(q) ||
        (t.model        || "").toLowerCase().includes(q) ||
        (t.phone        || "").toLowerCase().includes(q) ||
        (t.assignTo     || "").toLowerCase().includes(q) ||
        (t.raisedByName || "").toLowerCase().includes(q) ||
        (t.customerType || "").toLowerCase().includes(q) ||
        (t.ticketNumber?.toString() || "").includes(q) ||
(t.companyName  || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.date).getTime();
      const db = new Date(b.createdAt || b.date).getTime();
      return dateSort === "newest" ? db - da : da - db;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
const paginatedTickets = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const counts = {
    all:      tickets.length,
    open:     tickets.filter(t => (t.status || "open").toLowerCase() === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    reopened: tickets.filter(t => (t.status || "").toLowerCase() === "reopened").length,
    rma:      tickets.filter(t => t.status === "rma").length,
  };

  const handleReassign = async () => {
    if (!selectedPerson) { alert("Please select a support person."); return; }
    if (!reassignReason.trim() || reassignReason.trim().length < 5) { alert("Please enter a reason (min 5 characters)."); return; }
    const ticket = reassignPopup;
    setSubmitting(true);
    const historyEntry = {
      from:      ticket.assignTo,
      to:        selectedPerson,
      reason:    reassignReason.trim(),
      timestamp: new Date().toISOString(),
      by:        "Admin",
    };
    const existingHistory = Array.isArray(ticket.reassignHistory) ? ticket.reassignHistory : [];
    try {
      const res = await fetch(`${BASE_URL}/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignTo:        selectedPerson,
          reassignedFrom:  ticket.assignTo,
          reassignReason:  reassignReason.trim(),
          reassignedAt:    new Date().toISOString(),
          reassignHistory: [...existingHistory, historyEntry],
          status:          ticket.status === "resolved" ? "open" : ticket.status,
          acceptedAt:      new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      setSuccessMsg(`✅ Ticket #${ticket.ticketNumber} reassigned to ${selectedPerson} successfully!`);
      setReassignPopup(null);
      setSelectedPerson("");
      setReassignReason("");
      fetchAll();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch {
      alert("❌ Failed to reassign ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityChange = async (ticket, newPriority) => {
  const msg = newPriority === "high"
    ? `Set HIGH priority for company "${ticket.companyName || ticket.customer}"? This will reassign ticket to L3 and all future tickets from this company will go to L3 automatically.`
    : `Set LOW priority for company "${ticket.companyName || ticket.customer}"? Future tickets from this company will go to normal L1 flow.`;

  if (!window.confirm(msg)) return;

  // Update ticket priority
  await fetch(`${BASE_URL}/tickets/${ticket.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority: newPriority }),
  });

  // Add or remove company from priority list
  if (newPriority === "high") {
    await fetch(`${BASE_URL}/api/priority-companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName: ticket.companyName || ticket.customer, setBy: "Admin" }),
    });

    // Reassign to L3
    const allUsers = await fetch(`${BASE_URL}/api/users`).then(r => r.json());
    const category = (ticket.category || "").toLowerCase();
    const l3 = allUsers.filter(p =>
      p.role === "support" && p.approved && p.level === 3 &&
      (Array.isArray(p.specialization) ? p.specialization : []).map(s => s.toLowerCase()).includes(category)
    );
    if (l3.length > 0) {
      const withCounts = await Promise.all(l3.map(async p => {
        const res = await fetch(`${BASE_URL}/tickets?page=1&limit=2000`).then(r => r.json());
        const all = res.tickets || [];
        const count = all.filter(t => t.assignTo === p.name && ["open","pending"].includes(t.status)).length;
        return { ...p, count };
      }));
      const bestL3 = withCounts.reduce((a, b) => a.count < b.count ? a : b);
      const existingHistory = Array.isArray(ticket.reassignHistory) ? ticket.reassignHistory : [];
      await fetch(`${BASE_URL}/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignTo: bestL3.name,
          reassignedFrom: ticket.assignTo,
          reassignReason: "High priority company — escalated to L3",
          reassignedAt: new Date().toISOString(),
          reassignHistory: [...existingHistory, {
            from: ticket.assignTo,
            to: bestL3.name,
            reason: "High priority company — escalated to L3",
            timestamp: new Date().toISOString(),
            by: "Admin (Priority)"
          }],
          status: "open",
          acceptedAt: new Date().toISOString(),
        }),
      });
    }
  } else {
    await fetch(`${BASE_URL}/api/priority-companies/${encodeURIComponent(ticket.companyName || ticket.customer)}`, {
      method: "DELETE",
    });
  }

  fetchAll();
  setSuccessMsg(`✅ Priority updated to ${newPriority.toUpperCase()} for "${ticket.companyName || ticket.customer}"`);
  setTimeout(() => setSuccessMsg(""), 5000);
};

  const getLevelBadge = (name) => {
    const lvl = getPersonLevel(name);
    if (!lvl) return null;
    const colors = { 1: "#3b82f6", 2: "#f59e0b", 3: "#ef4444", 4: "#7c3aed" };
    return (
      <span style={{ background: colors[lvl] || "#6b7280", color: "white", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 8, marginLeft: 4 }}>
        L{lvl}
      </span>
    );
  };

  const getSourceLabel = (ticket) => {
    if (ticket.source === "customer") return { label: ticket.customerType ? ticket.customerType.toUpperCase() : "Customer", bg: "#ede9fe", color: "#5b21b6" };
    if (ticket.source === "support")  return { label: "Support", bg: "#fde68a", color: "#92400e" };
    return { label: "Sales", bg: "#fff4ee", color: "#e04e00" };
  };

  // Group support persons by level for the select dropdown
  const personsByLevel = [1, 2, 3, 4].reduce((acc, lvl) => {
    acc[lvl] = supportPersons.filter(p => p.level === lvl);
    return acc;
  }, {});

  return (
    <div className="rt-wrapper">



{customerPopup && (
  <div onClick={() => setCustomerPopup(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"24px 28px", maxWidth:420, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #bfdbfe" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#1d4ed8" }}>👤 Customer Details</div>
        <button onClick={() => setCustomerPopup(null)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
      </div>
      <div style={{ background:"#eff6ff", borderRadius:10, padding:"14px 16px", border:"1px solid #bfdbfe" }}>
        {[["👤 Name", customerPopup.customer], ["🏢 Company", customerPopup.companyName], ["📞 Phone", customerPopup.phone], ["✉️ Email", customerPopup.email], ["🏙️ City", customerPopup.city], ["🌍 Country", customerPopup.country]].map(([label, val]) => (
          <div key={label} style={{ display:"flex", gap:10, marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#6b7280", minWidth:90 }}>{label}</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#111" }}>{val || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
      {/* Reassign Popup */}
      {reassignPopup && (
        <div className="rt-overlay" onClick={() => { setReassignPopup(null); setSelectedPerson(""); setReassignReason(""); }}>
          <div className="rt-popup" onClick={e => e.stopPropagation()}>
            <div className="rt-popup-header">
              <div>
                <div className="rt-popup-title">🔄 Reassign Ticket</div>
                <div className="rt-popup-sub">#{reassignPopup.ticketNumber} · {reassignPopup.customer}</div>
              </div>
              <button className="rt-popup-close" onClick={() => { setReassignPopup(null); setSelectedPerson(""); setReassignReason(""); }}>✕</button>
            </div>

            {/* Ticket Info */}
            <div className="rt-popup-info">
              <div className="rt-popup-info-row">
                <span className="rt-popup-info-label">Product</span>
                <span className="rt-popup-info-val">{reassignPopup.category || "—"}</span>
              </div>
              <div className="rt-popup-info-row">
                <span className="rt-popup-info-label">Model</span>
                <span className="rt-popup-info-val">{reassignPopup.model || "—"}</span>
              </div>
              <div className="rt-popup-info-row">
                <span className="rt-popup-info-label">Current Assignee</span>
                <span className="rt-popup-info-val">
                  {reassignPopup.assignTo || "—"}
                  {getLevelBadge(reassignPopup.assignTo)}
                </span>
              </div>
              <div className="rt-popup-info-row">
                <span className="rt-popup-info-label">Status</span>
                <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: STATUS_COLOR[(reassignPopup.status||"open").toLowerCase()], background: STATUS_BG[(reassignPopup.status||"open").toLowerCase()] }}>
                  {(reassignPopup.status || "open").toUpperCase()}
                </span>
              </div>
            </div>

            {/* Select Person */}
            <div className="rt-popup-field">
              <label className="rt-popup-label">Assign To <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                value={selectedPerson}
                onChange={e => setSelectedPerson(e.target.value)}
                className="rt-popup-select"
              >
                <option value="">-- Select Engineer --</option>
                {[1, 2, 3, 4].map(lvl => (
                  personsByLevel[lvl]?.length > 0 && (
                    <optgroup key={lvl} label={`── Level ${lvl} Engineers ──`}>
                      {personsByLevel[lvl].map(p => (
                       <option key={p.email} value={p.name}>
  {p.name} {p.specialization?.length > 0 ? `· ${p.specialization.join(", ")}` : ""}
</option>
                      ))}
                    </optgroup>
                  )
                ))}
              </select>
            </div>

            {/* Reason */}
            <div className="rt-popup-field">
              <label className="rt-popup-label">Reason for Reassign <span style={{ color: "#ef4444" }}>*</span></label>
              <textarea
                rows={3}
                placeholder="e.g. Escalating to higher level due to complexity..."
                value={reassignReason}
                onChange={e => setReassignReason(e.target.value)}
                className="rt-popup-textarea"
              />
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{reassignReason.length} / min 5 chars</div>
            </div>

            <div className="rt-popup-actions">
              <button onClick={handleReassign} disabled={submitting} className="rt-btn-confirm">
                {submitting ? "⏳ Reassigning..." : "🔄 Confirm Reassign"}
              </button>
              <button onClick={() => { setReassignPopup(null); setSelectedPerson(""); setReassignReason(""); }} className="rt-btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rt-header">
        <div>
          <h2 className="rt-title">🔄 Ticket Reassign</h2>
          <p className="rt-subtitle">Admin can reassign any ticket to any engineer at any level</p>
        </div>
        <div className="rt-header-stats">
          <div className="rt-stat-pill" style={{ background: "#fff4ee", color: "#e04e00" }}>🔓 {counts.open} Open</div>
          <div className="rt-stat-pill" style={{ background: "#edfaf3", color: "#1a7a46" }}>✅ {counts.resolved} Resolved</div>
          <div className="rt-stat-pill" style={{ background: "#fee2e2", color: "#dc2626" }}>🔄 {counts.reopened} Reopened</div>
          <div className="rt-stat-pill" style={{ background: "#f5f3ff", color: "#7c3aed" }}>🔧 {counts.rma} RMA</div>
        </div>
      </div>

      {successMsg && (
        <div className="rt-success">{successMsg}</div>
      )}

      {/* Filters */}
      <div className="rt-filters-card">

        {/* Status Filter */}
        <div className="rt-filter-row">
          <span className="rt-filter-label">📋 Status:</span>
          <div className="rt-filter-chips">
            {[["all","All"],["open","🔓 Open"],["resolved","✅ Resolved"],["reopened","🔄 Reopened"],["rma","🔧 RMA"]].map(([key, label]) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`rt-chip ${statusFilter === key ? "rt-chip-active" : ""}`}
                style={statusFilter === key ? { borderColor: STATUS_COLOR[key] || "#374151", background: STATUS_BG[key] || "#f3f4f6", color: STATUS_COLOR[key] || "#374151" } : {}}>
                {label}
               <span className="rt-chip-count" style={statusFilter === key ? { background: "rgba(0,0,0,0.25)", color: "white", filter: "none" } : {}}>
  {counts[key] ?? 0}
</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rt-filter-divider" />

        {/* Source Filter */}
        <div className="rt-filter-row">
          <span className="rt-filter-label">🎫 Raised By:</span>
          <div className="rt-filter-chips">
            {[["all","All"],["customer","👥 Customer"],["sales","🧑‍💼 Sales"],["support","🛠️ Support"]].map(([key, label]) => (
              <button key={key} onClick={() => { setSourceFilter(key); setCustomerTypeFilter("all"); }}
                className={`rt-chip ${sourceFilter === key ? "rt-chip-active-orange" : ""}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Customer Type sub-filter */}
          {sourceFilter === "customer" && (
            <div className="rt-filter-chips" style={{ marginLeft: 8 }}>
              {[["all","All Types"],["dealer","🏷️ Dealer"],["Service Provider","📦 Service Provider"],["si partner","🤝 SI Partner"]].map(([key, label]) => (
                <button key={key} onClick={() => setCustomerTypeFilter(key)}
                  className={`rt-chip-sm ${customerTypeFilter === key ? "rt-chip-sm-active" : ""}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rt-filter-divider" />

        {/* Level Filter + Date + Sort */}
        <div className="rt-filter-row" style={{ flexWrap: "wrap", gap: 10 }}>
          <span className="rt-filter-label">🔧 Engineer Level:</span>
          {[["all","All"],["1","L1"],["2","L2"],["3","L3"],["4","Software Team"]].map(([key, label]) => (
            <button key={key} onClick={() => setLevelFilter(key)}
              className={`rt-chip ${levelFilter === key ? "rt-chip-active-green" : ""}`}>
              {label}
            </button>
          ))}

          <div className="rt-filter-divider-v" />

          <span className="rt-filter-label">🗓️ Filter:</span>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="rt-select-sm">
            <option value="">All Years</option>
            {[2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="rt-select-sm">
            <option value="">All Months</option>
            {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          {(filterYear || filterMonth) && (
            <button onClick={() => { setFilterYear(""); setFilterMonth(""); }} className="rt-clear-btn">✕ Clear</button>
          )}

          <div className="rt-filter-divider-v" />

          <span className="rt-filter-label">📅 Sort:</span>
          <select value={dateSort} onChange={e => setDateSort(e.target.value)} className="rt-select-sm">
            <option value="newest">Newest First ↓</option>
            <option value="oldest">Oldest First ↑</option>
          </select>

          <div style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>
            Showing <strong style={{ color: "#374151" }}>{filtered.length}</strong> of <strong style={{ color: "#374151" }}>{tickets.length}</strong>
          </div>
        </div>

        <div className="rt-filter-divider" />

        {/* Search */}
        <div className="rt-search-row">
          <input
            placeholder="🔍 Search by customer, company, ticket no, serial no, product, model, phone, assignee..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="rt-search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="rt-clear-btn">✕ Clear</button>
          )}
        </div>
      </div>


{/* Company Priority Filter */}
<div style={{ background:"white", borderRadius:10, border:"1.5px solid #e0d8d0", padding:"12px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
  <span style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>🏢 Company Priority:</span>
  <button onClick={() => setCompanyFilter("all")}
    style={{ padding:"5px 14px", borderRadius:16, border: companyFilter==="all" ? "2px solid #374151" : "1px solid #d1d5db", background: companyFilter==="all" ? "#f3f4f6" : "white", color: companyFilter==="all" ? "#374151" : "#555", fontWeight: companyFilter==="all" ? 700 : 400, fontSize:12, cursor:"pointer" }}>
    All Companies
  </button>
  <button onClick={() => setCompanyFilter("high")}
    style={{ padding:"5px 14px", borderRadius:16, border: companyFilter==="high" ? "2px solid #dc2626" : "1px solid #d1d5db", background: companyFilter==="high" ? "#fee2e2" : "white", color: companyFilter==="high" ? "#dc2626" : "#555", fontWeight: companyFilter==="high" ? 700 : 400, fontSize:12, cursor:"pointer" }}>
    🔴 High Priority Companies
    <span style={{ marginLeft:5, background: companyFilter==="high" ? "#dc2626" : "#e5e7eb", color: companyFilter==="high" ? "white" : "#555", borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:700 }}>
      {priorityCompanies.length}
    </span>
  </button>
 {priorityCompanies.length > 0 && (
  <div style={{ position:"relative" }}>
    <button
      onClick={() => setShowPriorityList(prev => !prev)}
      style={{ padding:"5px 14px", borderRadius:16, border:"1.5px solid #fca5a5", background:"#fee2e2", color:"#dc2626", fontWeight:700, fontSize:12, cursor:"pointer" }}>
      🔴 {priorityCompanies.length} High Priority {priorityCompanies.length === 1 ? "Company" : "Companies"} {showPriorityList ? "▲" : "▼"}
    </button>
    {showPriorityList && (
      <div style={{ position:"absolute", top:"110%", left:0, background:"white", border:"1.5px solid #fca5a5", borderRadius:10, padding:"10px 14px", zIndex:200, minWidth:220, boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#dc2626", marginBottom:8, textTransform:"uppercase" }}>High Priority Companies</div>
        {priorityCompanies.map(pc => (
          <div key={pc.companyName} style={{ fontSize:12, fontWeight:600, color:"#374151", padding:"4px 0", borderBottom:"1px solid #fee2e2" }}>
            🔴 {pc.companyName}
          </div>
        ))}
      </div>
    )}
  </div>
)}
</div>
      {/* Table */}
      <div className="rt-table-wrap">
        <table className="rt-table">
          <thead>
            <tr className="rt-thead-row">
             {["Ticket No","Date","Source / Type","Raised By","Product","Item","Customer","Current Assignee","Status","Priority","Reassign"].map((h, i) => (
                <th key={i} className="rt-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
           {paginatedTickets.length === 0 ? (
              <tr>
                <td colSpan={10} className="rt-empty">No tickets found for the selected filters.</td>
              </tr>
            ) : (
              paginatedTickets.map((ticket, idx) => {
                const s = (ticket.status || "open").toLowerCase();
                const srcLabel = getSourceLabel(ticket);
                const assignedLevel = getPersonLevel(ticket.assignTo);
                const levelColors = { 1: "#3b82f6", 2: "#f59e0b", 3: "#ef4444", 4: "#7c3aed" };

                return (
                  <tr key={ticket.id} className="rt-tr" style={{
                    background: idx % 2 === 0 ? "#faf7f4" : "white",
                    borderLeft: `4px solid ${STATUS_COLOR[s] || "#ccc"}`,
                  }}>
                    {/* Ticket No */}
                    <td className="rt-td">
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#ff5a00" }}>{ticket.ticketNumber || "—"}</div>
                      <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>{ticket.date || "—"}</div>
                    </td>

                    {/* Date */}
                    <td className="rt-td">
                      <div style={{ fontSize: 11, color: "#374151" }}>
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-IN") : "—"}
                      </div>
                    </td>

                    {/* Source / Type */}
                    <td className="rt-td">
                      <span style={{ background: srcLabel.bg, color: srcLabel.color, padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700, display: "inline-block" }}>
                        {srcLabel.label}
                      </span>
                    </td>

                    {/* Raised By */}
                    <td className="rt-td">
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>{ticket.raisedByName || "—"}</div>
                    </td>

                    {/* Product */}
                    <td className="rt-td">
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>{ticket.category || "—"}</div>
                    </td>

                    {/* Item */}
                    <td className="rt-td">
                      <div style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>{ticket.model || "—"}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{ticket.subCategory || ""}</div>
                    </td>

                    {/* Customer */}
<td className="rt-td" style={{ cursor: "pointer" }}
  onClick={() => setCustomerPopup({ customer: ticket.customer, phone: ticket.phone, email: ticket.email, city: ticket.city, country: ticket.country, companyName: ticket.companyName })}>
  <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", whiteSpace: "nowrap", textDecoration: "underline", textDecorationStyle: "dotted" }}>{ticket.companyName || ticket.customer || "—"}</div>
</td>

                    {/* Current Assignee */}
                    <td className="rt-td">
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e", whiteSpace: "nowrap" }}>
                          {ticket.assignTo || "—"}
                        </span>
                        {assignedLevel && (
                          <span style={{ background: levelColors[assignedLevel] || "#6b7280", color: "white", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 8 }}>
                            L{assignedLevel}
                          </span>
                        )}
                      </div>
                      {ticket.reassignedFrom && (
                        <div style={{ fontSize: 9, color: "#c2410c", fontWeight: 700, marginTop: 2 }}>
                          🔄 from {ticket.reassignedFrom}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="rt-td">
                      <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s], display: "inline-block", whiteSpace: "nowrap" }}>
                        {s.toUpperCase()}
                      </span>
                      {ticket.createdAt && (
                        <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 3 }}>
                          {new Date(ticket.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                        </div>
                      )}
                    </td>

                   {/* Priority */}
<td className="rt-td">
  <select
    value={ticket.priority || "low"}
    onChange={e => handlePriorityChange(ticket, e.target.value)}
    style={{
      padding: "5px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer",
      border: `1.5px solid ${(ticket.priority || "low") === "high" ? "#dc2626" : "#d1d5db"}`,
      background: (ticket.priority || "low") === "high" ? "#fee2e2" : "white",
      color: (ticket.priority || "low") === "high" ? "#dc2626" : "#374151",
      fontWeight: 700, outline: "none", fontFamily: "inherit"
    }}>
    <option value="low">⚪ Low</option>
    <option value="high">🔴 High</option>
  </select>
  {priorityCompanies.some(p => p.companyName.toLowerCase() === (ticket.companyName || "").toLowerCase()) && (
    <div style={{ fontSize:9, color:"#dc2626", fontWeight:700, marginTop:3 }}>🏢 Company Priority</div>
  )}
</td>

{/* Reassign Button */}
<td className="rt-td">
  <button
    onClick={() => { setReassignPopup({ ...ticket }); setSelectedPerson(""); setReassignReason(""); }}
    className="rt-reassign-btn"
  >
    🔄 Reassign
  </button>
</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
  <button
    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
    disabled={currentPage === 1}
    style={{ padding:"7px 18px", borderRadius:8, border:"1.5px solid #d1d5db", background: currentPage===1 ? "#f3f4f6" : "white", color: currentPage===1 ? "#9ca3af" : "#374151", fontWeight:600, fontSize:13, cursor: currentPage===1 ? "not-allowed" : "pointer" }}>
    ← Previous
  </button>
  <span style={{ fontSize:13, color:"#6b7280" }}>
    Showing <strong style={{ color:"#374151" }}>{(currentPage-1)*PAGE_SIZE+1}</strong> - <strong style={{ color:"#374151" }}>{Math.min(currentPage*PAGE_SIZE, filtered.length)}</strong> of <strong style={{ color:"#ff5a00" }}>{filtered.length}</strong> filtered tickets
  </span>
  <button
    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
    disabled={currentPage === totalPages || totalPages === 0}
    style={{ padding:"7px 18px", borderRadius:8, border:"1.5px solid #d1d5db", background: currentPage===totalPages||totalPages===0 ? "#f3f4f6" : "white", color: currentPage===totalPages||totalPages===0 ? "#9ca3af" : "#374151", fontWeight:600, fontSize:13, cursor: currentPage===totalPages||totalPages===0 ? "not-allowed" : "pointer" }}>
    Next →
  </button>
</div>
    </div>
  );
}