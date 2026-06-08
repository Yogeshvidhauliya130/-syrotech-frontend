import { useState, useEffect } from "react";

const OLD_EMPLOYEE_ISSUES = [
  "Desktop", "Laptop", "Email ID", "Mouse", "LAN Cable",
  "Keyboard", "Internet", "Printer Connectivity", "other"
];

const NEW_EMPLOYEE_ISSUES = [
  "Issue Laptop", "Issue Desktop", "Create Email ID",
  "CRM Login", "Ticketing Tool Login", "Savvy HRMS Login", "other"
];
import { useNavigate } from "react-router-dom";

import "./hrAdmin.css";

const BASE_URL = "https://api.syrotech.com";

const STATUS_COLOR = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed", reopened: "#dc2626" };
const STATUS_BG    = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff", reopened: "#fee2e2" };

export default function HrAdmin() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [tickets, setTickets]           = useState([]);
const [statusFilter, setStatusFilter] = useState("all");
const [activeTab, setActiveTab]       = useState("alltickets");

const [raiseForm, setRaiseForm] = useState({
  empType: "", empCode: "", empDept: "",
  empName: "", empEmail: "", empPhone: "",
  issues: [], description: "",
});
const [raiseErrors, setRaiseErrors]       = useState({});
const [raiseSubmitting, setRaiseSubmitting] = useState(false);
const [raiseSuccess, setRaiseSuccess]     = useState("");
  const [filterYear, setFilterYear]     = useState("");
  const [filterMonth, setFilterMonth]   = useState("");
  const [filterDate, setFilterDate]     = useState("");
  const [searchQuery, setSearchQuery]   = useState("");
  const [resolvePopup, setResolvePopup] = useState(null);
  const [resolveNote, setResolveNote]   = useState("");
  const [resolving, setResolving]       = useState(false);
  const [statusUpdateForm, setStatusUpdateForm] = useState({});
const [statusUpdatePopup, setStatusUpdatePopup] = useState(null);
  const [issuePopup, setIssuePopup]     = useState(null);
  const [successMsg, setSuccessMsg]     = useState("");

  const fetchTickets = () => {
    fetch(`${BASE_URL}/tickets?page=1&limit=2000`)
  .then(r => r.json())
  .then(data => {
    setTickets((data.tickets || []).filter(t => t.source === "hr" || t.source === "hradmin"));
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
      setSuccessMsg("✅ Ticket resolved successfully!");
      fetchTickets();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      alert("Failed to resolve ticket.");
    } finally {
      setResolving(false);
    }
  };



  const handleRaiseChange = (e) => {
    const { name, value } = e.target;
    if (name === "empType") {
      setRaiseForm(prev => ({ ...prev, empType: value, issues: [], description: "" }));
    } else {
      setRaiseForm(prev => ({ ...prev, [name]: value }));
    }
    setRaiseErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateRaise = () => {
    const e = {};
    if (!raiseForm.description.trim()) e.description = "Please describe the issue.";
    else if (raiseForm.description.trim().length > 500) e.description = "Max 500 characters.";
    return e;
  };

  const handleRaiseSubmit = async () => {
    const errs = validateRaise();
    if (Object.keys(errs).length > 0) { setRaiseErrors(errs); return; }
    setRaiseSubmitting(true);
    const newTicket = {
      category:          "HR Ticket",
      subCategory:       raiseForm.empType === "old" ? "Old Employee" : "New Employee",
      model:             raiseForm.issues.join(", "),
      serialNo:          raiseForm.empCode,
      mac:               "",
      customer:          raiseForm.empCode,
      email:             currentUser?.email || "",
      phone:             "",
      city:              "",
      state:             "",
      country:           "India",
      pincode:           "",
      companyName:       "",
      empDept:           raiseForm.empDept,
      description:       `${raiseForm.issues.join(", ")} | ${raiseForm.description}`,
      assignTo:          currentUser?.name || "HR Admin",
      status:            "open",
      source: "hradmin",
      raisedBy:          currentUser?.email || "hradmin@goip.in",
      raisedByName:      currentUser?.name  || "HR Admin",
      date:              new Date().toISOString().slice(0, 10),
      createdAt:         new Date().toISOString(),
      acceptedAt:        new Date().toISOString(),
      firstDescription:  `${raiseForm.issues.join(", ")} | ${raiseForm.description}`,
      firstCreatedAt:    new Date().toISOString(),
      firstRaisedByName: currentUser?.name || "HR Admin",
      empType:           raiseForm.empType,
      empCode:           raiseForm.empCode,
      empDept:           raiseForm.empDept,
      hrIssue:           raiseForm.issues.join(", "),
      empName:           raiseForm.empName,
      empEmail:          raiseForm.empEmail,
      empPhone:          raiseForm.empPhone,
    };
    try {
      const res = await fetch(`${BASE_URL}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });
      if (!res.ok) throw new Error("Server error");
      setRaiseForm({ empType: "", empCode: "", empDept: "", empName: "", empEmail: "", empPhone: "", issues: [], description: "" });
      setRaiseErrors({});
      setRaiseSuccess("✅ Ticket submitted successfully!");
      setActiveTab("alltickets");
      fetchTickets();
      setTimeout(() => setRaiseSuccess(""), 4000);
    } catch {
      setRaiseErrors({ submit: "❌ Failed to submit ticket." });
    } finally {
      setRaiseSubmitting(false);
    }
  };

  const raiseIssueOptions = raiseForm.empType === "old"
    ? OLD_EMPLOYEE_ISSUES
    : raiseForm.empType === "new"
    ? NEW_EMPLOYEE_ISSUES
    : [];

  const displayTickets = tickets
    .filter(t => {
      if (statusFilter === "all") return true;
      return (t.status || "open").toLowerCase() === statusFilter;
    })
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (t.empName  || "").toLowerCase().includes(q) ||
        (t.empCode  || "").toLowerCase().includes(q) ||
        (t.empDept  || "").toLowerCase().includes(q) ||
        (t.hrIssue  || "").toLowerCase().includes(q) ||
        (t.empEmail || "").toLowerCase().includes(q) ||
        (t.empPhone || "").toLowerCase().includes(q)
      );
    })
    .filter(t => {
      const d = new Date(t.createdAt || t.date);
      if (filterDate)  return d.toDateString() === new Date(filterDate).toDateString();
      if (filterYear  && d.getFullYear() !== parseInt(filterYear))  return false;
      if (filterMonth && d.getMonth() + 1 !== parseInt(filterMonth)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const counts = {
    all:      tickets.length,
    open:     tickets.filter(t => t.status === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "DM Sans, sans-serif" }}>

      {/* Navbar */}
      <div style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "white", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="logo" style={{ width: 50, height: 50, borderRadius: 8, objectFit: "contain", background: "rgba(255,255,255,0.15)", padding: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Syrotech Networks</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>🔐 HR Admin Panel — {currentUser?.name}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", color: "white", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Logout</button>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div style={{ margin: "16px 28px 0", background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, color: "#065f46" }}>
          {successMsg}
        </div>
      )}

      {/* Issue Popup */}
      {issuePopup && (
        <div onClick={() => setIssuePopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #dbeafe" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8" }}>📋 Issue Details</div>
              <button onClick={() => setIssuePopup(null)} style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#dc2626", fontWeight: 700 }}>✕ Close</button>
            </div>
            <div style={{ background: "#eff6ff", borderRadius: 10, padding: "14px 16px", border: "1px solid #bfdbfe", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>ISSUE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>{issuePopup.hrIssue || issuePopup.model || "—"}</div>
            </div>
            <div style={{ background: "#f9fafb", borderRadius: 10, padding: "14px 16px", border: "1px solid #e5e7eb", marginBottom: issuePopup.resolutionNotes ? 12 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>DESCRIPTION</div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{issuePopup.description || "—"}</div>
            </div>
            {issuePopup.resolutionNotes && (
              <div style={{ background: "#ecfdf5", borderRadius: 10, padding: "14px 16px", border: "1px solid #6ee7b7" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", marginBottom: 6 }}>✅ RESOLVED — What was done:</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{issuePopup.resolutionNotes}</div>
                {issuePopup.resolvedAt && (
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>🕐 {new Date(issuePopup.resolvedAt).toLocaleString()}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}



{/* Status Update Form Popup */}
{statusUpdateForm?.show && (
  <div onClick={() => setStatusUpdateForm({})} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"28px 32px", maxWidth:560, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #bfdbfe" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:"#1d4ed8" }}>📝 Status Update</div>
        <button onClick={() => setStatusUpdateForm({})} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
      </div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>Update Note <span style={{ color:"#ef4444" }}>*</span></div>
        <textarea rows={5} placeholder="Write update note..."
          value={statusUpdateForm.note || ""}
          onChange={e => setStatusUpdateForm(prev => ({ ...prev, note: e.target.value }))}
          style={{ width:"100%", padding:"11px 14px", border:"2px solid #bfdbfe", borderRadius:10, fontSize:13, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box", color:"#000000", lineHeight:1.6 }} />
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
            body: JSON.stringify({ statusUpdates: [...existing, newEntry], latestStatusUpdate: note, status: "open" })
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


      {/* Resolve Popup */}
      {resolvePopup && (
        <div onClick={() => { setResolvePopup(null); setResolveNote(""); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #6ee7b7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#065f46" }}>✅ Resolve Ticket #{resolvePopup.ticketNumber}</div>
              <button onClick={() => { setResolvePopup(null); setResolveNote(""); }} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>✕ Close</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: 8 }}>
                What was resolved? <span style={{ color: "#ef4444" }}>*</span>
              </div>
              <textarea
                rows={4}
                placeholder="e.g. Issued laptop to employee, configured email ID..."
                value={resolveNote}
                onChange={e => setResolveNote(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "2px solid #6ee7b7", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", resize: "vertical", color: "#111", lineHeight: 1.5, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleResolve} disabled={resolving} style={{ flex: 1, background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>
                {resolving ? "⏳ Resolving..." : "✅ Mark as Resolved"}
              </button>
              <button onClick={() => { setResolvePopup(null); setResolveNote(""); }} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "11px 16px", cursor: "pointer", fontSize: 12, color: "#64748b", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

     {/* Tabs */}
      <div style={{ background: "white", borderBottom: "2px solid #e5e7eb", padding: "0 28px", display: "flex", gap: 0 }}>
        {[
          ["raise",      "🎫 Raise Ticket"],
          ["alltickets", `📋 All HR Tickets (${tickets.length})`],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              padding: "14px 22px", fontSize: 13, background: "none",
              border: "none", borderBottom: activeTab === key ? "3px solid #1d4ed8" : "3px solid transparent",
              cursor: "pointer", whiteSpace: "nowrap", marginBottom: -2,
              fontFamily: "inherit",
              color: activeTab === key ? "#2563eb" : "#6b7280",
              fontWeight: activeTab === key ? 800 : 500,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Success */}
      {raiseSuccess && (
        <div style={{ margin: "16px 28px 0", background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, color: "#065f46" }}>
          {raiseSuccess}
        </div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: activeTab === "raise" ? 680 : 1200, margin: "28px auto", padding: "0 16px" }}>

      {/* ══ RAISE TICKET TAB ══ */}
      {activeTab === "raise" && (
        <div style={{ background: "white", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #dbeafe" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #eff6ff" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎫</div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Raise HR Ticket</h2>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>All fields marked <span style={{ color: "#2563eb" }}>*</span> are required.</p>
            </div>
          </div>

          {raiseErrors.submit && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#b91c1c", marginBottom: 16 }}>{raiseErrors.submit}</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Employee Type */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee Type <span style={{ color: "#9ca3af", fontSize: 11, textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
              <div style={{ display: "flex", gap: 12 }}>
                {[["old","👤 Old Employee"],["new","🆕 New Employee"]].map(([val, label]) => (
                  <button key={val} type="button"
                    onClick={() => handleRaiseChange({ target: { name: "empType", value: val } })}
                    style={{ flex: 1, padding: 12, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 14,
                      border: raiseForm.empType === val ? "2px solid #2563eb" : "1.5px solid #d1d5db",
                      background: raiseForm.empType === val ? "#eff6ff" : "#f9fafb",
                      color: raiseForm.empType === val ? "#1d4ed8" : "#374151",
                      fontWeight: raiseForm.empType === val ? 700 : 500,
                    }}>{label}
                  </button>
                ))}
              </div>
              {raiseErrors.empType && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{raiseErrors.empType}</span>}
            </div>

            {/* Department */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Department <span style={{ color: "#9ca3af", fontSize: 11, textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
              <select name="empDept" value={raiseForm.empDept} onChange={handleRaiseChange}
                style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${raiseErrors.empDept ? "#ef4444" : "#d1d5db"}`, borderRadius: 10, background: raiseErrors.empDept ? "#fff5f5" : "#f9fafb", fontSize: 14, outline: "none", fontFamily: "inherit", color: "#111827", boxSizing: "border-box" }}>
                <option value="">-- Select Department --</option>
                {["R&D Department","IT","Marketing","Accounts","Sales","Logistics","RMA","Production-Passive","Production-SFP","Production-Factory"].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {raiseErrors.empDept && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{raiseErrors.empDept}</span>}
            </div>

            {/* Employee Name */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee Name <span style={{ color: "#9ca3af", fontSize: 11, textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
              <input name="empName" placeholder="e.g. Rahul Sharma" value={raiseForm.empName} onChange={handleRaiseChange}
                style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${raiseErrors.empName ? "#ef4444" : "#d1d5db"}`, borderRadius: 10, background: raiseErrors.empName ? "#fff5f5" : "#f9fafb", fontSize: 14, outline: "none", fontFamily: "inherit", color: "#111827", boxSizing: "border-box" }} />
              {raiseErrors.empName && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{raiseErrors.empName}</span>}
            </div>

            {/* Employee Email */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Employee Email <span style={{ color: "#9ca3af", fontSize: 11, textTransform: "none", fontWeight: 400 }}>(optional)</span>
              </label>
              <input name="empEmail" placeholder="e.g. rahul@goip.in" value={raiseForm.empEmail} onChange={handleRaiseChange}
                style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${raiseErrors.empEmail ? "#ef4444" : "#d1d5db"}`, borderRadius: 10, background: raiseErrors.empEmail ? "#fff5f5" : "#f9fafb", fontSize: 14, outline: "none", fontFamily: "inherit", color: "#111827", boxSizing: "border-box" }} />
              {raiseErrors.empEmail && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{raiseErrors.empEmail}</span>}
            </div>

            {/* Employee Code */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Employee Code <span style={{ color: "#9ca3af", fontSize: 11, textTransform: "none", fontWeight: 400 }}>(optional)</span>
              </label>
              <input name="empCode" placeholder="e.g. EMP-1001" value={raiseForm.empCode} onChange={handleRaiseChange}
                style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${raiseErrors.empCode ? "#ef4444" : "#d1d5db"}`, borderRadius: 10, background: raiseErrors.empCode ? "#fff5f5" : "#f9fafb", fontSize: 14, outline: "none", fontFamily: "inherit", color: "#111827", boxSizing: "border-box" }} />
              {raiseErrors.empCode && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{raiseErrors.empCode}</span>}
            </div>

            {/* Employee Phone */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee Phone <span style={{ color: "#9ca3af", fontSize: 11, textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
              <input name="empPhone" placeholder="10-digit number" value={raiseForm.empPhone} onChange={handleRaiseChange} maxLength={10}
                style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${raiseErrors.empPhone ? "#ef4444" : "#d1d5db"}`, borderRadius: 10, background: raiseErrors.empPhone ? "#fff5f5" : "#f9fafb", fontSize: 14, outline: "none", fontFamily: "inherit", color: "#111827", boxSizing: "border-box" }} />
              {raiseErrors.empPhone && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{raiseErrors.empPhone}</span>}
            </div>

            {/* Issue Chips */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select Issue <span style={{ color: "#9ca3af", fontSize: 11, textTransform: "none", fontWeight: 400 }}>(optional)</span>
                <span style={{ fontSize: 10, color: "#9ca3af", textTransform: "none", fontWeight: 400 }}> (select multiple)</span>
              </label>
              {!raiseForm.empType ? (
                <div style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid #d1d5db", background: "#f9fafb", fontSize: 13, color: "#9ca3af" }}>Select employee type first</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {raiseIssueOptions.map(opt => {
                    const selected = raiseForm.issues.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => {
                          setRaiseForm(prev => ({ ...prev, issues: selected ? prev.issues.filter(i => i !== opt) : [...prev.issues, opt] }));
                          setRaiseErrors(prev => ({ ...prev, issue: "" }));
                        }}
                        style={{ padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                          border: selected ? "2px solid #2563eb" : "1.5px solid #d1d5db",
                          background: selected ? "#eff6ff" : "#f9fafb",
                          color: selected ? "#1d4ed8" : "#374151",
                          fontWeight: selected ? 700 : 500,
                        }}>
                        {selected ? "✓ " : ""}{opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {raiseForm.issues.length > 0 && (
                <div style={{ fontSize: 11, color: "#2563eb", marginTop: 6, fontWeight: 600 }}>✅ Selected: {raiseForm.issues.join(", ")}</div>
              )}
              {raiseErrors.issue && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>{raiseErrors.issue}</span>}
            </div>

            {/* Description */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Issue Description <span style={{ color: "#2563eb" }}>*</span>
                <span style={{ fontSize: 10, color: "#9ca3af", textTransform: "none", fontWeight: 400 }}> (max 500 chars)</span>
              </label>
              <textarea name="description" rows={4}
                placeholder="Describe the issue in detail..."
                value={raiseForm.description} onChange={handleRaiseChange}
                disabled={false}
                style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${raiseErrors.description ? "#ef4444" : "#d1d5db"}`, borderRadius: 10, background: raiseErrors.description ? "#fff5f5" : "#f9fafb",fontSize: 14, outline: "none", fontFamily: "inherit", color: "#111827", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6, opacity: 1}} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 3 }}>
                {raiseErrors.description
                  ? <span style={{ color: "#ef4444" }}>{raiseErrors.description}</span>
                  : <span style={{ color: "#9ca3af" }}>{raiseForm.description.length}/500</span>}
                <span style={{ color: raiseForm.description.length > 450 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                  {500 - raiseForm.description.length} left
                </span>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleRaiseSubmit} disabled={raiseSubmitting}
              style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: raiseSubmitting ? "#9ca3af" : "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: raiseSubmitting ? "not-allowed" : "pointer", boxShadow: raiseSubmitting ? "none" : "0 4px 14px rgba(37,99,235,0.35)" }}>
              {raiseSubmitting ? "⏳ Submitting..." : "🎫 Submit Ticket"}
            </button>

          </div>
        </div>
      )}

      {activeTab === "alltickets" && (
        <>

        {/* Top Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#374151", margin: 0 }}>📋 HR Tickets</h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>All tickets raised by HR panel</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            ["Total Tickets",  counts.all,      "🎫", "#2563eb", "#eff6ff"],
            ["Open",           counts.open,     "🔓", "#e04e00", "#fff4ee"],
            ["Resolved",       counts.resolved, "✅", "#1a7a46", "#edfaf3"],
          ].map(([label, val, icon, col, bg]) => (
            <div key={label} style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderTop: `4px solid ${col}` }}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: col, marginTop: 6 }}>{val}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: "white", borderRadius: 10, padding: "12px 16px", border: "1.5px solid #dbeafe", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>🗓️ Filter:</span>

          <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterDate(""); }}
            style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, outline: "none", fontFamily: "inherit", border: `1.5px solid ${filterYear ? "#2563eb" : "#d1d5db"}`, background: filterYear ? "#eff6ff" : "white", color: filterYear ? "#2563eb" : "#374151" }}>
            <option value="">All Years</option>
            {[2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setFilterDate(""); }}
            style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, outline: "none", fontFamily: "inherit", border: `1.5px solid ${filterMonth ? "#2563eb" : "#d1d5db"}`, background: filterMonth ? "#eff6ff" : "white", color: filterMonth ? "#2563eb" : "#374151" }}>
            <option value="">All Months</option>
            {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i) => (
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>

          <input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setFilterYear(""); setFilterMonth(""); }}
            style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, outline: "none", fontFamily: "inherit", border: `1.5px solid ${filterDate ? "#2563eb" : "#d1d5db"}`, background: filterDate ? "#eff6ff" : "white", color: filterDate ? "#2563eb" : "#374151" }} />

          {(filterYear || filterMonth || filterDate) && (
            <button onClick={() => { setFilterYear(""); setFilterMonth(""); setFilterDate(""); }}
              style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, color: "#dc2626", fontWeight: 700 }}>✕ Clear</button>
          )}

          <div style={{ fontSize: 12, color: "#6b7280" }}>Showing <strong style={{ color: "#2563eb" }}>{displayTickets.length}</strong> tickets</div>
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          {[
            ["all",      "All",         counts.all,      "#374151"],
            ["open",     "🔓 Open",     counts.open,     "#e04e00"],
            ["resolved", "✅ Resolved", counts.resolved, "#1a7a46"],
          ].map(([key, label, count, col]) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              style={{ padding: "6px 14px", borderRadius: 16, fontSize: 12, cursor: "pointer", border: statusFilter === key ? `2px solid ${col}` : "1px solid #d1d5db", background: statusFilter === key ? col : "white", color: statusFilter === key ? "white" : "#555", fontWeight: statusFilter === key ? 700 : 400 }}>
              {label} <span style={{ marginLeft: 4, background: statusFilter === key ? "rgba(255,255,255,0.3)" : "#e5e7eb", color: statusFilter === key ? "white" : "#555", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 14, display: "flex", gap: 8 }}>
          <input placeholder="🔍 Search by name, code, department, issue, email, phone..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #d1d5db", fontSize: 13, background: "white", color: "#374151", outline: "none", fontFamily: "inherit" }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}
              style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>✕ Clear</button>
          )}
        </div>

        {/* Table */}
        {tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, color: "#aaa" }}>
            <div style={{ fontSize: 48 }}>🎫</div>
            <p style={{ marginTop: 12 }}>No HR tickets found.</p>
          </div>
        ) : (
          <div style={{ borderRadius: 12, border: "1.5px solid #dbeafe", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflowX: "auto", overflowY: "auto", maxHeight: "60vh" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "white", minWidth: 900 }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", position: "sticky", top: 0, zIndex: 2 }}>
                  {["Ticket No","Raised By HR","Emp Code","Emp Type","Emp Name / KYC","Department","Issue","Status","Date","Action"].map((h, i) => (
                    <th key={i} style={{ padding: "12px 14px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayTickets.map((ticket, idx) => {
                  const s = (ticket.status || "open").toLowerCase();
                  const isNew = ticket.empType === "new" || ticket.subCategory === "New Employee";
                  return (
                    <tr key={ticket.id} style={{ borderBottom: "1px solid #dbeafe", background: idx % 2 === 0 ? "#f0f7ff" : "white", borderLeft: `4px solid ${STATUS_COLOR[s] || "#2563eb"}` }}>

                      <td style={{ padding: "12px 14px", borderRight: "1px solid #dbeafe" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#2563eb" }}>{ticket.ticketNumber || "—"}</div>
                      </td>

                      <td style={{ padding: "12px 14px", borderRight: "1px solid #dbeafe" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{ticket.raisedByName || "HR"}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{ticket.raisedBy || "—"}</div>
                      </td>

                      <td style={{ padding: "12px 14px", borderRight: "1px solid #dbeafe" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{ticket.empCode || ticket.serialNo || "—"}</div>
                      </td>

                      <td style={{ padding: "12px 14px", borderRight: "1px solid #dbeafe" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, display: "inline-block", background: isNew ? "#dcfce7" : "#fef9c3", color: isNew ? "#166534" : "#854d0e" }}>
                          {isNew ? "🆕 New" : "👤 Old"}
                        </span>
                      </td>

                      <td style={{ padding: "12px 14px", borderRight: "1px solid #dbeafe" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{ticket.empName || "—"}</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{ticket.empEmail || "—"}</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{ticket.empPhone || "—"}</div>
                      </td>

                      <td style={{ padding: "12px 14px", borderRight: "1px solid #dbeafe" }}>
                        <div style={{ fontSize: 12, color: "#374151" }}>{ticket.empDept || "—"}</div>
                      </td>

                      <td style={{ padding: "12px 14px", borderRight: "1px solid #dbeafe", cursor: "pointer", maxWidth: 180 }}
                        onClick={() => setIssuePopup(ticket)}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160, textDecoration: "underline", textDecorationStyle: "dotted" }}>
                          {ticket.hrIssue || ticket.model || "—"}
                        </div>
                        {ticket.resolutionNotes && (
                          <div style={{ fontSize: 10, color: "#059669", fontWeight: 700, marginTop: 3 }}>
                            ✅ {ticket.resolutionNotes.length > 30 ? ticket.resolutionNotes.slice(0, 30) + "…" : ticket.resolutionNotes}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "12px 14px", borderRight: "1px solid #dbeafe" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s], display: "inline-block", whiteSpace: "nowrap" }}>
                          {s.toUpperCase()}
                        </span>
                      </td>

                      <td style={{ padding: "12px 14px", borderRight: "1px solid #dbeafe" }}>
                        <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, whiteSpace: "nowrap" }}>{ticket.date || "—"}</div>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
  {(ticket.status === "open" || ticket.status === "reopened") ? (
    <button onClick={() => { setResolvePopup(ticket); setResolveNote(""); }}
      style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap", display:"block", marginBottom:6 }}>
      ✅ Resolve
    </button>
  ) : (
    <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginBottom:6 }}>
      ✅ Resolved
      {ticket.resolvedBy && <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>by {ticket.resolvedBy}</div>}
    </div>
  )}
  {ticket.status !== "resolved" && (
    <button onClick={() => setStatusUpdateForm({ show: true, id: ticket.id, note: "" })}
      style={{ background:"#1d4ed8", color:"white", border:"none", padding:"6px 14px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit", display:"block", marginBottom:6 }}>
      📝 Update
    </button>
  )}
  {Array.isArray(ticket.statusUpdates) && ticket.statusUpdates.length > 0 && (
    <div onClick={() => setStatusUpdatePopup(ticket.statusUpdates)}
      style={{ fontSize:10, color:"#1d4ed8", cursor:"pointer", fontWeight:700, background:"#eff6ff", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
      📝 {ticket.statusUpdates.length} Update{ticket.statusUpdates.length > 1 ? "s" : ""} — View
    </div>
  )}
</td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", textAlign: "right" }}>
          Total: <strong style={{ color: "#374151" }}>{tickets.length}</strong> tickets
        </div>
      </>
      )}
      </div>
    </div>
  );
}