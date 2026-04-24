import { useState, useEffect } from "react";

// const BASE_URL = "http://localhost:3001";
const BASE_URL = "https://syrotech-backend.onrender.com";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pendingTab, setPendingTab] = useState("user"); // ✅ NEW: tab state

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
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });
    fetchUsers();
  };

  const removeUser = async (email) => {
    await fetch(`${BASE_URL}/api/users/${encodeURIComponent(email)}`, {
      method: "DELETE",
    });
    fetchUsers();
  };

  // ✅ CHANGE 1: pending now includes customers too
  const pending        = users.filter(u => !u.approved && (u.role === "user" || u.role === "customer"));
  // ✅ CHANGE 2: approvedUsers now includes customers too
  const approvedUsers  = users.filter(u =>  u.approved && (u.role === "user" || u.role === "customer"));
  const supportPersons = users.filter(u => u.role === "support");

  // ✅ Split pending by role
  const pendingSales    = pending.filter(u => u.role === "user")
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const pendingCustomer = pending.filter(u => u.role === "customer")
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // ✅ CHANGE 3: RoleBadge now handles customer role
  const RoleBadge = ({ role }) => {
    if (role === "support")  return <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: "#ecfdf5", color: "#059669" }}>🛠️ Support</span>;
    if (role === "customer") return <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: "#f5f3ff", color: "#7c3aed" }}>👥 Customer</span>;
    return <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8" }}>👤 Sales Person</span>;
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">User Permissions</h2>
        <div className="tab-stats">
          <span className="stat-pill pending">{pending.length} Pending</span>
          <span className="stat-pill resolved">{approvedUsers.length} Users</span>
          <span style={{ background:"#ecfdf5", color:"#059669", padding:"4px 12px", borderRadius:20, fontSize:13, fontWeight:600 }}>
            {supportPersons.length} Support
          </span>
        </div>
      </div>

      {/* ✅ Pending Approvals with tabs */}
      {pending.length > 0 ? (
        <>
          <h3 className="section-label">⏳ Awaiting Approval</h3>

          {/* ✅ Tab switcher */}
          <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 16, width: "fit-content" }}>
            <button
              onClick={() => setPendingTab("user")}
              style={{
                padding: "8px 18px", border: "none", borderRadius: 9, cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                background: pendingTab === "user" ? "white" : "transparent",
                color: pendingTab === "user" ? "#1d4ed8" : "#6b7280",
                boxShadow: pendingTab === "user" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.18s",
              }}>
              💼 Sales Person ({pendingSales.length})
            </button>
            <button
              onClick={() => setPendingTab("customer")}
              style={{
                padding: "8px 18px", border: "none", borderRadius: 9, cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                background: pendingTab === "customer" ? "white" : "transparent",
                color: pendingTab === "customer" ? "#7c3aed" : "#6b7280",
                boxShadow: pendingTab === "customer" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.18s",
              }}>
              👥 Customer ({pendingCustomer.length})
            </button>
          </div>

          {/* ✅ Sales Person Table */}
          {pendingTab === "user" && (
            pendingSales.length === 0 ? (
              <div className="empty-state">✅ No pending sales person requests.</div>
            ) : (
              <div style={{ overflowX: "auto", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 480 }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
                      {["S.No", "Name", "Email", "Action"].map((h, i) => (
                        <th key={i} style={{ padding: "11px 16px", fontSize: 11, fontWeight: 800, color: "white", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em", borderRight: "1px solid rgba(255,255,255,0.15)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSales.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f8f9ff" : "white" }}>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#6b7280" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                              {u.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{u.name || "—"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{u.email}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn-approve" onClick={() => approveUser(u.email)}>Approve</button>
                            <button className="btn-reject"  onClick={() => removeUser(u.email)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ✅ Customer Table */}
          {pendingTab === "customer" && (
            pendingCustomer.length === 0 ? (
              <div className="empty-state">✅ No pending customer requests.</div>
            ) : (
              <div style={{ overflowX: "auto", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 680 }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                      {["S.No", "Name", "Email", "Phone", "Company Name", "Action"].map((h, i) => (
                        <th key={i} style={{ padding: "11px 16px", fontSize: 11, fontWeight: 800, color: "white", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em", borderRight: "1px solid rgba(255,255,255,0.15)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCustomer.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#faf8ff" : "white" }}>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#6b7280" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                              {u.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{u.name || "—"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{u.email}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{u.phone || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>{u.companyName || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn-approve" onClick={() => approveUser(u.email)}>Approve</button>
                            <button className="btn-reject"  onClick={() => removeUser(u.email)}>Reject</button>
                          </div>
                        </td>
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

      {/* Approved Users */}
      <h3 className="section-label" style={{ marginTop: 28 }}>✅ Approved Users</h3>
      {approvedUsers.length === 0 && <div className="empty-state">No approved users yet.</div>}
      <div className="user-list">
        {approvedUsers.map(u => (
          <div key={u.email} className="user-row">
            <div className="user-avatar approved-avatar">{u.name?.charAt(0)?.toUpperCase() || "?"}</div>
            <div className="user-info">
              <div className="user-name">{u.name || "—"} <RoleBadge role={u.role} /></div>
              <div className="user-email">{u.email}</div>
              {u.role === "customer" && u.companyName && (
                <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 2 }}>🏢 {u.companyName}</div>
              )}
              {u.role === "customer" && u.phone && (
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>📞 {u.phone}</div>
              )}
            </div>
            <div className="user-actions">
              <button className="btn-reject" onClick={() => removeUser(u.email)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Support Persons — shows specialization, city, country */}
      <h3 className="section-label" style={{ marginTop: 28 }}>🛠️ Support Persons</h3>
      <div className="user-list">
        {supportPersons.map(u => (
          <div key={u.email} className="user-row">
            <div className="user-avatar" style={{ background: "#10b981" }}>
              {u.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="user-info">
              <div className="user-name">
                {u.name || "—"} <RoleBadge role="support" />
                {Array.isArray(u.specialization) && u.specialization.length > 0 && (
                  <span style={{ marginLeft: 6, display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                    {u.specialization.map(s => (
                      <span key={s} style={{
                        background: "#fff7ed", color: "#c94500",
                        border: "1px solid #fed7aa",
                        padding: "1px 8px", borderRadius: 10,
                        fontSize: 10, fontWeight: 700,
                      }}>
                        {s}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <div className="user-email">
                {u.email}
                {(u.city || u.country) && (
                  <span style={{ marginLeft: 10, color: "#6b7280", fontSize: 11 }}>
                    📍 {[u.city, u.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {u.phone && (
                  <span style={{ marginLeft: 10, color: "#6b7280", fontSize: 11 }}>
                    📞 {u.phone}
                  </span>
                )}
              </div>
            </div>
            <span style={{ fontSize:12, color:"#059669", fontWeight:600 }}>✅ Active</span>
          </div>
        ))}
      </div>
    </div>
  );
}