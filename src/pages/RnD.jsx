import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const BASE_URL = "https://api.syrotech.com";

const STATUS_COLOR = { open: "#e04e00", resolved: "#1a7a46" };
const STATUS_BG    = { open: "#fff4ee", resolved: "#edfaf3" };

export default function RnD() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [activeTab, setActiveTab] = useState("raise");
  const [tickets, setTickets]     = useState([]);
  const [filter, setFilter]       = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [resolveForm, setResolveForm] = useState({});
  const [form, setForm] = useState({
    empName:  "",
    empEmail: "",
    empPhone: "",
    task:     "",
  });
  const [errors, setErrors] = useState({});

  const fetchTickets = () => {
    const email = currentUser?.email || "";
    if (!email) return;
    fetch(`${BASE_URL}/tickets?raisedBy=${encodeURIComponent(email)}&limit=500`)
      .then(r => r.json())
      .then(data => {
        const all = (data.tickets || []).filter(t => t.ticketType === "rnd");
        setTickets(all);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 60000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.empName.trim())  e.empName  = "Employee name is required.";
    if (!form.empEmail.trim()) e.empEmail = "Employee email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.empEmail)) e.empEmail = "Enter a valid email.";
    if (!form.empPhone.trim()) e.empPhone = "Employee phone is required.";
    else if (!/^\d{10}$/.test(form.empPhone.replace(/\s/g, ""))) e.empPhone = "Enter valid 10-digit phone.";
    if (!form.task.trim())     e.task     = "Task description is required.";
    return e;
  };

  const handleSubmit = () => {
    if (submitting) return;
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    const newTicket = {
      empName:      form.empName.trim(),
      empEmail:     form.empEmail.trim(),
      empPhone:     form.empPhone.trim(),
      description:  form.task.trim(),
      customer:     form.empName.trim(),
      phone:        form.empPhone.trim(),
      email:        form.empEmail.trim(),
      assignTo:     currentUser?.name || "",
      raisedBy:     currentUser?.email || "",
      raisedByName: currentUser?.name  || "",
      status:       "open",
      source:       "rnd",
      ticketType:   "rnd",
      date:         new Date().toISOString().slice(0, 10),
      createdAt:    new Date().toISOString(),
      acceptedAt:   new Date().toISOString(),
    };
    fetch(`${BASE_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTicket),
    })
      .then(r => { if (!r.ok) throw new Error("Server error"); return r.json(); })
      .then(() => {
        setForm({ empName: "", empEmail: "", empPhone: "", task: "" });
        setErrors({});
        setSuccessMsg("✅ Ticket raised successfully!");
        fetchTickets();
        setTimeout(() => {
          setSuccessMsg("");
          setActiveTab("mytickets");
        }, 1500);
      })
      .catch(() => setErrors({ submit: "❌ Failed to submit ticket." }))
      .finally(() => setSubmitting(false));
  };

  const handleResolve = (ticketId) => {
    const notes = resolveForm[ticketId]?.notes || "";
    if (!notes.trim()) { alert("Please describe what was completed."); return; }
    const now = new Date().toISOString();
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:          "resolved",
        resolvedAt:      now,
        resolutionNotes: notes.trim(),
        resolvedBy:      currentUser?.name,
      }),
    })
      .then(r => r.json())
      .then(() => {
        setResolveForm(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
        fetchTickets();
      })
      .catch(console.error);
  };

  const inputStyle = (field) => ({
    width: "100%",
    padding: "11px 14px",
    border: `2px solid ${errors[field] ? "#ef4444" : "#d1d5db"}`,
    borderRadius: 10,
    fontSize: 13.5,
    boxSizing: "border-box",
    outline: "none",
    background: errors[field] ? "#fff5f5" : "#f9fafb",
    fontFamily: "DM Sans, sans-serif",
    color: "#111",
  });

  const displayed = tickets.filter(t => {
    if (filter === "all")      return true;
    if (filter === "open")     return t.status === "open";
    if (filter === "resolved") return t.status === "resolved";
    return true;
  });

  const counts = {
    all:      tickets.length,
    open:     tickets.filter(t => t.status === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "DM Sans, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #059669, #10b981)", color: "white", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 12px rgba(16,185,129,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="Syrotech" style={{ width: 50, height: 50, borderRadius: 8, objectFit: "contain", background: "white", padding: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Syrotech Networks — R&D Portal</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>🔬 {currentUser?.name}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", color: "white", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: "white", borderBottom: "2px solid #e5e7eb", padding: "0 28px", display: "flex", gap: 0 }}>
        {[
          ["raise",     "🎫 Raise Ticket"],
          ["mytickets", `📋 My Tickets (${tickets.length})`],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: "14px 22px", fontSize: 13,
            fontWeight: activeTab === key ? 800 : 500,
            color: activeTab === key ? "#059669" : "#6b7280",
            background: "none", border: "none",
            borderBottom: activeTab === key ? "3px solid #10b981" : "3px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap", marginBottom: -2, fontFamily: "inherit",
          }}>{label}</button>
        ))}
      </div>

      {/* Success Message */}
      {successMsg && (
        <div style={{ margin: "16px 28px 0", background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, color: "#065f46" }}>
          {successMsg}
        </div>
      )}

      {/* RAISE TICKET TAB */}
      {activeTab === "raise" && (
        <div style={{ maxWidth: 600, margin: "32px auto", padding: "0 16px" }}>
          <div style={{ background: "white", borderRadius: 16, padding: "28px 32px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1.5px solid #e0d8d0" }}>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#059669,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔬</div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>Raise R&D Ticket</h2>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>All fields are required</p>
              </div>
            </div>

            {errors.submit && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#b91c1c", marginBottom: 16 }}>
                {errors.submit}
              </div>
            )}

            {/* Employee Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Employee Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="empName"
                placeholder="Full name"
                value={form.empName}
                onChange={handleChange}
                style={inputStyle("empName")}
              />
              {errors.empName && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{errors.empName}</span>}
            </div>

            {/* Employee Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Employee Email <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="empEmail"
                type="email"
                placeholder="employee@syrotech.com"
                value={form.empEmail}
                onChange={handleChange}
                style={inputStyle("empEmail")}
              />
              {errors.empEmail && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{errors.empEmail}</span>}
            </div>

            {/* Employee Phone */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Employee Phone <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="empPhone"
                placeholder="10-digit mobile number"
                value={form.empPhone}
                onChange={handleChange}
                maxLength={10}
                style={inputStyle("empPhone")}
              />
              {errors.empPhone && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{errors.empPhone}</span>}
            </div>

            {/* Task */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Task Description <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                name="task"
                rows={5}
                placeholder="Describe the R&D task in detail..."
                value={form.task}
                onChange={handleChange}
                style={{ ...inputStyle("task"), resize: "vertical", lineHeight: 1.6 }}
              />
              {errors.task && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{errors.task}</span>}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%", padding: "13px 20px", border: "none",
                borderRadius: 10, background: submitting ? "#94a3b8" : "linear-gradient(135deg, #059669, #10b981)",
                color: "white", fontSize: 15, fontWeight: 800,
                cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
              }}>
              {submitting ? "⏳ Submitting..." : "🔬 Submit R&D Ticket"}
            </button>
          </div>
        </div>
      )}

      {/* MY TICKETS TAB */}
      {activeTab === "mytickets" && (
        <div style={{ maxWidth: 1200, margin: "28px auto", padding: "0 16px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#374151", margin: 0 }}>📋 My R&D Tickets</h2>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Track all your raised R&D tickets</p>
            </div>
            <button onClick={() => setActiveTab("raise")} style={{ background: "#059669", color: "white", border: "none", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
              + Raise New Ticket
            </button>
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>📋 Status:</span>
            {[
              ["all",      "All",         "#374151", "#f3f4f6"],
              ["open",     "🔓 Open",     "#e04e00", "#fff4ee"],
              ["resolved", "✅ Resolved", "#1a7a46", "#edfaf3"],
            ].map(([key, label, col, bg]) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: "6px 14px", borderRadius: 16, cursor: "pointer",
                border: filter === key ? `2px solid ${col}` : "1px solid #d1d5db",
                background: filter === key ? bg : "white",
                color: filter === key ? col : "#555",
                fontWeight: filter === key ? 700 : 400,
                fontSize: 12, fontFamily: "inherit",
              }}>
                {label}
                <span style={{ marginLeft: 5, background: filter === key ? col : "#e5e7eb", color: filter === key ? "white" : "#555", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>

          {/* Empty State */}
          {displayed.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 14, color: "#aaa", border: "1.5px solid #e0d8d0" }}>
              <div style={{ fontSize: 48 }}>🔬</div>
              <p style={{ marginTop: 12, fontSize: 14 }}>No tickets found.</p>
              <button onClick={() => setActiveTab("raise")} style={{ marginTop: 12, background: "#059669", color: "white", border: "none", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                Raise First Ticket
              </button>
            </div>
          )}

          {/* Table */}
          {displayed.length > 0 && (
            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "72vh", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 900, background: "white" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", position: "sticky", top: 0, zIndex: 2 }}>
                    {["Ticket No", "Ticket Type", "Employee Name", "Employee Email", "Employee Phone", "Task", "Status", "Date", "Action"].map((h, i) => (
                      <th key={i} style={{ padding: "12px 14px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((ticket, idx) => {
                    const s = (ticket.status || "open").toLowerCase();
                    const showResolve = resolveForm[ticket.id]?.show || false;
                    return (
                      <>
                        <tr key={ticket.id} style={{
                          borderBottom: "1px solid #f0ede8",
                          background: idx % 2 === 0 ? "#f0fdf4" : "white",
                          borderLeft: `5px solid ${STATUS_COLOR[s] || "#ccc"}`,
                        }}>
                          {/* Ticket No */}
                          <td style={{ padding: "12px 14px", borderRight: "1px solid #e0d8d0", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>{ticket.ticketNumber || "—"}</div>
                          </td>

                          {/* Ticket Type */}
                          <td style={{ padding: "12px 14px", borderRight: "1px solid #e0d8d0", whiteSpace: "nowrap" }}>
                            <span style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #6ee7b7", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                              🔬 R&D
                            </span>
                          </td>

                          {/* Employee Name */}
                          <td style={{ padding: "12px 14px", borderRight: "1px solid #e0d8d0", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{ticket.empName || ticket.customer || "—"}</div>
                          </td>

                          {/* Employee Email */}
                          <td style={{ padding: "12px 14px", borderRight: "1px solid #e0d8d0", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{ticket.empEmail || ticket.email || "—"}</div>
                          </td>

                          {/* Employee Phone */}
                          <td style={{ padding: "12px 14px", borderRight: "1px solid #e0d8d0", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{ticket.empPhone || ticket.phone || "—"}</div>
                          </td>

                          {/* Task */}
                          <td style={{ padding: "12px 14px", borderRight: "1px solid #e0d8d0", maxWidth: 220 }}>
                            <div style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }} title={ticket.description}>
                              {ticket.description?.length > 50 ? ticket.description.slice(0, 50) + "…" : ticket.description || "—"}
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: "12px 14px", borderRight: "1px solid #e0d8d0", whiteSpace: "nowrap" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700, color: STATUS_COLOR[s] || "#374151", background: STATUS_BG[s] || "#f3f4f6", display: "inline-block" }}>
                              {s.toUpperCase()}
                            </span>
                            {ticket.resolvedAt && (
                              <div style={{ fontSize: 10, color: "#10b981", marginTop: 3 }}>
                                ✅ {new Date(ticket.resolvedAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td style={{ padding: "12px 14px", borderRight: "1px solid #e0d8d0", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>{ticket.date || "—"}</div>
                          </td>

                          {/* Action */}
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            {s === "open" && (
                              <button
                                onClick={() => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: !prev[ticket.id]?.show } }))}
                                style={{
                                  background: showResolve ? "#ecfdf5" : "#10b981",
                                  color: showResolve ? "#065f46" : "white",
                                  border: showResolve ? "1.5px solid #6ee7b7" : "none",
                                  padding: "6px 14px", borderRadius: 7,
                                  cursor: "pointer", fontSize: 12, fontWeight: 700,
                                  fontFamily: "inherit",
                                }}>
                                ✅ {showResolve ? "Cancel" : "Mark Done"}
                              </button>
                            )}
                            {s === "resolved" && (
                              <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>✅ Completed</span>
                            )}
                          </td>
                        </tr>

                        {/* Resolve Form Row */}
                        {showResolve && s === "open" && (
                          <tr key={`resolve-${ticket.id}`} style={{ background: "#f0fdf4" }}>
                            <td colSpan={9} style={{ padding: "16px 20px" }}>
                              <div style={{ maxWidth: 600, background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "2px solid #10b981", borderRadius: 12, padding: "18px 20px" }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46", marginBottom: 12 }}>✅ Mark Task as Done</div>
                                <div style={{ marginBottom: 14 }}>
                                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                                    What was completed? <span style={{ color: "#ef4444" }}>*</span>
                                  </label>
                                  <textarea
                                    rows={3}
                                    placeholder="Describe what was done / completed..."
                                    value={resolveForm[ticket.id]?.notes || ""}
                                    onChange={e => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], notes: e.target.value } }))}
                                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #6ee7b7", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", resize: "vertical", color: "#111", lineHeight: 1.5, boxSizing: "border-box" }}
                                  />
                                </div>
                                <div style={{ display: "flex", gap: 10 }}>
                                  <button
                                    onClick={() => handleResolve(ticket.id)}
                                    style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "inherit" }}>
                                    ✅ Confirm Done
                                  </button>
                                  <button
                                    onClick={() => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: false } }))}
                                    style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, color: "#64748b", fontFamily: "inherit" }}>
                                    Cancel
                                  </button>
                                </div>
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

          <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", textAlign: "right" }}>
            Showing <strong style={{ color: "#374151" }}>{displayed.length}</strong> of <strong style={{ color: "#374151" }}>{tickets.length}</strong> tickets
          </div>
        </div>
      )}
    </div>
  );
}