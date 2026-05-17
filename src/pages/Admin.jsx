import ProductFilterBar from "../components/ProductFilterBar";
import { useProductFilter } from "../hooks/useProductFilter";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import AdminUsers from "./AdminUsers";
import SLAReport from "./SLAReport";
import ProductManager from "./ProductManager";
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
            fontSize: 22, cursor: "pointer",
            color: star <= display ? "#f59e0b" : "#d1d5db",
            transition: "color 0.15s, transform 0.15s",
            transform: star <= display ? "scale(1.2)" : "scale(1)",
            display: "inline-block", userSelect: "none",
          }}>★</span>
      ))}
      {numVal > 0 && (
        <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 800, marginLeft: 6 }}>{numVal}/5</span>
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
  const [tab, setTab] = useState("analytics");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  const NAV = [
    { key: "analytics",   icon: "📊", label: "Analytics"        },
    { key: "performance", icon: "🏆", label: "Performance"      },
    { key: "users",       icon: "👥", label: "User Permissions" },
    { key: "sla",         icon: "📈", label: "SLA Report"       },
    { key: "products", icon: "📦", label: "Product Category" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f4f8", fontFamily: "DM Sans, sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 200,
        minWidth: 200,
        flexShrink: 0,
        background: "linear-gradient(180deg, #1a0a00 0%, #2d1200 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "0 0 16px 0",
        boxShadow: "2px 0 12px rgba(0,0,0,0.18)",
        position: "sticky",
        top: 0,
        height: "100vh",
        zIndex: 10,
      }}>
        {/* Brand */}
        <div style={{ padding: "20px 16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/GOIPIMAGE2.png" alt="Syrotech" style={{ width: 50, height: 50, borderRadius: 8, objectFit: "contain", background: "rgba(255,255,255,0.1)", padding: 2 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "white", letterSpacing: "0.02em" }}>Syrotech</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Admin Panel</div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {NAV.map(n => (
            <button key={n.key}
              onClick={() => setTab(n.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 12px", marginBottom: 4,
                borderRadius: 8, border: "none", cursor: "pointer",
                background: tab === n.key ? "rgba(255,90,0,0.22)" : "transparent",
                color: tab === n.key ? "#ff7a30" : "rgba(255,255,255,0.6)",
                fontWeight: tab === n.key ? 700 : 500,
                fontSize: 13, textAlign: "left",
                borderLeft: tab === n.key ? "3px solid #ff5a00" : "3px solid transparent",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} style={{
          margin: "0 10px", padding: "10px 12px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 12, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
        }}>⬅ Logout</button>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, minWidth: 0, padding: "24px 28px", overflowX: "hidden" }}>
        {tab === "analytics"   && <Analytics />}
        {tab === "performance" && <Performance />}
        {tab === "users"       && <AdminUsers />}
        {tab === "sla"         && <SLAReport />}
        {tab === "products" && <ProductManager />}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ANALYTICS TAB
═══════════════════════════════════════════════════ */
function Analytics() {
  const [tickets, setTickets]           = useState([]);
  const {
  filterCat, filterSub, filterItem,
  setCat, setSub, setItem,
  subOptions, itemOptions,
  applyFilter,
  categories: productCategories,
} = useProductFilter(tickets);


  
  const [filter, setFilter]             = useState("all");
  const [search, setSearch]             = useState("");
  const [issuePopup, setIssuePopup]     = useState(null);
  const [feedbackData, setFeedbackData] = useState({});
  const [savingId, setSavingId]         = useState(null);
  const [rmaPopup, setRmaPopup]         = useState(null);
  const [supportPersons, setSupportPersons] = useState([]);
  const [productPopup, setProductPopup]     = useState(null);
  const [customerPopup, setCustomerPopup]   = useState(null);
  const [assigneePopup, setAssigneePopup]   = useState(null);
  const [raisedByPopup, setRaisedByPopup]   = useState(null);
  const [reassignPopup, setReassignPopup]   = useState(null);
  const [sourceFilter, setSourceFilter]     = useState("all");
  const [sourceViaFilter, setSourceViaFilter] = useState("all");
 const [filterYear, setFilterYear]   = useState("");
const [filterMonth, setFilterMonth] = useState("");
const [filterDate, setFilterDate]   = useState("");
 const [analyticsTab, setAnalyticsTab] = useState("tickets");
  // Reassigned table filters
  const [reassignSearch, setReassignSearch]       = useState("");
  const [reassignStatusFilter, setReassignStatusFilter] = useState("all");
  const [reassignProductFilter, setReassignProductFilter] = useState("all");
  const [reassignSort, setReassignSort]           = useState("newest");
  const [reassignLevelFilter, setReassignLevelFilter] = useState("all");
  const [reassignYear, setReassignYear]           = useState("");
  const [reassignMonth, setReassignMonth]         = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  
  const saveFeedback = (ticketId, ticket) => {
    const fb = feedbackData[ticketId] || {};
    const finalRating = fb.rating !== undefined ? parseInt(fb.rating) : (parseInt(ticket?.feedbackRating) || null);
    if (!finalRating) { alert("Please select a star rating."); return; }
    setSavingId(ticketId);
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackRating: finalRating, feedbackReceivedAt: new Date().toISOString() })
    })
      .then(r => r.json())
      .then(updated => {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...updated } : t));
        setSavingId(null);
        setFeedbackData(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
        alert(`✅ Rating saved: ${finalRating}/5`);
      })
      .catch(err => { console.error("Failed:", err); setSavingId(null); });
  };

  useEffect(() => {
    const load = () => fetch(`${BASE_URL}/tickets`).then(r => r.json()).then(setTickets).catch(console.error);
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(users => setSupportPersons(users.filter(u => u.role === "support" && u.approved)))
      .catch(console.error);
  }, []);

 const counts = {
  all: tickets.length,
  open: tickets.filter(t => t.status === "open").length,
  resolved: tickets.filter(t => t.status === "resolved").length,
  rma: tickets.filter(t => t.status === "rma").length,
 reopened: tickets.filter(t => (t.status || "").toLowerCase() === "reopened").length,
};

  const filtered = applyFilter(
  tickets
    .filter(t => {
  if (filter === "all") return true;
  if (filter === "reopened") return (t.status || "").toLowerCase() === "reopened";
  return (t.status || "open").toLowerCase() === filter;
})
    .filter(t => {
      const d = new Date(t.createdAt || t.date);
      if (filterDate)  return d.toDateString() === new Date(filterDate).toDateString();
      if (filterYear  && d.getFullYear() !== parseInt(filterYear))  return false;
      if (filterMonth && d.getMonth() + 1 !== parseInt(filterMonth)) return false;
      return true;
    })
    .filter(t => {
  if (sourceFilter === "customer")    return t.source === "customer";
  if (sourceFilter === "dealer")      return t.source === "customer" && (t.customerType||"").toLowerCase() === "dealer";
  if (sourceFilter === "distributor") return t.source === "customer" && (t.customerType||"").toLowerCase() === "distributor";
  if (sourceFilter === "sipartner")   return t.source === "customer" && (t.customerType||"").toLowerCase() === "si partner";
  if (sourceFilter === "support") return t.source === "support" && (sourceViaFilter === "all" || t.raisedVia === sourceViaFilter);
  if (sourceFilter === "sales")       return !t.source || (t.source !== "customer" && t.source !== "support");
  return true;
})
    .filter(t => {
  if (levelFilter === "all") return true;
  const assignedPerson = supportPersons.find(p =>
    p.name && t.assignTo &&
    p.name.toLowerCase().trim() === t.assignTo.toLowerCase().trim()
  );
  return assignedPerson?.level === parseInt(levelFilter);
})
.filter(t => [t.raisedByName, t.raisedBy, t.assignTo, t.customer, t.phone, t.email, t.category, t.subCategory, t.model, t.serialNo]
  .some(f => (f || "").toLowerCase().includes(search.toLowerCase())))


    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
);
  // All reassigned tickets
 const allReassigned = tickets
    .filter(t => !!t.reassignedFrom)
    .filter(t => filter === "all" || (t.status || "open").toLowerCase() === filter)
    .filter(t => reassignProductFilter === "all" || t.category === reassignProductFilter)
    .filter(t => {
      if (reassignLevelFilter === "all") return true;
      const p = supportPersons.find(x =>
        x.name && t.reassignedFrom &&
        x.name.toLowerCase().trim() === t.reassignedFrom.toLowerCase().trim()
      );
      return p?.level === parseInt(reassignLevelFilter);
    })
    .filter(t => {
      if (!reassignYear && !reassignMonth) return true;
      const d = new Date(t.createdAt || t.date);
      if (reassignYear && reassignMonth) return d.getFullYear() === parseInt(reassignYear) && d.getMonth() + 1 === parseInt(reassignMonth);
      if (reassignYear) return d.getFullYear() === parseInt(reassignYear);
      if (reassignMonth) return d.getMonth() + 1 === parseInt(reassignMonth);
      return true;
    })
    .filter(t => {
      if (!reassignSearch.trim()) return true;
      const q = reassignSearch.toLowerCase();
      return (
        (t.customer        || "").toLowerCase().includes(q) ||
        (t.serialNo        || "").toLowerCase().includes(q) ||
        (t.category        || "").toLowerCase().includes(q) ||
        (t.phone           || "").toLowerCase().includes(q) ||
        (t.subCategory     || "").toLowerCase().includes(q) ||
(t.model           || "").toLowerCase().includes(q) ||
        (t.reassignedFrom  || "").toLowerCase().includes(q) ||
        (t.assignTo        || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const da = new Date(a.reassignedAt || a.createdAt || a.date).getTime();
      const db = new Date(b.reassignedAt || b.createdAt || b.date).getTime();
      return reassignSort === "newest" ? db - da : da - db;
    });

 const STATUS_COLOR = { open: "#e04e00", resolved: "#1a7a46", rma: "#7c3aed" };
const STATUS_BG    = { open: "#fff4ee", resolved: "#edfaf3", rma: "#f5f3ff" };

  const raisedViaLabel = (via) => {
    if (via === "support-email") return "📧 Support Email";
    if (via === "syrocare-app")  return "📱 Syrocare App";
    if (via === "website")       return "🌐 Website";
    if (via === "whatsapp")      return "💬 WhatsApp";
    if (via === "rnd")           return "⚙️ R&D";
    if (via === "direct-call")   return "📞 Direct Call";
    if (via === "call")          return "📞 Call";
    if (via === "email")         return "📧 Email";
    if (via === "walk-in")       return "🚶 Walk-in";
    return "📞 Call";
  };

  const getRaisedFromLabel = (ticket) => {
    if (ticket.source === "customer") return { label: "Customer", customerType: ticket.customerType || "", bg: "#ede9fe", color: "#5b21b6", icon: "👥" };
    if (ticket.source === "support")  return { label: `Support · ${raisedViaLabel(ticket.raisedVia)}`, bg: "#fde68a", color: "#92400e", icon: "📞", border: "1px solid #d97706" };
    return { label: "Sales", bg: "#fff4ee", color: "#e04e00", icon: "🧑‍💼" };
  };

  const uniqueReassignProducts = [...new Set(tickets.filter(t => !!t.reassignedFrom).map(t => t.category).filter(Boolean))];

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif" }}>

      {/* ── Popups ── */}
      {issuePopup && (
        <div onClick={() => setIssuePopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: `2px solid ${issuePopup.resolutionNotes ? "#d1fae5" : "#fad8be"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: issuePopup.resolutionNotes ? "#1a7a46" : "#c94500" }}>
                {issuePopup.resolutionNotes ? "✅ Ticket Resolved" : "📋 Issue Description"}
              </div>
              <button onClick={() => setIssuePopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>

      {(() => {
  const allHistory = [];
  // Stage 1: the original ticket
  allHistory.push({
    description: issuePopup.firstDescription || issuePopup.description,
    raisedAt: issuePopup.firstCreatedAt,
    raisedByName: issuePopup.firstRaisedByName,
    resolvedNotes: issuePopup.firstResolvedNotes || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolutionNotes : null) || null,
resolvedAt: issuePopup.firstResolvedAt || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolvedAt : null) || null,
resolvedBy: issuePopup.firstResolvedBy || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolvedBy : null) || null,
isRma: issuePopup.firstIsRma || false,
  });
  // Stages 2+: from issueHistory (reopens)
  if (Array.isArray(issuePopup.issueHistory)) {
    issuePopup.issueHistory.forEach((h, i) => {
      allHistory.push({
        description: h.description,
        raisedAt: h.raisedAt,
        raisedByName: h.raisedByName,
        resolvedNotes: h.resolvedNotes || null,
        resolvedAt: h.resolvedAt || null,
        resolvedBy: h.resolvedBy || null,
        isRma: h.isRma || false,
      });
    });
  }
  if (allHistory.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>
        📋 Ticket History — {allHistory.length} Stage{allHistory.length > 1 ? "s" : ""}
      </div>
      <div style={{ maxHeight: "55vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4, scrollbarWidth: "thin", scrollbarColor: "#ff5a00 #fff4ee" }}>
        {allHistory.map((h, i) => (
          <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", fontSize: 12 }}>
            {/* Issue row */}
            <div style={{ background: "#f9fafb", padding: "7px 10px", borderLeft: "3px solid #6b7280" }}>
              <div style={{ fontWeight: 700, color: "#374151", marginBottom: 2 }}>
                🔴 Stage {i + 1}
                {h.raisedAt && <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400, marginLeft: 6 }}>{new Date(h.raisedAt).toLocaleString()}</span>}
                {h.raisedByName && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>· {h.raisedByName}</span>}
              </div>
              <div style={{ color: "#374151" }}>{h.description || "—"}</div>
            </div>
            {/* Resolution row */}
            {h.isRma ? (
              <div style={{ background: "#f5f3ff", padding: "6px 10px", borderLeft: "3px solid #7c3aed" }}>
                <div style={{ fontWeight: 700, color: "#7c3aed", fontSize: 11 }}>🔧 Sent to RMA</div>
              </div>
            ) : h.resolvedNotes ? (
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
    </div>
  );
})()}


            {issuePopup.resolutionNotes ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>🔧 What was solved:</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#ecfdf5", padding: "14px 16px", borderRadius: 10, border: "1px solid #6ee7b7", borderLeft: "4px solid #10b981", marginBottom: 14 }}>{issuePopup.resolutionNotes}</div>
                {issuePopup.resolutionTimeTaken && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>⏱️ Time taken: <strong>{issuePopup.resolutionTimeTaken}</strong></div>}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>📋 Original Issue Raised:</div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, background: "#f9fafb", padding: "12px 14px", borderRadius: 8, border: "1px solid #e5e7eb", borderLeft: "3px solid #ff5a00" }}>{issuePopup.description}</div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#fff8f2", padding: "14px 16px", borderRadius: 10, border: "1px solid #fad8be", borderLeft: "4px solid #ff5a00" }}>{issuePopup.description}</div>
            )}
          </div>
        </div>
      )}

      {rmaPopup && (
        <div onClick={() => setRmaPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #c4b5fd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#5b21b6" }}>🔧 RMA Details</div>
              <button onClick={() => setRmaPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "14px 16px", marginBottom: 14, border: "1px solid #c4b5fd" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", marginBottom: 6 }}>Reason for RMA:</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>{rmaPopup.rmaReason || "—"}</div>
            </div>
            <div style={{ background: "#faf7f4", borderRadius: 10, padding: "14px 16px", border: "1px solid #e0d8d0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 10 }}>RMA Center Details:</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 4 }}>📍 {rmaPopup.rmaCenterName || "—"}</div>
              {rmaPopup.rmaCenterCity && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>🏙️ {rmaPopup.rmaCenterCity}</div>}
              {rmaPopup.rmaCenterAddress && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>🗺️ {rmaPopup.rmaCenterAddress}</div>}
              {rmaPopup.rmaCenterPhone && <div style={{ fontSize: 12, color: "#6b7280" }}>📞 {rmaPopup.rmaCenterPhone}</div>}
            </div>
            {rmaPopup.rmaSentAt && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 12 }}>📅 Sent on: {new Date(rmaPopup.rmaSentAt).toLocaleString()}</div>}
          </div>
        </div>
      )}

      {productPopup && (
        <div onClick={() => setProductPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fad8be" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#c94500" }}>📦 Device Details</div>
              <button onClick={() => setProductPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#fff8f2", borderRadius: 10, padding: "14px 16px", border: "1px solid #fad8be" }}>
              {[["📦 Category", productPopup.category], ["📂 Sub Category", productPopup.subCategory], ["📐 Item Name", productPopup.model], ["🔢 Serial No", productPopup.serialNo], ["📡 MAC Address", productPopup.mac]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 110 }}>{label}</div>
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
              {[["👤 Name", customerPopup.customer], ["📞 Phone", customerPopup.phone], ["✉️ Email", customerPopup.email], ["🏙️ City", customerPopup.city], ["🌍 Country", customerPopup.country]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 90 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {assigneePopup && (
        <div onClick={() => setAssigneePopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fde68a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#92400e" }}>🛠️ Assigned Support</div>
              <button onClick={() => setAssigneePopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#fffbeb", borderRadius: 10, padding: "14px 16px", border: "1px solid #fde68a" }}>
              {[["🛠️ Name", assigneePopup.name], ["📞 Phone", assigneePopup.phone], ["🏙️ City", assigneePopup.city], ["🎯 Specialization", assigneePopup.specialization]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 110 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
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
              {[["👤 Name", raisedByPopup.name], ["✉️ Email", raisedByPopup.email], ["📞 Phone", raisedByPopup.phone], ["🏙️ City", raisedByPopup.city], ["🌍 Country", raisedByPopup.country], ["🎭 Role", raisedByPopup.role], ["🎯 Specialization", raisedByPopup.specialization]].map(([label, val]) => val ? (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 120 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val}</div>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      )}

      {reassignPopup && (
        <div onClick={() => setReassignPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "20px 22px", maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fed7aa", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#c2410c" }}>🔄 Reassignment History</div>
              <button onClick={() => setReassignPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#374151" }}>✕</button>
            </div>
            {Array.isArray(reassignPopup.reassignHistory) && reassignPopup.reassignHistory.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {reassignPopup.reassignHistory.map((entry, i) => {
                  const fromP = supportPersons.find(p => p.name && entry.from && p.name.toLowerCase().trim() === entry.from.toLowerCase().trim());
                  const toP   = supportPersons.find(p => p.name && entry.to   && p.name.toLowerCase().trim() === entry.to.toLowerCase().trim());
                  return (
                    <div key={i} style={{ border: "1px solid #e0d8d0", borderRadius: 10, overflow: "hidden", fontSize: 12 }}>
                      <div style={{ background: "#fff7ed", padding: "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "#c2410c", fontSize: 11 }}>Step {i + 1}</span>
                        {(entry.at || entry.timestamp) && <span style={{ fontSize: 10, color: "#9ca3af" }}>{new Date(entry.at || entry.timestamp).toLocaleString()}</span>}
                      </div>
                      <div style={{ padding: "8px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ flex: 1, background: "#fef2f2", borderRadius: 8, padding: "6px 10px", border: "1px solid #fca5a5" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>FROM</div>
                          <div style={{ fontWeight: 700, color: "#111" }}>{entry.from || "—"}</div>
                          {fromP?.city  && <div style={{ fontSize: 10, color: "#6b7280" }}>🏙️ {fromP.city}</div>}
                          {fromP?.email && <div style={{ fontSize: 10, color: "#6b7280" }}>✉️ {fromP.email}</div>}
                        </div>
                        <div style={{ fontSize: 16 }}>→</div>
                        <div style={{ flex: 1, background: "#f0fdf4", borderRadius: 8, padding: "6px 10px", border: "1px solid #86efac" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 4 }}>TO</div>
                          <div style={{ fontWeight: 700, color: "#111" }}>{entry.to || "—"}</div>
                          {toP?.city  && <div style={{ fontSize: 10, color: "#6b7280" }}>🏙️ {toP.city}</div>}
                          {toP?.email && <div style={{ fontSize: 10, color: "#6b7280" }}>✉️ {toP.email}</div>}
                          {toP?.specialization && <div style={{ fontSize: 10, color: "#6b7280" }}>🎯 {toP.specialization.join(", ")}</div>}
                        </div>
                      </div>
                      {entry.reason && <div style={{ padding: "4px 12px 8px", fontSize: 11, color: "#92400e", background: "#fffbeb" }}>📝 {entry.reason}</div>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ border: "1px solid #e0d8d0", borderRadius: 10, overflow: "hidden", fontSize: 12 }}>
                <div style={{ background: "#fff7ed", padding: "6px 12px" }}>
                  <span style={{ fontWeight: 700, color: "#c2410c", fontSize: 11 }}>Reassigned</span>
                  {reassignPopup.reassignedAt && <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 8 }}>{new Date(reassignPopup.reassignedAt).toLocaleString()}</span>}
                </div>
                <div style={{ padding: "8px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1, background: "#fef2f2", borderRadius: 8, padding: "6px 10px", border: "1px solid #fca5a5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>FROM</div>
                    <div style={{ fontWeight: 700, color: "#111" }}>{reassignPopup.reassignedFrom || "—"}</div>
                    {(() => { const p = supportPersons.find(x => x.name && reassignPopup.reassignedFrom && x.name.toLowerCase().trim() === reassignPopup.reassignedFrom.toLowerCase().trim()); return p ? <><div style={{ fontSize: 10, color: "#6b7280" }}>🏙️ {p.city}</div><div style={{ fontSize: 10, color: "#6b7280" }}>✉️ {p.email}</div></> : null; })()}
                  </div>
                  <div style={{ fontSize: 16 }}>→</div>
                  <div style={{ flex: 1, background: "#f0fdf4", borderRadius: 8, padding: "6px 10px", border: "1px solid #86efac" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 4 }}>TO</div>
                    <div style={{ fontWeight: 700, color: "#111" }}>{reassignPopup.assignTo || "—"}</div>
                    {(() => { const p = supportPersons.find(x => x.name && reassignPopup.assignTo && x.name.toLowerCase().trim() === reassignPopup.assignTo.toLowerCase().trim()); return p ? <><div style={{ fontSize: 10, color: "#6b7280" }}>🏙️ {p.city}</div><div style={{ fontSize: 10, color: "#6b7280" }}>✉️ {p.email}</div></> : null; })()}
                  </div>
                </div>
                {reassignPopup.reassignReason && <div style={{ padding: "4px 12px 8px", fontSize: 11, color: "#92400e", background: "#fffbeb" }}>📝 {reassignPopup.reassignReason}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Analytics</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>All tickets overview</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
         {[
  ["all",      "All",           "#374151", "#f3f4f6"],
  ["open",     "🔓 Open",       "#e04e00", "#fff4ee"],
  ["resolved", "✅ Resolved",   "#1a7a46", "#edfaf3"],
  ["rma",      "🔧 RMA",        "#7c3aed", "#f5f3ff"],
  ["reopened", "🔄 Reopened",   "#dc2626", "#fee2e2"],
].map(([key, label, col, bg]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: "6px 14px", borderRadius: 16, cursor: "pointer",
              border: filter === key ? `2px solid ${col}` : "1px solid #566274",
              background: filter === key ? bg : "white",
              color: filter === key ? col : "#555",
              fontWeight: filter === key ? 700 : 400,
              fontSize: 12, whiteSpace: "nowrap", fontFamily: "inherit",
            }}>
              {label} <span style={{ marginLeft: 4, background: filter === key ? col : "#e5e7eb", color: filter === key ? "white" : "#555", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Sub-tabs: Tickets | Reassigned ── */}
      <div style={{ display: "flex", gap: 0, background: "white", borderRadius: 10, border: "1.5px solid #e0d8d0", marginBottom: 16, overflow: "hidden", width: "fit-content" }}>
        {[
          ["tickets",    "📋 All Tickets",                  filtered.length],
          ["reassigned", "🔄 Reassigned Tickets",           tickets.filter(t => !!t.reassignedFrom).length],
        ].map(([key, label, cnt]) => (
          <button key={key} onClick={() => setAnalyticsTab(key)} style={{
            padding: "10px 20px", fontSize: 13, fontWeight: analyticsTab === key ? 800 : 500,
            color: analyticsTab === key ? "#c94500" : "#6b7280",
            background: analyticsTab === key ? "#fff4ee" : "white",
            border: "none", borderBottom: analyticsTab === key ? "3px solid #ff5a00" : "3px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
            borderRight: "1px solid #e0d8d0",
          }}>
            {label} <span style={{ marginLeft: 5, background: analyticsTab === key ? "#ff5a00" : "#e5e7eb", color: analyticsTab === key ? "white" : "#555", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{cnt}</span>
          </button>
        ))}
      </div>

      {/* ══ TICKETS TABLE ══ */}
        <ProductFilterBar
  categories={productCategories}
  subOptions={subOptions}
  itemOptions={itemOptions}
  filterCat={filterCat}
  filterSub={filterSub}
  filterItem={filterItem}
  setCat={setCat}
  setSub={setSub}
  setItem={setItem}
  resultCount={filtered.length}
/>

{analyticsTab === "tickets" && (

     
        <>
          {/* Source Filter */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12, background: "white", borderRadius: 10, padding: "10px 14px", border: "1.5px solid #e0d8d0" }}>
  <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>🎫 Raised By:</span>
  {[
    ["all",      "All Tickets",       "#374151", "#f3f4f6", tickets.length],
    ["customer", "👥 Customer",        "#7c3aed", "#f5f3ff", tickets.filter(t => t.source === "customer").length],
    ["sales",    "🧑‍💼 Sales Person",   "#ff5a00", "#fff4ee", tickets.filter(t => !t.source || (t.source !== "customer" && t.source !== "support")).length],
    ["support",  "🛠️ Support Person",  "#059669", "#ecfdf5", tickets.filter(t => t.source === "support").length],
  ].map(([key, label, col, bg, cnt]) => (
    <button key={key} onClick={() => setSourceFilter(key)} style={{
      padding: "5px 14px", borderRadius: 16, cursor: "pointer",
      border: sourceFilter === key ? `2px solid ${col}` : "1px solid #d1d5db",
      background: sourceFilter === key ? bg : "white",
      color: sourceFilter === key ? col : "#555",
      fontWeight: sourceFilter === key ? 700 : 400,
      fontSize: 12, whiteSpace: "nowrap", fontFamily: "inherit",
    }}>
      {label} <span style={{ marginLeft: 4, background: sourceFilter === key ? col : "#e5e7eb", color: sourceFilter === key ? "white" : "#555", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{cnt}</span>
    </button>
  ))}
  <select
    value={["customer","dealer","distributor","sipartner"].includes(sourceFilter) ? sourceFilter : "customer"}
    onChange={e => setSourceFilter(e.target.value)}
    style={{
      padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12,
      border: ["customer","dealer","distributor","sipartner"].includes(sourceFilter) ? "none" : "1px solid #d1d5db",
      background: ["customer","dealer","distributor","sipartner"].includes(sourceFilter) ? "#5b21b6" : "white",
      color: ["customer","dealer","distributor","sipartner"].includes(sourceFilter) ? "white" : "#555",
      fontWeight: ["customer","dealer","distributor","sipartner"].includes(sourceFilter) ? 700 : 400,
      outline: "none", fontFamily: "inherit"
    }}>
    <option value="customer">👥 All Customers ({tickets.filter(t => t.source === "customer").length})</option>
    <option value="dealer">🏷️ Dealer ({tickets.filter(t => t.source === "customer" && (t.customerType||"").toLowerCase() === "dealer").length})</option>
    <option value="distributor">📦 Distributor ({tickets.filter(t => t.source === "customer" && (t.customerType||"").toLowerCase() === "distributor").length})</option>
   
  
<option value="sipartner">🤝 SI Partner ({tickets.filter(t => t.source === "customer" && (t.customerType||"").toLowerCase() === "si partner").length})</option>
  </select>
{sourceFilter === "support" && (
  <select value={sourceViaFilter} onChange={e => setSourceViaFilter(e.target.value)}
    style={{ padding:"6px 12px", borderRadius:8, border:`1.5px solid ${sourceViaFilter!=="all"?"#059669":"#d1d5db"}`, fontSize:12, cursor:"pointer", background:sourceViaFilter!=="all"?"#ecfdf5":"white", color:sourceViaFilter!=="all"?"#059669":"#374151", outline:"none", fontFamily:"inherit" }}>
    <option value="all">All Vias</option>
    <option value="support-email">📧 Support Email</option>
    <option value="syrocare-app">📱 Syrocare App</option>
    <option value="website">🌐 Website</option>
    <option value="whatsapp">💬 WhatsApp</option>
    <option value="direct-call">📞 Direct Call</option>
    <option value="rnd">⚙️ R&D</option>
  </select>
)}
</div>

             <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:12, background:"white", borderRadius:10, padding:"12px 16px", border:"1.5px solid #e0d8d0" }}>
  <span style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>🗓️ Filter:</span>

  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
    <label style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>📅 Year</label>
    <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterDate(""); }}
      style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${filterYear ? "#ff5a00" : "#d1d5db"}`, fontSize:12, background: filterYear ? "#fff4ee" : "white", color: filterYear ? "#ff5a00" : "#374151", outline:"none", fontFamily:"inherit" }}>
      <option value="">All Years</option>
      {[2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035].map(y => <option key={y} value={y}>{y}</option>)}
 </select>
  </div>



  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
    <label style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>🗓️ Month</label>
    <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setFilterDate(""); }}
      style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${filterMonth ? "#ff5a00" : "#d1d5db"}`, fontSize:12, background: filterMonth ? "#fff4ee" : "white", color: filterMonth ? "#ff5a00" : "#374151", outline:"none", fontFamily:"inherit" }}>
      <option value="">All Months</option>
      {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
    </select>
  </div>

  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
    <label style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>📆 Date</label>
    <input type="date" value={filterDate}
      onChange={e => { setFilterDate(e.target.value); setFilterYear(""); setFilterMonth(""); }}
      style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${filterDate ? "#ff5a00" : "#d1d5db"}`, fontSize:12, background: filterDate ? "#fff4ee" : "white", color: filterDate ? "#ff5a00" : "#374151", outline:"none", fontFamily:"inherit" }} />
  </div>

  {(filterYear || filterMonth || filterDate) && (
    <button onClick={() => { setFilterYear(""); setFilterMonth(""); setFilterDate(""); }}
      style={{ marginTop:16, background:"#fee2e2", border:"none", borderRadius:6, padding:"6px 12px", cursor:"pointer", fontSize:11, color:"#dc2626", fontWeight:700, fontFamily:"inherit" }}>✕ Clear</button>
  )}

  <div style={{ marginTop:14, fontSize:12, color:"#6b7280" }}>
    Showing <strong style={{ color:"#ff5a00" }}>{filtered.length}</strong> tickets
  </div>
</div>


        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10, background:"white", borderRadius:10, padding:"10px 14px", border:"1.5px solid #e0d8d0" }}>
  <span style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>🔧 Engineer Level:</span>
  {[["all","All"],["1","L1"],["2","L2"],["3","L3"]].map(([key, label]) => (
    <button key={key} onClick={() => setLevelFilter(key)} style={{
      padding:"5px 12px", borderRadius:16, fontSize:12, cursor:"pointer",
      border: levelFilter===key ? "2px solid #ff5a00" : "1px solid #d1d5db",
      background: levelFilter===key ? "#fff4ee" : "white",
      color: levelFilter===key ? "#ff5a00" : "#555",
      fontWeight: levelFilter===key ? 700 : 400,
    }}>{label}</button>
  ))}
</div>

          <div style={{ marginBottom: 12 }}>
            <input placeholder="🔍 Search by name, agent, phone, product, subcategory, item..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 16px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 13, outline: "none", background: "white", fontFamily: "inherit", color: "#111", boxSizing: "border-box" }} />
          </div>

          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "72vh", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1300, background: "white" }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #c94500 0%, #ff5a00 100%)", position: "sticky", top: 0, zIndex: 2 }}>
                  {["Ticket No","Raised From","Raised By","Product","Item Name","Customer / KYC","Issue","History","Status","Image","Customer Rating"].map((h, i) => (
                    <th key={i} style={{ padding: "12px 14px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>No tickets found.</td></tr>
                ) : filtered.map((ticket, idx) => {
                  const s               = (ticket.status || "open").toLowerCase();
                  const isResolved      = s === "resolved";
                  const isSupportRaised = ticket.source === "support";
                  const isCustomerRaised = ticket.source === "customer";
                  const isReassigned    = !!ticket.reassignedFrom;
                  const assignedPerson  = supportPersons.find(p =>
                    p.name && ticket.assignTo &&
                    p.name.toLowerCase().trim() === ticket.assignTo.toLowerCase().trim()
                  );
                  const raiserPerson = supportPersons.find(p =>
                    p.email && ticket.raisedBy &&
                    p.email.toLowerCase().trim() === ticket.raisedBy.toLowerCase().trim()
                  );
                  const raisedFrom = getRaisedFromLabel(ticket);
                  return (
                    <tr key={ticket.id} style={{
                      borderBottom: "1px solid #f0ede8",
                      background: isSupportRaised
                        ? "#fef9c3"
                        : isCustomerRaised ? "#f5f3ff"
                        : isReassigned ? "#fffdf0"
                        : idx % 2 === 0 ? "#faf7f4" : "white",
                      borderLeft: `5px solid ${isSupportRaised ? "#d97706" : isCustomerRaised ? "#7c3aed" : STATUS_COLOR[s] || "#ccc"}`,
                    }}>
                      {/* Col 1 — Ticket No */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #e0d8d0" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#ff5a00" }}>{ticket.ticketNumber || "—"}</div>
                        <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>{ticket.date || "—"}</div>
                        {ticket.issueHistory && ticket.issueHistory.length > 0 && (
                          <div style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, marginTop: 2 }}>🔁 repeat</div>
                        )}
                      </td>

                      {/* Col 2 — Raised From */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #e0d8d0" }}>
                        <div style={{
                          fontSize: 10, fontWeight: 700,
                          background: raisedFrom.bg, color: raisedFrom.color,
                          border: raisedFrom.border || "none",
                          padding: "3px 8px", borderRadius: 6, display: "inline-block",
                        }}>
                         {raisedFrom.icon} {raisedFrom.label}
{raisedFrom.customerType && (
  <div style={{ fontSize:10, fontWeight:800, color:"#5b21b6", background:"#ddd6fe", padding:"2px 7px", borderRadius:5, display:"inline-block", marginTop:4 }}>
    {raisedFrom.customerType.toUpperCase()}
  </div>
)}
                        </div>
                      </td>

                      {/* Col 3 — Raised By (with popup) */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #e0d8d0", cursor: "pointer" }}
                        onClick={() => {
                          if (ticket.source === "customer") {
                            setRaisedByPopup({ name: ticket.customer, email: ticket.raisedBy, phone: ticket.phone, city: ticket.city, country: ticket.country, role: "Customer" });
                          } else {
                            setRaisedByPopup({ name: ticket.raisedByName || "—", email: ticket.raisedBy || raiserPerson?.email || "—", phone: raiserPerson?.phone || "—", city: raiserPerson?.city || "—", country: raiserPerson?.country || "—", role: raiserPerson?.role || (isSupportRaised ? "Support" : "Sales"), specialization: raiserPerson?.specialization ? raiserPerson.specialization.join(", ") : null });
                          }
                        }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#6ee7b7" }}>{ticket.raisedByName || "—"}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{ticket.date}</div>
                      </td>

                      {/* Col 4 — Product (with popup) */}
                     <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #e0d8d0" }}>
  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{ticket.category || "—"}</div>
</td>

                      {/* Col 5 — Model */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #e0d8d0", cursor: "pointer" }}
  onClick={() => setProductPopup({ category: ticket.category, subCategory: ticket.subCategory, model: ticket.model, serialNo: ticket.serialNo, mac: ticket.mac })}>
  <div style={{ fontSize: 11, fontWeight: 700, color: "#c94500", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#fad8be" }}>{ticket.model || "—"}</div>
</td>

                      {/* Col 6 — Customer / KYC (with popup) */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #e0d8d0", cursor: "pointer" }}
                        onClick={() => setCustomerPopup({ customer: ticket.customer, phone: ticket.phone, email: ticket.email, city: ticket.city, country: ticket.country })}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#93c5fd" }}>{ticket.customer || "—"}</div>
                        {ticket.assignTo && (
                          <div onClick={e => { e.stopPropagation(); setAssigneePopup({ name: ticket.assignTo, phone: assignedPerson?.phone, city: assignedPerson?.city, specialization: assignedPerson?.specialization?.join(", ") }); }}
                            style={{ fontSize: 10, color: "#92400e", fontWeight: 600, marginTop: 3, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#fde68a" }}>
                            🛠️ {ticket.assignTo}
                          </div>
                        )}
                        {isReassigned && (
                          <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, marginTop: 2 }}>🔄 from {ticket.reassignedFrom}</div>
                        )}
                      </td>

                      {/* Col 7 — Issue */}
                      <td style={{ padding: "11px 12px", maxWidth: 160, borderRight: "1px solid #e0d8d0" }}>
                        <div onClick={() => setIssuePopup({
  description: ticket.firstDescription || ticket.description,
  resolutionNotes: ticket.resolutionNotes,
  resolutionTimeTaken: ticket.resolutionTimeTaken,
  issueHistory: ticket.issueHistory,
  firstDescription: ticket.firstDescription || ticket.description,
  firstCreatedAt: ticket.createdAt,
  firstRaisedByName: ticket.raisedByName,
  firstResolvedNotes: ticket.firstResolvedNotes || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolutionNotes : null) || null,
  firstResolvedAt: ticket.firstResolvedAt || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedAt : null) || null,
  firstResolvedBy: ticket.firstResolvedBy || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedBy : null) || null,
  firstIsRma: ticket.firstIsRma || false,
})}
                          style={{ fontSize: 12, color: "#374151", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140, textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#9ca3af" }}
                          title="Click to view full issue">
                          {(ticket.description || "—").slice(0, 30)}{(ticket.description || "").length > 30 ? "…" : ""}
                        </div>
                        {isResolved && ticket.resolutionNotes && (
                          <div onClick={() => setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken })}
                            style={{ fontSize: 10, color: "#059669", fontWeight: 600, marginTop: 3, cursor: "pointer" }}>✅ Resolved — view</div>
                        )}
                      </td>

                      {/* Col 8 — Status */}

                        <td style={{ padding:"11px 12px", borderRight:"1px solid #e0d8d0" }}>
  <div onClick={() => setIssuePopup({
    description: ticket.description,
    resolutionNotes: ticket.resolutionNotes,
    resolutionTimeTaken: ticket.resolutionTimeTaken,
    rmaStatus: ticket.rmaStatus,
    issueHistory: ticket.issueHistory,
    firstDescription: ticket.firstDescription || ticket.description,
    firstCreatedAt: ticket.firstCreatedAt || ticket.createdAt,
    firstRaisedByName: ticket.firstRaisedByName || ticket.raisedByName,
    firstResolvedNotes: ticket.firstResolvedNotes || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolutionNotes : null) || null,
firstResolvedAt: ticket.firstResolvedAt || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedAt : null) || null,
firstResolvedBy: ticket.firstResolvedBy || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedBy : null) || null,
firstIsRma: ticket.firstIsRma || false,
  })} style={{ fontSize:10, color:"#c94500", cursor:"pointer", fontWeight:700, background:"#fff4ee", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
    📋 {(Array.isArray(ticket.issueHistory) ? ticket.issueHistory.length : 0) + 1} History
  </div>
  {ticket.reopenCount > 0 && (
    <div style={{ fontSize:9, color:"#dc2626", fontWeight:700, marginTop:3, background:"#fee2e2", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
      🔄 Reopened {ticket.reopenCount}x
    </div>
  )}
</td>



                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #e0d8d0" }}>
                        <span onClick={() => { if (s === "rma") setRmaPopup({ rmaReason: ticket.rmaReason, rmaCenterName: ticket.rmaCenterName, rmaCenterCity: ticket.rmaCenterCity, rmaCenterAddress: ticket.rmaCenterAddress, rmaCenterPhone: ticket.rmaCenterPhone, rmaSentAt: ticket.rmaSentAt }); }}
                          style={{ padding: "3px 9px", borderRadius: 10, fontSize: 10, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s], display: "inline-block", cursor: s === "rma" ? "pointer" : "default", border: s === "rma" ? "1.5px solid #c4b5fd" : "none" }}>
                          {s.toUpperCase()}
                        </span>
                        {s === "rma" && (
                          <div onClick={() => setRmaPopup({ rmaReason: ticket.rmaReason, rmaCenterName: ticket.rmaCenterName, rmaCenterCity: ticket.rmaCenterCity, rmaCenterAddress: ticket.rmaCenterAddress, rmaCenterPhone: ticket.rmaCenterPhone, rmaSentAt: ticket.rmaSentAt })}
                            style={{ fontSize: 9, color: "#7c3aed", marginTop: 3, cursor: "pointer", fontWeight: 600 }}>🔧 View RMA</div>
                        )}
                        {isReassigned && (
                          <div onClick={() => setReassignPopup({ reassignedFrom: ticket.reassignedFrom, assignTo: ticket.assignTo, reassignReason: ticket.reassignReason, reassignedAt: ticket.reassignedAt, reassignHistory: ticket.reassignHistory })}
                            style={{ fontSize: 9, color: "#c2410c", fontWeight: 700, cursor: "pointer", marginTop: 3 }}>🔄 reassigned</div>
                        )}
                        {ticket.createdAt && <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 3 }}>🕐 {new Date(ticket.createdAt).toLocaleDateString()}</div>}
                        {ticket.resolvedAt && <div style={{ fontSize: 9, color: "#10b981", marginTop: 2 }}>✅ {new Date(ticket.resolvedAt).toLocaleDateString()}</div>}
                      </td>

                      {/* Col 9 — Image */}
                      <td style={{ padding: "11px 10px", textAlign: "center", borderRight: "1px solid #e0d8d0" }}>
                        {ticket.productImage ? (
                          <button onClick={() => {
                            const win = window.open("", "_blank");
                            win.document.write(`<html><body style="margin:0;background:#111;display:flex;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;"><img src="${ticket.productImage}" style="max-width:100%;height:auto;border-radius:8px;" /></body></html>`);
                            win.document.close();
                          }} style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#065f46" }}>📷 View</button>
                        ) : <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>}
                      </td>

                      {/* Col 10 — Customer Rating */}
                      <td style={{ padding: "11px 12px", minWidth: 150 }}>
                       {!isResolved ? (
  <div style={{ fontSize: 11, color: "#d1d5db" }}>🔒 Only after resolved</div>
) : ticket.feedbackRating ? (
  <div>
    <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>
      {"★".repeat(parseInt(ticket.feedbackRating))}{"☆".repeat(5 - parseInt(ticket.feedbackRating))} {ticket.feedbackRating}/5
    </div>
    <div style={{ fontSize: 10, color: "#10b981", marginTop: 4, fontWeight: 600 }}>✅ Customer Rating</div>
    {ticket.feedbackComment && (
      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{ticket.feedbackComment}"</div>
    )}
  </div>
) : (
  <span style={{ fontSize: 11, color: "#d1d5db" }}>No feedback yet</span>
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
        </>
      )}

      {/* ══ REASSIGNED TABLE ══ */}
      {analyticsTab === "reassigned" && (
        <>
          {/* Filters */}
          <div style={{ background: "white", borderRadius: 10, border: "1.5px solid #fed7aa", padding: "14px 16px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e", whiteSpace: "nowrap" }}>📋 Status:</span>
              {[["all","All","#374151"],["open","🔓 Open","#e04e00"],["resolved","✅ Resolved","#1a7a46"],["rma","🔧 RMA","#7c3aed"]].map(([key, label, col]) => (
                <button key={key} onClick={() => setReassignStatusFilter(key)} style={{
                  padding: "5px 12px", borderRadius: 16, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                  border: reassignStatusFilter === key ? `2px solid ${col}` : "1px solid #d1d5db",
                  background: reassignStatusFilter === key ? col : "white",
                  color: reassignStatusFilter === key ? "white" : "#555",
                  fontWeight: reassignStatusFilter === key ? 700 : 400,
                }}>{label}</button>
              ))}
              <div style={{ width: 1, height: 20, background: "#e0d8d0", margin: "0 4px" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>🔧 Product:</span>
              <select value={reassignProductFilter} onChange={e => setReassignProductFilter(e.target.value)}
                style={{ padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${reassignProductFilter !== "all" ? "#f59e0b" : "#d1d5db"}`, fontSize: 11, cursor: "pointer", background: reassignProductFilter !== "all" ? "#fffbeb" : "white", color: reassignProductFilter !== "all" ? "#d97706" : "#374151", outline: "none", fontFamily: "inherit" }}>
                <option value="all">All Products</option>
                {uniqueReassignProducts.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>🗓️ Filter:</span>
              <select value={reassignYear} onChange={e => setReassignYear(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${reassignYear ? "#f59e0b" : "#d1d5db"}`, fontSize: 12, cursor: "pointer", background: reassignYear ? "#fffbeb" : "white", color: reassignYear ? "#d97706" : "#374151", outline: "none", fontFamily: "inherit" }}>
                <option value="">All Years</option>
                {[2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={reassignMonth} onChange={e => setReassignMonth(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${reassignMonth ? "#f59e0b" : "#d1d5db"}`, fontSize: 12, cursor: "pointer", background: reassignMonth ? "#fffbeb" : "white", color: reassignMonth ? "#d97706" : "#374151", outline: "none", fontFamily: "inherit" }}>
                <option value="">All Months</option>
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              {(reassignYear || reassignMonth) && (
                <button onClick={() => { setReassignYear(""); setReassignMonth(""); }}
                  style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: "#dc2626", fontWeight: 700, fontFamily: "inherit" }}>✕ Clear</button>
              )}
              <select value={reassignSort} onChange={e => setReassignSort(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 12, cursor: "pointer", background: "white", color: "#374151", outline: "none", fontFamily: "inherit" }}>
                <option value="newest">Newest First ↓</option>
                <option value="oldest">Oldest First ↑</option>
              </select>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>🔧 Level:</span>
{[["all","All"],["1","L1"],["2","L2"],["3","L3"]].map(([key, label]) => (
  <button key={key} onClick={() => setReassignLevelFilter(key)} style={{
    padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
    border: reassignLevelFilter === key ? "2px solid #f59e0b" : "1px solid #d1d5db",
    background: reassignLevelFilter === key ? "#fffbeb" : "white",
    color: reassignLevelFilter === key ? "#d97706" : "#555",
    fontWeight: reassignLevelFilter === key ? 700 : 400,
  }}>{label}</button>
))}
              <input placeholder="🔍 Search customer, serial, product, subcategory, item, from, to..."
                value={reassignSearch} onChange={e => setReassignSearch(e.target.value)}
                style={{ flex: 1, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: 12, background: "white", color: "#374151", outline: "none", fontFamily: "inherit" }} />
              {reassignSearch && <button onClick={() => setReassignSearch("")}
                style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, color: "#6b7280", fontWeight: 600, fontFamily: "inherit" }}>✕</button>}
            </div>
          </div>

          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "72vh", borderRadius: 12, border: "1.5px solid #fed7aa", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1200, background: "white" }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", position: "sticky", top: 0, zIndex: 2 }}>
                 {["Ticket No","Product","Item Name","Customer","Raised From","Raised By","Reassigned From","Reassigned To","Reason","Status","Reassigned At"].map((h, i) => (
                    <th key={i} style={{ padding: "12px 12px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allReassigned.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>No reassigned tickets found.</td></tr>
                ) : allReassigned.map((ticket, idx) => {
                  const s = (ticket.status || "open").toLowerCase();
                  const myEntry = Array.isArray(ticket.reassignHistory)
                    ? [...ticket.reassignHistory].reverse().find(e => e.from)
                    : null;
                  const raisedFrom = getRaisedFromLabel(ticket);
                  const raiserPerson = supportPersons.find(p =>
                    p.email && ticket.raisedBy &&
                    p.email.toLowerCase().trim() === ticket.raisedBy.toLowerCase().trim()
                  );
                  return (
                    <tr key={ticket.id} style={{ borderBottom: "1px solid #fef3c7", background: idx % 2 === 0 ? "#fffbeb" : "white", borderLeft: "4px solid #f59e0b" }}>
                      {/* Ticket No */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #fde68a" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#d97706" }}>{ticket.ticketNumber || "—"}</div>
                        <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>{ticket.date || "—"}</div>
                        {ticket.issueHistory && ticket.issueHistory.length > 0 && (
                          <div style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, marginTop: 2 }}>🔁 repeat</div>
                        )}
                      </td>
                      {/* Product */}
                     <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #fde68a" }}>
  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{ticket.category || "—"}</div>
</td>
                      {/* Model */}
                     <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #fde68a", cursor: "pointer" }}
  onClick={() => setProductPopup({ category: ticket.category, subCategory: ticket.subCategory, model: ticket.model, serialNo: ticket.serialNo, mac: ticket.mac })}>
  <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#fde68a" }}>{ticket.model || "—"}</div>
</td>
                      {/* Customer */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #fde68a", cursor: "pointer" }}
                        onClick={() => setCustomerPopup({ customer: ticket.customer, phone: ticket.phone, email: ticket.email, city: ticket.city, country: ticket.country })}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#93c5fd" }}>{ticket.customer || "—"}</div>
                      </td>
                      {/* Raised From */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #fde68a" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, background: raisedFrom.bg, color: raisedFrom.color, border: raisedFrom.border || "none", padding: "3px 7px", borderRadius: 6, display: "inline-block" }}>
  {raisedFrom.icon} {raisedFrom.label}
  {raisedFrom.customerType && (
    <div style={{ fontSize:10, fontWeight:800, color:"#5b21b6", background:"#ddd6fe", padding:"2px 7px", borderRadius:5, display:"inline-block", marginTop:4 }}>
      {raisedFrom.customerType.toUpperCase()}
    </div>
  )}
</div>
                      </td>
                      {/* Raised By */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #fde68a", cursor: "pointer" }}
                        onClick={() => {
                          if (ticket.source === "customer") {
                            setRaisedByPopup({ name: ticket.customer, email: ticket.raisedBy, phone: ticket.phone, city: ticket.city, country: ticket.country, role: "Customer" });
                          } else {
                            setRaisedByPopup({ name: ticket.raisedByName || "—", email: ticket.raisedBy || raiserPerson?.email || "—", phone: raiserPerson?.phone || "—", city: raiserPerson?.city || "—", country: raiserPerson?.country || "—", role: raiserPerson?.role || (ticket.source === "support" ? "Support" : "Sales"), specialization: raiserPerson?.specialization ? raiserPerson.specialization.join(", ") : null });
                          }
                        }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#6ee7b7" }}>{ticket.raisedByName || "—"}</div>
                      </td>
                      {/* Reassigned From */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #fde68a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "4px 8px" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", marginBottom: 2 }}>FROM</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{ticket.reassignedFrom || "—"}</div>
                            {(() => { const p = supportPersons.find(x => x.name && ticket.reassignedFrom && x.name.toLowerCase().trim() === ticket.reassignedFrom.toLowerCase().trim()); return p?.city ? <div style={{ fontSize: 10, color: "#6b7280" }}>🏙️ {p.city}</div> : null; })()}
                          </div>
                        </div>
                      </td>
                      {/* Reassigned To */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap", borderRight: "1px solid #fde68a" }}>
                        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6, padding: "4px 8px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 2 }}>TO</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{myEntry?.to || ticket.assignTo || "—"}</div>
                          {(() => { const p = supportPersons.find(x => x.name && (myEntry?.to || ticket.assignTo) && x.name.toLowerCase().trim() === (myEntry?.to || ticket.assignTo || "").toLowerCase().trim()); return p?.city ? <div style={{ fontSize: 10, color: "#6b7280" }}>🏙️ {p.city}</div> : null; })()}
                        </div>
                      </td>
                      {/* Reason */}
                      <td style={{ padding: "11px 12px", maxWidth: 150, borderRight: "1px solid #fde68a" }}>
                        <div style={{ fontSize: 11, color: "#92400e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}
                          title={myEntry?.reason || ticket.reassignReason || "—"}>
                          {myEntry?.reason || ticket.reassignReason || "—"}
                        </div>
                        {ticket.reassignHistory && ticket.reassignHistory.length > 1 && (
                          <div onClick={() => setReassignPopup({ reassignedFrom: ticket.reassignedFrom, assignTo: ticket.assignTo, reassignReason: ticket.reassignReason, reassignedAt: ticket.reassignedAt, reassignHistory: ticket.reassignHistory })}
                            style={{ fontSize: 9, color: "#c2410c", fontWeight: 700, cursor: "pointer", marginTop: 3 }}>
                            🔄 {ticket.reassignHistory.length} steps — view
                          </div>
                        )}
                      </td>
                      {/* Status */}
                      <td style={{ padding: "11px 12px", borderRight: "1px solid #fde68a", whiteSpace: "nowrap" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s], display: "inline-block" }}>
                          {s.toUpperCase()}
                        </span>
                      </td>
                      {/* Reassigned At */}
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 11, color: "#374151" }}>
                          {myEntry?.timestamp || ticket.reassignedAt ? new Date(myEntry?.timestamp || ticket.reassignedAt).toLocaleString() : "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", textAlign: "right" }}>
            Showing <strong style={{ color: "#374151" }}>{allReassigned.length}</strong> of <strong style={{ color: "#374151" }}>{tickets.filter(t => !!t.reassignedFrom).length}</strong> reassigned tickets
          </div>
        </>
      )}
    </div>
  );
}

function Analytics_OLD() {
  return null;
}

/* ═══════════════════════════════════════════════════
   PERFORMANCE TAB  (unchanged)
═══════════════════════════════════════════════════ */
function Performance() {
  const [tickets,     setTickets]     = useState([]);
const {
  filterCat, filterSub, filterItem,
  setCat, setSub, setItem,
  subOptions, itemOptions,
  applyFilter,
  categories: productCategories,
} = useProductFilter(tickets);

  
  const [period,      setPeriod]      = useState("all");
  const [customDate,  setCustomDate]  = useState("");
  const [agentFilter, setAgentFilter] = useState("");
 const [filterYear, setFilterYear] = useState("");
const [filterMonth, setFilterMonth] = useState("");
const [filterDate, setFilterDate] = useState("");
const [ratingFilter, setRatingFilter] = useState({});
const [globalRating, setGlobalRating] = useState(0);
const [supportPersons, setSupportPersons] = useState([]);

useEffect(() => {
  fetch(`${BASE_URL}/api/users`)
    .then(r => r.json())
    .then(users => setSupportPersons(users.filter(u => u.role === "support" && u.approved)))
    .catch(console.error);
}, []);
const [levelFilter, setLevelFilter] = useState("all");
const [sourceViaFilter, setSourceViaFilter] = useState("all");
const [supportOnly, setSupportOnly] = useState(false);

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

const filteredTickets = applyFilter(filterByPeriod(tickets).filter(t => {
  const d = new Date(t.createdAt || t.date);
  if (filterDate) return d.toDateString() === new Date(filterDate).toDateString();
  if (filterYear && filterMonth) return d.getFullYear() === parseInt(filterYear) && d.getMonth() + 1 === parseInt(filterMonth);
  if (filterYear) return d.getFullYear() === parseInt(filterYear);
  if (filterMonth) return d.getMonth() + 1 === parseInt(filterMonth);
 return true;
})
.filter(t => !supportOnly || t.source === "support")
.filter(t => sourceViaFilter === "all" || t.raisedVia === sourceViaFilter));
  const agents          = [...new Set(filteredTickets.map(t => t.assignTo).filter(Boolean))];
  const filteredAgents  = agents
  .filter(a => a.toLowerCase().includes(agentFilter.toLowerCase()))
  .filter(a => {
    if (levelFilter === "all") return true;
    const person = filteredTickets
      .map(t => t.assignTo === a ? supportPersons.find(p => p.name && p.name.toLowerCase().trim() === a.toLowerCase().trim()) : null)
      .find(Boolean);
    return person?.level === parseInt(levelFilter);
  });
  const periodLabel = () => {
    if (period === "daily")   return customDate ? `Day: ${customDate}` : `Today: ${new Date().toLocaleDateString()}`;
    if (period === "weekly")  return "Last 7 Days";
    if (period === "monthly") return `Month: ${new Date().toLocaleString("default",{month:"long",year:"numeric"})}`;
    return "All Time";
  };

  const getAgentStats = (agent) => {
    const agentTickets    = filteredTickets.filter(t => t.assignTo === agent);
    const resolvedList    = agentTickets.filter(t => t.status === "resolved" && t.createdAt && t.resolvedAt);
    const rmaList         = agentTickets.filter(t => t.status === "rma");
    const within24        = resolvedList.filter(t => (new Date(t.resolvedAt) - new Date(t.createdAt)) <= 24 * 60 * 60 * 1000).length;
    const avgScore        = resolvedList.length ? (resolvedList.reduce((s, t) => s + getCombinedScore(t), 0) / resolvedList.length).toFixed(1) : "—";
    const avgHours        = resolvedList.length ? (resolvedList.reduce((s, t) => s + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0) / resolvedList.length / (1000 * 60 * 60)).toFixed(1) : "—";
    const overdueCount    = agentTickets.filter(t => t.status !== "resolved" && t.status !== "rma" && t.createdAt && new Date(t.createdAt).getTime() + 24 * 60 * 60 * 1000 - Date.now() <= 0).length;
    const feedbackTickets = resolvedList.filter(t => t.feedbackRating && parseInt(t.feedbackRating) > 0);
    const avgFeedback     = feedbackTickets.length ? (feedbackTickets.reduce((s, t) => s + parseInt(t.feedbackRating), 0) / feedbackTickets.length).toFixed(1) : "—";
    return {
      total: agentTickets.length,
      
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
    } else if (t.createdAt && !t.resolvedAt) { sla = "OPEN"; }
    return [
      t.id||"—", t.raisedByName||"—", t.raisedBy||"—", t.customer||"—",
      t.email||"—", t.phone||"—", t.category||"—", t.serialNo||"—",
      t.mac||"—", t.city||"—", t.country||"—", t.description||"—", t.assignTo||"—",
      t.date||"—", (t.status || "open").toUpperCase(),
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
      ["Total Tickets", stats.total], ["Open", stats.open],
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
      ["Agent","Total","Open","Resolved","RMA","Within 24hr","SLA%","Avg Hrs","Avg Score","Overdue","Feedback","Avg Rating"],
      ...agents.map(agent => {
        const s = getAgentStats(agent);
        return [agent, s.total,  s.open, s.resolved, s.rma, s.within24,
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

      <ProductFilterBar
        categories={productCategories}
        subOptions={subOptions}
        itemOptions={itemOptions}
        filterCat={filterCat}
        filterSub={filterSub}
        filterItem={filterItem}
        setCat={setCat}
        setSub={setSub}
        setItem={setItem}
        resultCount={filteredTickets.length}
      />

      {agents.length === 0 && <div className="empty-state-box"><div style={{ fontSize: 48, marginBottom: 12 }}>📭</div><p>No data for the selected period.</p></div>}


      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:12, background:"white", borderRadius:10, padding:"12px 16px", border:"1.5px solid #e0d8d0" }}>
  <span style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>🗓️ Filter:</span>

  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
    <label style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>📅 Year</label>
    <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterDate(""); }}
      style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${filterYear ? "#ff5a00" : "#d1d5db"}`, fontSize:12, background: filterYear ? "#fff4ee" : "white", color: filterYear ? "#ff5a00" : "#374151", outline:"none", fontFamily:"inherit" }}>
      <option value="">All Years</option>
      {[2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035].map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  </div>

  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
    <label style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>🗓️ Month</label>
    <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setFilterDate(""); }}
      style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${filterMonth ? "#ff5a00" : "#d1d5db"}`, fontSize:12, background: filterMonth ? "#fff4ee" : "white", color: filterMonth ? "#ff5a00" : "#374151", outline:"none", fontFamily:"inherit" }}>
      <option value="">All Months</option>
      {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
    </select>
  </div>

  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
    <label style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>📆 Date</label>
    <input type="date" value={filterDate}
      onChange={e => { setFilterDate(e.target.value); setFilterYear(""); setFilterMonth(""); }}
      style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${filterDate ? "#ff5a00" : "#d1d5db"}`, fontSize:12, background: filterDate ? "#fff4ee" : "white", color: filterDate ? "#ff5a00" : "#374151", outline:"none", fontFamily:"inherit" }} />
  </div>

  {(filterYear || filterMonth || filterDate) && (
    <button onClick={() => { setFilterYear(""); setFilterMonth(""); setFilterDate(""); }}
      style={{ marginTop:16, background:"#fee2e2", border:"none", borderRadius:6, padding:"6px 12px", cursor:"pointer", fontSize:11, color:"#dc2626", fontWeight:700, fontFamily:"inherit" }}>✕ Clear</button>
  )}

  <div style={{ marginTop:14, fontSize:12, color:"#6b7280" }}>
    Showing <strong style={{ color:"#ff5a00" }}>{filteredTickets.length}</strong> tickets
  </div>
</div>

      {agents.length > 0 && (
        <div style={{ marginBottom: 14 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
          <button onClick={() => { setSupportOnly(p => !p); setSourceViaFilter("all"); }} style={{
  padding:"6px 14px", borderRadius:16, fontSize:12, cursor:"pointer",
  border: supportOnly ? "2px solid #059669" : "1px solid #d1d5db",
  background: supportOnly ? "#ecfdf5" : "white",
  color: supportOnly ? "#059669" : "#555",
  fontWeight: supportOnly ? 700 : 400,
}}>🛠️ Support Only</button>
{supportOnly && (
  <select value={sourceViaFilter} onChange={e => setSourceViaFilter(e.target.value)}
    style={{ padding:"6px 12px", borderRadius:8, border:`1.5px solid ${sourceViaFilter!=="all"?"#059669":"#d1d5db"}`, fontSize:12, cursor:"pointer", background:sourceViaFilter!=="all"?"#ecfdf5":"white", color:sourceViaFilter!=="all"?"#059669":"#374151", outline:"none", fontFamily:"inherit" }}>
    <option value="all">All Vias</option>
    <option value="support-email">📧 Support Email</option>
    <option value="syrocare-app">📱 Syrocare App</option>
    <option value="website">🌐 Website</option>
    <option value="whatsapp">💬 WhatsApp</option>
    <option value="direct-call">📞 Direct Call</option>
    <option value="rnd">⚙️ R&D</option>
  </select>
)}
  <span style={{ fontSize:12, color:"#6b7280", fontWeight:600 }}>🔧 Level:</span>
  {[["all","All Engineers"],["1","L1 Engineers"],["2","L2 Engineers"],["3","L3 Engineers"]].map(([key, label]) => (
    <button key={key} onClick={() => setLevelFilter(key)} style={{
      padding:"6px 14px", borderRadius:16, fontSize:12, cursor:"pointer",
      border: levelFilter===key ? "2px solid #ff5a00" : "1px solid #d1d5db",
      background: levelFilter===key ? "#fff4ee" : "white",
      color: levelFilter===key ? "#ff5a00" : "#555",
      fontWeight: levelFilter===key ? 700 : 400,
    }}>{label}</button>
  ))}
</div>
          <input
            placeholder="🔍 Filter by support person name..."
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            style={{ width: "100%", padding: "10px 16px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 13, outline: "none", background: "white", fontFamily: "inherit", color: "#111", boxSizing: "border-box" }}
          />
        </div>
      )}

      {filteredAgents.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
           <h3 style={{ fontSize: 16, fontWeight: 800, color: "#374151", margin: 0 }}>📋 Agent Summary — {periodLabel()}</h3>
<div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
  <span style={{ fontSize:12, color:"#6b7280", fontWeight:600 }}>⭐ Rating Filter:</span>
  {[0,1,2,3,4,5].map(star => (
    <button key={star} onClick={() => setGlobalRating(star)}
      style={{ padding:"5px 12px", borderRadius:16, fontSize:12, cursor:"pointer",
        border: globalRating===star ? "2px solid #f59e0b" : "1px solid #d1d5db",
        background: globalRating===star ? "#fffbeb" : "white",
        color: globalRating===star ? "#d97706" : "#555",
        fontWeight: globalRating===star ? 700 : 400 }}>
      {star === 0 ? "All" : "★".repeat(star)}
    </button>
  ))}
</div>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{filteredAgents.length} agent{filteredAgents.length !== 1 ? "s" : ""}</span>
          </div>
         <div style={{
  overflowX: "auto",
  overflowY: "auto",
  maxHeight: "400px",   // 👈 controls height
  borderRadius: 12,
  border: "1.5px solid #e0d8d0",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
}}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, background: "white" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                <tr style={{ background: "linear-gradient(135deg, #c94500 0%, #ff5a00 100%)" }}>
              {["Support Person","Total","Resolved","Open","RMA","Resolution Rate","Within 24hr","Avg Time","Avg Rating","Rating Breakdown","Export"].map((h, i) => (
                    <th key={i} style={{ padding: "12px 18px", fontSize: 11, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent, idx) => {
                 const stats = getAgentStats(agent);
console.log(agent, stats.total, stats.resolved, stats.open, stats.rma);
const colors = ["#ff5a00","#3b82f6","#10b981","#f59e0b","#8b5cf6"];
                  const col = colors[idx % colors.length];
                  const activeTotal = stats.resolved + stats.open;
const resolutionRate = activeTotal > 0 
  ? `${Math.round((stats.resolved / activeTotal) * 100)}%` 
  : "—";
                  return (
                    <tr key={agent} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#faf7f4" : "white", borderLeft: `4px solid ${col}` }}>
                      <td style={{ padding: "12px 18px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: col, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{agent.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{agent}</div>
                           
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
  <div style={{ fontSize: 20, fontWeight: 800, color: "#6b7280" }}>{stats.total}</div>
  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>tickets</div>
</td>
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#1a7a46" }}>{stats.resolved}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>tickets</div>
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#e04e00" }}>{stats.open}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>tickets</div>
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
  <div style={{ fontSize: 20, fontWeight: 800, color: "#7c3aed" }}>{stats.rma}</div>
  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>tickets</div>
</td>
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: activeTotal > 0 ? (parseInt(resolutionRate) >= 70 ? "#10b981" : parseInt(resolutionRate) >= 40 ? "#f59e0b" : "#ef4444") : "#9ca3af" }}>{resolutionRate}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{stats.resolved}/{activeTotal}</div>
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
  {stats.resolved === 0 ? (
    <div style={{ fontSize: 13, color: "#d1d5db" }}>—</div>
  ) : (
    <>
      <div style={{ fontSize: 20, fontWeight: 800, color:
        stats.within24 / stats.resolved >= 0.7 ? "#10b981" :
        stats.within24 / stats.resolved >= 0.4 ? "#f59e0b" : "#ef4444"
      }}>
        {Math.round((stats.within24 / stats.resolved) * 100)}%
      </div>
      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
        {stats.within24}/{stats.resolved}
      </div> 
    </>
  )}
</td>
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#3b82f6" }}>{stats.avgHours === "—" ? "—" : `${stats.avgHours}h`}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>avg resolution</div>
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
                        {stats.avgFeedback === "—" ? (
                          <div style={{ fontSize: 13, color: "#d1d5db" }}>—</div>
                        ) : (
                          <>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>⭐ {stats.avgFeedback}</div>
                            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{stats.feedbackCount} reviews</div>
                          </>
                        )}
                      </td>

         <td style={{ padding: "12px 18px", textAlign: "center" }}>
  {globalRating > 0 ? (
    <div style={{ background: "#fffbeb", border: "1.5px solid #f59e0b", borderRadius: 8, padding: "6px 10px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#d97706" }}>
        {filteredTickets.filter(t =>
          t.assignTo === agent &&
          parseInt(t.feedbackRating) === globalRating
        ).length}
      </div>
      <div style={{ fontSize: 10, color: "#92400e" }}>
        {"★".repeat(globalRating)} tickets
      </div>
    </div>
  ) : (
    <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"center" }}>
      {[5,4,3,2,1].map(star => {
        const count = filteredTickets.filter(t => t.assignTo === agent && parseInt(t.feedbackRating) === star).length;
        return count > 0 ? (
          <div key={star} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11 }}>
            <span style={{ color:"#f59e0b" }}>{"★".repeat(star)}</span>
            <span style={{ fontWeight:700, color:"#374151" }}>{count}</span>
          </div>
        ) : null;
      })}
      {filteredTickets.filter(t => t.assignTo === agent && t.feedbackRating).length === 0 &&
        <span style={{ fontSize:11, color:"#d1d5db" }}>No ratings</span>}
    </div>
  )}
</td>
         
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
  <button
    onClick={() => exportAgentExcel(agent)}
    style={{
      background: "#ff5a00",
      color: "white",
      border: "none",
      borderRadius: 6,
      padding: "6px 10px",
      fontSize: 11,
      cursor: "pointer",
      fontWeight: 600
    }}
  >
    ⬇️ Export
  </button>
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}