import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const BASE_URL = "https://api.syrotech.com";

const STATUS_COLOR = { open: "#e04e00", resolved: "#1a7a46", reopened: "#dc2626" };
const STATUS_BG    = { open: "#fff4ee", resolved: "#edfaf3", reopened: "#fee2e2" };

export default function RnD() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [activeTab, setActiveTab] = useState("raise");
  const [tickets, setTickets]     = useState([]);
  const [filter, setFilter]       = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [resolveForm, setResolveForm] = useState({});
  const [issuePopup, setIssuePopup] = useState(null);
  const [statusUpdateForm, setStatusUpdateForm] = useState({});
  const [statusUpdatePopup, setStatusUpdatePopup] = useState(null);
 const [form, setForm] = useState({
    empName:  "",
    empEmail: "",
    empPhone: "",
    taskRole: "",
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
    if (!form.taskRole)        e.taskRole = "Task role is required.";
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
       taskRole:     form.taskRole,
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
        setForm({ empName: "", empEmail: "", empPhone: "", taskRole: "", task: "" });
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
   const currentTicket = tickets.find(t => t.id === ticketId) || {};
const existingHistory = Array.isArray(currentTicket?.issueHistory) ? currentTicket.issueHistory : [];
    const updatedHistory = existingHistory.map((entry, i) => {
      if (i === existingHistory.length - 1) {
        return { ...entry, resolvedNotes: notes.trim(), resolvedAt: now, resolvedBy: currentUser?.name };
      }
      return entry;
    });
    const isFirstResolution = existingHistory.length === 0;
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:          "resolved",
        resolvedAt:      now,
        resolutionNotes: notes.trim(),
        resolvedBy:      currentUser?.name,
        issueHistory:    updatedHistory,
        ...(isFirstResolution ? {
          firstResolvedNotes: notes.trim(),
          firstResolvedAt:    now,
          firstResolvedBy:    currentUser?.name,
        } : {}),
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
    if (filter === "reopened") return t.status === "reopened";
    return true;
  });

  const counts = {
    all:      tickets.length,
    open:     tickets.filter(t => t.status === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    reopened: tickets.filter(t => t.status === "reopened").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "DM Sans, sans-serif" }}>


{/* History Popup */}
      {issuePopup && (
        <div onClick={() => setIssuePopup(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"24px 28px", maxWidth:520, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #d1fae5", maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:800, color: issuePopup.resolutionNotes ? "#1a7a46" : "#059669" }}>
                {issuePopup.resolutionNotes ? "✅ Ticket Resolved" : "📋 Task Description"}
              </div>
              <button onClick={() => setIssuePopup(null)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
            </div>

            {/* History Stages */}
            {(() => {
              const allHistory = [];
              allHistory.push({
                description: issuePopup.firstDescription || issuePopup.description,
                raisedAt: issuePopup.firstCreatedAt || issuePopup.createdAt,
                raisedByName: issuePopup.firstRaisedByName || issuePopup.raisedByName,
                resolvedNotes: issuePopup.firstResolvedNotes || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolutionNotes : null) || null,
                resolvedAt: issuePopup.firstResolvedAt || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolvedAt : null) || null,
                resolvedBy: issuePopup.firstResolvedBy || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolvedBy : null) || null,
              });
              if (Array.isArray(issuePopup.issueHistory)) {
                issuePopup.issueHistory.forEach(h => {
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
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", marginBottom:6 }}>
                    📋 History — {allHistory.length} Stage{allHistory.length > 1 ? "s" : ""}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
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
                </div>
              );
            })()}

          
          </div>
        </div>
      )}

{/* Status Updates View Popup */}
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
      {/* Status Update Form Popup */}
      {statusUpdateForm?.show && (
        <div onClick={() => setStatusUpdateForm({})} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"28px 32px", maxWidth:520, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #bfdbfe" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:800, color:"#1d4ed8" }}>📝 Status Update</div>
              <button onClick={() => setStatusUpdateForm({})} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>Update Note <span style={{ color:"#ef4444" }}>*</span></div>
              <textarea rows={5} placeholder="Write what is happening with this ticket..."
                value={statusUpdateForm.note || ""}
                onChange={e => setStatusUpdateForm(prev => ({ ...prev, note: e.target.value }))}
                style={{ width:"100%", padding:"11px 14px", border:"2px solid #bfdbfe", borderRadius:10, fontSize:13, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box", color:"#000", lineHeight:1.6 }} />
            </div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => {
                const note = statusUpdateForm.note?.trim();
                if (!note) { alert("Please write an update note."); return; }
                const ticketId = statusUpdateForm.id;
                const ticket = tickets.find(t => t.id === ticketId);
                const newEntry = { note, updatedBy: currentUser?.name, updatedAt: new Date().toISOString() };
                const existing = Array.isArray(ticket?.statusUpdates) ? ticket.statusUpdates : [];
                fetch(`${BASE_URL}/tickets/${ticketId}`, {
                  method:"PATCH", headers:{"Content-Type":"application/json"},
                  body: JSON.stringify({ statusUpdates: [...existing, newEntry], latestStatusUpdate: note })
                }).then(() => { setStatusUpdateForm({}); fetchTickets(); });
              }} style={{ flex:1, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", padding:"12px 24px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:800, fontFamily:"inherit" }}>
                ✅ Submit Update
              </button>
              <button onClick={() => setStatusUpdateForm({})}
                style={{ background:"#e2e8f0", border:"none", borderRadius:10, padding:"12px 20px", cursor:"pointer", fontSize:13, color:"#64748b", fontFamily:"inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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





           {/* Task Role */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Task Role <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                name="taskRole"
                value={form.taskRole}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: `2px solid ${errors.taskRole ? "#ef4444" : "#d1d5db"}`,
                  borderRadius: 10,
                  fontSize: 13.5,
                  boxSizing: "border-box",
                  outline: "none",
                  background: errors.taskRole ? "#fff5f5" : "#f9fafb",
                  fontFamily: "DM Sans, sans-serif",
                  color: "#111",
                }}>
                <option value="">-- Select Task Role --</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Full Stack">Full Stack</option>
                <option value="Hardware">Hardware</option>
                <option value="Hardware">Testing</option>
                <option value="Hardware">Data Anaylst</option>
              </select>
              {errors.taskRole && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{errors.taskRole}</span>}
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
              ["all",      "All",           "#374151", "#f3f4f6"],
              ["open",     "🔓 Open",       "#e04e00", "#fff4ee"],
              ["resolved", "✅ Resolved",   "#1a7a46", "#edfaf3"],
              ["reopened", "🔄 Reopened",   "#dc2626", "#fee2e2"],
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
            <div style={{ overflowX: "scroll", overflowY: "auto", maxHeight: "72vh", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 900, background: "white" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", position: "sticky", top: 0, zIndex: 2 }}>
                 {["Ticket No", "Ticket Type", "Employee Name", "Employee Email", "Employee Phone", "Task Role", "Task", "History", "Status Updates", "Status", "Date", "Action"].map((h, i) => (
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

                       {/* Task Role */}
                          <td style={{ padding: "12px 14px", borderRight: "1px solid #e0d8d0", whiteSpace: "nowrap" }}>
                            <span style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #6ee7b7", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                              {ticket.taskRole || "—"}
                            </span>
                          </td>

                          {/* Task */}
                          <td style={{ padding: "12px 14px", borderRight: "1px solid #e0d8d0", maxWidth: 220 }}>
                            <div style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }} title={ticket.firstDescription || ticket.description}>
                          {(ticket.firstDescription || ticket.description)?.length > 50 ? (ticket.firstDescription || ticket.description).slice(0, 50) + "…" : (ticket.firstDescription || ticket.description) || "—"}
                            </div>
                          </td>

{/* History */}
                          <td style={{ padding:"12px 14px", borderRight:"1px solid #e0d8d0" }}>
                            <div onClick={() => setIssuePopup({
                              description: ticket.description,
                              resolutionNotes: ticket.resolutionNotes,
                              resolvedAt: ticket.resolvedAt,
                              resolvedBy: ticket.resolvedBy,
                              issueHistory: ticket.issueHistory,
                              firstDescription: ticket.firstDescription || ticket.description,
                              firstCreatedAt: ticket.firstCreatedAt || ticket.createdAt,
                              firstRaisedByName: ticket.firstRaisedByName || ticket.raisedByName,
                              firstResolvedNotes: ticket.firstResolvedNotes || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolutionNotes : null) || null,
                              firstResolvedAt: ticket.firstResolvedAt || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedAt : null) || null,
                              firstResolvedBy: ticket.firstResolvedBy || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedBy : null) || null,
                            })}
                            style={{ fontSize:10, color:"#059669", cursor:"pointer", fontWeight:700, background:"#ecfdf5", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
                              📋 {(Array.isArray(ticket.issueHistory) ? ticket.issueHistory.length : 0) + 1} History
                            </div>
                            {ticket.reopenCount > 0 && (
                              <div style={{ fontSize:9, color:"#dc2626", fontWeight:700, marginTop:3, background:"#fee2e2", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
                                🔄 Reopened {ticket.reopenCount}x
                              </div>
                            )}
                          </td>

                          {/* Status Updates */}
                          <td style={{ padding:"12px 14px", borderRight:"1px solid #e0d8d0" }}>
                          {Array.isArray(ticket.statusUpdates) && ticket.statusUpdates.length > 0 && (
                              <div onClick={() => setStatusUpdatePopup(ticket.statusUpdates)}
                              style={{ fontSize:10, color:"#1d4ed8", cursor:"pointer", fontWeight:700, background:"#eff6ff", padding:"2px 6px", borderRadius:4, display:"inline-block", marginBottom:6 }}>
                                📝 {ticket.statusUpdates.length} Update{ticket.statusUpdates.length > 1 ? "s" : ""} — View
                              </div>
                            )}
                            {s === "open" || s === "reopened" ? (
                              <button onClick={() => setStatusUpdateForm({ show:true, id:ticket.id, note:"" })}
                                style={{ background:"#1d4ed8", color:"white", border:"none", padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, display:"block", fontFamily:"inherit" }}>
                                📝 Update
                              </button>
                            ) : null}
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
                            {(s === "open" || s === "reopened") && (
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
                                {showResolve ? "Cancel" : "✅ Mark Done"}
                              </button>
                            )}
                            {s === "resolved" && (
                              <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>✅ Completed</span>
                            )}
                          </td>
                        </tr>

                        {/* Resolve Form Row */}
                       {showResolve && (s === "open" || s === "reopened") && (
                          <tr key={`resolve-${ticket.id}`} style={{ background: "#f0fdf4" }}>
                           <td colSpan={11} style={{ padding: "16px 20px" }}>
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