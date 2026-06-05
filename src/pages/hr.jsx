import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./hr.css";

const BASE_URL = "https://api.syrotech.com";

const OLD_EMPLOYEE_ISSUES = [
  "Desktop", "Laptop", "Email ID", "Mouse", "LAN Cable", "Keyboard", "Internet","Printer Connectivity","other"
];

const NEW_EMPLOYEE_ISSUES = [
  "Issue Laptop", "Issue Desktop", "Create Email ID", "CRM Login", "Ticketing Tool Login","Savvy HRMS Login","other"
];

const STATUS_COLOR = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed", reopened: "#dc2626" };
const STATUS_BG    = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff", reopened: "#fee2e2" };

export default function HR() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [activeTab, setActiveTab] = useState("raise");
  const [tickets, setTickets]     = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors]         = useState({});
  const [statusFilter, setStatusFilter]     = useState("all");
  const [empFilter, setEmpFilter]           = useState("all");
  const [filterYear, setFilterYear]   = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDate, setFilterDate]   = useState("");
  const [resolvePopup, setResolvePopup]     = useState(null);
  const [issuePopup, setIssuePopup]         = useState(null);
  const [resolveNote, setResolveNote]       = useState("");
  const [resolving, setResolving]           = useState(false);
  const [statusUpdatePopup, setStatusUpdatePopup] = useState(null);

  const [form, setForm] = useState({
    empType: "",
    empCode: "",
    empDept: "",
    empName: "",
    empEmail: "",
    empPhone: "",
    issues: [],
    description: "",
  });

  // ── fetch all HR tickets ──
  const fetchTickets = () => {
    fetch(`${BASE_URL}/tickets`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTickets(data.filter(t => t.source === "hr"));
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 10000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "empType") {
      setForm(prev => ({ ...prev, empType: value, issues: [], description: "" }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.empType)           e.empType     = "Please select employee type.";
   if (form.empType === "old" && !form.empCode.trim()) e.empCode = "Employee code is required.";
    if (!form.empDept.trim())    e.empDept     = "Department is required.";
    if (!form.empName.trim())    e.empName     = "Employee name is required.";
   if (form.empType !== "new" && !form.empEmail.trim())   e.empEmail = "Employee email is required.";
    if (!form.empPhone.trim())   e.empPhone    = "Employee phone is required.";
    if (!form.issues || form.issues.length === 0) e.issue = "Please select at least one issue.";
    if (!form.description.trim()) e.description = "Please describe the issue.";
    else if (form.description.trim().length > 500) e.description = "Max 500 characters.";
    return e;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);

    const last = tickets.length > 0
      ? Math.max(...tickets.map(t => t.ticketNumber || 0))
      : 0;

    const newTicket = {
      category:     "HR Ticket",
      subCategory:  form.empType === "old" ? "Old Employee" : "New Employee",
      model:        form.issues.join(", "),
      serialNo:     form.empCode,
      mac:          "",
      customer:     form.empCode,
      email:        currentUser?.email || "",
      phone:        "",
      city:         "",
      state:        "",
      country:      "India",
      pincode:      "",
      companyName:  "",
      empDept:      form.empDept,
      description:  `${form.issues.join(", ")} | ${form.description}`,
      assignTo:     currentUser?.name || "HR Admin",
      status:       "open",
      source:       "hr",
      raisedBy:     currentUser?.email || "hr@goip.in",
      raisedByName: currentUser?.name  || "HR Admin",
      date:         new Date().toISOString().slice(0, 10),
      createdAt:    new Date().toISOString(),
      acceptedAt:   new Date().toISOString(),
      firstDescription:  `${form.issues.join(", ")} | ${form.description}`,
      firstCreatedAt:    new Date().toISOString(),
      firstRaisedByName: currentUser?.name || "HR Admin",
      empType:    form.empType,
      empCode:    form.empCode,
      empDept:    form.empDept,
      hrIssue:    form.issues.join(", "),
      empName:    form.empName,
      empEmail:   form.empEmail,
      empPhone:   form.empPhone,
    };

    try {
      const res = await fetch(`${BASE_URL}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });
      if (!res.ok) throw new Error("Server error");
      setForm({ empType: "", empCode: "", empDept: "", empName: "", empEmail: "", empPhone: "", issues: [], description: "" });
      setErrors({});
      setSuccessMsg("✅ Ticket submitted successfully!");
      setActiveTab("mytickets");
      fetchTickets();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setErrors({ submit: "❌ Failed to submit ticket." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveNote.trim()) { alert("Please write what was resolved."); return; }
    setResolving(true);
    try {
      await fetch(`${BASE_URL}/tickets/${resolvePopup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          resolvedAt: new Date().toISOString(),
          resolutionNotes: resolveNote.trim(),
          resolvedBy: currentUser?.name || "HR Admin",
        }),
      });
      setResolvePopup(null);
      setResolveNote("");
      fetchTickets();
    } catch {
      alert("Failed to resolve ticket.");
    } finally {
      setResolving(false);
    }
  };

  const issueOptions = form.empType === "old" ? OLD_EMPLOYEE_ISSUES : form.empType === "new" ? NEW_EMPLOYEE_ISSUES : [];

  const displayTickets = tickets
    .filter(t => {
      if (statusFilter === "all") return true;
      return (t.status || "open").toLowerCase() === statusFilter;
    })
    .filter(t => {
      if (empFilter === "all") return true;
      if (empFilter === "old") return t.empType === "old" || t.subCategory === "Old Employee";
      if (empFilter === "new") return t.empType === "new" || t.subCategory === "New Employee";
      return true;
    })
    .filter(t => {
      const d = new Date(t.createdAt || t.date);
      if (filterDate)  return d.toDateString() === new Date(filterDate).toDateString();
      if (filterYear  && d.getFullYear() !== parseInt(filterYear))  return false;
      if (filterMonth && d.getMonth() + 1 !== parseInt(filterMonth)) return false;
      return true;
    });

  return (
    <div className="hr-page">

      {/* ── Navbar ── */}
      <div className="hr-navbar">
        <div className="hr-navbar__brand">
          <img src="/logo.png" alt="logo" className="hr-navbar__logo" />
          <div>
            <div className="hr-navbar__title">Syrotech Networks</div>
            <div className="hr-navbar__subtitle">🧑‍💼 HR Panel — {currentUser?.name}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="hr-navbar__logout">Logout</button>
      </div>

      {/* ── Issue Popup ── */}
      {issuePopup && (
        <div className="hr-overlay" onClick={() => setIssuePopup(null)}>
          <div className="hr-popup hr-popup--issue" onClick={e => e.stopPropagation()}>
            <div className="hr-popup__header">
              <div className="hr-popup__title--issue">📋 Issue Details</div>
              <button className="hr-popup__close--issue" onClick={() => setIssuePopup(null)}>✕ Close</button>
            </div>
            <div className="hr-popup__section hr-popup__section--blue">
              <div className="hr-popup__label">ISSUE</div>
              <div className="hr-popup__value">{issuePopup.hrIssue || issuePopup.model || "—"}</div>
            </div>
            <div className={`hr-popup__section hr-popup__section--gray${issuePopup.resolutionNotes ? "" : " hr-popup__section--last"}`}>
              <div className="hr-popup__label">DESCRIPTION</div>
              <div className="hr-popup__text">{issuePopup.description || "—"}</div>
            </div>
            {issuePopup.resolutionNotes && (
              <div className="hr-popup__section hr-popup__section--green">
                <div className="hr-popup__label--green">✅ RESOLVED — What was done:</div>
                <div className="hr-popup__text">{issuePopup.resolutionNotes}</div>
                {issuePopup.resolvedAt && (
                  <div className="hr-popup__timestamp">🕐 {new Date(issuePopup.resolvedAt).toLocaleString()}</div>
                )}
              </div>
            )}
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

      {/* ── Resolve Popup ── */}
      {resolvePopup && (
        <div className="hr-overlay" onClick={() => { setResolvePopup(null); setResolveNote(""); }}>
          <div className="hr-popup hr-popup--resolve" onClick={e => e.stopPropagation()}>
            <div className="hr-popup__header">
              <div className="hr-popup__title--resolve">✅ Resolve Ticket #{resolvePopup.ticketNumber}</div>
              <button className="hr-popup__close--resolve" onClick={() => { setResolvePopup(null); setResolveNote(""); }}>✕ Close</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="hr-resolve__field-label">
                What was resolved? <span className="hr-resolve__required">*</span>
              </div>
              <textarea
                rows={4}
                placeholder="e.g. Issued laptop to employee, configured email ID..."
                value={resolveNote}
                onChange={e => setResolveNote(e.target.value)}
                className="hr-resolve__textarea"
              />
            </div>
            <div className="hr-resolve__actions">
              <button onClick={handleResolve} disabled={resolving} className="hr-resolve__btn-confirm">
                {resolving ? "⏳ Resolving..." : "✅ Mark as Resolved"}
              </button>
              <button onClick={() => { setResolvePopup(null); setResolveNote(""); }} className="hr-resolve__btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="hr-tabs">
        {[
          ["raise",     "🎫 Raise Ticket"],
          ["mytickets", `📋 My Tickets (${tickets.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`hr-tab-btn${activeTab === key ? " hr-tab-btn--active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Success Message ── */}
      {successMsg && <div className="hr-success-msg">{successMsg}</div>}

      {/* ══ RAISE TICKET TAB ══ */}
      {activeTab === "raise" && (
        <div className="hr-raise-wrapper">
          <div className="hr-raise-card">

            <div className="hr-raise-card__header">
              <div className="hr-raise-card__icon">🎫</div>
              <div>
                <h2 className="hr-raise-card__title">Raise HR Ticket</h2>
                <p className="hr-raise-card__subtitle">
                  All fields marked <span>*</span> are required.
                </p>
              </div>
            </div>

            {errors.submit && (
              <div className="hr-raise-card__error-banner">{errors.submit}</div>
            )}

            <div className="hr-form">

              {/* Employee Type */}
              <div>
                <label className="hr-field__label">
                  Employee Type <span>*</span>
                </label>
                <div className="hr-emptype-btns">
                  {[["old", "👤 Old Employee"], ["new", "🆕 New Employee"]].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleChange({ target: { name: "empType", value: val } })}
                      className={`hr-emptype-btn${form.empType === val ? " hr-emptype-btn--active" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.empType && <span className="hr-field__error">{errors.empType}</span>}
              </div>

              {/* Department */}
              <div>
                <label className="hr-field__label">
                  Employee Department <span>*</span>
                </label>
                <select
  name="empDept"
  value={form.empDept}
  onChange={handleChange}
  className={`hr-input${errors.empDept ? " hr-input--error" : ""}`}
>
  <option value="">-- Select Department --</option>
  <option value="R&D Department">R&D Department</option>
  <option value="IT">IT</option>
  <option value="Marketing">Marketing</option>
  <option value="Accounts">Accounts</option>
  <option value="Sales">Sales</option>
  <option value="Logistics">Logistics</option>
  <option value="RMA">RMA</option>
  <option value="Production">Production-Passive</option>
  <option value="Production">Production-SFP</option>
  <option value="Production">Production-Factory</option>
  
</select>
                {errors.empDept && <span className="hr-field__error">{errors.empDept}</span>}
              </div>

              {/* Employee Name */}
              <div>
                <label className="hr-field__label">
                  Employee Name <span>*</span>
                </label>
                <input
                  name="empName"
                  placeholder="e.g. Rahul Sharma"
                  value={form.empName}
                  onChange={handleChange}
                  className={`hr-input${errors.empName ? " hr-input--error" : ""}`}
                />
                {errors.empName && <span className="hr-field__error">{errors.empName}</span>}
              </div>

              {/* Employee Email */}
              <div>
                <label className="hr-field__label">
                  Employee Email {form.empType === "new" ? <span style={{color:"#9ca3af", fontSize:11}}>(optional)</span> : <span>*</span>}
                </label>
                <input
                  name="empEmail"
                  placeholder="e.g. rahul@goip.in"
                  value={form.empEmail}
                  onChange={handleChange}
                  className={`hr-input${errors.empEmail ? " hr-input--error" : ""}`}
                />
                {errors.empEmail && <span className="hr-field__error">{errors.empEmail}</span>}
              </div>

              {/* Employee Code */}
              <div>
                <label className="hr-field__label">
                Employee Code {form.empType === "old" ? <span>*</span> : <span style={{color:"#9ca3af", fontSize:11}}>(optional)</span>}
                </label>
                <input
                  name="empCode"
                  placeholder="e.g. EMP-1001"
                  value={form.empCode}
                  onChange={handleChange}
                  className={`hr-input${errors.empCode ? " hr-input--error" : ""}`}
                />
                {errors.empCode && <span className="hr-field__error">{errors.empCode}</span>}
              </div>

              {/* Employee Phone */}
              <div>
                <label className="hr-field__label">
                  Employee Phone <span>*</span>
                </label>
                <input
                  name="empPhone"
                  placeholder="10-digit number"
                  value={form.empPhone}
                  onChange={handleChange}
                  maxLength={10}
                  className={`hr-input${errors.empPhone ? " hr-input--error" : ""}`}
                />
                {errors.empPhone && <span className="hr-field__error">{errors.empPhone}</span>}
              </div>

              {/* Issue Select — Multiple */}
              <div>
                <label className="hr-field__label">
                  Select Issue <span>*</span>
                  <span className="hr-field__label--note"> (select multiple)</span>
                </label>
                {!form.empType ? (
                  <div className="hr-issue-placeholder">Select employee type first</div>
                ) : (
                  <div className="hr-issue-chips">
                    {issueOptions.map(opt => {
                      const selected = form.issues.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              issues: selected
                                ? prev.issues.filter(i => i !== opt)
                                : [...prev.issues, opt]
                            }));
                            setErrors(prev => ({ ...prev, issue: "" }));
                          }}
                          className={`hr-issue-chip${selected ? " hr-issue-chip--selected" : ""}`}
                        >
                          {selected ? "✓ " : ""}{opt}
                        </button>
                      );
                    })}
                  </div>
                )}
                {form.issues.length > 0 && (
                  <div className="hr-issue-selected-summary">✅ Selected: {form.issues.join(", ")}</div>
                )}
                {errors.issue && <span className="hr-field__error">{errors.issue}</span>}
              </div>

              {/* Issue Description */}
              <div>
                <label className="hr-field__label">
                  Issue Description <span>*</span>
                  <span className="hr-field__label--note"> (max 500 chars)</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  value={form.description}
                  onChange={handleChange}
                  disabled={form.issues.length === 0}
                  className={`hr-textarea${errors.description ? " hr-textarea--error" : ""}${form.issues.length === 0 ? " hr-textarea--disabled" : ""}`}
                />
                <div className="hr-char-row">
                  {errors.description
                    ? <span className="hr-char-row__error">{errors.description}</span>
                    : <span className="hr-char-row__count">{form.description.length}/500</span>}
                  <span className={form.description.length > 450 ? "hr-char-row__left--warn" : "hr-char-row__left--ok"}>
                    {500 - form.description.length} left
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button onClick={handleSubmit} disabled={submitting} className="hr-submit-btn">
                {submitting ? "⏳ Submitting..." : "🎫 Submit Ticket"}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ══ MY TICKETS TAB ══ */}
      {activeTab === "mytickets" && (
        <div className="hr-tickets-wrapper">

          <div className="hr-tickets-topbar">
            <div>
              <h2 className="hr-tickets-topbar__heading">📋 My HR Tickets</h2>
              <p className="hr-tickets-topbar__sub">All tickets raised by HR</p>
            </div>
            <button onClick={() => setActiveTab("raise")} className="hr-new-ticket-btn">
              + New Ticket
            </button>
          </div>

          {/* Date Filter */}
          <div className="hr-date-filter">
            <span className="hr-date-filter__label">🗓️ Filter:</span>

            <div className="hr-date-filter__group">
              <label className="hr-date-filter__group-label">📅 Year</label>
              <select
                value={filterYear}
                onChange={e => { setFilterYear(e.target.value); setFilterDate(""); }}
                className={`hr-date-filter__select${filterYear ? " hr-date-filter__select--active" : ""}`}
              >
                <option value="">All Years</option>
                {[2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="hr-date-filter__group">
              <label className="hr-date-filter__group-label">🗓️ Month</label>
              <select
                value={filterMonth}
                onChange={e => { setFilterMonth(e.target.value); setFilterDate(""); }}
                className={`hr-date-filter__select${filterMonth ? " hr-date-filter__select--active" : ""}`}
              >
                <option value="">All Months</option>
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            </div>

            <div className="hr-date-filter__group">
              <label className="hr-date-filter__group-label">📆 Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={e => { setFilterDate(e.target.value); setFilterYear(""); setFilterMonth(""); }}
                className={`hr-date-filter__input${filterDate ? " hr-date-filter__input--active" : ""}`}
              />
            </div>

            {(filterYear || filterMonth || filterDate) && (
              <button onClick={() => { setFilterYear(""); setFilterMonth(""); setFilterDate(""); }} className="hr-date-filter__clear">
                ✕ Clear
              </button>
            )}

            <div className="hr-date-filter__count">
              Showing <strong>{displayTickets.length}</strong> tickets
            </div>
          </div>

          {/* Status + Emp Filter */}
          <div className="hr-filter-row">
            {[
              ["all",      "All",          tickets.length,                                                   "#374151"],
              ["open",     "🔓 Open",      tickets.filter(t => t.status === "open").length,                  "#e04e00"],
              ["resolved", "✅ Resolved",  tickets.filter(t => t.status === "resolved").length,              "#1a7a46"],
            ].map(([key, label, count, col]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`hr-filter-btn${statusFilter === key ? " hr-filter-btn--active" : ""}`}
                style={statusFilter === key ? { border: `2px solid ${col}`, background: col, color: "white", fontWeight: 700 } : {}}
              >
                {label}
                <span className="hr-filter-btn__badge">{count}</span>
              </button>
            ))}

            <div className="hr-filter-divider" />

            {[
              ["all", "👥 All Types",      tickets.length,                                                                              "#374151"],
              ["old", "👤 Old Employee",   tickets.filter(t => t.empType === "old" || t.subCategory === "Old Employee").length,         "#854d0e"],
              ["new", "🆕 New Employee",   tickets.filter(t => t.empType === "new" || t.subCategory === "New Employee").length,         "#166534"],
            ].map(([key, label, count, col]) => (
              <button
                key={`emp-${key}`}
                onClick={() => setEmpFilter(key)}
                className={`hr-filter-btn${empFilter === key ? " hr-filter-btn--active" : ""}`}
                style={empFilter === key ? { border: `2px solid ${col}`, background: col, color: "white", fontWeight: 700 } : {}}
              >
                {label}
                <span className="hr-filter-btn__badge">{count}</span>
              </button>
            ))}
          </div>

          {tickets.length === 0 ? (
            <div className="hr-empty">
              <div className="hr-empty__icon">🎫</div>
              <p className="hr-empty__text">No HR tickets raised yet.</p>
              <button onClick={() => setActiveTab("raise")} className="hr-empty__btn">
                Raise First Ticket
              </button>
            </div>
          ) : (
            <div className="hr-table-wrapper">
              <table className="hr-table">
                <thead>
                  <tr>
                    {["Ticket No","Ticket Type","Raised By HR","Emp Code","Emp Type / KYC","Department","Issue","Status","Date","Remark"].map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayTickets.map((ticket) => {
                    const s = (ticket.status || "open").toLowerCase();
                    const empType = ticket.empType || ticket.subCategory || "—";
                    const isNew = empType === "new" || empType === "New Employee";
                    return (
                      <tr key={ticket.id} style={{ borderLeft: `4px solid ${STATUS_COLOR[s] || "#2563eb"}` }}>

                        <td><div className="hr-cell__ticket-no">{ticket.ticketNumber || "—"}</div></td>

                        <td><span className="hr-cell__ticket-type">🧑‍💼 HR Ticket</span></td>

                        <td>
                          <div className="hr-cell__raised-name">{ticket.raisedByName || "HR Admin"}</div>
                          <div className="hr-cell__raised-email">{ticket.raisedBy || "hr@goip.in"}</div>
                        </td>

                        <td><div className="hr-cell__emp-code">{ticket.empCode || ticket.serialNo || "—"}</div></td>

                        <td>
                          <span className={`hr-cell__emp-badge ${isNew ? "hr-cell__emp-badge--new" : "hr-cell__emp-badge--old"}`}>
                            {isNew ? "🆕 New" : "👤 Old"}
                          </span>
                          <div className="hr-cell__emp-name">{ticket.empName || "—"}</div>
                          <div className="hr-cell__emp-email">{ticket.empEmail || "—"}</div>
                          <div className="hr-cell__emp-phone">{ticket.empPhone || "—"}</div>
                        </td>

                        <td><div className="hr-cell__dept">{ticket.empDept || ticket.companyName || "—"}</div></td>

                        <td className="hr-cell__issue-wrap" onClick={() => setIssuePopup(ticket)}>
                          <div className="hr-cell__issue-text">{ticket.hrIssue || ticket.model || "—"}</div>
                          {ticket.resolutionNotes && (
                            <div className="hr-cell__resolution-preview">
                              ✅ {ticket.resolutionNotes.length > 30 ? ticket.resolutionNotes.slice(0, 30) + "…" : ticket.resolutionNotes}
                            </div>
                          )}
                        </td>

                        <td>
                          <span
                            className="hr-cell__status-badge"
                            style={{ color: STATUS_COLOR[s], background: STATUS_BG[s] }}
                          >
                            {s.toUpperCase()}
                          </span>
                        </td>

                        <td><div className="hr-cell__date">{ticket.date || "—"}</div></td>

                        <td>
  <div className="hr-cell__resolved-label">
    {ticket.status === "resolved" ? (
      <>
        ✅ Resolved
        {ticket.resolvedBy && (
          <div className="hr-cell__resolved-by">by {ticket.resolvedBy}</div>
        )}
      </>
    ) : "—"}
    {Array.isArray(ticket.statusUpdates) && ticket.statusUpdates.length > 0 && (
      <div onClick={() => setStatusUpdatePopup(ticket.statusUpdates)}
        style={{ fontSize:10, color:"#1d4ed8", cursor:"pointer", fontWeight:700, background:"#eff6ff", padding:"2px 6px", borderRadius:4, display:"inline-block", marginTop:4 }}>
        📝 {ticket.statusUpdates.length} Update{ticket.statusUpdates.length > 1 ? "s" : ""} — View
      </div>
    )}
  </div>
</td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="hr-tickets-footer">
            Total: <strong>{tickets.length}</strong> tickets
          </div>
        </div>
      )}

    </div>
  );
}