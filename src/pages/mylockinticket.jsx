import { useState, useEffect } from "react";

const BASE_URL = "https://api.syrotech.com";

const STATUS_COLOR = {
  open: "#e04e00", pending: "#b45309",
  resolved: "#1a7a46", reopened: "#dc2626",
};
const STATUS_BG = {
  open: "#fff4ee", pending: "#fffbeb",
  resolved: "#edfaf3", reopened: "#fee2e2",
};

export default function MyLockinTickets({ tickets: allTickets }) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateSort, setDateSort] = useState("newest");
  const [productPopup, setProductPopup] = useState(null);
const [customerPopup, setCustomerPopup] = useState(null);
const [issuePopup, setIssuePopup] = useState(null);
const [statusUpdatePopup, setStatusUpdatePopup] = useState(null);

const fetchTickets = () => {
    const email = currentUser?.email || "";
    if (!email) { setLoading(false); return; }
    fetch(`${BASE_URL}/tickets?raisedBy=${encodeURIComponent(email)}&ticketType=lockin&limit=2000`)
  .then((r) => r.json())
  .then((data) => {
    setTickets(data.tickets || []);
    setLoading(false);
  })
  .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (allTickets) {
      const mine = allTickets.filter(
        (t) => t.ticketType === "lockin" && t.raisedBy === currentUser?.email
      );
      setTickets(mine);
      setLoading(false);
    } else {
      fetchTickets();
      const id = setInterval(fetchTickets, 60000);
      return () => clearInterval(id);
    }
  }, [allTickets]);

  const displayed = tickets
    .filter((t) => statusFilter === "all" || t.status === statusFilter)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (t.customer || "").toLowerCase().includes(q) ||
        (t.model || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.city || "").toLowerCase().includes(q) ||
        (t.serialNo || "").toLowerCase().includes(q) ||
        (t.ticketNumber?.toString() || "").includes(q)
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
        Loading lockin tickets...
      </div>
    );
  }

  return (
  <>
  {productPopup && (
  <div onClick={() => setProductPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fad8be" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#c94500" }}>📦 Product Details</div>
        <button onClick={() => setProductPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
      </div>
      <div style={{ background: "#fff8f2", borderRadius: 10, padding: "14px 16px", border: "1px solid #fad8be" }}>
        {[["📂 Sub Category", productPopup.subCategory], ["📐 Model", productPopup.model], ["🔧 Hardware Version", productPopup.hardwareVersion]].map(([label, val]) => (
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
{customerPopup && (
  <div onClick={() => setCustomerPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #bfdbfe" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8" }}>👤 Customer Details</div>
        <button onClick={() => setCustomerPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
      </div>
      <div style={{ background: "#eff6ff", borderRadius: 10, padding: "14px 16px", border: "1px solid #bfdbfe" }}>
        {[["👤 Name", customerPopup.customer], ["✉️ Email", customerPopup.email], ["📞 Phone", customerPopup.phone], ["🏢 Company", customerPopup.companyName], ["🏙️ City", customerPopup.city], ["🗺️ State", customerPopup.state], ["📮 Pincode", customerPopup.pincode]].map(([label, val]) => (
          <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 100 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
          </div>
        ))}
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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#374151", margin: 0 }}>
            🔒 My Lockin Tickets
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            All lockin tickets raised by you
          </p>
        </div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          Total: <strong style={{ color: "#374151" }}>{tickets.length}</strong>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 14, color: "#aaa" }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <p style={{ marginTop: 12 }}>No lockin tickets raised yet.</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{
            background: "white", borderRadius: 12, border: "1.5px solid #e0d8d0",
            padding: "14px 16px", marginBottom: 14,
            display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>📋 Status:</span>
            {[["all","All"],["open","🔓 Open"],["resolved","✅ Resolved"],["reopened","🔄 Reopened"]].map(([key, label]) => (
              <button key={key} onClick={() => setStatusFilter(key)} style={{
                padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                border: statusFilter === key ? `2px solid ${STATUS_COLOR[key] || "#374151"}` : "1px solid #d1d5db",
                background: statusFilter === key ? (STATUS_BG[key] || "#f3f4f6") : "white",
                color: statusFilter === key ? (STATUS_COLOR[key] || "#374151") : "#555",
                fontWeight: statusFilter === key ? 700 : 400,
              }}>
                {label}
                <span style={{
                  marginLeft: 4, fontSize: 10, fontWeight: 700,
                  background: statusFilter === key ? (STATUS_COLOR[key] || "#374151") : "#e5e7eb",
                  color: statusFilter === key ? "white" : "#555",
                  borderRadius: 10, padding: "1px 6px",
                }}>
                  {counts[key] ?? 0}
                </span>
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
              placeholder="🔍 Search customer, model, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 9,
                border: "1.5px solid #d1d5db", fontSize: 12,
                outline: "none", fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{
                background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8,
                padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#6b7280",
              }}>✕</button>
            )}

            <div style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>
              Showing <strong style={{ color: "#374151" }}>{displayed.length}</strong> of{" "}
              <strong style={{ color: "#374151" }}>{tickets.length}</strong>
            </div>
          </div>

          {/* Table */}
          <div style={{
  borderRadius: 12, border: "1.5px solid #e0d8d0",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflowX: "scroll", overflowY: "auto", maxHeight: "72vh",
}}>
            <table style={{
              width: "100%", borderCollapse: "separate", borderSpacing: 0,
              background: "white", minWidth: 900,
            }}>
              <thead>
                <tr style={{
                  background: "linear-gradient(135deg,#c94500 0%,#ff5a00 100%)",
                  position: "sticky", top: 0, zIndex: 2,
                }}>
                {["Ticket No","Date","Category","Product Details","Customer","Status","File","Logo","History","Sup. Updates","Resolved By"].map((h, i) => (
                    <th key={i} style={{
                      padding: "12px 12px", fontSize: 10, fontWeight: 800,
                      color: "white", textTransform: "uppercase",
                      textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  displayed.map((t, idx) => {
                    const s = (t.status || "open").toLowerCase();
                    return (
                      <tr key={t.id || t._id} style={{
                        borderBottom: "1px solid #f0ede8",
                        background: idx % 2 === 0 ? "#faf7f4" : "white",
                        borderLeft: `4px solid ${STATUS_COLOR[s] || "#ccc"}`,
                      }}>

                        {/* Ticket No */}
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#ff5a00" }}>
                            #{t.ticketNumber || "—"}
                          </div>
                        </td>

                        {/* Date */}
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 11, color: "#374151" }}>{t.date || "—"}</div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                            {t.category || "—"}
                          </div>
                        </td>

                       {/* Product Details */}
<td style={{ padding: "10px 12px" }}>
  <div
    onClick={() => setProductPopup({
      subCategory: t.subCategory,
      model: t.model,
      hardwareVersion: t.hardwareVersion,
    })}
    style={{
      fontSize: 11, fontWeight: 700, color: "#ff5a00",
      cursor: "pointer", textDecoration: "underline",
      textDecorationStyle: "dotted", textDecorationColor: "#fad8be",
      whiteSpace: "nowrap",
    }}
  >
    {t.model || "—"}
  </div>
  <div style={{ fontSize: 10, color: "#6b7280" }}>{t.subCategory || ""}</div>
</td>

                      {/* Customer */}
<td style={{ padding: "10px 12px" }}>
  <div
    onClick={() => setCustomerPopup({
      customer: t.customer,
      email: t.email,
      phone: t.phone,
      companyName: t.companyName,
      city: t.city,
      state: t.state,
      pincode: t.pincode,
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

                       {/* Status */}
<td style={{ padding: "10px 12px" }}>
  <span style={{
    padding: "3px 8px", borderRadius: 10, fontSize: 10,
    fontWeight: 700, color: STATUS_COLOR[s],
    background: STATUS_BG[s], display: "inline-block",
  }}>
    {s.toUpperCase()}
  </span>
  {s === "resolved" && (() => {
    const hrs = t.resolvedAt ? (Date.now() - new Date(t.resolvedAt).getTime()) / (1000*60*60) : 999;
    if (hrs > 48) return null;
    return (
      <div onClick={() => {
        const newIssue = window.prompt("Please describe the issue you are still facing:");
        if (!newIssue || !newIssue.trim()) return;
        const existingHistory = Array.isArray(t.issueHistory) ? t.issueHistory : [];
        const newEntry = {
          description: newIssue.trim(),
          raisedBy: currentUser?.email,
          raisedByName: currentUser?.name,
          raisedAt: new Date().toISOString(),
        };
       fetch(`${BASE_URL}/tickets/${t.id || t._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "reopened",
            resolvedAt: null,
            resolutionNotes: "",
            reopenedAt: new Date().toISOString(),
            reopenCount: (t.reopenCount || 0) + 1,
            issueHistory: [...existingHistory, newEntry],
            description: newIssue.trim(),
            firstDescription: t.firstDescription || t.description,
            firstCreatedAt: t.firstCreatedAt || t.createdAt,
            firstRaisedByName: t.firstRaisedByName || t.raisedByName,
            firstResolvedNotes: t.firstResolvedNotes || t.resolutionNotes || null,
            firstResolvedAt: t.firstResolvedAt || t.resolvedAt || null,
            firstResolvedBy: t.firstResolvedBy || t.resolvedBy || null,
          })
        }).then(() => fetchTickets());
      }} style={{ fontSize:9, color:"#dc2626", marginTop:3, cursor:"pointer", fontWeight:700, background:"#fee2e2", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
        🔄 Reopen
      </div>
    );
  })()}
</td>

                        {/* File */}
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {t.fileName ? (
                            <a
                              href={t.fileBase64}
                              download={t.fileName}
                              style={{
                                fontSize: 11, color: "#2563eb", fontWeight: 600,
                                textDecoration: "underline", cursor: "pointer",
                              }}
                            >
                              📎 {t.fileName.length > 15 ? t.fileName.slice(0, 15) + "…" : t.fileName}
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

{/* Sup. Updates */}
<td style={{ padding:"10px 12px", borderRight:"1px solid #e0d8d0" }}>
  {Array.isArray(t.statusUpdates) && t.statusUpdates.length > 0 ? (
    <div onClick={() => setStatusUpdatePopup(t.statusUpdates)}
      style={{ fontSize:10, color:"#1d4ed8", cursor:"pointer", fontWeight:700, background:"#eff6ff", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
      📝 {t.statusUpdates.length} Update{t.statusUpdates.length > 1 ? "s" : ""} — View
    </div>
  ) : (
    <span style={{ fontSize:11, color:"#d1d5db" }}>—</span>
  )}
</td>
                        {/* Resolved By */}
                        <td style={{ padding: "10px 12px" }}>
                          {t.resolvedBy ? (
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>
                                ✅ {t.resolvedBy}
                              </div>
                              {t.resolutionNotes && (
                                <div style={{
                                  fontSize: 10, color: "#6b7280", marginTop: 2,
                                  maxWidth: 150, overflow: "hidden",
                                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }} title={t.resolutionNotes}>
                                  {t.resolutionNotes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: "#d1d5db" }}>Pending...</span>
                          )}
                        </td>

                      </tr>
                    );
                    
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
   </div>
  </>
  );
}