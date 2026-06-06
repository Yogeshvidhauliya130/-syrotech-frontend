import { useState, useEffect } from "react";

const BASE_URL = "https://api.syrotech.com";

export default function AbsentSupportPerson() {
  const [supportPersons, setSupportPersons] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");
  const [updating, setUpdating]             = useState(null);
 const [successMsg, setSuccessMsg]          = useState("");
const [leaveFilter, setLeaveFilter]         = useState("all");
  const fetchPersons = () => {
    setLoading(true);
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(users => {
        setSupportPersons(users.filter(u => u.role === "support" && u.approved));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPersons(); }, []);

  const toggleLeave = (person) => {
    const newStatus = !person.isOnLeave;
    setUpdating(person.email);
    fetch(`${BASE_URL}/api/users/${person.email}/leave`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnLeave: newStatus }),
    })
      .then(r => r.json())
      .then(() => {
        setSupportPersons(prev =>
          prev.map(p => p.email === person.email ? { ...p, isOnLeave: newStatus } : p)
        );
        setSuccessMsg(`✅ ${person.name} marked as ${newStatus ? "On Leave" : "Active"}`);
        setTimeout(() => setSuccessMsg(""), 3000);
        setUpdating(null);
      })
      .catch(() => setUpdating(null));
  };

  const filtered = supportPersons
    .filter(p => {
      if (leaveFilter === "active")   return !p.isOnLeave;
      if (leaveFilter === "onleave")  return p.isOnLeave;
      return true;
    })
    .filter(p =>
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(p.specialization) ? p.specialization.join(", ") : "").toLowerCase().includes(search.toLowerCase())
    );

  const onLeaveCount  = supportPersons.filter(p => p.isOnLeave).length;
  const activeCount   = supportPersons.filter(p => !p.isOnLeave).length;

  const levelLabel = (lvl) => {
    if (lvl === 1) return { label: "L1", color: "#3b82f6", bg: "#eff6ff" };
    if (lvl === 2) return { label: "L2", color: "#f59e0b", bg: "#fffbeb" };
    if (lvl === 3) return { label: "L3", color: "#ef4444", bg: "#fef2f2" };
    if (lvl === 4) return { label: "L4", color: "#7c3aed", bg: "#f5f3ff" };
    return { label: "—", color: "#6b7280", bg: "#f3f4f6" };
  };

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>🏖️ Absent Support Person</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
            Mark support persons as On Leave — they will not receive new ticket assignments
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
         <div onClick={() => setLeaveFilter(leaveFilter === "active" ? "all" : "active")}
  style={{ background: leaveFilter === "active" ? "#059669" : "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: "8px 16px", textAlign: "center", cursor: "pointer" }}>
  <div style={{ fontSize: 20, fontWeight: 800, color: leaveFilter === "active" ? "white" : "#059669" }}>{activeCount}</div>
  <div style={{ fontSize: 11, color: leaveFilter === "active" ? "white" : "#6b7280" }}>Active</div>
</div>
<div onClick={() => setLeaveFilter(leaveFilter === "onleave" ? "all" : "onleave")}
  style={{ background: leaveFilter === "onleave" ? "#dc2626" : "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "8px 16px", textAlign: "center", cursor: "pointer" }}>
  <div style={{ fontSize: 20, fontWeight: 800, color: leaveFilter === "onleave" ? "white" : "#dc2626" }}>{onLeaveCount}</div>
  <div style={{ fontSize: 11, color: leaveFilter === "onleave" ? "white" : "#6b7280" }}>On Leave</div>
</div>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div style={{ background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: "10px 16px", marginBottom: 14, fontSize: 13, fontWeight: 600, color: "#065f46" }}>
          {successMsg}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <input
          placeholder="🔍 Search by name or specialization..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 16px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 13, outline: "none", background: "white", fontFamily: "inherit", color: "#111", boxSizing: "border-box" }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading support persons...</div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "white", minWidth: 700 }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #c94500 0%, #ff5a00 100%)" }}>
                {["Support Person", "Specialization", "Level", "Zone", "Status", "Action"].map((h, i) => (
                  <th key={i} style={{ padding: "12px 16px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>No support persons found.</td></tr>
              ) : filtered.map((person, idx) => {
                const lvl = levelLabel(person.level);
                return (
                  <tr key={person.email} style={{
                    borderBottom: "1px solid #f0ede8",
                    background: person.isOnLeave ? "#fef9f9" : idx % 2 === 0 ? "#faf7f4" : "white",
                    borderLeft: `4px solid ${person.isOnLeave ? "#ef4444" : "#10b981"}`,
                    opacity: person.isOnLeave ? 0.85 : 1,
                  }}>
                    {/* Name */}
                    <td style={{ padding: "12px 16px", borderRight: "1px solid #e0d8d0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: person.isOnLeave ? "#fee2e2" : "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: person.isOnLeave ? "#dc2626" : "#059669", flexShrink: 0 }}>
                          {(person.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{person.name}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{person.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Specialization */}
                    <td style={{ padding: "12px 16px", borderRight: "1px solid #e0d8d0" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(Array.isArray(person.specialization) ? person.specialization : []).map(s => (
                          <span key={s} style={{ background: "#fff4ee", color: "#c94500", border: "1px solid #fad8be", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{s}</span>
                        ))}
                      </div>
                    </td>

                    {/* Level */}
                    <td style={{ padding: "12px 16px", borderRight: "1px solid #e0d8d0" }}>
                      <span style={{ background: lvl.bg, color: lvl.color, border: `1.5px solid ${lvl.color}`, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>{lvl.label}</span>
                    </td>

                    {/* Zone */}
                    <td style={{ padding: "12px 16px", borderRight: "1px solid #e0d8d0" }}>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{person.zone || "all"}</div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px", borderRight: "1px solid #e0d8d0" }}>
                      {person.isOnLeave ? (
                        <span style={{ background: "#fee2e2", color: "#dc2626", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 800, display: "inline-block" }}>🏖️ On Leave</span>
                      ) : (
                        <span style={{ background: "#ecfdf5", color: "#059669", border: "1.5px solid #6ee7b7", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 800, display: "inline-block" }}>✅ Active</span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => toggleLeave(person)}
                        disabled={updating === person.email}
                        style={{
                          background: person.isOnLeave ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)",
                          color: "white", border: "none", borderRadius: 8,
                          padding: "7px 16px", fontSize: 12, fontWeight: 700,
                          cursor: updating === person.email ? "not-allowed" : "pointer",
                          opacity: updating === person.email ? 0.6 : 1,
                          fontFamily: "inherit", whiteSpace: "nowrap",
                        }}>
                        {updating === person.email ? "⏳ Updating..." : person.isOnLeave ? "✅ Mark Active" : "🏖️ Mark On Leave"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", textAlign: "right" }}>
        Showing <strong style={{ color: "#374151" }}>{filtered.length}</strong> of <strong style={{ color: "#374151" }}>{supportPersons.length}</strong> support persons
      </div>
    </div>
  );
}