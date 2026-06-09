import React, { useState, useEffect } from "react";

const BASE_URL = "https://api.syrotech.com";
const STATUS_COLOR = { open: "#e04e00", resolved: "#1a7a46" };
const STATUS_BG = { open: "#fff4ee", resolved: "#edfaf3" };

export default function ProductTestingTickets({ currentUser }) {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resolveForm, setResolveForm] = useState({});
  const [productPopup, setProductPopup] = useState(null);

  const fetchTickets = () => {
    fetch(`${BASE_URL}/tickets?page=1&limit=2000`)
      .then(r => r.json())
      .then(data => {
        const all = data.tickets || [];
        const mine = all.filter(t =>
          t.ticketType === "product_testing" &&
          t.assignTo?.toLowerCase().trim() === currentUser?.name?.toLowerCase().trim()
        );
        setTickets(mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .catch(console.error);
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleResolve = (ticketId) => {
    const rf = resolveForm[ticketId] || {};
    if (!rf.notes?.trim()) { alert("Please describe what was tested."); return; }
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "resolved",
        resolvedAt: new Date().toISOString(),
        resolutionNotes: rf.notes.trim(),
        resolvedBy: currentUser?.name,
      }),
    })
      .then(r => r.json())
      .then(updated => {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...updated, id: updated._id || ticketId } : t));
        setResolveForm(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
      })
      .catch(console.error);
  };

  const filtered = tickets
    .filter(t => statusFilter === "all" || t.status === statusFilter)
    .filter(t => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (t.category || "").toLowerCase().includes(q) ||
        (t.model || "").toLowerCase().includes(q) ||
        (t.serialNo || "").toLowerCase().includes(q) ||
        (t.oemName || "").toLowerCase().includes(q) ||
        (t.dcNumber || "").toLowerCase().includes(q)
      );
    });

  return (
    <div style={{ maxWidth: 1200, margin: "28px auto", padding: "0 16px" }}>

      {productPopup && (
        <div onClick={() => setProductPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #d1fae5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>📦 Product Details</div>
              <button onClick={() => setProductPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "14px 16px", border: "1px solid #bbf7d0" }}>
              {[["🔧 Category", productPopup.category], ["📂 Sub Category", productPopup.subCategory], ["📐 Item Name", productPopup.model], ["🔢 Serial No", productPopup.serialNo], ["📡 MAC Address", productPopup.mac], ["🏭 OEM Name", productPopup.oemName], ["📅 Sample Date", productPopup.sampleReceiveDate], ["📋 DC Number", productPopup.dcNumber]].map(([label, val]) => val ? (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 120 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val}</div>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#374151", margin: 0 }}>🧪 Product Testing Tickets</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Tickets raised by you for product testing</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        {[["all", "All"], ["open", "🔓 Open"], ["resolved", "✅ Resolved"]].map(([key, label]) => (
          <button key={key} onClick={() => setStatusFilter(key)} style={{
            padding: "6px 14px", borderRadius: 16, fontSize: 12, cursor: "pointer",
            border: statusFilter === key ? "2px solid #10b981" : "1px solid #d1d5db",
            background: statusFilter === key ? "#ecfdf5" : "white",
            color: statusFilter === key ? "#059669" : "#555",
            fontWeight: statusFilter === key ? 700 : 400,
          }}>{label} ({key === "all" ? tickets.length : tickets.filter(t => t.status === key).length})</button>
        ))}
        <input placeholder="🔍 Search category, model, serial, OEM, DC number..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: "8px 14px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
        {search && <button onClick={() => setSearch("")} style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#6b7280" }}>✕</button>}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 14, color: "#aaa" }}>
          <div style={{ fontSize: 48 }}>🧪</div>
          <p style={{ marginTop: 12 }}>No product testing tickets found.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 900, background: "white" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #059669, #10b981)", position: "sticky", top: 0, zIndex: 2 }}>
                {["Ticket No", "Date", "Product", "Item Name", "Serial No", "OEM", "Sample Date", "DC No", "Status", "Actions"].map((h, i) => (
                  <th key={i} style={{ padding: "12px 14px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket, idx) => {
                const s = (ticket.status || "open").toLowerCase();
                const showResolve = resolveForm[ticket.id]?.show;
                return (
                  <React.Fragment key={ticket.id}>
                    <tr style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f0fdf4" : "white", borderLeft: `4px solid ${STATUS_COLOR[s] || "#ccc"}` }}>
                      <td style={{ padding: "12px 14px", borderRight: "1px solid #d1fae5" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>{ticket.ticketNumber || "—"}</div>
                      </td>
                      <td style={{ padding: "12px 14px", borderRight: "1px solid #d1fae5", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{ticket.date || "—"}</td>
                      <td style={{ padding: "12px 14px", borderRight: "1px solid #d1fae5", fontSize: 12, fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>{ticket.category || "—"}</td>
                      <td style={{ padding: "12px 14px", borderRight: "1px solid #d1fae5", cursor: "pointer" }}
                        onClick={() => setProductPopup({ category: ticket.category, subCategory: ticket.subCategory, model: ticket.model, serialNo: ticket.serialNo, mac: ticket.mac, oemName: ticket.oemName, sampleReceiveDate: ticket.sampleReceiveDate, dcNumber: ticket.dcNumber })}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", textDecoration: "underline", textDecorationStyle: "dotted" }}>{ticket.model || "—"}</div>
                      </td>
                      <td style={{ padding: "12px 14px", borderRight: "1px solid #d1fae5", fontSize: 12, color: "#374151" }}>{ticket.serialNo || "—"}</td>
                      <td style={{ padding: "12px 14px", borderRight: "1px solid #d1fae5", fontSize: 12, color: "#374151" }}>{ticket.oemName || "—"}</td>
                      <td style={{ padding: "12px 14px", borderRight: "1px solid #d1fae5", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{ticket.sampleReceiveDate || "—"}</td>
                      <td style={{ padding: "12px 14px", borderRight: "1px solid #d1fae5", fontSize: 12, color: "#374151" }}>{ticket.dcNumber || "—"}</td>
                      <td style={{ padding: "12px 14px", borderRight: "1px solid #d1fae5" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s], display: "inline-block", whiteSpace: "nowrap" }}>
                          {s.toUpperCase()}
                        </span>
                        {s === "resolved" && ticket.resolvedAt && (
                          <div style={{ fontSize: 9, color: "#10b981", marginTop: 3 }}>✅ {new Date(ticket.resolvedAt).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {s === "open" && (
                          <button onClick={() => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: !prev[ticket.id]?.show } }))}
                            style={{ background: showResolve ? "#ecfdf5" : "#10b981", color: showResolve ? "#065f46" : "white", border: showResolve ? "1.5px solid #6ee7b7" : "none", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                            ✅ {showResolve ? "Cancel" : "Resolve"}
                          </button>
                        )}
                        {s === "resolved" && ticket.resolutionNotes && (
                          <div style={{ fontSize: 11, color: "#059669", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ticket.resolutionNotes}>
                            📋 {ticket.resolutionNotes.slice(0, 30)}...
                          </div>
                        )}
                      </td>
                    </tr>

                    {showResolve && s === "open" && (
                      <tr key={`resolve-${ticket.id}`} style={{ background: "#f0fdf4" }}>
                        <td colSpan={10} style={{ padding: "16px 20px" }}>
                          <div style={{ maxWidth: 700, background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "2px solid #10b981", borderRadius: 12, padding: "18px 20px" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46", marginBottom: 12 }}>✅ Resolve Testing Ticket</div>
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>What was tested? <span style={{ color: "#ef4444" }}>*</span></div>
                              <textarea rows={4} placeholder="Describe what was tested, results, observations..."
                                value={resolveForm[ticket.id]?.notes || ""}
                                onChange={e => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], notes: e.target.value } }))}
                                style={{ width: "100%", padding: "10px 12px", border: "2px solid #6ee7b7", borderRadius: 8, fontSize: 12, outline: "none", fontFamily: "inherit", background: "white", resize: "vertical", color: "#111", lineHeight: 1.5, boxSizing: "border-box" }}
                              />
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                              <button onClick={() => handleResolve(ticket.id)}
                                style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "inherit" }}>
                                ✅ Mark Resolved
                              </button>
                              <button onClick={() => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: false } }))}
                                style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, color: "#64748b", fontFamily: "inherit" }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}