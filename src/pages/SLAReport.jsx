import { useState, useEffect, useMemo } from "react";
import "./SLAReport.css";

const BASE_URL = "https://api.syrotech.com";

/* ── helpers ── */

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT_M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pct(num, den) { return den === 0 ? 0 : Math.round((num / den) * 100); }
function avgHrs(list) {
  const valid = list.filter(t => t.createdAt && t.resolvedAt);
  if (!valid.length) return null;
  return (valid.reduce((s,t) => s + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0) / valid.length / 3600000).toFixed(1);
}
function slaColor(p) { return p >= 80 ? "#10b981" : p >= 50 ? "#f59e0b" : "#ef4444"; }
function slaGrade(p) { return p >= 90 ? "A" : p >= 75 ? "B" : p >= 55 ? "C" : p >= 35 ? "D" : "F"; }
function gradeColor(g) { return { A:"#10b981", B:"#3b82f6", C:"#f59e0b", D:"#f97316", F:"#ef4444" }[g] || "#9ca3af"; }

/* bar width capped at 100% */
function Bar({ pct: p, color, height = 7 }) {
  return (
    <div style={{ background: "#f0f0f0", borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${Math.min(100,p)}%`, background: color, borderRadius: 99, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

/* mini sparkline using SVG */
function Spark({ data, color = "#ff5a00", width = 80, height = 28 }) {
  if (!data || data.length < 2) return <span style={{ fontSize: 10, color: "#ccc" }}>—</span>;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function SLAReport() {
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filterYear,  setFilterYear]  = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDate,  setFilterDate]  = useState("");
  const [activeSection, setActiveSection] = useState("overview");

 useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/tickets?page=1&limit=2000`)
      .then(r => r.json())
      .then(data => { setTickets(data.tickets || []); setLoading(false); })
      .catch(() => setLoading(false));
    const id = setInterval(() => {
      fetch(`${BASE_URL}/tickets?page=1&limit=2000`)
        .then(r => r.json())
        .then(data => { setTickets(data.tickets || []); })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

  /* filtered tickets */
  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const d = new Date(t.createdAt || t.date);
      if (filterDate)  return d.toDateString() === new Date(filterDate).toDateString();
      if (filterYear  && d.getFullYear() !== parseInt(filterYear))  return false;
      if (filterMonth && d.getMonth() + 1 !== parseInt(filterMonth)) return false;
      return true;
    });
  }, [tickets, filterYear, filterMonth, filterDate]);

  const clearFilters = () => { setFilterYear(""); setFilterMonth(""); setFilterDate(""); };
  const hasFilter = filterYear || filterMonth || filterDate;

  /* ── KPI ── */
  const kpi = useMemo(() => {
    const total    = filtered.length;
    const resolved = filtered.filter(t => t.status === "resolved").length;
    const open     = filtered.filter(t => t.status === "open").length;
    const rma      = filtered.filter(t => t.status === "rma").length;
    
    const within24 = filtered.filter(t => t.status === "resolved" && t.createdAt && t.resolvedAt &&
      (new Date(t.resolvedAt) - new Date(t.createdAt)) <= 86400000).length;
    const sla24Pct = pct(within24, resolved);
    const avg = avgHrs(filtered.filter(t => t.status === "resolved"));
    const withFeedback = filtered.filter(t => t.feedbackRating && parseInt(t.feedbackRating) > 0);
    const avgRating = withFeedback.length
      ? (withFeedback.reduce((s, t) => s + parseInt(t.feedbackRating), 0) / withFeedback.length).toFixed(1)
      : null;
    const reassigned = filtered.filter(t => !!t.reassignedFrom).length;
    return { total, resolved, open, rma, within24,  sla24Pct, avg, avgRating, withFeedback: withFeedback.length, reassigned };
  }, [filtered]);

  /* ── Product analysis ── */
 const productData = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      if (!t.category) return;
      if (t.source === "hr") return;
      if (!map[t.category]) map[t.category] = { total:0, resolved:0, open:0, rma:0,  issues:[] };
      map[t.category].total++;
      map[t.category][t.status]  = (map[t.category][t.status] || 0) + 1;
      if (t.description) map[t.category].issues.push(t.description);
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, resRate: pct((v.resolved || 0) + (v.rma || 0), v.total) }))
      .sort((a,b) => b.total - a.total);
  }, [filtered]);

  /* ── City analysis ── */
  const cityData = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      if (t.source === "hr") return;
      const city = (t.city || "Unknown").trim();
      if (!map[city]) map[city] = { total:0, resolved:0, open:0, rma:0 };
      map[city].total++;
      map[city][t.status] = (map[city][t.status] || 0) + 1;
    });
    return Object.entries(map)
      .map(([city, v]) => ({ city, ...v, resRate: pct((v.resolved || 0) + (v.rma || 0), v.total) }))
      .sort((a,b) => b.total - a.total)
      .slice(0, 15);
  }, [filtered]);

  /* ── Sales person analysis ── */
 const salesData = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const name = t.raisedByName || "Unknown";
      const source = t.source || "sales";
      if (!map[name]) map[name] = { name, source, total:0, resolved:0, open:0, rma:0 };
      map[name].total++;
      map[name][t.status] = (map[name][t.status] || 0) + 1;
      map[name].source = source;
    });
    return Object.values(map)
      .map(v => ({ ...v, resRate: pct((v.resolved || 0) + (v.rma || 0), v.total) }))
      .sort((a,b) => b.total - a.total);
  }, [filtered]);

  /* ── Support person SLA ── */
  const supportData = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const name = t.assignTo || "Unassigned";
      if (!map[name]) map[name] = { name, total:0, resolved:0, open:0, rma:0, times:[], ratings:[] };
      map[name].total++;
      map[name][t.status] = (map[name][t.status] || 0) + 1;
      if (t.status === "resolved" && t.createdAt && t.resolvedAt) {
        map[name].times.push((new Date(t.resolvedAt) - new Date(t.createdAt)) / 3600000);
      }
      if (t.feedbackRating) map[name].ratings.push(parseInt(t.feedbackRating));
    });
    return Object.values(map).map(v => {
      const within24 = filtered.filter(t => t.assignTo === v.name && t.status === "resolved" && t.createdAt && t.resolvedAt &&
        (new Date(t.resolvedAt) - new Date(t.createdAt)) <= 86400000).length;
      const sla = pct(within24, v.resolved);
      const avgT = v.times.length ? (v.times.reduce((a,b) => a+b,0) / v.times.length).toFixed(1) : null;
      const avgR = v.ratings.length ? (v.ratings.reduce((a,b)=>a+b,0)/v.ratings.length).toFixed(1) : null;
      const grade = slaGrade(sla);
      return { ...v, within24, sla, avgTime: avgT, avgRating: avgR, grade };
    }).sort((a,b) => b.total - a.total);
  }, [filtered]);

  /* ── Monthly trend (last 6 months) ── */
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const m = d.getMonth(); const y = d.getFullYear();
      const mTickets = tickets.filter(t => {
        const td = new Date(t.createdAt || t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      return {
        label: SHORT_M[m],
        total: mTickets.length,
        resolved: mTickets.filter(t => t.status === "resolved").length,
        rma: mTickets.filter(t => t.status === "rma").length,
      };
    });
  }, [tickets]);

  /* ── RMA reasons ── */
  const rmaReasons = useMemo(() => {
    const map = {};
    filtered.filter(t => t.status === "rma" && t.rmaReason).forEach(t => {
      map[t.rmaReason] = (map[t.rmaReason] || 0) + 1;
    });
    return Object.entries(map).sort((a,b) => b[1]-a[1]);
  }, [filtered]);

  /* ── Source breakdown ── */
  const sourceBreakdown = useMemo(() => {
    const customer = filtered.filter(t => t.source === "customer").length;
    const support  = filtered.filter(t => t.source === "support").length;
    const hr       = filtered.filter(t => t.source === "hr").length;
    const sales    = filtered.filter(t => !t.source || (t.source !== "customer" && t.source !== "support" && t.source !== "hr")).length;
    return [
      { label: "Customer Portal", count: customer, color: "#7c3aed", icon: "👥" },
      { label: "Sales Team",      count: sales,    color: "#ff5a00", icon: "🧑‍💼" },
      { label: "Support Team",    count: support,  color: "#059669", icon: "🛠️" },
      { label: "HR Team",         count: hr,       color: "#1d4ed8", icon: "🧑‍💼" },
    ];
  }, [filtered]);

  const maxProduct = productData[0]?.total || 1;
  const maxCity    = cityData[0]?.total    || 1;
  const maxSales   = salesData[0]?.total   || 1;

  const SECTIONS = [
    { key: "overview",  label: "Overview",         icon: "📊" },
    { key: "products",  label: "Products",          icon: "📦" },
    { key: "cities",    label: "Cities",            icon: "🏙️" },
    { key: "sales",     label: "Sales Persons",     icon: "🧑‍💼" },
    { key: "support",   label: "Support SLA",       icon: "🛠️" },
    { key: "trends",    label: "Monthly Trends",    icon: "📈" },
  ];

  if (loading) return (
    <div className="sla-loading">
      <div className="sla-spinner" />
      <p>Loading SLA Report…</p>
    </div>
  );

  return (
    <div className="sla-root">

      {/* ── Page Header ── */}
      <div className="sla-page-header">
        <div className="sla-page-header-left">
          <div className="sla-page-badge">SLA REPORT</div>
          <h1 className="sla-page-title">Insights & Analytics</h1>
          <p className="sla-page-sub">Product trends · City heatmap · Sales performance · Support SLA</p>
        </div>
        {/* Filter Bar */}
        <div className="sla-filter-bar">
          <div className="sla-filter-group">
            <label className="sla-filter-label">📅 Year</label>
            <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterDate(""); }}
              className={`sla-select ${filterYear ? "active" : ""}`}>
              <option value="">All Years</option>
              {[2021,2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="sla-filter-group">
            <label className="sla-filter-label">🗓️ Month</label>
            <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setFilterDate(""); }}
              className={`sla-select ${filterMonth ? "active" : ""}`}>
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="sla-filter-group">
            <label className="sla-filter-label">📆 Date</label>
            <input type="date" value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setFilterYear(""); setFilterMonth(""); }}
              className={`sla-date-input ${filterDate ? "active" : ""}`} />
          </div>
          {hasFilter && (
            <button onClick={clearFilters} className="sla-clear-btn">✕ Clear</button>
          )}
          <div className="sla-filter-count">
            <span className="sla-filter-count-num">{filtered.length}</span>
            <span className="sla-filter-count-label">tickets</span>
          </div>
        </div>
      </div>

      {/* ── Section Nav ── */}
      <div className="sla-section-nav">
        {SECTIONS.map(s => (
          <button key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`sla-section-btn ${activeSection === s.key ? "active" : ""}`}>
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          OVERVIEW
      ══════════════════════════════════════ */}
      {activeSection === "overview" && (
        <div className="sla-section">
          {/* KPI Grid */}
          <div className="sla-kpi-grid">
            {[
              { label: "Total Tickets",    value: kpi.total,       icon: "🎫", color: "#3b82f6", bg: "#eff6ff",  sub: "All time in range" },
              { label: "Resolved",         value: kpi.resolved,    icon: "✅", color: "#10b981", bg: "#ecfdf5",  sub: `${pct(kpi.resolved + kpi.rma, kpi.total)}% resolution rate` },
              { label: "Open",             value: kpi.open,        icon: "🔓", color: "#e04e00", bg: "#fff4ee",  sub: "Awaiting resolution" },
            
              { label: "RMA",              value: kpi.rma,         icon: "🔧", color: "#7c3aed", bg: "#f5f3ff",  sub: "Sent to RMA center" },
              { label: "Within 24hr SLA",  value: kpi.within24,    icon: "⚡", color: "#0369a1", bg: "#eff6ff",  sub: `${kpi.sla24Pct}% of resolved` },
              { label: "Avg Resolution",   value: kpi.avg ? `${kpi.avg}h` : "—", icon: "⏱️", color: "#6d28d9", bg: "#f5f3ff", sub: "Mean time to resolve" },
              { label: "Avg Rating",       value: kpi.avgRating ? `${kpi.avgRating}⭐` : "—", icon: "💬", color: "#d97706", bg: "#fffbeb", sub: `${kpi.withFeedback} reviews` },
              { label: "Reassigned",       value: kpi.reassigned,  icon: "🔄", color: "#c2410c", bg: "#fff7ed",  sub: "Tickets reassigned" },
              { label: "HR Tickets",       value: filtered.filter(t => t.source === "hr").length, icon: "🧑‍💼", color: "#1d4ed8", bg: "#dbeafe", sub: "Raised by HR team" },
            ].map(k => (
              <div key={k.label} className="sla-kpi-card" style={{ borderTop: `3px solid ${k.color}`, background: k.bg }}>
                <div className="sla-kpi-icon">{k.icon}</div>
                <div className="sla-kpi-value" style={{ color: k.color }}>{k.value}</div>
                <div className="sla-kpi-label">{k.label}</div>
                <div className="sla-kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Source breakdown */}
          <div className="sla-card" style={{ marginTop: 20 }}>
            <div className="sla-card-title">🎯 Ticket Sources</div>
            <div className="sla-source-row">
              {sourceBreakdown.map(s => (
                <div key={s.label} className="sla-source-item">
                  <div className="sla-source-icon" style={{ background: s.color + "22", color: s.color }}>{s.icon}</div>
                  <div className="sla-source-info">
                    <div className="sla-source-name">{s.label}</div>
                    <div className="sla-source-count" style={{ color: s.color }}>{s.count}</div>
                    <Bar pct={pct(s.count, kpi.total)} color={s.color} height={6} />
                    <div className="sla-source-pct">{pct(s.count, kpi.total)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA compliance summary */}
          <div className="sla-card" style={{ marginTop: 16 }}>
            <div className="sla-card-title">⚡ SLA Compliance Overview</div>
            <div className="sla-sla-band" style={{ background: slaColor(kpi.sla24Pct) + "18", border: `2px solid ${slaColor(kpi.sla24Pct)}33` }}>
              <div className="sla-sla-grade" style={{ background: gradeColor(slaGrade(kpi.sla24Pct)), color: "white" }}>
                {slaGrade(kpi.sla24Pct)}
              </div>
              <div className="sla-sla-band-info">
                <div className="sla-sla-band-pct" style={{ color: slaColor(kpi.sla24Pct) }}>{kpi.sla24Pct}%</div>
                <div className="sla-sla-band-label">of resolved tickets closed within 24 hours</div>
                <Bar pct={kpi.sla24Pct} color={slaColor(kpi.sla24Pct)} height={10} />
                <div className="sla-sla-band-sub">{kpi.within24} of {kpi.resolved} resolved tickets met the 24hr SLA target</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PRODUCTS
      ══════════════════════════════════════ */}
      {activeSection === "products" && (
        <div className="sla-section">
          <div className="sla-card">
            <div className="sla-card-header">
              <div className="sla-card-title">📦 Product Issue Frequency</div>
              <div className="sla-card-sub">{productData.length} products · sorted by volume</div>
            </div>
            {productData.length === 0 ? (
              <div className="sla-empty">No product data for selected period.</div>
            ) : (
              <div className="sla-scroll">
                <table className="sla-table">
                  <thead>
                    <tr>
                      {["#","Product","Total Issues","Open","Resolved","RMA","Resolution Rate","SLA Grade","Trend"].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productData.map((p, i) => {
                      const sla = pct(p.resolved || 0, p.total);
                      const grade = slaGrade(sla);
                      // sparkline: last 6 months count for this product
                      const spark = monthlyTrend.map(m => {
                        const d = new Date();
                        return tickets.filter(t => {
                          const td = new Date(t.createdAt || t.date);
                          return t.category === p.name && SHORT_M[td.getMonth()] === m.label;
                        }).length;
                      });
                      return (
                        <tr key={p.name} className={i % 2 === 0 ? "even" : ""}>
                          <td><span className="sla-rank" style={{ background: i < 3 ? ["#ff5a00","#f59e0b","#3b82f6"][i] : "#e5e7eb", color: i < 3 ? "white" : "#555" }}>#{i+1}</span></td>
                          <td><span className="sla-product-name">{p.name}</span></td>
                          <td>
                            <div className="sla-vol-cell">
                              <span className="sla-vol-num">{p.total}</span>
                              <Bar pct={pct(p.total, maxProduct)} color="#ff5a00" height={5} />
                            </div>
                          </td>
                          <td><span className="sla-badge open">{p.open || 0}</span></td>
                          <td><span className="sla-badge resolved">{p.resolved || 0}</span></td>
                          <td><span className="sla-badge rma">{p.rma || 0}</span></td>
                          
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, color: slaColor(sla), fontSize: 13 }}>{sla}%</span>
                              <Bar pct={sla} color={slaColor(sla)} height={5} />
                            </div>
                          </td>
                          <td>
                            <span className="sla-grade-badge" style={{ background: gradeColor(grade), color: "white" }}>{grade}</span>
                          </td>
                          <td><Spark data={spark} color="#ff5a00" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          CITIES
      ══════════════════════════════════════ */}
      {activeSection === "cities" && (
        <div className="sla-section">
          <div className="sla-card">
            <div className="sla-card-header">
              <div className="sla-card-title">🏙️ City-wise Issue Heatmap</div>
              <div className="sla-card-sub">Top {cityData.length} cities by ticket volume</div>
            </div>
            {cityData.length === 0 ? (
              <div className="sla-empty">No city data for selected period.</div>
            ) : (
              <>
                {/* Heat blocks */}
                <div className="sla-city-heat-grid">
                  {cityData.map((c, i) => {
                    const intensity = Math.max(0.15, c.total / maxCity);
                    return (
                      <div key={c.city} className="sla-city-heat-block"
                        style={{ background: `rgba(255,90,0,${intensity})`, border: `1.5px solid rgba(255,90,0,${intensity + 0.2})` }}>
                        <div className="sla-city-heat-name">{c.city}</div>
                        <div className="sla-city-heat-num" style={{ color: intensity > 0.5 ? "white" : "#c94500" }}>{c.total}</div>
                        <div className="sla-city-heat-sub" style={{ color: intensity > 0.5 ? "rgba(255,255,255,0.85)" : "#888" }}>tickets</div>
                      </div>
                    );
                  })}
                </div>

                {/* Table */}
                <div className="sla-scroll" style={{ marginTop: 20 }}>
                  <table className="sla-table">
                    <thead>
                      <tr>
                        {["#","City","Total","Open","Resolved","RMA","Resolution Rate","Volume Bar"].map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {cityData.map((c, i) => (
                        <tr key={c.city} className={i % 2 === 0 ? "even" : ""}>
                          <td><span className="sla-rank" style={{ background: i < 3 ? ["#ff5a00","#f59e0b","#3b82f6"][i] : "#e5e7eb", color: i < 3 ? "white" : "#555" }}>#{i+1}</span></td>
                          <td><span className="sla-city-name">🏙️ {c.city}</span></td>
                          <td><strong style={{ color: "#ff5a00" }}>{c.total}</strong></td>
                          <td><span className="sla-badge open">{c.open || 0}</span></td>
                          <td><span className="sla-badge resolved">{c.resolved || 0}</span></td>
                          <td><span className="sla-badge rma">{c.rma || 0}</span></td>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ fontWeight:700, color: slaColor(c.resRate), fontSize:13 }}>{c.resRate}%</span>
                              <Bar pct={c.resRate} color={slaColor(c.resRate)} height={5} />
                            </div>
                          </td>
                          <td style={{ width: 140 }}><Bar pct={pct(c.total, maxCity)} color="#ff5a00" height={7} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SALES PERSONS
      ══════════════════════════════════════ */}
      {activeSection === "sales" && (
        <div className="sla-section">
          <div className="sla-card">
            <div className="sla-card-header">
              <div className="sla-card-title">🧑‍💼 Sales & Support Person — Ticket Activity</div>
              <div className="sla-card-sub">{salesData.length} persons · sorted by tickets raised</div>
            </div>
            {salesData.length === 0 ? (
              <div className="sla-empty">No data for selected period.</div>
            ) : (
              <>
                {/* Cards */}
                <div className="sla-sales-grid sla-card-scroll">
                  {salesData.slice(0, 6).map((s, i) => {
                    const colors = ["#ff5a00","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899"];
                    const col = colors[i % colors.length];
                    const sourceLabel = s.source === "customer" ? "Customer" : s.source === "support" ? "Support" : s.source === "hr" ? "HR" : "Sales";
                    return (
                      <div key={s.name} className="sla-sales-card" style={{ borderTop: `3px solid ${col}` }}>
                        <div className="sla-sales-avatar" style={{ background: col }}>{s.name.charAt(0).toUpperCase()}</div>
                        <div className="sla-sales-name">{s.name}</div>
                        <div className="sla-sales-source" style={{ background: col + "22", color: col }}>{sourceLabel}</div>
                        <div className="sla-sales-stats">
                          <div className="sla-sales-stat">
                            <span className="sla-sales-stat-val" style={{ color: col }}>{s.total}</span>
                            <span className="sla-sales-stat-lbl">Raised</span>
                          </div>
                          <div className="sla-sales-stat">
                            <span className="sla-sales-stat-val" style={{ color: "#10b981" }}>{s.resolved}</span>
                            <span className="sla-sales-stat-lbl">Resolved</span>
                          </div>
                          <div className="sla-sales-stat">
                            <span className="sla-sales-stat-val" style={{ color: "#e04e00" }}>{s.open}</span>
                            <span className="sla-sales-stat-lbl">Open</span>
                          </div>
                          <div className="sla-sales-stat">
                            <span className="sla-sales-stat-val" style={{ color: "#7c3aed" }}>{s.rma}</span>
                            <span className="sla-sales-stat-lbl">RMA</span>
                          </div>
                        </div>
                        <div style={{ margin: "10px 0 4px" }}>
                          <Bar pct={s.resRate} color={slaColor(s.resRate)} height={7} />
                        </div>
                        <div className="sla-sales-resrate" style={{ color: slaColor(s.resRate) }}>{s.resRate}% resolved</div>
                      </div>
                    );
                  })}
                </div>

                {/* Full table */}
                <div className="sla-scroll" style={{ marginTop: 20 }}>
                  <table className="sla-table">
                    <thead>
                      <tr>
                        {["#","Person","Source","Total Raised","Open","Resolved","RMA","Resolution Rate"].map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.map((s, i) => {
                        const srcMap = { customer: { label:"Customer", color:"#7c3aed", bg:"#f5f3ff" }, support: { label:"Support", color:"#059669", bg:"#ecfdf5" }, hr: { label:"HR", color:"#1d4ed8", bg:"#dbeafe" } };
                        const src = srcMap[s.source] || { label:"Sales", color:"#ff5a00", bg:"#fff4ee" };
                        return (
                          <tr key={s.name} className={i % 2 === 0 ? "even" : ""}>
                            <td><span className="sla-rank" style={{ background: i < 3 ? ["#ff5a00","#f59e0b","#3b82f6"][i] : "#e5e7eb", color: i < 3 ? "white" : "#555" }}>#{i+1}</span></td>
                            <td>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:28, height:28, borderRadius:"50%", background: ["#ff5a00","#3b82f6","#10b981","#f59e0b","#8b5cf6"][i%5], color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, flexShrink:0 }}>{s.name.charAt(0).toUpperCase()}</div>
                                <span style={{ fontWeight:700, fontSize:13, color:"#1a1a1a" }}>{s.name}</span>
                              </div>
                            </td>
                            <td><span style={{ fontSize:10, fontWeight:700, background:src.bg, color:src.color, padding:"3px 8px", borderRadius:6 }}>{src.label}</span></td>
                            <td>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <strong style={{ color:"#ff5a00" }}>{s.total}</strong>
                                <Bar pct={pct(s.total, maxSales)} color="#ff5a00" height={5} />
                              </div>
                            </td>
                            <td><span className="sla-badge open">{s.open || 0}</span></td>
                            <td><span className="sla-badge resolved">{s.resolved || 0}</span></td>
                           
                            <td><span className="sla-badge rma">{s.rma || 0}</span></td>
                            <td>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <span style={{ fontWeight:700, color:slaColor(s.resRate), fontSize:13 }}>{s.resRate}%</span>
                                <Bar pct={s.resRate} color={slaColor(s.resRate)} height={5} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SUPPORT SLA
      ══════════════════════════════════════ */}
      {activeSection === "support" && (
        <div className="sla-section">
          {/* RMA reasons */}
          {rmaReasons.length > 0 && (
            <div className="sla-card" style={{ marginBottom: 20 }}>
              <div className="sla-card-title">🔧 Top RMA Reasons</div>
              <div className="sla-rma-reasons">
                {rmaReasons.map(([reason, cnt], i) => (
                  <div key={reason} className="sla-rma-row">
                    <span className="sla-rma-label">{reason}</span>
                    <div style={{ flex: 1 }}><Bar pct={pct(cnt, rmaReasons[0][1])} color="#7c3aed" height={8} /></div>
                    <span className="sla-rma-count">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sla-card">
            <div className="sla-card-header">
              <div className="sla-card-title">🛠️ Support Person — SLA Performance</div>
              <div className="sla-card-sub">Graded by 24hr SLA compliance</div>
            </div>
            {supportData.length === 0 ? (
              <div className="sla-empty">No support data for selected period.</div>
            ) : (
              <>
                {/* Grade cards */}
           <div className="sla-support-grade-grid sla-card-scroll">
                  {supportData.map((s, i) => (
                    <div key={s.name} className="sla-support-grade-card">
                      <div className="sla-support-grade-badge" style={{ background: gradeColor(s.grade), color: "white" }}>{s.grade}</div>
                      <div className="sla-support-grade-name">{s.name}</div>
                      <div className="sla-support-grade-sla" style={{ color: slaColor(s.sla) }}>{s.sla}%</div>
                      <div className="sla-support-grade-sub">24hr SLA</div>
                      <Bar pct={s.sla} color={slaColor(s.sla)} height={6} />
                      <div className="sla-support-grade-meta">
                        <span>⏱️ {s.avgTime ? `${s.avgTime}h` : "—"}</span>
                        <span>⭐ {s.avgRating || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Full SLA table */}
                <div className="sla-scroll" style={{ marginTop: 20 }}>
                  <table className="sla-table">
                    <thead>
                      <tr>
                        {["Support Person","Total","Open","Resolved","RMA","Within 24hr","SLA %","Grade","Avg Time","Avg Rating"].map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {supportData.map((s, i) => (
                        <tr key={s.name} className={i % 2 === 0 ? "even" : ""}>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:28, height:28, borderRadius:"50%", background: gradeColor(s.grade), color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12 }}>{s.name.charAt(0).toUpperCase()}</div>
                              <span style={{ fontWeight:700, fontSize:13 }}>{s.name}</span>
                            </div>
                          </td>
                          <td><strong style={{ color:"#3b82f6" }}>{s.total}</strong></td>
                          <td><span className="sla-badge open">{s.open || 0}</span></td>
                          <td><span className="sla-badge resolved">{s.resolved || 0}</span></td>
                        
                          <td><span className="sla-badge rma">{s.rma || 0}</span></td>
                          <td><strong style={{ color:"#0369a1" }}>{s.within24}</strong></td>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:100 }}>
                              <span style={{ fontWeight:800, color:slaColor(s.sla), fontSize:14 }}>{s.sla}%</span>
                              <Bar pct={s.sla} color={slaColor(s.sla)} height={6} />
                            </div>
                          </td>
                          <td>
                            <span className="sla-grade-badge" style={{ background: gradeColor(s.grade), color:"white" }}>{s.grade}</span>
                          </td>
                          <td><span style={{ color: s.avgTime ? (parseFloat(s.avgTime) <= 8 ? "#10b981" : parseFloat(s.avgTime) <= 24 ? "#f59e0b" : "#ef4444") : "#9ca3af", fontWeight:700 }}>{s.avgTime ? `${s.avgTime}h` : "—"}</span></td>
                          <td>
                            {s.avgRating ? (
                              <span style={{ color:"#f59e0b", fontWeight:700 }}>{"★".repeat(Math.round(s.avgRating))}{"☆".repeat(5-Math.round(s.avgRating))} {s.avgRating}</span>
                            ) : <span style={{ color:"#d1d5db" }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MONTHLY TRENDS
      ══════════════════════════════════════ */}
      {activeSection === "trends" && (
        <div className="sla-section">
          <div className="sla-card">
            <div className="sla-card-header">
              <div className="sla-card-title">📈 Monthly Ticket Trends</div>
              <div className="sla-card-sub">Last 6 months — all tickets (unfiltered)</div>
            </div>
            {/* Bar chart */}
            <div className="sla-trend-chart">
              {monthlyTrend.map((m, i) => {
                const maxVal = Math.max(...monthlyTrend.map(x => x.total), 1);
                const height = Math.max(4, (m.total / maxVal) * 160);
                const resH   = m.total > 0 ? (m.resolved / m.total) * height : 0;
                return (
                  <div key={m.label} className="sla-trend-bar-wrap">
                    <div className="sla-trend-bar-top">{m.total}</div>
                    <div className="sla-trend-bar-stack" style={{ height: 160 }}>
                      <div className="sla-trend-bar-bg" />
                      <div className="sla-trend-bar-total" style={{ height: `${height}px`, bottom: 0 }}>
                        <div className="sla-trend-bar-resolved" style={{ height: `${resH}px` }} />
                      </div>
                    </div>
                    <div className="sla-trend-label">{m.label}</div>
                    <div className="sla-trend-sub">{m.resolved}✅ {m.rma > 0 ? `${m.rma}🔧` : ""}</div>
                  </div>
                );
              })}
            </div>
            <div className="sla-trend-legend">
              <span><span style={{ display:"inline-block", width:12, height:12, borderRadius:3, background:"#ff5a00", marginRight:5 }} />Total Tickets</span>
              <span><span style={{ display:"inline-block", width:12, height:12, borderRadius:3, background:"#10b981", marginRight:5 }} />Resolved</span>
            </div>

            {/* Monthly table */}
            <div className="sla-scroll" style={{ marginTop: 20 }}>
              <table className="sla-table">
                <thead>
                  <tr>
                    {["Month","Total","Resolved","Open","RMA","Resolution Rate","Trend"].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {monthlyTrend.map((m, i) => {
                  const open = m.total - m.resolved - m.rma;
const rate = pct(m.resolved, m.resolved + Math.max(0, open));
                    return (
                      <tr key={m.label} className={i % 2 === 0 ? "even" : ""}>
                        <td><strong>{m.label}</strong></td>
                        <td><strong style={{ color:"#ff5a00" }}>{m.total}</strong></td>
                        <td><span className="sla-badge resolved">{m.resolved}</span></td>
                        <td><span className="sla-badge open">{Math.max(0, open)}</span></td>
                        <td><span className="sla-badge rma">{m.rma}</span></td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:100 }}>
                            <span style={{ fontWeight:700, color:slaColor(rate) }}>{rate}%</span>
                            <Bar pct={rate} color={slaColor(rate)} height={5} />
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize:12, fontWeight:600, color: m.total > (monthlyTrend[i-1]?.total||0) ? "#ef4444" : "#10b981" }}>
                            {i > 0 ? (m.total > monthlyTrend[i-1].total ? `↑ +${m.total - monthlyTrend[i-1].total}` : m.total < monthlyTrend[i-1].total ? `↓ ${m.total - monthlyTrend[i-1].total}` : "→ 0") : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}