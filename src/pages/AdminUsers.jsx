import { useState, useEffect } from "react";

const BASE_URL = "https://syrotech-backend.onrender.com";

export default function AdminUsers() {
  const [users, setUsers]             = useState([]);
  const [pendingTab, setPendingTab]   = useState("user");
  const [approvedTab, setApprovedTab] = useState("user");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addRole, setAddRole]         = useState("user");
  const [addForm, setAddForm]         = useState({ name: "", email: "", password: "", phone: "", companyName: "" });
  const [addError, setAddError]       = useState("");
  const [addSuccess, setAddSuccess]   = useState("");
  const [adding, setAdding]           = useState(false);

  const fetchUsers = () => {
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(setUsers)
      .catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
    const id = setInterval(fetchUsers, 8000);
    return () => clearInterval(id);
  }, []);

  const approveUser = async (email) => {
    await fetch(`${BASE_URL}/api/users/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    fetchUsers();
  };

  const removeUser = async (email) => {
    await fetch(`${BASE_URL}/api/users/${encodeURIComponent(email)}`, { method: "DELETE" });
    fetchUsers();
  };

  const handleAddUser = async () => {
    if (!addForm.name.trim())     { setAddError("Name is required."); return; }
    if (!addForm.email.trim())    { setAddError("Email is required."); return; }
    if (!addForm.password.trim()) { setAddError("Password is required."); return; }
    if (addRole === "customer" && !addForm.companyName.trim()) { setAddError("Company name is required."); return; }
    if (addRole === "customer" && !/^\d{10}$/.test((addForm.phone || "").replace(/\s/g,""))) { setAddError("Enter valid 10-digit phone."); return; }
    setAdding(true); setAddError("");
    try {
      const res  = await fetch(`${BASE_URL}/api/signup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addForm.name, email: addForm.email, password: addForm.password, phone: addForm.phone || "", companyName: addForm.companyName || "", role: addRole }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || "Failed to add user."); setAdding(false); return; }
      await fetch(`${BASE_URL}/api/users/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: addForm.email }) });
      setAddSuccess(`✅ ${addRole === "customer" ? "Customer" : "Sales Person"} added and approved successfully!`);
      setAddForm({ name: "", email: "", password: "", phone: "", companyName: "" });
      fetchUsers();
      setTimeout(() => { setAddSuccess(""); setShowAddForm(false); }, 3000);
    } catch { setAddError("Cannot connect to server."); }
    setAdding(false);
  };

  const pending        = users.filter(u => !u.approved && (u.role === "user" || u.role === "customer"));
  const approvedUsers  = users.filter(u =>  u.approved && (u.role === "user" || u.role === "customer"));
  const supportPersons = users.filter(u => u.role === "support")
    .sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));

  const pendingSales    = pending.filter(u => u.role === "user").sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
  const pendingCustomer = pending.filter(u => u.role === "customer").sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
  const approvedSales   = approvedUsers.filter(u => u.role === "user").sort((a,b) => new Date(b.updatedAt||b.createdAt||0) - new Date(a.updatedAt||a.createdAt||0));
  const approvedCust    = approvedUsers.filter(u => u.role === "customer").sort((a,b) => new Date(b.updatedAt||b.createdAt||0) - new Date(a.updatedAt||a.createdAt||0));

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  // Shared styles
  const thStyle = (color) => ({
    padding: "11px 14px", fontSize: 11, fontWeight: 800, color: "white",
    textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em",
    borderRight: "1px solid rgba(255,255,255,0.15)", background: color,
    whiteSpace: "nowrap",
  });
  const tdStyle = { padding: "11px 14px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" };

  const tableWrap = {
    overflowX: "auto", overflowY: "auto", maxHeight: 340,
    borderRadius: 12, border: "1.5px solid #e0d8d0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 16,
  };

  const TabSwitch = ({ value, onChange, options }) => (
    <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 16, width: "fit-content" }}>
      {options.map(([key, label, color]) => (
        <button key={key} onClick={() => onChange(key)} style={{
          padding: "8px 18px", border: "none", borderRadius: 9, cursor: "pointer",
          fontFamily: "inherit", fontSize: 13, fontWeight: 600,
          background: value === key ? "white" : "transparent",
          color: value === key ? color : "#6b7280",
          boxShadow: value === key ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
          transition: "all 0.18s",
        }}>{label}</button>
      ))}
    </div>
  );

  const avatar = (name, bg) => (
    <div style={{ width: 32, height: 32, borderRadius: "50%", background: bg, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );

  // Input style for add form — fixed visibility
  const inputStyle = {
    width: "100%", padding: "10px 13px", borderRadius: 9,
    border: "1.5px solid #d1d5db", fontSize: 14,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    background: "white", color: "#111827",
    transition: "border-color 0.18s",
  };
  const labelStyle = {
    display: "block", fontSize: 11, fontWeight: 700, color: "#374151",
    marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em",
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">User Permissions</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="tab-stats">
            <span className="stat-pill pending">{pending.length} Pending</span>
            <span className="stat-pill resolved">{approvedUsers.length} Users</span>
            <span style={{ background:"#ecfdf5", color:"#059669", padding:"4px 12px", borderRadius:20, fontSize:13, fontWeight:600 }}>{supportPersons.length} Support</span>
          </div>
          <button onClick={() => { setShowAddForm(!showAddForm); setAddError(""); setAddSuccess(""); }}
            style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ff5a00,#ff7020)", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 10px rgba(255,90,0,0.28)" }}>
            {showAddForm ? "✕ Cancel" : "+ Add User"}
          </button>
        </div>
      </div>

      {/* ── ADD USER FORM ── */}
      {showAddForm && (
        <div style={{ background: "#fafafa", borderRadius: 14, border: "1.5px solid #e0d8d0", padding: "24px 26px", marginBottom: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 18 }}>➕ Add New User</div>

          {addError   && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderLeft: "3px solid #ef4444", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#b91c1c", marginBottom: 14 }}>{addError}</div>}
          {addSuccess && <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderLeft: "3px solid #10b981", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#065f46", marginBottom: 14 }}>{addSuccess}</div>}

          {/* Role tabs */}
          <div style={{ display: "flex", gap: 4, background: "#f0f0f2", borderRadius: 10, padding: 3, marginBottom: 20, width: "fit-content" }}>
            {[["user","💼 Sales Person","#2563eb"],["customer","👥 Customer","#7c3aed"]].map(([r,l,c]) => (
              <button key={r} onClick={() => { setAddRole(r); setAddError(""); }}
                style={{ padding: "8px 18px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: addRole === r ? "white" : "transparent", color: addRole === r ? c : "#6b7280", boxShadow: addRole === r ? "0 1px 4px rgba(0,0,0,0.10)" : "none", transition: "all 0.15s" }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {addRole === "customer" && (
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Company Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input value={addForm.companyName} onChange={e => setAddForm(p => ({...p, companyName: e.target.value}))} placeholder="e.g. ABC Pvt. Ltd." style={inputStyle} />
              </div>
            )}
            <div>
              <label style={labelStyle}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
              <input value={addForm.name} onChange={e => setAddForm(p => ({...p, name: e.target.value}))} placeholder="Full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email Address <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="email" value={addForm.email} onChange={e => setAddForm(p => ({...p, email: e.target.value}))} placeholder="email@example.com" style={inputStyle} />
            </div>
            {addRole === "customer" && (
              <div>
                <label style={labelStyle}>Phone Number <span style={{ color: "#ef4444" }}>*</span></label>
                <input value={addForm.phone} onChange={e => setAddForm(p => ({...p, phone: e.target.value}))} placeholder="10-digit phone" maxLength={10} style={inputStyle} />
              </div>
            )}
            <div>
              <label style={labelStyle}>Password <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="password" value={addForm.password} onChange={e => setAddForm(p => ({...p, password: e.target.value}))} placeholder="Min 4 characters" style={inputStyle} />
            </div>
          </div>

          <button onClick={handleAddUser} disabled={adding}
            style={{ marginTop: 18, padding: "11px 26px", borderRadius: 10, border: "none", background: addRole === "customer" ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", fontWeight: 700, fontSize: 14, cursor: adding ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: adding ? 0.7 : 1, boxShadow: "0 3px 12px rgba(0,0,0,0.18)" }}>
            {adding ? "⏳ Adding..." : `➕ Add & Approve ${addRole === "customer" ? "Customer" : "Sales Person"}`}
          </button>
        </div>
      )}

      {/* ── PENDING APPROVALS ── */}
      {pending.length > 0 ? (
        <>
          <h3 className="section-label">⏳ Awaiting Approval</h3>
          <TabSwitch value={pendingTab} onChange={setPendingTab} options={[
            ["user",     `💼 Sales Person (${pendingSales.length})`,    "#1d4ed8"],
            ["customer", `👥 Customer (${pendingCustomer.length})`,      "#7c3aed"],
          ]} />

          {pendingTab === "user" && (
            pendingSales.length === 0 ? <div className="empty-state">✅ No pending sales person requests.</div> : (
              <div style={tableWrap}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 560 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr>{["S.No","Name","Email","Requested On","Action"].map((h,i) => <th key={i} style={thStyle("#2563eb")}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {pendingSales.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f8f9ff" : "white" }}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#6b7280", width: 48 }}>{idx + 1}</td>
                        <td style={tdStyle}><div style={{ display:"flex", alignItems:"center", gap:10 }}>{avatar(u.name,"linear-gradient(135deg,#f59e0b,#fbbf24)")}<span style={{ fontWeight:600 }}>{u.name||"—"}</span></div></td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{fmtDate(u.createdAt)}</td>
                        <td style={tdStyle}><div style={{ display:"flex", gap:8 }}><button className="btn-approve" onClick={() => approveUser(u.email)}>Approve</button><button className="btn-reject" onClick={() => removeUser(u.email)}>Reject</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {pendingTab === "customer" && (
            pendingCustomer.length === 0 ? <div className="empty-state">✅ No pending customer requests.</div> : (
              <div style={tableWrap}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 760 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr>{["S.No","Name","Email","Phone","Company","Requested On","Action"].map((h,i) => <th key={i} style={thStyle("#7c3aed")}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {pendingCustomer.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#faf8ff" : "white" }}>
                        <td style={{ ...tdStyle, fontWeight:700, color:"#6b7280", width:48 }}>{idx+1}</td>
                        <td style={tdStyle}><div style={{ display:"flex", alignItems:"center", gap:10 }}>{avatar(u.name,"linear-gradient(135deg,#7c3aed,#6d28d9)")}<span style={{ fontWeight:600 }}>{u.name||"—"}</span></div></td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.phone||"—"}</td>
                        <td style={{ ...tdStyle, fontWeight:600, color:"#7c3aed" }}>{u.companyName||"—"}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{fmtDate(u.createdAt)}</td>
                        <td style={tdStyle}><div style={{ display:"flex", gap:8 }}><button className="btn-approve" onClick={() => approveUser(u.email)}>Approve</button><button className="btn-reject" onClick={() => removeUser(u.email)}>Reject</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      ) : (
        <div className="empty-state">✅ No pending approvals.</div>
      )}

      {/* ── APPROVED USERS ── */}
      <h3 className="section-label" style={{ marginTop: 28 }}>✅ Approved Users</h3>
      {approvedUsers.length === 0 ? <div className="empty-state">No approved users yet.</div> : (
        <>
          <TabSwitch value={approvedTab} onChange={setApprovedTab} options={[
            ["user",     `💼 Sales Person (${approvedSales.length})`,  "#1d4ed8"],
            ["customer", `👥 Customer (${approvedCust.length})`,        "#7c3aed"],
          ]} />

          {approvedTab === "user" && (
            approvedSales.length === 0 ? <div className="empty-state">No approved sales persons yet.</div> : (
              <div style={tableWrap}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 620 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr>{["S.No","Name","Email","Requested On","Approved On","Action"].map((h,i) => <th key={i} style={thStyle("#059669")}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {approvedSales.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f0fdf4" : "white" }}>
                        <td style={{ ...tdStyle, fontWeight:700, color:"#6b7280", width:48 }}>{idx+1}</td>
                        <td style={tdStyle}><div style={{ display:"flex", alignItems:"center", gap:10 }}>{avatar(u.name,"linear-gradient(135deg,#10b981,#34d399)")}<span style={{ fontWeight:600 }}>{u.name||"—"}</span></div></td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{fmtDate(u.createdAt)}</td>
                        <td style={{ ...tdStyle, color:"#059669", fontWeight:600 }}>{fmtDate(u.updatedAt||u.createdAt)}</td>
                        <td style={tdStyle}><button className="btn-reject" onClick={() => removeUser(u.email)}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {approvedTab === "customer" && (
            approvedCust.length === 0 ? <div className="empty-state">No approved customers yet.</div> : (
              <div style={tableWrap}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 860 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr>{["S.No","Name","Email","Phone","Company","Requested On","Approved On","Action"].map((h,i) => <th key={i} style={thStyle("#7c3aed")}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {approvedCust.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#faf8ff" : "white" }}>
                        <td style={{ ...tdStyle, fontWeight:700, color:"#6b7280", width:48 }}>{idx+1}</td>
                        <td style={tdStyle}><div style={{ display:"flex", alignItems:"center", gap:10 }}>{avatar(u.name,"linear-gradient(135deg,#7c3aed,#6d28d9)")}<span style={{ fontWeight:600 }}>{u.name||"—"}</span></div></td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.phone||"—"}</td>
                        <td style={{ ...tdStyle, fontWeight:600, color:"#7c3aed" }}>{u.companyName||"—"}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{fmtDate(u.createdAt)}</td>
                        <td style={{ ...tdStyle, color:"#059669", fontWeight:600 }}>{fmtDate(u.updatedAt||u.createdAt)}</td>
                        <td style={tdStyle}><button className="btn-reject" onClick={() => removeUser(u.email)}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}

      {/* ── SUPPORT PERSONS TABLE ── */}
      <h3 className="section-label" style={{ marginTop: 28 }}>🛠️ Support Persons ({supportPersons.length})</h3>
      {supportPersons.length === 0 ? <div className="empty-state">No support persons found.</div> : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 820 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr>{["S.No","Name","Email","Phone","City","Country","Specialization","Added On","Status"].map((h,i) => <th key={i} style={thStyle("#10b981")}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {supportPersons.map((u, idx) => (
                <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f0fdf4" : "white" }}>
                  <td style={{ ...tdStyle, fontWeight:700, color:"#6b7280", width:48 }}>{idx+1}</td>
                  <td style={tdStyle}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {avatar(u.name,"#10b981")}
                      <span style={{ fontWeight:600 }}>{u.name||"—"}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                  <td style={{ ...tdStyle, color:"#6b7280" }}>{u.phone||"—"}</td>
                  <td style={{ ...tdStyle, color:"#6b7280" }}>{u.city||"—"}</td>
                  <td style={{ ...tdStyle, color:"#6b7280" }}>{u.country||"—"}</td>
                  <td style={tdStyle}>
                    {Array.isArray(u.specialization) && u.specialization.length > 0 ? (
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {u.specialization.map(s => (
                          <span key={s} style={{ background:"#fff7ed", color:"#c94500", border:"1px solid #fed7aa", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:700 }}>{s}</span>
                        ))}
                      </div>
                    ) : "—"}
                  </td>
                  <td style={{ ...tdStyle, color:"#6b7280" }}>{fmtDate(u.createdAt)}</td>
                  <td style={tdStyle}>
                    <span style={{ background:"#ecfdf5", color:"#059669", padding:"3px 10px", borderRadius:10, fontSize:11, fontWeight:700 }}>✅ Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}