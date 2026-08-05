import { useState, useEffect } from "react";

const BASE_URL = "https://api.syrotech.com";

const STATUS_COLOR = { open: "#e04e00", resolved: "#1a7a46", reopened: "#dc2626" };
const STATUS_BG    = { open: "#fff4ee", resolved: "#edfaf3", reopened: "#fee2e2" };

export default function MyLogisticTicket({ tickets: allTickets }) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [issuePopup, setIssuePopup] = useState(null);
  const [logisticPopup, setLogisticPopup] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);

  const fetchTickets = () => {
    const email = currentUser?.email || "";
    if (!email) { setLoading(false); return; }
    fetch(`${BASE_URL}/tickets?raisedBy=${encodeURIComponent(email)}&ticketType=logistic&limit=2000`)
      .then(r => r.json())
      .then(data => { setTickets(data.tickets || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (allTickets) {
      setTickets(allTickets.filter(t => t.ticketType === "logistic" && t.raisedBy === currentUser?.email));
      setLoading(false);
    } else {
      fetchTickets();
      const id = setInterval(fetchTickets, 60000);
      return () => clearInterval(id);
    }
  }, [allTickets]);

  const displayed = tickets
    .filter(t => statusFilter === "all" || (t.status || "open") === statusFilter)
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (t.courierCompany || "").toLowerCase().includes(q) ||
        (t.invoiceNumber  || "").toLowerCase().includes(q) ||
        (t.trackingDetails || "").toLowerCase().includes(q) ||
        (t.customer  || "").toLowerCase().includes(q) ||
        (t.ticketNumber?.toString() || "").includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => (t.status || "open") === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    reopened: tickets.filter(t => t.status === "reopened").length,
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading logistic tickets...</div>;

  return (
    <>
      {issuePopup && (
        <div onClick={() => setIssuePopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fad8be" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: issuePopup.resolutionNotes ? "#1a7a46" : "#c94500" }}>
                {issuePopup.resolutionNotes ? "✅ Ticket Resolved" : "📋 Issue Description"}
              </div>
              <button onClick={() => setIssuePopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>✕ Close</button>
            </div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#fff8f2", padding: "14px 16px", borderRadius: 10, border: "1px solid #fad8be", marginBottom: issuePopup.resolutionNotes ? 12 : 0 }}>
              {issuePopup.description}
            </div>
            {issuePopup.resolutionNotes && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", textTransform: "uppercase", marginBottom: 8 }}>🔧 Resolved by {issuePopup.resolvedBy}:</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#ecfdf5", padding: "14px 16px", borderRadius: 10, border: "1px solid #6ee7b7" }}>
                  {issuePopup.resolutionNotes}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Logistics Details Popup */}
      {logisticPopup && (
        <div onClick={() => setLogisticPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #bfdbfe" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8" }}>🚚 Logistics Details</div>
              <button onClick={() => setLogisticPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#eff6ff", borderRadius: 10, padding: "14px 16px", border: "1px solid #bfdbfe" }}>
              {[
                ["🚚 Courier Company", logisticPopup.courierCompany],
                ["🧾 Invoice Number", logisticPopup.invoiceNumber],
                ["📅 Invoice Date", logisticPopup.invoiceDate],
                ["📦 Dispatch Date", logisticPopup.dispatchDate],
                ["📍 Delivery Destination", logisticPopup.deliveryDestination],
                ["🔗 Tracking Details", logisticPopup.trackingDetails],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 150 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#374151", margin: 0 }}>📦 My Logistic Tickets</h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>All logistic tickets raised by you</p>
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Total: <strong style={{ color: "#374151" }}>{tickets.length}</strong></div>
        </div>

        {tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 14, color: "#aaa" }}>
            <div style={{ fontSize: 48 }}>📦</div>
            <p style={{ marginTop: 12 }}>No logistic tickets raised yet.</p>
          </div>
        ) : (
          <>
            <div style={{ background: "white", borderRadius: 12, border: "1.5px solid #e0d8d0", padding: "14px 16px", marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>📋 Status:</span>
              {[["all","All"],["open","🔓 Open"],["resolved","✅ Resolved"],["reopened","🔄 Reopened"]].map(([key, label]) => (
                <button key={key} onClick={() => setStatusFilter(key)} style={{
                  padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                  border: statusFilter === key ? `2px solid ${STATUS_COLOR[key] || "#374151"}` : "1px solid #d1d5db",
                  background: statusFilter === key ? (STATUS_BG[key] || "#f3f4f6") : "white",
                  color: statusFilter === key ? (STATUS_COLOR[key] || "#374151") : "#555",
                  fontWeight: statusFilter === key ? 700 : 400,
                }}>
                  {label} <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, background: statusFilter === key ? (STATUS_COLOR[key] || "#374151") : "#e5e7eb", color: statusFilter === key ? "white" : "#555", borderRadius: 10, padding: "1px 6px" }}>{counts[key] ?? 0}</span>
                </button>
              ))}
              <input placeholder="🔍 Search courier, invoice, tracking, customer, ticket no..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: 12, outline: "none" }} />
            </div>

            <div style={{ borderRadius: 12, border: "1.5px solid #e0d8d0", overflowX: "scroll", overflowY: "auto", maxHeight: "72vh" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "white", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg, #c94500 0%, #ff5a00 100%)", position: "sticky", top: 0 }}>
                    {["Ticket No", "Date", "Logistics Details", "Customer", "Assigned To", "Status", "Issue / Resolution"].map((h, i) => (
                      <th key={i} style={{ padding: "12px 12px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((t, idx) => {
                    const s = (t.status || "open").toLowerCase();
                    const id = t.id || t._id;
                    return (
                      <tr key={id} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#faf7f4" : "white", borderLeft: `4px solid ${STATUS_COLOR[s] || "#ccc"}` }}>
                        <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 11, fontWeight: 800, color: "#ff5a00" }}>#{t.ticketNumber || "—"}</div></td>
                        <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 11, color: "#374151" }}>{t.date || "—"}</div></td>
                        <td style={{ padding: "10px 12px" }}>
                          <div onClick={() => setLogisticPopup({
                            courierCompany: t.courierCompany,
                            invoiceNumber: t.invoiceNumber,
                            invoiceDate: t.invoiceDate,
                            dispatchDate: t.dispatchDate,
                            deliveryDestination: t.deliveryDestination,
                            trackingDetails: t.trackingDetails,
                          })}
                            style={{ fontSize: 11, color: "#1d4ed8", cursor: "pointer", fontWeight: 700, background: "#eff6ff", padding: "3px 10px", borderRadius: 6, display: "inline-block" }}>
                            🚚 View Details
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8" }}>{t.customer || "—"}</div></td>
                        <td style={{ padding: "10px 12px" }}><div style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>{t.assignTo || "—"}</div></td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s] }}>{s.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div onClick={() => setIssuePopup({ description: t.description, resolutionNotes: t.resolutionNotes, resolvedBy: t.resolvedBy })}
                            style={{ fontSize: 11, color: "#ff5a00", cursor: "pointer", fontWeight: 700, background: "#fff4ee", padding: "2px 8px", borderRadius: 4, display: "inline-block" }}>
                            📋 View
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
    </>
  );
}