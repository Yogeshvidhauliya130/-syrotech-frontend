import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import AdminUsers from "./AdminUsers";
import "./Admin.css";

// const BASE_URL = "http://localhost:3001";

const BASE_URL = "https://syrotech-backend.onrender.com";

// ✅ uses createdAt
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

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("users");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  const NAV = [
    { key: "users",       icon: "👥", label: "User Permissions" },
    { key: "queries",     icon: "🎫", label: "Query Tracker"    },
    { key: "analytics",   icon: "📊", label: "Analytics"        },
    { key: "performance", icon: "🏆", label: "Performance"      },
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
        {tab === "users"       && <AdminUsers />}
        {tab === "queries"     && <QueryTracker />}
        {tab === "analytics"   && <Analytics />}
        {tab === "performance" && <Performance />}
      </main>
    </div>
  );
}

function QueryTracker() {
  const [queries, setQueries]           = useState([]);
  const [filter, setFilter]             = useState("all");
  const [search, setSearch]             = useState("");
  const [deletingId, setDeletingId]     = useState(null);
  const [expandedId, setExpandedId]     = useState(null);
  const [feedbackData, setFeedbackData] = useState({});
  const [savingId, setSavingId]         = useState(null);

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

  const deleteTicket = (id, raisedByName, category) => {
    const confirmed = window.confirm(`⚠️ Delete this ticket?\n\nRaised by: ${raisedByName || "Unknown"}\nProduct: ${category}\n\nThis will remove it permanently.`);
    if (!confirmed) return;
    setDeletingId(id);
    fetch(`${BASE_URL}/tickets/${id}`, { method: "DELETE" })
      .then(r => r.json())
      .then(() => { setQueries(prev => prev.filter(q => q.id !== id)); setDeletingId(null); })
      .catch(err => { console.error("Delete failed:", err); setDeletingId(null); });
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
        setSavingId(null); setExpandedId(null);
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

      <div style={{ background: "linear-gradient(135deg, #fefce8, #fef9c3)", border: "1.5px solid #fde68a", borderRadius: 12, padding: "12px 18px", marginBottom: 12, fontSize: 12, color: "#92400e" }}>
        <strong>🏆 Final Score = Time Score (from raised) + Customer Feedback Bonus</strong>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          {[["5⭐ = +1","#10b981"],["4⭐ = +0.5","#34d399"],["3⭐ = 0","#6b7280"],["2⭐ = -0.5","#f97316"],["1⭐ = -1","#ef4444"]].map(([label, col]) => (
            <span key={label} style={{ background:"white", padding:"3px 10px", borderRadius:8, border:`1px solid ${col}`, color:col, fontWeight:700 }}>{label}</span>
          ))}
        </div>
      </div>

      <div className="delete-info-banner">
        🗑️ Only <strong>resolved</strong> tickets can be deleted. &nbsp;⭐ Click <strong>Feedback</strong> on resolved tickets to add/update customer rating.
      </div>

      {filtered.length === 0 && <div className="empty-state">No queries found.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1.5px solid #e0d8d0", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.9fr 0.9fr 1.3fr 0.8fr 0.7fr 0.7fr 0.8fr 0.6fr 0.5fr",
          padding: "12px 18px",
          background: "linear-gradient(135deg, #f9f7f4, #f4f0eb)",
          borderBottom: "2px solid #e0d8d0",
          fontSize: 11, fontWeight: 700, color: "#999",
          textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          <span>Raised By</span><span>Assigned To</span><span>Product/Serial</span>
          <span>Issue</span><span>Date</span><span>Status</span>
          <span>Change</span><span>Score</span><span>Feedback</span><span>Delete</span>
        </div>

        {filtered.map(q => {
          const s           = (q.status || "pending").toLowerCase();
          const isResolved  = s === "resolved";
          const isRma       = s === "rma";
          const isDeleting  = deletingId === q.id;
          const isExpanded  = expandedId === q.id;
          const fb          = feedbackData[q.id] || {};
          const savedRating = parseInt(q.feedbackRating) || 0;
          const hasFeedback = savedRating > 0;
          const combinedScore = (isResolved && q.createdAt && q.resolvedAt) ? getCombinedScore(q) : null;
          const previewRating = fb.rating !== undefined ? parseInt(fb.rating) : savedRating;
          const previewScore  = (isResolved && q.createdAt && q.resolvedAt && previewRating)
            ? Math.min(10, Math.max(1, getTimeScore(q) + getFeedbackBonus(previewRating))) : combinedScore;

          const detailRow1 = [
            ["Customer",  q.customer || "—"],
            ["Phone",     q.phone    || "—"],
            ["Serial No", q.serialNo || "—"],
            ["MAC",       q.mac      || "—"],
            ["Pincode",   q.pincode  || "—"],
          ];
          const detailRow2 = [
            ["City",        q.city     || "—"],
            ["Country",     q.country  || "—"],
            ["Raised At",   q.createdAt  ? new Date(q.createdAt).toLocaleString()  : "—"],
            ["Accepted At", q.acceptedAt ? new Date(q.acceptedAt).toLocaleString() : "—"],
            ["Resolved At", q.resolvedAt ? new Date(q.resolvedAt).toLocaleString() : "—"],
          ];

          return (
            <div key={q.id} style={{
              background: "white",
              borderBottom: "1px solid #f0ede8",
              borderLeft: `4px solid ${isRma ? "#7c3aed" : q.reassignedFrom ? "#f59e0b" : (isResolved ? "#10b981" : "#e5e7eb")}`,
            }}>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.9fr 0.9fr 1.3fr 0.8fr 0.7fr 0.7fr 0.8fr 0.6fr 0.5fr",
                padding: "14px 18px", alignItems: "start", gap: 8, fontSize: 13,
              }}>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.raisedByName || q.raisedBy || "—"}</div>
                  {q.phone && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>📞 {q.phone}</div>}
                  {/* ✅ NEW: Repeat customer badge */}
                  {q.issueHistory && q.issueHistory.length > 0 && (
                    <div style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, marginTop: 2 }}>
                      🔁 {q.issueHistory.length} repeat visit{q.issueHistory.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div style={{ minWidth: 0, fontSize: 13 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.assignTo || "—"}</div>
                  {q.reassignedFrom && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 3, fontWeight: 700 }}>🔄 from {q.reassignedFrom}</div>}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.category}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>S/N: {q.serialNo}</div>
                  {/* ✅ NEW: Image indicator */}
                  {q.productImage && <div style={{ fontSize: 10, color: "#10b981", fontWeight: 700, marginTop: 2 }}>📷 Has image</div>}
                </div>

                <div style={{ minWidth: 0, fontSize: 12, color: "#555", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.5 }}>
                  {(q.description || "").slice(0, 55)}{(q.description || "").length > 55 ? "..." : ""}
                </div>

                <div style={{ minWidth: 0, fontSize: 12, color: "#888" }}>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.date || "—"}</div>
                  {q.resolvedAt && <div style={{ fontSize: 10, color: "#1a7a46", marginTop: 2 }}>✅ {new Date(q.resolvedAt).toLocaleDateString()}</div>}
                </div>

                <div style={{ minWidth: 0 }}>
                  <span className="status-badge" style={{ color: SC[s]||"#333", background: SB[s]||"#f5f5f5", fontSize: 11 }}>{s}</span>
                  {/* ✅ NEW: RMA indicator */}
                  {isRma && <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, marginTop: 3 }}>🔧 {q.rmaCenterCity}</div>}
                </div>

                <div style={{ minWidth: 0 }}>
                  <select className="status-select" value={s} onChange={e => updateStatus(q.id, e.target.value)} style={{ width: "100%", fontSize: 11 }}>
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="rma">RMA</option>
                  </select>
                </div>

                <div style={{ minWidth: 0, textAlign: "center" }}>
                  {isResolved && combinedScore !== null ? (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 800, color: SCORE_COLOR(combinedScore) }}>{combinedScore}/10</div>
                      {hasFeedback
                        ? <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 1 }}>{"★".repeat(savedRating)}{"☆".repeat(5 - savedRating)}</div>
                        : <div style={{ fontSize: 10, color: "#d1d5db", marginTop: 1 }}>no rating</div>
                      }
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: "#ccc" }}>—</span>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  {(isResolved || isRma) ? (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      style={{
                        width: "100%", padding: "7px 6px", borderRadius: 8, border: "none", cursor: "pointer",
                        background: isRma ? (isExpanded ? "#ede9fe" : "#f5f3ff") : hasFeedback ? (isExpanded ? "#fef9c3" : "#ecfdf5") : (isExpanded ? "#eff6ff" : "#f8faff"),
                        color: isRma ? "#5b21b6" : hasFeedback ? "#065f46" : "#1d4ed8",
                        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                        borderLeft: `3px solid ${isRma ? "#7c3aed" : hasFeedback ? "#10b981" : "#93c5fd"}`,
                      }}
                    >
                      {isRma ? `🔧 ${isExpanded ? "▲" : "▼"}` : hasFeedback ? `⭐${savedRating} ${isExpanded ? "▲" : "▼"}` : `📝 ${isExpanded ? "▲" : "▼"}`}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "#ccc", display: "block", textAlign: "center" }}>—</span>
                  )}
                </div>

                <div style={{ minWidth: 0, textAlign: "center" }}>
                  {isResolved ? (
                    <button className="btn-delete-ticket" onClick={() => deleteTicket(q.id, q.raisedByName, q.category)} disabled={isDeleting}>
                      {isDeleting ? "..." : "🗑️"}
                    </button>
                  ) : (
                    <span className="no-delete-placeholder">—</span>
                  )}
                </div>
              </div>

              {/* ✅ Expanded Panel */}
              {isExpanded && (isResolved || isRma) && (
                <div style={{ background: "#f8faff", borderTop: "2px dashed #bfdbfe", padding: "22px 28px 28px" }}>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#1e40af", marginBottom: 4 }}>
                        📊 Ticket Details — <span style={{ color: "#ff5a00" }}>{q.customer || q.raisedByName}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span>#{(q.id || "").slice(-8)}</span>
                        <span>· {q.category}</span>
                        <span>· {isRma ? `RMA by ${q.rmaSentBy}` : `Resolved by ${q.assignTo}`}</span>
                        {q.feedbackSent && <span style={{ background: "#dcfce7", color: "#065f46", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>✅ WhatsApp Sent</span>}
                      </div>
                    </div>
                    <button onClick={() => setExpandedId(null)}
                      style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                      ✕ Close
                    </button>
                  </div>

                  <TicketTable rows={detailRow1} />
                  <TicketTable rows={detailRow2} />

                  {/* Issue description */}
                  <div style={{ background: "#fff8f2", border: "1px solid #fad8be", borderLeft: "4px solid #ff5a00", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#4a3e36" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#b0a898", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Issue Description</div>
                    {q.description}
                  </div>

                  {/* ✅ NEW: Product Image */}
                  {q.productImage && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>📷 Product Image</div>
                      <img src={q.productImage} alt="Product"
                        style={{ maxWidth: "100%", maxHeight: 250, borderRadius: 10, border: "2px solid #e0d8d0", cursor: "pointer" }}
                        onClick={() => window.open(q.productImage, "_blank")}
                      />
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Click to view full size — serial no & MAC visible in image</div>
                    </div>
                  )}

                  {/* ✅ NEW: RMA Details */}
                  {isRma && (
                    <div style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1.5px solid #c4b5fd", borderRadius: 12, padding: "16px 20px", marginBottom: 18 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#5b21b6", marginBottom: 12 }}>🔧 RMA Details</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                        <div><span style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Reason</span><div style={{ fontWeight: 600, color: "#374151", marginTop: 4 }}>{q.rmaReason}</div></div>
                        <div><span style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Sent By</span><div style={{ fontWeight: 600, color: "#374151", marginTop: 4 }}>{q.rmaSentBy}</div></div>
                        <div><span style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>RMA Center</span><div style={{ fontWeight: 600, color: "#374151", marginTop: 4 }}>{q.rmaCenterName}</div></div>
                        <div><span style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>City</span><div style={{ fontWeight: 600, color: "#374151", marginTop: 4 }}>{q.rmaCenterCity}</div></div>
                        <div style={{ gridColumn: "1/-1" }}><span style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Address</span><div style={{ fontWeight: 600, color: "#374151", marginTop: 4 }}>{q.rmaCenterAddress}</div></div>
                        <div><span style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Center Phone</span><div style={{ fontWeight: 600, color: "#374151", marginTop: 4 }}>📞 {q.rmaCenterPhone}</div></div>
                        <div><span style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Sent At</span><div style={{ fontWeight: 600, color: "#374151", marginTop: 4 }}>{q.rmaSentAt ? new Date(q.rmaSentAt).toLocaleString() : "—"}</div></div>
                      </div>
                    </div>
                  )}

                  {/* ✅ NEW: Issue History */}
                  {q.issueHistory && q.issueHistory.length > 0 && (
                    <div style={{ background: "#eff6ff", border: "1.5px solid #93c5fd", borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1e40af", marginBottom: 10 }}>
                        🔁 Repeat Customer — {q.issueHistory.length} Previous Issue{q.issueHistory.length > 1 ? "s" : ""}
                      </div>
                      {q.issueHistory.map((h, i) => (
                        <div key={i} style={{ background: "white", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 12 }}>
                          <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>{h.description}</div>
                          <div style={{ color: "#9ca3af", fontSize: 11 }}>
                            Raised by: {h.raisedByName} — {h.raisedAt ? new Date(h.raisedAt).toLocaleString() : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reassign History */}
                  {q.reassignHistory && q.reassignHistory.length > 0 && (
                    <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginBottom: 10 }}>
                        🔄 Reassignment History ({q.reassignHistory.length})
                      </div>
                      {q.reassignHistory.map((h, i) => (
                        <div key={i} style={{ background: "white", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 12 }}>
                          <span style={{ background: "#f59e0b", color: "white", padding: "2px 8px", borderRadius: 6, fontWeight: 700, fontSize: 11 }}>#{i + 1}</span>
                          <span style={{ fontWeight: 700, color: "#374151" }}>{h.from} → {h.to}</span>
                          <span style={{ color: "#6b7280" }}>Reason: "<em>{h.reason}</em>"</span>
                          {h.timestamp && <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: "auto" }}>{new Date(h.timestamp).toLocaleString()}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Feedback section — only for resolved */}
                  {isResolved && (
                    <>
                      <div style={{ background: "white", border: "2px solid #e2e8f0", borderRadius: 12, padding: "16px 22px", marginBottom: 18, display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Time Score</div>
                          <div style={{ fontSize: 26, fontWeight: 800, color: SCORE_COLOR(getTimeScore(q)), marginTop: 4 }}>{getTimeScore(q)}/10</div>
                        </div>
                        <div style={{ fontSize: 22, color: "#d1d5db", fontWeight: 300 }}>+</div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Feedback Bonus</div>
                          <div style={{ fontSize: 26, fontWeight: 800, color: getFeedbackBonus(previewRating) >= 0 ? "#10b981" : "#ef4444", marginTop: 4 }}>
                            {previewRating ? (getFeedbackBonus(previewRating) >= 0 ? `+${getFeedbackBonus(previewRating)}` : `${getFeedbackBonus(previewRating)}`) : "—"}
                          </div>
                        </div>
                        <div style={{ fontSize: 22, color: "#d1d5db", fontWeight: 300 }}>=</div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Final Score</div>
                          <div style={{ fontSize: 32, fontWeight: 900, color: SCORE_COLOR(previewScore), marginTop: 4 }}>{previewScore !== null ? `${previewScore}/10` : "—"}</div>
                        </div>
                        {hasFeedback && (
                          <div style={{ marginLeft: "auto", background: "#ecfdf5", border: "1px solid #86efac", borderRadius: 10, padding: "10px 16px", fontSize: 12, color: "#065f46" }}>
                            ✅ Rating saved: <strong>{savedRating}/5</strong><br/>
                            <span style={{ fontSize: 11, color: "#6b7280" }}>Update below if needed</span>
                          </div>
                        )}
                      </div>

                      <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#92400e" }}>
                        ℹ️ Ask <strong>{q.assignTo}</strong> to forward the customer's WhatsApp reply, then enter it below.
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                            Customer Rating ⭐ {hasFeedback && <span style={{ color: "#10b981", textTransform: "none", fontWeight: 400 }}>(already saved)</span>}
                          </div>
                          <StarRating
                            value={fb.rating !== undefined ? parseInt(fb.rating) : savedRating}
                            onChange={val => setFeedbackData(prev => ({ ...prev, [q.id]: { ...prev[q.id], rating: val } }))}
                          />
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Click stars to set rating (1 = worst, 5 = best)</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Customer Said Issue Resolved?</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            {["Yes", "No", "Partially"].map(opt => {
                              const currentVal = fb.resolved !== undefined ? fb.resolved : (q.feedbackResolved || "");
                              const isSelected = currentVal === opt;
                              return (
                                <button key={opt}
                                  onClick={() => setFeedbackData(prev => ({ ...prev, [q.id]: { ...prev[q.id], resolved: opt } }))}
                                  style={{ padding: "8px 14px", borderRadius: 20, border: "2px solid", borderColor: isSelected ? "#3b82f6" : "#d1d5db", background: isSelected ? "#eff6ff" : "white", color: isSelected ? "#1d4ed8" : "#555", fontWeight: isSelected ? 700 : 400, fontSize: 12, cursor: "pointer" }}>
                                  {opt === "Yes" ? "✅ Yes" : opt === "No" ? "❌ No" : "⚠️ Partially"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Customer's Comment (paste from WhatsApp)</div>
                          <input type="text"
                            placeholder='e.g. "Issue fixed, very helpful!"'
                            value={fb.comment !== undefined ? fb.comment : (q.feedbackComment || "")}
                            onChange={e => setFeedbackData(prev => ({ ...prev, [q.id]: { ...prev[q.id], comment: e.target.value } }))}
                            style={{ width: "100%", padding: "11px 14px", border: "2px solid #d1d5db", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "white", color: "#111" }}
                            onFocus={e => e.target.style.borderColor = "#3b82f6"}
                            onBlur={e  => e.target.style.borderColor = "#d1d5db"}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center" }}>
                        <button onClick={() => saveFeedback(q.id)} disabled={savingId === q.id}
                          style={{
                            background: savingId === q.id ? "#94a3b8" : "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                            color: "white", border: "none", padding: "12px 32px", borderRadius: 10,
                            cursor: savingId === q.id ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 800,
                            boxShadow: savingId === q.id ? "none" : "0 4px 14px rgba(59,130,246,0.4)", fontFamily: "inherit",
                          }}>
                          {savingId === q.id ? "⏳ Saving..." : hasFeedback ? "💾 Update Feedback & Score" : "💾 Save Feedback & Update Score"}
                        </button>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>Score updates immediately ✅</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Analytics() {
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    const load = () => fetch(`${BASE_URL}/tickets`).then(r => r.json()).then(setQueries).catch(console.error);
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const agents   = [...new Set(queries.map(q => q.assignTo).filter(Boolean))];
  const colors   = ["#ff5a00","#3b82f6","#10b981","#f59e0b","#8b5cf6"];
  const maxTotal = Math.max(...agents.map(a => queries.filter(q => q.assignTo === a).length), 1);

  const getStats = agent => ({
    open:     queries.filter(q => q.assignTo === agent && (q.status||"").toLowerCase() === "open").length,
    pending:  queries.filter(q => q.assignTo === agent && (q.status||"").toLowerCase() === "pending").length,
    resolved: queries.filter(q => q.assignTo === agent && (q.status||"").toLowerCase() === "resolved").length,
    rma:      queries.filter(q => q.assignTo === agent && (q.status||"").toLowerCase() === "rma").length,
    total:    queries.filter(q => q.assignTo === agent).length,
  });

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div><h2 className="tab-title">Support Analytics</h2><p className="tab-sub">Query volume per support agent</p></div>
      </div>
      {agents.length === 0 && <div className="empty-state">No data yet.</div>}
      <div className="analytics-grid">
        {agents.map((agent, i) => {
          const s = getStats(agent);
          return (
            <div key={agent} className="agent-card">
              <div className="agent-header">
                <div className="agent-avatar" style={{ background: colors[i % colors.length] }}>{agent.charAt(0).toUpperCase()}</div>
                <div><div className="agent-name">{agent}</div><div className="agent-total">{s.total} total queries</div></div>
              </div>
              <div className="bar-chart">
                {[["Open",s.open,"#ff5a00"],["Pending",s.pending,"#f59e0b"],["Resolved",s.resolved,"#10b981"],["RMA",s.rma,"#7c3aed"]].map(([label,value,color]) => (
                  <div key={label} className="bar-row">
                    <span className="bar-label">{label}</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width:`${(value/maxTotal)*100}%`, background:color }} /></div>
                    <span className="bar-value">{value}</span>
                  </div>
                ))}
              </div>
              <div className="agent-footer">
                <span className="resolve-rate">Resolution rate: <strong>{s.total ? Math.round((s.resolved/s.total)*100) : 0}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
          <p className="tab-sub">Time Score + Customer Feedback = Final Score</p>
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
              {/* ✅ NEW: RMA count */}
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
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>time + feedback</div>
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