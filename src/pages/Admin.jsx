import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import AdminUsers from "./AdminUsers";
import "./Admin.css";

const BASE_URL = "https://syrotech-backend.onrender.com";

function getTimeScore(t) {
  if (!t.createdAt || !t.resolvedAt) return 0;
  const hrs = (new Date(t.resolvedAt) - new Date(t.createdAt)) / (1000 * 60 * 60);
  if (hrs <=  8) return 10;
  if (hrs <= 16) return 8;
  if (hrs <= 24) return 6;
  if (hrs <= 48) return 4;
  return 2;
}

function getFeedbackBonus(rating) {
  const r = parseInt(rating);
  if (!r) return 0;
  if (r === 5) return  1;
  if (r === 4) return  0.5;
  if (r === 3) return  0;
  if (r === 2) return -0.5;
  if (r === 1) return -1;
  return 0;
}

function getCombinedScore(t) {
  const timeScore = getTimeScore(t);
  if (timeScore === 0) return 0;
  const bonus = getFeedbackBonus(t.feedbackRating);
  return Math.min(10, Math.max(1, parseFloat((timeScore + bonus).toFixed(1))));
}

function SCORE_COLOR(s) {
  if (!s || s === "—" || s === 0) return "#9ca3af";
  const n = parseFloat(s);
  if (isNaN(n)) return "#9ca3af";
  return n >= 8 ? "#10b981" : n >= 6 ? "#f59e0b" : "#ef4444";
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const numVal  = parseInt(value) || 0;
  const display = hovered || numVal;
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[1,2,3,4,5].map(star => (
        <span key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            fontSize: 28, cursor: "pointer",
            color: star <= display ? "#f59e0b" : "#d1d5db",
            transition: "color 0.15s, transform 0.15s",
            transform: star <= display ? "scale(1.2)" : "scale(1)",
            display: "inline-block", userSelect: "none",
          }}>★</span>
      ))}
      {numVal > 0 && (
        <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: 800, marginLeft: 8 }}>{numVal}/5</span>
      )}
    </div>
  );
}

function TicketTable({ rows }) {
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "2.5px solid #c94500", boxShadow: "0 2px 10px rgba(201,69,0,0.10)", marginBottom: 16 }}>
      <div style={{ display: "flex", background: "linear-gradient(135deg, #c94500 0%, #ff5a00 100%)", borderBottom: "2.5px solid #c94500" }}>
        {rows.map(([label], i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, padding: "9px 12px", borderRight: i < rows.length - 1 ? "2px solid rgba(255,255,255,0.25)" : "none", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        ))}
      </div>
      <div style={{ display: "flex", background: "#ffffff" }}>
        {rows.map(([, value], i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, padding: "11px 12px", borderRight: i < rows.length - 1 ? "2px solid #e8ddd4" : "none", fontSize: 13, fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: i % 2 === 0 ? "#faf7f4" : "#ffffff" }}>{value}</div>
        ))}
      </div>
    </div>
  );
}

// ✅ Star display (read-only)
function StarDisplay({ value }) {
  const n = parseInt(value) || 0;
  if (!n) return <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: 14, color: s <= n ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
      <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginLeft: 4 }}>{n}/5</span>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  // ✅ Default tab changed to analytics
  const [tab, setTab] = useState("analytics");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  // ✅ NAV order: Analytics, Query Tracker, Performance, User Permissions
  const NAV = [
    { key: "analytics",   icon: "📊", label: "Analytics"        },
    { key: "queries",     icon: "🎫", label: "Query Tracker"    },
    { key: "performance", icon: "🏆", label: "Performance"      },
    { key: "users",       icon: "👥", label: "User Permissions" },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">S</div>
          <div>
            <div className="sidebar-brand-name">Syrotech</div>
            <div className="sidebar-brand-sub">Admin Panel</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button key={n.key} className={`nav-item ${tab === n.key ? "active" : ""}`} onClick={() => setTab(n.key)}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout}><span>⬅</span> Logout</button>
      </aside>
      <main className="admin-main">
        {tab === "analytics"   && <Analytics />}
        {tab === "queries"     && <QueryTracker />}
        {tab === "performance" && <Performance />}
        {tab === "users"       && <AdminUsers />}
      </main>
    </div>
  );
}

// ✅ NEW Analytics — full ticket table

function Analytics() {
  const [tickets, setTickets]   = useState([]);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [issuePopup, setIssuePopup] = useState(null); // ✅ NEW

  useEffect(() => {
    const load = () => fetch(`${BASE_URL}/tickets`).then(r => r.json()).then(setTickets).catch(console.error);
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const ticketNumberMap = {};
  [...tickets]
    .sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))
    .forEach((t, i) => { ticketNumberMap[t.id] = i + 1; });

  const counts = {
    all:      tickets.length,
    pending:  tickets.filter(t => t.status === "pending").length,
    open:     tickets.filter(t => t.status === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    rma:      tickets.filter(t => t.status === "rma").length,
  };

  const filtered = tickets
    .filter(t => filter === "all" || (t.status || "pending").toLowerCase() === filter)
    .filter(t => [t.raisedByName, t.raisedBy, t.assignTo, t.customer, t.phone, t.email, t.category, t.serialNo]
      .some(f => (f || "").toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const STATUS_COLOR = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed" };
  const STATUS_BG    = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff" };

  const getResolutionRate = (assignTo) => {
    const agentTickets = tickets.filter(t => t.assignTo === assignTo);
    if (!agentTickets.length) return "—";
    const resolved = agentTickets.filter(t => t.status === "resolved").length;
    return `${Math.round((resolved / agentTickets.length) * 100)}%`;
  };

  return (
    <div className="tab-content">

      {/* ✅ Issue/Resolution Popup */}
      {issuePopup && (
        <div
          onClick={() => setIssuePopup(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 14, padding: "24px 28px",
              maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: `2px solid ${issuePopup.resolutionNotes ? "#d1fae5" : "#fad8be"}`
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: issuePopup.resolutionNotes ? "#1a7a46" : "#c94500" }}>
                {issuePopup.resolutionNotes ? "✅ Ticket Resolved" : "📋 Issue Description"}
              </div>
              <button onClick={() => setIssuePopup(null)}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                ✕ Close
              </button>
            </div>
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
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, background: "#f9fafb", padding: "12px 14px", borderRadius: 8, border: "1px solid #e5e7eb", borderLeft: "3px solid #ff5a00" }}>
                  {issuePopup.description}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#fff8f2", padding: "14px 16px", borderRadius: 10, border: "1px solid #fad8be", borderLeft: "4px solid #ff5a00" }}>
                {issuePopup.description}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tab-header">
        <div>
          <h2 className="tab-title">Analytics</h2>
          <p className="tab-sub">All tickets overview</p>
        </div>
        <div className="tab-stats" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["all",      "All",        "#374151", "#f3f4f6"],
            ["open",     "🔓 Open",    "#e04e00", "#fff4ee"],
            ["pending",  "⏳ Pending", "#b45309", "#fffbeb"],
            ["resolved", "✅ Resolved","#1a7a46", "#edfaf3"],
            ["rma",      "🔧 RMA",     "#7c3aed", "#f5f3ff"],
          ].map(([key, label, col, bg]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: "6px 14px", borderRadius: 16, cursor: "pointer",
              border: filter === key ? `2px solid ${col}` : "1px solid #d1d5db",
              background: filter === key ? bg : "white",
              color: filter === key ? col : "#555",
              fontWeight: filter === key ? 700 : 400,
              fontSize: 12, whiteSpace: "nowrap"
            }}>
              {label} <span style={{
                marginLeft: 4, background: filter === key ? col : "#e5e7eb",
                color: filter === key ? "white" : "#555",
                borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700
              }}>{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          placeholder="🔍 Search by name, agent, phone, product..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "10px 16px", border: "1.5px solid #d1d5db",
            borderRadius: 10, fontSize: 13, outline: "none", background: "white",
            fontFamily: "inherit", color: "#111", boxSizing: "border-box"
          }}
        />
      </div>

      {/* ✅ Table — now with Issue, Device Info, updated Status columns */}
      <div style={{ overflowX: "scroll", overflowY: "auto", maxHeight: "72vh", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1300, background: "white" }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #c94500 0%, #ff5a00 100%)", position: "sticky", top: 0, zIndex: 2 }}>
              {["Ticket No", "Assigned To", "Raised By", "Customer Info", "Device Info", "Issue", "Status", "Resolution Rate", "Customer Rating"].map((h, i) => (
                <th key={i} style={{
                  padding: "12px 14px", fontSize: 10, fontWeight: 800, color: "white",
                  textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left",
                  borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>
                  No tickets found.
                </td>
              </tr>
            ) : filtered.map((ticket, idx) => {
              const s = (ticket.status || "pending").toLowerCase();
              const isResolved = s === "resolved";
              return (
                <tr key={ticket.id} style={{
                  borderBottom: "1px solid #f0ede8",
                  background: idx % 2 === 0 ? "#faf7f4" : "white",
                  borderLeft: `4px solid ${STATUS_COLOR[s] || "#ccc"}`,
                }}>

                  {/* Ticket No */}
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#ff5a00" }}>Syro{ticketNumberMap[ticket.id]}</div>
                    <div style={{ fontSize: 9, color: "#9ca3af" }}>{ticket.date || "—"}</div>
                  </td>

                  {/* Assigned To */}
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{ticket.assignTo || "—"}</div>
                    {ticket.reassignedFrom && (
                      <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>🔄 from {ticket.reassignedFrom}</div>
                    )}
                  </td>

                  {/* Raised By */}
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{ticket.raisedByName || "—"}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{ticket.raisedBy || ""}</div>
                  </td>

                  {/* Customer Info */}
                  <td style={{ padding: "12px 14px", minWidth: 170 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{ticket.customer || "—"}</div>
                    {ticket.phone && <div style={{ fontSize: 11, color: "#6b7280" }}>📞 {ticket.phone}</div>}
                    {ticket.email && <div style={{ fontSize: 11, color: "#6b7280" }}>✉️ {ticket.email}</div>}
                    {(ticket.city || ticket.country) && (
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>📍 {[ticket.city, ticket.country].filter(Boolean).join(", ")}</div>
                    )}
                  </td>

                  {/* ✅ NEW: Device Info — product, serial, MAC */}
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{ticket.category || "—"}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>S/N: {ticket.serialNo || "—"}</div>
                    {ticket.mac && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>MAC: {ticket.mac}</div>}
                  </td>

                  {/* ✅ NEW: Issue — click to open popup */}
                  <td style={{ padding: "12px 14px", maxWidth: 180 }}>
                    <div
                      onClick={() => setIssuePopup({
                        description: ticket.description,
                        resolutionNotes: ticket.resolutionNotes,
                        resolutionTimeTaken: ticket.resolutionTimeTaken,
                      })}
                      style={{
                        fontSize: 12, color: "#374151", lineHeight: 1.5,
                        cursor: "pointer",
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap", maxWidth: 160,
                        textDecoration: "underline", textDecorationStyle: "dotted",
                        textDecorationColor: "#9ca3af"
                      }}
                      title="Click to view full issue"
                    >
                      {(ticket.description || "—").slice(0, 35)}{(ticket.description || "").length > 35 ? "…" : ""}
                    </div>
                    {isResolved && ticket.resolutionNotes && (
                      <div
                        onClick={() => setIssuePopup({
                          description: ticket.description,
                          resolutionNotes: ticket.resolutionNotes,
                          resolutionTimeTaken: ticket.resolutionTimeTaken,
                        })}
                        style={{ fontSize: 10, color: "#059669", fontWeight: 600, marginTop: 3, cursor: "pointer" }}>
                        ✅ Resolved — click to view
                      </div>
                    )}
                  </td>

                  {/* ✅ UPDATED: Status — with raised & resolved date/time */}
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                      color: STATUS_COLOR[s], background: STATUS_BG[s], display: "inline-block"
                    }}>
                      {s.toUpperCase()}
                    </span>
                    {/* Raised date/time */}
                    {ticket.createdAt && (
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                        🕐 Raised: <strong>{new Date(ticket.createdAt).toLocaleString()}</strong>
                      </div>
                    )}
                    {/* Resolved date/time */}
                    {ticket.resolvedAt && (
                      <div style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}>
                        ✅ Solved: <strong>{new Date(ticket.resolvedAt).toLocaleString()}</strong>
                      </div>
                    )}
                  </td>

                  {/* Resolution Rate */}
                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#ff5a00" }}>
                      {getResolutionRate(ticket.assignTo)}
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>agent rate</div>
                  </td>

                  {/* Customer Rating */}
                  <td style={{ padding: "12px 14px" }}>
                    <StarDisplay value={ticket.feedbackRating} />
                    {ticket.feedbackComment && (
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        "{ticket.feedbackComment}"
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", textAlign: "right" }}>
        Showing <strong style={{ color: "#374151" }}>{filtered.length}</strong> of <strong style={{ color: "#374151" }}>{tickets.length}</strong> tickets
      </div>
    </div>
  );
}

function QueryTracker() {
  const [queries, setQueries]           = useState([]);
  const [filter, setFilter]             = useState("all");
  const [search, setSearch]             = useState("");
  const [feedbackData, setFeedbackData] = useState({});
  const [savingId, setSavingId]         = useState(null);
  const [issuePopup, setIssuePopup]     = useState(null);

  const fetchData = () =>
    fetch(`${BASE_URL}/tickets`).then(r => r.json()).then(data => {
      const normalized = data.map(t => ({ ...t, feedbackRating: t.feedbackRating ? parseInt(t.feedbackRating) : null }));
      setQueries(normalized);
    }).catch(console.error);

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 5000); return () => clearInterval(id); }, []);

  const updateStatus = (id, status) => {
    const ticket  = queries.find(q => q.id === id);
    const now     = new Date().toISOString();
    const updates = { status };
    if (status === "open"     && !ticket?.acceptedAt) updates.acceptedAt = now;
    if (status === "resolved" && !ticket?.resolvedAt) updates.resolvedAt = now;
    fetch(`${BASE_URL}/tickets/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    }).then(r => r.json()).then(updated =>
      setQueries(prev => prev.map(q => q.id === id ? { ...updated, feedbackRating: updated.feedbackRating ? parseInt(updated.feedbackRating) : null } : q))
    );
  };

  const saveFeedback = (ticketId) => {
    const fb     = feedbackData[ticketId] || {};
    const ticket = queries.find(q => q.id === ticketId);
    const finalRating   = fb.rating   !== undefined ? parseInt(fb.rating)   : (parseInt(ticket?.feedbackRating) || null);
    const finalResolved = fb.resolved !== undefined ? fb.resolved            : (ticket?.feedbackResolved || "");
    const finalComment  = fb.comment  !== undefined ? fb.comment             : (ticket?.feedbackComment  || "");
    if (!finalRating) { alert("Please select a star rating (1-5) before saving."); return; }
    setSavingId(ticketId);
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackRating: finalRating, feedbackComment: finalComment, feedbackResolved: finalResolved, feedbackReceivedAt: new Date().toISOString() })
    })
      .then(r => r.json())
      .then(updated => {
        const norm = { ...updated, feedbackRating: updated.feedbackRating ? parseInt(updated.feedbackRating) : null };
        setQueries(prev => prev.map(q => q.id === ticketId ? norm : q));
        setSavingId(null);
        setFeedbackData(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
        const timeScore = getTimeScore(norm);
        const bonus     = getFeedbackBonus(norm.feedbackRating);
        const combined  = Math.min(10, Math.max(1, timeScore + bonus));
        alert(`✅ Feedback saved!\n\n⏱️ Time Score: ${timeScore}/10\n⭐ Bonus: ${bonus >= 0 ? "+" : ""}${bonus}\n🏆 Final: ${combined}/10`);
      })
      .catch(err => { console.error("Failed:", err); setSavingId(null); });
  };

  const filtered = queries.filter(q => {
    const matchFilter = filter === "all" || (q.status || "pending").toLowerCase() === filter;
    const matchSearch = [q.raisedBy, q.raisedByName, q.assignTo, q.category, q.description, q.serialNo, q.phone]
      .some(f => (f || "").toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const SC = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed" };
  const SB = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff" };

  return (
    <div className="tab-content">

      {/* ✅ Issue Popup Modal */}
      {issuePopup && (
        <div
          onClick={() => setIssuePopup(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 14, padding: "24px 28px",
              maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: `2px solid ${issuePopup.resolutionNotes ? "#d1fae5" : "#fad8be"}`
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: issuePopup.resolutionNotes ? "#1a7a46" : "#c94500" }}>
                {issuePopup.resolutionNotes ? "✅ Ticket Resolved" : "📋 Issue Description"}
              </div>
              <button onClick={() => setIssuePopup(null)}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                ✕ Close
              </button>
            </div>
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
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, background: "#f9fafb", padding: "12px 14px", borderRadius: 8, border: "1px solid #e5e7eb", borderLeft: "3px solid #ff5a00" }}>
                  {issuePopup.description}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#fff8f2", padding: "14px 16px", borderRadius: 10, border: "1px solid #fad8be", borderLeft: "4px solid #ff5a00" }}>
                {issuePopup.description}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tab-header">
        <div>
          <h2 className="tab-title">Query Tracker</h2>
          <p className="tab-sub">All support tickets in one place</p>
        </div>
        <div className="tab-stats">
          {[["open","🔓 Open"],["pending","⏳ Pending"],["resolved","✅ Resolved"],["rma","🔧 RMA"]].map(([s, l]) => (
            <span key={s} className={`stat-pill ${s}`} style={s === "rma" ? { background: "#f5f3ff", color: "#7c3aed", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 } : {}}>
              {queries.filter(q => (q.status || "").toLowerCase() === s).length} {l}
            </span>
          ))}
        </div>
      </div>

      <div className="filter-bar">
        <input className="search-input" placeholder="🔍  Search by user, agent, serial no, subject..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="filter-chips">
          {["all","open","pending","resolved","rma"].map(f => (
            <button key={f} className={`chip ${filter === f ? "chip-active" : ""}`} onClick={() => setFilter(f)}>
              {f === "rma" ? "🔧 RMA" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1.5px solid #93c5fd", borderRadius: 12, padding: "14px 20px", marginBottom: 12, fontSize: 13 }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: "#1e40af" }}>📱 How Customer Feedback Works:</div>
        <div style={{ lineHeight: 1.8, color: "#374151" }}>
          <strong>Step 1</strong> — Support person sends WhatsApp to customer after resolving<br/>
          <strong>Step 2</strong> — Customer replies with rating on WhatsApp<br/>
          <strong>Step 3</strong> — Support person forwards reply to Admin<br/>
          <strong>Step 4</strong> — Admin clicks <strong>"Feedback"</strong> on resolved ticket and enters rating
        </div>
      </div>

      {filtered.length === 0 && <div className="empty-state">No queries found.</div>}

      <div style={{ overflowX: "scroll", overflowY: "auto", maxHeight: "72vh", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900, background: "white" }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #f9f7f4, #f4f0eb)", position: "sticky", top: 0, zIndex: 2 }}>
              {["Raised By", "Assigned To", "Product / Serial", "Issue", "Date & Time", "Status"].map((h, i) => (
                <th key={i} style={{
                  padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#999",
                  textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left",
                  borderBottom: "2px solid #e0d8d0", borderRight: i < 5 ? "1px solid #e0d8d0" : "none",
                  whiteSpace: "nowrap", background: "linear-gradient(135deg, #f9f7f4, #f4f0eb)"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((q, idx) => {
              const s          = (q.status || "pending").toLowerCase();
              const isResolved = s === "resolved";
              const isRma      = s === "rma";
              const savedRating    = parseInt(q.feedbackRating) || 0;
              const hasFeedback    = savedRating > 0;
              const fb             = feedbackData[q.id] || {};
              const combinedScore  = (isResolved && q.createdAt && q.resolvedAt) ? getCombinedScore(q) : null;
              const previewRating  = fb.rating !== undefined ? parseInt(fb.rating) : savedRating;
              const previewScore   = (isResolved && q.createdAt && q.resolvedAt && previewRating)
                ? Math.min(10, Math.max(1, getTimeScore(q) + getFeedbackBonus(previewRating))) : combinedScore;

              return (
                <tr key={q.id} style={{
                  borderBottom: "1px solid #f0ede8",
                  background: idx % 2 === 0 ? "#faf7f4" : "white",
                  borderLeft: `4px solid ${isRma ? "#7c3aed" : q.reassignedFrom ? "#f59e0b" : (isResolved ? "#10b981" : "#e5e7eb")}`,
                }}>

                  {/* Raised By */}
                  <td style={{ padding: "14px 16px", borderRight: "1px solid #f0ede8" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{q.raisedByName || q.raisedBy || "—"}</div>
                    {q.phone && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>📞 {q.phone}</div>}
                    {q.issueHistory && q.issueHistory.length > 0 && (
                      <div style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, marginTop: 2 }}>
                        🔁 {q.issueHistory.length} repeat
                      </div>
                    )}
                  </td>

                  {/* Assigned To */}
                  <td style={{ padding: "14px 16px", fontSize: 13, borderRight: "1px solid #f0ede8" }}>
                    <div style={{ fontWeight: 600 }}>{q.assignTo || "—"}</div>
                    {q.reassignedFrom && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 3, fontWeight: 700 }}>🔄 from {q.reassignedFrom}</div>}
                  </td>

                  {/* Product / Serial */}
                  <td style={{ padding: "14px 16px", borderRight: "1px solid #f0ede8" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{q.category}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>S/N: {q.serialNo}</div>
                    {q.productImage && <div style={{ fontSize: 10, color: "#10b981", fontWeight: 700, marginTop: 2 }}>📷 Has image</div>}
                  </td>

                  {/* Issue — clickable popup */}
                  <td style={{ padding: "14px 16px", maxWidth: 220, borderRight: "1px solid #f0ede8" }}>
                    <div
                      onClick={() => setIssuePopup({ description: q.description, resolutionNotes: q.resolutionNotes, resolutionTimeTaken: q.resolutionTimeTaken })}
                      style={{
                        fontSize: 12, color: "#374151", lineHeight: 1.5, cursor: "pointer",
                        textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#9ca3af"
                      }}
                      title="Click to view full issue"
                    >
                      {(q.description || "—").slice(0, 55)}{(q.description || "").length > 55 ? "..." : ""}
                    </div>
                    {isResolved && q.resolutionNotes && (
                      <div
                        onClick={() => setIssuePopup({ description: q.description, resolutionNotes: q.resolutionNotes, resolutionTimeTaken: q.resolutionTimeTaken })}
                        style={{ fontSize: 10, color: "#059669", fontWeight: 600, marginTop: 3, cursor: "pointer" }}>
                        ✅ Resolved — click to view
                      </div>
                    )}
                  </td>

                  {/* ✅ Date & Time — raised + resolved */}
                  <td style={{ padding: "14px 16px", fontSize: 11, whiteSpace: "nowrap", borderRight: "1px solid #f0ede8" }}>
                    <div style={{ color: "#6b7280" }}>
                      🕐 <strong style={{ color: "#374151" }}>Raised:</strong><br/>
                      {q.createdAt ? new Date(q.createdAt).toLocaleString() : (q.date || "—")}
                    </div>
                    {q.resolvedAt && (
                      <div style={{ color: "#10b981", marginTop: 6 }}>
                        ✅ <strong>Resolved:</strong><br/>
                        {new Date(q.resolvedAt).toLocaleString()}
                      </div>
                    )}
                  </td>

                  {/* ✅ Status — click resolved to open popup, NO expand details */}
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      onClick={() => {
                        if (isResolved) {
                          setIssuePopup({
                            description: q.description,
                            resolutionNotes: q.resolutionNotes,
                            resolutionTimeTaken: q.resolutionTimeTaken,
                          });
                        }
                      }}
                      style={{
                        display: "inline-block", padding: "4px 10px", borderRadius: 12,
                        fontSize: 11, fontWeight: 700,
                        color: SC[s] || "#333", background: SB[s] || "#f5f5f5",
                        cursor: isResolved ? "pointer" : "default",
                        border: isResolved ? "1.5px solid #6ee7b7" : "none",
                      }}
                      title={isResolved ? "Click to see resolution details" : ""}
                    >
                      {s.toUpperCase()}
                    </span>
                    {isResolved && q.resolutionNotes && (
                      <div
                        onClick={() => setIssuePopup({ description: q.description, resolutionNotes: q.resolutionNotes, resolutionTimeTaken: q.resolutionTimeTaken })}
                        style={{ fontSize: 9, color: "#059669", marginTop: 3, cursor: "pointer", fontWeight: 600 }}>
                        📋 View details
                      </div>
                    )}
                    {isRma && <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, marginTop: 3 }}>🔧 {q.rmaCenterCity}</div>}

                    {/* Feedback section inline for resolved */}
                    {isResolved && (
                      <div style={{ marginTop: 8, borderTop: "1px dashed #e5e7eb", paddingTop: 8 }}>
                        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>⭐ Feedback:</div>
                        <StarRating
                          value={fb.rating !== undefined ? parseInt(fb.rating) : savedRating}
                          onChange={val => setFeedbackData(prev => ({ ...prev, [q.id]: { ...prev[q.id], rating: val } }))}
                        />
                        {(fb.rating !== undefined || !hasFeedback) && (
                          <button
                            onClick={() => saveFeedback(q.id)}
                            disabled={savingId === q.id}
                            style={{
                              marginTop: 6, background: savingId === q.id ? "#94a3b8" : "#1d4ed8",
                              color: "white", border: "none", borderRadius: 6,
                              padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600
                            }}>
                            {savingId === q.id ? "⏳" : hasFeedback ? "💾 Update" : "💾 Save"}
                          </button>
                        )}
                        {hasFeedback && fb.rating === undefined && (
                          <div style={{ fontSize: 10, color: "#10b981", marginTop: 4 }}>
                            ✅ Saved: {savedRating}/5
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Analytics_OLD() {
  // kept as placeholder — replaced by new Analytics above
  return null;
}

function Performance() {
  const [tickets,    setTickets]    = useState([]);
  const [period,     setPeriod]     = useState("all");
  const [customDate, setCustomDate] = useState("");

  useEffect(() => {
    const load = () => fetch(`${BASE_URL}/tickets`)
      .then(r => r.json())
      .then(data => { const normalized = data.map(t => ({ ...t, feedbackRating: t.feedbackRating ? parseInt(t.feedbackRating) : null })); setTickets(normalized); })
      .catch(console.error);
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const filterByPeriod = (list) => {
    const now = new Date();
    if (period === "daily") {
      const base = customDate ? new Date(customDate) : now;
      return list.filter(t => new Date(t.createdAt || t.date).toDateString() === base.toDateString());
    }
    if (period === "weekly") {
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      return list.filter(t => new Date(t.createdAt || t.date) >= weekAgo);
    }
    if (period === "monthly") {
      return list.filter(t => {
        const d = new Date(t.createdAt || t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    return list;
  };

  const filteredTickets = filterByPeriod(tickets);
  const agents          = [...new Set(filteredTickets.map(t => t.assignTo).filter(Boolean))];

  const periodLabel = () => {
    if (period === "daily")   return customDate ? `Day: ${customDate}` : `Today: ${new Date().toLocaleDateString()}`;
    if (period === "weekly")  return "Last 7 Days";
    if (period === "monthly") return `Month: ${new Date().toLocaleString("default",{month:"long",year:"numeric"})}`;
    return "All Time";
  };

  const getAgentStats = (agent) => {
    const agentTickets = filteredTickets.filter(t => t.assignTo === agent);
    const resolvedList = agentTickets.filter(t => t.status === "resolved" && t.createdAt && t.resolvedAt);
    const rmaList      = agentTickets.filter(t => t.status === "rma");
    const within24     = resolvedList.filter(t => (new Date(t.resolvedAt) - new Date(t.createdAt)) <= 24 * 60 * 60 * 1000).length;
    const avgScore     = resolvedList.length ? (resolvedList.reduce((s, t) => s + getCombinedScore(t), 0) / resolvedList.length).toFixed(1) : "—";
    const avgHours     = resolvedList.length ? (resolvedList.reduce((s, t) => s + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0) / resolvedList.length / (1000 * 60 * 60)).toFixed(1) : "—";
    const overdueCount = agentTickets.filter(t => t.status !== "resolved" && t.status !== "rma" && t.createdAt && new Date(t.createdAt).getTime() + 24 * 60 * 60 * 1000 - Date.now() <= 0).length;
    const feedbackTickets = resolvedList.filter(t => t.feedbackRating && parseInt(t.feedbackRating) > 0);
    const avgFeedback     = feedbackTickets.length ? (feedbackTickets.reduce((s, t) => s + parseInt(t.feedbackRating), 0) / feedbackTickets.length).toFixed(1) : "—";
    return {
      total: agentTickets.length,
      pending:  agentTickets.filter(t => t.status === "pending").length,
      open:     agentTickets.filter(t => t.status === "open").length,
      resolved: resolvedList.length,
      rma:      rmaList.length,
      within24, avgScore, avgHours, overdueCount, avgFeedback,
      feedbackCount: feedbackTickets.length,
      compliance: resolvedList.length ? Math.round((within24 / resolvedList.length) * 100) : 0,
      agentTickets, resolvedList,
    };
  };

  const TICKET_HEADER = [
    "Ticket ID","Raised By (Name)","Raised By (Email)","Customer Name",
    "Customer Email","Contact Number","Product","Serial Number",
    "MAC Address","City","Country","Issue Description","Assigned To",
    "Date Raised","Status","Raised At","Accepted At","Resolved At",
    "Time Taken (hrs)","Time Score","Feedback Bonus","Final Score","Within 24hr SLA",
    "Customer Rating (⭐)","Customer Resolved?","Customer Comment",
    "Has Product Image","RMA Status","RMA Reason","RMA Center","RMA Center Address",
  ];

  const buildTicketRow = (t) => {
    let timeTaken="—", timeScore="—", feedbackBonus="—", finalScore="—", sla="—";
    if (t.createdAt && t.resolvedAt) {
      const ms  = new Date(t.resolvedAt) - new Date(t.createdAt);
      const hrs = ms / (1000 * 60 * 60);
      timeTaken     = parseFloat(hrs.toFixed(2));
      timeScore     = `${getTimeScore(t)}/10`;
      const bonus   = getFeedbackBonus(t.feedbackRating);
      feedbackBonus = t.feedbackRating ? (bonus >= 0 ? `+${bonus}` : `${bonus}`) : "No feedback";
      finalScore    = `${getCombinedScore(t)}/10`;
      sla           = hrs <= 24 ? "YES ✅" : "NO ❌";
    } else if (t.createdAt && !t.resolvedAt) { sla = "Pending"; }
    return [
      t.id||"—", t.raisedByName||"—", t.raisedBy||"—", t.customer||"—",
      t.email||"—", t.phone||"—", t.category||"—", t.serialNo||"—",
      t.mac||"—", t.city||"—", t.country||"—", t.description||"—", t.assignTo||"—",
      t.date||"—", (t.status||"pending").toUpperCase(),
      t.createdAt  ? new Date(t.createdAt).toLocaleString()  : "—",
      t.acceptedAt ? new Date(t.acceptedAt).toLocaleString() : "—",
      t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : "—",
      timeTaken, timeScore, feedbackBonus, finalScore, sla,
      t.feedbackRating ? `${parseInt(t.feedbackRating)}/5` : "—",
      t.feedbackResolved || "—",
      t.feedbackComment  || "—",
      t.productImage ? "Yes ✅" : "No",
      t.rmaStatus ? "Yes 🔧" : "No",
      t.rmaReason        || "—",
      t.rmaCenterName    ? `${t.rmaCenterName} (${t.rmaCenterCity})` : "—",
      t.rmaCenterAddress || "—",
    ];
  };

  const exportAgentExcel = (agent) => {
    const stats = getAgentStats(agent);
    const wb    = XLSX.utils.book_new();
    const summaryData = [
      ["AGENT PERFORMANCE REPORT — " + agent.toUpperCase()], [""],
      ["Report Period", periodLabel()], ["Generated On", new Date().toLocaleString()], [""],
      ["── OVERALL STATS ──"],
      ["Total Tickets", stats.total], ["Pending", stats.pending], ["Open", stats.open],
      ["Resolved", stats.resolved], ["RMA Tickets", stats.rma],
      ["Within 24hrs (from raised)", stats.within24], ["SLA Compliance", `${stats.compliance}%`],
      ["Avg Resolution Time (from raised)", stats.avgHours === "—" ? "—" : `${stats.avgHours} hrs`],
      ["Avg Final Score", stats.avgScore !== "—" ? `${stats.avgScore}/10` : "—"],
      ["Overdue Tickets", stats.overdueCount], [""],
      ["── CUSTOMER FEEDBACK ──"],
      ["Tickets with Feedback", stats.feedbackCount],
      ["Avg Customer Rating", stats.avgFeedback === "—" ? "—" : `${stats.avgFeedback}/5`],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1["!cols"] = [{ wch: 40 }, { wch: 26 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    const cw = [12,20,24,18,24,14,14,14,18,14,14,40,14,12,12,22,22,22,14,12,14,12,14,12,14,30,10,10,16,28,30].map(w=>({wch:w}));
    const ws2 = XLSX.utils.aoa_to_sheet([TICKET_HEADER, ...stats.agentTickets.map(buildTicketRow)]);
    ws2["!cols"] = cw; XLSX.utils.book_append_sheet(wb, ws2, "All Tickets");
    const ws3 = XLSX.utils.aoa_to_sheet([TICKET_HEADER, ...stats.resolvedList.map(buildTicketRow)]);
    ws3["!cols"] = cw; XLSX.utils.book_append_sheet(wb, ws3, "Resolved Tickets");
    const ws4 = XLSX.utils.aoa_to_sheet([TICKET_HEADER, ...stats.agentTickets.filter(t=>t.status!=="resolved").map(buildTicketRow)]);
    ws4["!cols"] = cw; XLSX.utils.book_append_sheet(wb, ws4, "Active Tickets");
    XLSX.writeFile(wb, `${agent}_Report_${period}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportAllExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryRows = [
      ["ALL AGENTS PERFORMANCE REPORT"], [""],
      ["Report Period", periodLabel()], ["Generated On", new Date().toLocaleString()],
      ["Total Tickets", filteredTickets.length], [""],
      ["Agent","Total","Pending","Open","Resolved","RMA","Within 24hr","SLA%","Avg Hrs","Avg Score","Overdue","Feedback","Avg Rating"],
      ...agents.map(agent => {
        const s = getAgentStats(agent);
        return [agent, s.total, s.pending, s.open, s.resolved, s.rma, s.within24,
          `${s.compliance}%`, s.avgHours==="—"?"—":`${s.avgHours}`,
          s.avgScore!=="—"?`${s.avgScore}/10`:"—",
          s.overdueCount, s.feedbackCount,
          s.avgFeedback==="—"?"—":`${s.avgFeedback}/5`];
      }),
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1["!cols"] = [20,10,10,10,10,10,12,10,12,16,10,14,12].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws1, "All Agents Summary");
    const cw = [12,20,24,18,24,14,14,14,18,14,14,40,14,12,12,22,22,22,14,12,14,12,14,12,14,30,10,10,16,28,30].map(w=>({wch:w}));
    const ws2 = XLSX.utils.aoa_to_sheet([TICKET_HEADER, ...filteredTickets.map(buildTicketRow)]);
    ws2["!cols"] = cw; XLSX.utils.book_append_sheet(wb, ws2, "All Tickets Combined");
    agents.forEach(agent => {
      const stats = getAgentStats(agent);
      const ws = XLSX.utils.aoa_to_sheet([
        [`AGENT: ${agent}`], [`Period: ${periodLabel()}`],
        [`Resolved: ${stats.resolved} | RMA: ${stats.rma} | Score: ${stats.avgScore}/10 | SLA: ${stats.compliance}%`],
        [""], TICKET_HEADER, ...stats.agentTickets.map(buildTicketRow),
      ]);
      ws["!cols"] = cw;
      XLSX.utils.book_append_sheet(wb, ws, agent.slice(0, 31));
    });
    XLSX.writeFile(wb, `All_Agents_${period}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Support Performance</h2>
          <p className="tab-sub">Ticket Resolution Performance — Time Score + Customer Feedback</p>
        </div>
        {agents.length > 0 && <button className="export-all-btn" onClick={exportAllExcel}>⬇️ Export All to Excel</button>}
      </div>

      <div className="period-filter-bar">
        <div className="period-filter-left">
          <span className="period-filter-label">📅 Report Period:</span>
          <div className="period-chips">
            {[["all","All Time","🗂️"],["daily","Daily","📆"],["weekly","Weekly","📅"],["monthly","Monthly","🗓️"]].map(([key,label,icon]) => (
              <button key={key} className={`period-chip ${period===key?"period-chip-active":""}`} onClick={() => setPeriod(key)}>{icon} {label}</button>
            ))}
          </div>
        </div>
        {period === "daily" && (
          <div className="period-date-picker">
            <label className="period-filter-label">Select Date:</label>
            <input type="date" className="date-input" value={customDate} max={new Date().toISOString().slice(0,10)} onChange={e => setCustomDate(e.target.value)} />
          </div>
        )}
        <div className="period-active-label">
          Showing: <strong>{periodLabel()}</strong> &nbsp;— <strong style={{ color: "#ff5a00" }}>{filteredTickets.length}</strong> ticket{filteredTickets.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="sla-legend">
        <strong>⏱️ Time Score (from raised) + ⭐ Feedback Bonus = 🏆 Final Score (max 10)</strong>
        <div className="sla-legend-pills" style={{ marginTop: 8 }}>
          {[["≤8h→10","#10b981"],["8-16h→8","#34d399"],["16-24h→6","#f59e0b"],["24-48h→4","#f97316"],["48h+→2","#ef4444"]].map(([l,c])=>(
            <span key={l} className="sla-pill" style={{ border:`1px solid ${c}`,color:c }}>{l}</span>
          ))}
          <span style={{ margin:"0 6px",color:"#9ca3af",fontWeight:700 }}>+</span>
          {[["5⭐+1","#10b981"],["4⭐+0.5","#34d399"],["3⭐ 0","#9ca3af"],["2⭐-0.5","#f97316"],["1⭐-1","#ef4444"]].map(([l,c])=>(
            <span key={l} className="sla-pill" style={{ border:`1px solid ${c}`,color:c }}>{l}</span>
          ))}
        </div>
      </div>

      {agents.length === 0 && <div className="empty-state-box"><div style={{ fontSize: 48, marginBottom: 12 }}>📭</div><p>No data for the selected period.</p></div>}

      <div className="perf-grid">
        {agents.map((agent, i) => {
          const stats  = getAgentStats(agent);
          const colors = ["#ff5a00","#3b82f6","#10b981","#f59e0b","#8b5cf6"];
          const col    = colors[i % colors.length];
          return (
            <div key={agent} className="perf-card" style={{ borderTop: `4px solid ${col}` }}>
              <div className="perf-card-header">
                <div className="perf-avatar" style={{ background: col }}>{agent.charAt(0)}</div>
                <div className="perf-agent-info">
                  <div className="perf-agent-name">{agent}</div>
                  <div className="perf-agent-total">{stats.total} tickets · {periodLabel()}</div>
                </div>
                {stats.overdueCount > 0 && <span className="overdue-badge">⚠️ {stats.overdueCount} Overdue</span>}
              </div>
              <div className="perf-stats-grid">
                {[
                  ["Pending",  stats.pending,  "#b45309","#fffbeb"],
                  ["Open",     stats.open,     "#e04e00","#fff4ee"],
                  ["Resolved", stats.resolved, "#1a7a46","#edfaf3"],
                  ["Within 24hr", stats.within24,"#0369a1","#eff6ff"],
                ].map(([label,val,tc,bg]) => (
                  <div key={label} className="perf-stat-box" style={{ background: bg }}>
                    <div className="perf-stat-val" style={{ color: tc }}>{val}</div>
                    <div className="perf-stat-label">{label}</div>
                  </div>
                ))}
              </div>
              {stats.rma > 0 && (
                <div style={{ margin: "8px 0", background: "#f5f3ff", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#5b21b6", fontWeight: 600 }}>
                  🔧 {stats.rma} ticket{stats.rma > 1 ? "s" : ""} sent to RMA
                </div>
              )}
              <div className="perf-bottom">
                <div>
                  <div className="perf-meta-label">Avg Resolution</div>
                  <div className="perf-meta-val">{stats.avgHours === "—" ? "—" : `${stats.avgHours}h`}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="perf-meta-label">Customer Rating</div>
                  <div style={{ fontWeight: 800, fontSize: 20, marginTop: 2, color: stats.avgFeedback === "—" ? "#9ca3af" : "#f59e0b" }}>
                    {stats.avgFeedback === "—" ? "—" : `⭐ ${stats.avgFeedback}/5`}
                  </div>
                  {stats.feedbackCount > 0
                    ? <div style={{ fontSize: 10, color: "#9ca3af" }}>{stats.feedbackCount} reviews</div>
                    : <div style={{ fontSize: 10, color: "#d1d5db" }}>no reviews yet</div>
                  }
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="perf-meta-label">Final Score</div>
                  <div className="perf-score" style={{ color: SCORE_COLOR(stats.avgScore) }}>{stats.avgScore}</div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>resolution score</div>
                </div>
              </div>
              {stats.resolved > 0 && (
                <div className="compliance-bar-wrap">
                  <div className="compliance-bar-header">
                    <span>24hr SLA Compliance</span>
                    <span className="compliance-pct">{stats.compliance}%</span>
                  </div>
                  <div className="compliance-track">
                    <div className="compliance-fill" style={{ width: `${stats.compliance}%`, background: stats.compliance >= 80 ? "#10b981" : stats.compliance >= 50 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                </div>
              )}
              <button className="export-btn" onClick={() => exportAgentExcel(agent)}>
                ⬇️ Export {agent}'s Excel Report
              </button>
            </div>
          );
        })}
      </div>

      {filteredTickets.length > 0 && (
        <div className="detail-table-wrap">
          <div className="detail-table-header-row">
            <h3 className="detail-table-title">📋 Ticket Details — {periodLabel()}</h3>
            <span className="detail-table-count">{filteredTickets.length} tickets</span>
          </div>
          <div className="detail-table">
            <div className="detail-table-head" style={{ gridTemplateColumns: "0.8fr 1fr 1fr 0.9fr 0.8fr 0.5fr 0.6fr 0.5fr 0.6fr 0.6fr" }}>
              <span>Agent</span><span>User</span><span>Product/S/N</span>
              <span>Raised At</span><span>Resolved</span>
              <span>Time</span><span>Time Sc.</span><span>Rating</span><span>Final</span><span>Status</span>
            </div>
            {filteredTickets.map(t => {
              const s  = (t.status || "pending").toLowerCase();
              const SC = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed" };
              const SB = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff" };
              let timeTaken="—", timeScoreVal="—", finalScoreVal="—";
              if (t.createdAt && t.resolvedAt) {
                const hrs = (new Date(t.resolvedAt) - new Date(t.createdAt)) / (1000 * 60 * 60);
                timeTaken    = `${hrs.toFixed(1)}h`;
                timeScoreVal = `${getTimeScore(t)}/10`;
                finalScoreVal= `${getCombinedScore(t)}/10`;
              }
              return (
                <div key={t.id} className="detail-table-row" style={{ gridTemplateColumns: "0.8fr 1fr 1fr 0.9fr 0.8fr 0.5fr 0.6fr 0.5fr 0.6fr 0.6fr" }}>
                  <span className="dt-agent">{t.assignTo || "—"}</span>
                  <span style={{ fontSize: 12 }}>{t.raisedByName || t.raisedBy || "—"}</span>
                  <span>
                    <strong style={{ fontSize: 12 }}>{t.category}</strong>
                    <div style={{ color:"#888", fontSize:11 }}>{t.serialNo}</div>
                    {t.productImage && <div style={{ fontSize: 10, color: "#10b981" }}>📷</div>}
                  </span>
                  <span className="dt-time">{t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}</span>
                  <span className="dt-time">{t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : "—"}</span>
                  <span style={{ fontWeight:600, fontSize:12 }}>{timeTaken}</span>
                  <span style={{ fontWeight:700, fontSize:12, color: SCORE_COLOR(timeScoreVal.split("/")[0]) }}>{timeScoreVal}</span>
                  <span style={{ fontWeight:700, fontSize:12, color: t.feedbackRating ? "#f59e0b" : "#9ca3af" }}>
                    {t.feedbackRating ? `${parseInt(t.feedbackRating)}⭐` : "—"}
                  </span>
                  <span style={{ fontWeight:900, fontSize:13, color: SCORE_COLOR(finalScoreVal.split("/")[0]) }}>{finalScoreVal}</span>
                  <span className="dt-status" style={{ color:SC[s], background:SB[s], fontSize:11 }}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}