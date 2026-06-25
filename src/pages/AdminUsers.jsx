import { useState, useEffect } from "react";
import { PRODUCT_MODELS } from "../data/productModels";

const BASE_URL = "https://api.syrotech.com";
const STATE_CITY_MAP = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Tirupati"],
  "Bihar": ["Patna","Gaya","Muzaffarpur","Bhagalpur","Darbhanga"],
  "Delhi": ["New Delhi","Dwarka","Rohini","Pitampura","Lajpat Nagar","Saket","Karol Bagh"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Gandhinagar"],
  "Haryana": ["Gurugram","Faridabad","Panipat","Ambala","Hisar","Rohtak","Karnal"],
  "Karnataka": ["Bangalore","Mysuru","Mangaluru","Hubli","Belagavi","Davangere"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam","Kannur"],
  "Madhya Pradesh": ["Bhopal","Indore","Gwalior","Jabalpur","Ujjain"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Thane","Navi Mumbai"],
  "Punjab": ["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Mohali"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer","Bikaner"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Vellore"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Meerut","Allahabad","Ghaziabad","Noida"],
  "Uttarakhand": ["Dehradun","Haridwar","Roorkee","Haldwani","Rishikesh"],
  "West Bengal": ["Kolkata","Howrah","Asansol","Siliguri","Durgapur"],
  "Chandigarh": ["Chandigarh"],
  "Jammu and Kashmir": ["Srinagar","Jammu","Anantnag","Baramulla"],
  "Assam": ["Guwahati","Silchar","Dibrugarh","Jorhat"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Berhampur"],
  "Chhattisgarh": ["Raipur","Bhilai","Bilaspur","Korba"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa"],
  "Himachal Pradesh": ["Shimla","Dharamsala","Manali","Solan"],
  "Puducherry": ["Puducherry","Karaikal","Mahe"],
  "Ladakh": ["Leh","Kargil"],
};

export default function AdminUsers() {
  const [users, setUsers]             = useState([]);
  const [pendingTab, setPendingTab]   = useState("user");
  const [approvedTab, setApprovedTab] = useState("user");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addRole, setAddRole]         = useState("user");
const [addForm, setAddForm] = useState({ name: "", email: "", password: "", phone: "", companyName: "", customerType: "", salesPerson: "", state: "", city: "", country: "", specialization: [], level: 1, zone: "all" });
 const [addError, setAddError]       = useState("");
  const [addSuccess, setAddSuccess]   = useState("");
  const [adding, setAdding]           = useState(false);
 const [showSpecDrop, setShowSpecDrop] = useState(false);
  const [specSearch, setSpecSearch]     = useState("");
  const [custSearch, setCustSearch]         = useState("");
  const [custTypeFilter, setCustTypeFilter] = useState("all");
  const [custStateFilter, setCustStateFilter] = useState("all");
  const [custSalesFilter, setCustSalesFilter] = useState("all");
  const [custSort, setCustSort]             = useState("newest");
  const [suppSearch, setSuppSearch] = useState("");
const [suppLevelFilter, setSuppLevelFilter] = useState("all");
const [suppZoneFilter, setSuppZoneFilter] = useState("all");
const [suppSpecFilter, setSuppSpecFilter] = useState("all");

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
if (addRole === "customer" && !addForm.state) { setAddError("Please select a state."); return; }
if (addRole === "customer" && !addForm.city) { setAddError("Please select a city."); return; }
    if (addRole === "support" && (!addForm.specialization || addForm.specialization.length === 0)) { setAddError("Please select at least one specialization."); return; }
   

    setAdding(true); setAddError("");
    try {
      const res  = await fetch(`${BASE_URL}/api/signup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
  name: addForm.name, email: addForm.email, password: addForm.password,
  phone: addForm.phone || "", companyName: addForm.companyName || "",
  customerType: addForm.customerType || "",
  salesPerson: addForm.salesPerson || "",
  role: addRole,
  state: addForm.state || "",
  city: addForm.city || "", country: addForm.country || "",
  specialization: Array.isArray(addForm.specialization) ? addForm.specialization : [],
  level: addForm.level || 1,
  zone: addForm.zone || "all",
}),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || "Failed to add user."); setAdding(false); return; }
      await fetch(`${BASE_URL}/api/users/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: addForm.email }) });
      const roleLabel = addRole === "customer" ? "Customer" : addRole === "support" ? "Support Person" : "Sales Person";
      setAddSuccess(`✅ ${roleLabel} added and approved successfully!`);
     setAddForm({ name: "", email: "", password: "", phone: "", companyName: "", customerType: "", salesPerson: "", state: "", city: "", country: "", specialization: [], level: 1, zone: "all" });
      fetchUsers();
      setTimeout(() => { setAddSuccess(""); setShowAddForm(false); }, 3000);
    } catch { setAddError("Cannot connect to server."); }
    setAdding(false);
  };

const PRODUCTS = Object.keys(PRODUCT_MODELS);

  const toggleSpec = (product) => {
    setAddForm(p => {
      const curr = Array.isArray(p.specialization) ? p.specialization : [];
      return { ...p, specialization: curr.includes(product) ? curr.filter(x => x !== product) : [...curr, product] };
    });
  };
  const pending        = users.filter(u => !u.approved && (u.role === "user" || u.role === "customer" || u.role === "rnd"));
  const approvedUsers  = users.filter(u =>  u.approved && (u.role === "user" || u.role === "customer" || u.role === "rnd"));
  const supportPersons = users.filter(u => u.role === "support")
    .sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));

  const pendingSales    = pending.filter(u => u.role === "user").sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
  const pendingCustomer = pending.filter(u => u.role === "customer").sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
  const pendingRnd      = pending.filter(u => u.role === "rnd").sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
  const approvedSales   = approvedUsers.filter(u => u.role === "user").sort((a,b) => new Date(b.updatedAt||b.createdAt||0) - new Date(a.updatedAt||a.createdAt||0));
  const approvedCust    = approvedUsers.filter(u => u.role === "customer").sort((a,b) => new Date(b.updatedAt||b.createdAt||0) - new Date(a.updatedAt||a.createdAt||0));
  const approvedRnd     = approvedUsers.filter(u => u.role === "rnd").sort((a,b) => new Date(b.updatedAt||b.createdAt||0) - new Date(a.updatedAt||a.createdAt||0));

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
          <div style={{ display: "flex", gap: 4, background: "#f0f0f2", borderRadius: 10, padding: 3, marginBottom: 20, width: "fit-content", flexWrap: "wrap" }}>
            {[["user","💼 Sales Person","#2563eb"],["customer","👥 Customer","#7c3aed"],["support","🛠️ Support Person","#059669"]].map(([r,l,c]) => (
              <button key={r} onClick={() => { setAddRole(r); setAddError(""); setShowSpecDrop(false); setSpecSearch(""); setAddForm({ name:"", email:"", password:"", phone:"", companyName:"", customerType:"", salesPerson:"", state:"", city:"", country:"", specialization:[], level: 1, zone: "all" });}}
                style={{ padding: "8px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: addRole === r ? "white" : "transparent", color: addRole === r ? c : "#6b7280", boxShadow: addRole === r ? "0 1px 4px rgba(0,0,0,0.10)" : "none", transition: "all 0.15s" }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
           {/* Customer only: Company Name */}
{addRole === "customer" && (
  <div style={{ gridColumn: "1/-1" }}>
    <label style={labelStyle}>Company Name <span style={{ color: "#ef4444" }}>*</span></label>
    <input value={addForm.companyName} onChange={e => setAddForm(p => ({...p, companyName: e.target.value}))} placeholder="e.g. ABC Pvt. Ltd." style={inputStyle} />
  </div>
)}

{addRole === "customer" && (
  <div>
    <label style={labelStyle}>Customer Type <span style={{ color: "#ef4444" }}>*</span></label>
    <select value={addForm.customerType} onChange={e => setAddForm(p => ({...p, customerType: e.target.value}))} style={inputStyle}>
      <option value="">-- Select Type --</option>
      <option value="Dealer">Dealer</option>
      <option value="Service Provider">Service Provider</option>
      <option value="SI Partner">SI Partner</option>
    </select>
  </div>
)}

{addRole === "customer" && (
  <div>
    <label style={labelStyle}>Sales Person <span style={{ color: "#ef4444" }}>*</span></label>
    <select value={addForm.salesPerson} onChange={e => setAddForm(p => ({...p, salesPerson: e.target.value}))} style={inputStyle}>
      <option value="">-- Select Sales Person --</option>
      {users.filter(u => u.role === "user" && u.approved).map(u => (
        <option key={u.email} value={u.name}>{u.name}</option>
      ))}
    </select>
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

            {/* Customer + Support: Phone */}
          {(addRole === "customer" || addRole === "support") && (
  <div>
    <label style={labelStyle}>Phone Number {addRole === "customer" && <span style={{ color: "#ef4444" }}>*</span>}</label>
    <input value={addForm.phone} onChange={e => setAddForm(p => ({...p, phone: e.target.value}))} placeholder="10-digit phone" maxLength={10} style={inputStyle} />
  </div>
)}

{addRole === "customer" && (
  <div>
    <label style={labelStyle}>State <span style={{ color: "#ef4444" }}>*</span></label>
    <select value={addForm.state} onChange={e => setAddForm(p => ({...p, state: e.target.value, city: ""}))} style={inputStyle}>
      <option value="">-- Select State --</option>
      {Object.keys(STATE_CITY_MAP).sort().map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  </div>
)}

{addRole === "customer" && (
  <div>
    <label style={labelStyle}>City <span style={{ color: "#ef4444" }}>*</span></label>
    <select value={addForm.city} onChange={e => setAddForm(p => ({...p, city: e.target.value}))} style={inputStyle} disabled={!addForm.state}>
      <option value="">{addForm.state ? "-- Select City --" : "Select state first"}</option>
      {(STATE_CITY_MAP[addForm.state] || []).map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  </div>
)}

            <div>
              <label style={labelStyle}>Password <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="password" value={addForm.password} onChange={e => setAddForm(p => ({...p, password: e.target.value}))} placeholder="Min 4 characters" style={inputStyle} />
            </div>

            {/* Support only: City, Country, Specialization, Level, Zone */}
            {addRole === "support" && (
              <>
                <div>
                  <label style={labelStyle}>City</label>
                  <input value={addForm.city} onChange={e => setAddForm(p => ({...p, city: e.target.value}))} placeholder="e.g. Mumbai" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <input value={addForm.country} onChange={e => setAddForm(p => ({...p, country: e.target.value}))} placeholder="e.g. India" style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={labelStyle}>Specialization <span style={{ color: "#ef4444" }}>*</span></label>
                  {/* Custom dropdown trigger */}
                  <div style={{ position: "relative" }}>
                    <button type="button" onClick={() => { setShowSpecDrop(p => !p); setSpecSearch(""); }}
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "white", color: addForm.specialization.length > 0 ? "#111827" : "#9ca3af", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{addForm.specialization.length > 0 ? `${addForm.specialization.length} selected: ${addForm.specialization.join(", ")}` : "-- Select products --"}</span>
                      <span style={{ fontSize: 10, color: "#6b7280" }}>{showSpecDrop ? "▲" : "▼"}</span>
                    </button>
                    {showSpecDrop && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", border: "1.5px solid #d1d5db", borderRadius: 9, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                        {/* Search filter */}
                        <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
                          <input autoFocus placeholder="🔍 Search product..." value={specSearch} onChange={e => setSpecSearch(e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "#f9fafb", color: "#111" }} />
                        </div>
                        {/* Options with scrollbar */}
                        <div style={{ maxHeight: 200, overflowY: "auto", padding: "6px 0" }}>
                          {PRODUCTS.filter(p => p.toLowerCase().includes(specSearch.toLowerCase())).map(product => {
                            const checked = addForm.specialization.includes(product);
                            return (
                              <div key={product} onClick={() => toggleSpec(product)}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer", background: checked ? "#ecfdf5" : "white", transition: "background 0.12s" }}
                                onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "#f9fafb"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = checked ? "#ecfdf5" : "white"; }}>
                                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? "#059669" : "#d1d5db"}`, background: checked ? "#059669" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  {checked && <span style={{ color: "white", fontSize: 9, fontWeight: 900 }}>✓</span>}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? "#065f46" : "#374151" }}>{product}</span>
                              </div>
                            );
                          })}
                          {PRODUCTS.filter(p => p.toLowerCase().includes(specSearch.toLowerCase())).length === 0 && (
                            <div style={{ padding: "12px 14px", fontSize: 13, color: "#9ca3af", textAlign: "center" }}>No products found</div>
                          )}
                        </div>
                        {/* Footer */}
                        <div style={{ padding: "8px 12px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#6b7280" }}>{addForm.specialization.length} selected</span>
                          <button onClick={() => setShowSpecDrop(false)}
                            style={{ padding: "5px 14px", borderRadius: 7, border: "none", background: "#059669", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            ✓ Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {addForm.specialization.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {addForm.specialization.map(s => (
                        <span key={s} style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7", padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                          {s} <span onClick={() => toggleSpec(s)} style={{ cursor: "pointer", marginLeft: 4, color: "#dc2626" }}>✕</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── NEW: Level and Zone fields ── */}
                <div>
                  <label style={labelStyle}>Level <span style={{ color: "#ef4444" }}>*</span></label>
                  <select value={addForm.level} onChange={e => setAddForm(p => ({...p, level: parseInt(e.target.value)}))}
                    style={inputStyle}>
                    <option value={1}>Level 1 (L1)</option>
<option value={2}>Level 2 (L2)</option>
<option value={3}>Level 3 (L3)</option>
<option value={4}>Level 4 (L4)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Zone <span style={{ color: "#ef4444" }}>*</span></label>
                  <select value={addForm.zone} onChange={e => setAddForm(p => ({...p, zone: e.target.value}))}
                    style={inputStyle}>
                    <option value="all">All Zones</option>
                    <option value="all except south">All Except South</option>
                    <option value="South Region">South Region</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <button onClick={handleAddUser} disabled={adding}
            style={{ marginTop: 18, padding: "11px 26px", borderRadius: 10, border: "none",
              background: addRole === "customer" ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : addRole === "support" ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color: "white", fontWeight: 700, fontSize: 14, cursor: adding ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: adding ? 0.7 : 1, boxShadow: "0 3px 12px rgba(0,0,0,0.18)" }}>
            {adding ? "⏳ Adding..." : `➕ Add ${addRole === "customer" ? "Customer" : addRole === "support" ? "Support Person" : "Sales Person"}`}
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
            ["rnd",      `🔬 R&D (${pendingRnd.length})`,               "#059669"],
          ]} />

          {pendingTab === "user" && (
            pendingSales.length === 0 ? <div className="empty-state">✅ No pending sales person requests.</div> : (
              <div style={tableWrap}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 560 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                   <tr>{["S.No","Name","Email","Phone","State","City","Requested On","Action"].map((h,i) => <th key={i} style={thStyle("#2563eb")}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {pendingSales.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f8f9ff" : "white" }}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#6b7280", width: 48 }}>{idx + 1}</td>
                        <td style={tdStyle}><div style={{ display:"flex", alignItems:"center", gap:10 }}>{avatar(u.name,"linear-gradient(135deg,#f59e0b,#fbbf24)")}<span style={{ fontWeight:600 }}>{u.name||"—"}</span></div></td>
                       <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.phone||"—"}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.state||"—"}</td>
<td style={{ ...tdStyle, color:"#6b7280" }}>{u.city||"—"}</td>
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
                  <tr>{["S.No","Name","Email","Phone","Company","Type","Sales Person","State","City","Requested On","Action"].map((h,i) => <th key={i} style={thStyle("#7c3aed")}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {pendingCustomer.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#faf8ff" : "white" }}>
                        <td style={{ ...tdStyle, fontWeight:700, color:"#6b7280", width:48 }}>{idx+1}</td>
                        <td style={tdStyle}><div style={{ display:"flex", alignItems:"center", gap:10 }}>{avatar(u.name,"linear-gradient(135deg,#7c3aed,#6d28d9)")}<span style={{ fontWeight:600 }}>{u.name||"—"}</span></div></td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.phone||"—"}</td>
                       <td style={{ ...tdStyle, fontWeight:600, color:"#7c3aed" }}>{u.companyName||"—"}</td>
<td style={{ ...tdStyle }}>
  <span style={{ background:"#ede9fe", color:"#5b21b6", padding:"3px 10px", borderRadius:10, fontSize:11, fontWeight:700 }}>
    {u.customerType||"—"}
  </span>
</td>
<td style={tdStyle}>
  <span style={{ fontSize:12, fontWeight:600, color:"#059669" }}>
    {u.salesPerson || "—"}
  </span>
</td>
<td style={{ ...tdStyle, color:"#6b7280" }}>{u.state||"—"}</td>
<td style={{ ...tdStyle, color:"#6b7280" }}>{u.city||"—"}</td>
<td style={{ ...tdStyle, color:"#6b7280" }}>{fmtDate(u.createdAt)}</td>
                        <td style={tdStyle}><div style={{ display:"flex", gap:8 }}><button className="btn-approve" onClick={() => approveUser(u.email)}>Approve</button><button className="btn-reject" onClick={() => removeUser(u.email)}>Reject</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {pendingTab === "rnd" && (
            pendingRnd.length === 0 ? <div className="empty-state">✅ No pending R&D requests.</div> : (
              <div style={tableWrap}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 560 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr>{["S.No","Name","Email","Phone","Designation","Requested On","Action"].map((h,i) => <th key={i} style={thStyle("#059669")}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {pendingRnd.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f0fdf4" : "white" }}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#6b7280", width: 48 }}>{idx + 1}</td>
                        <td style={tdStyle}><div style={{ display:"flex", alignItems:"center", gap:10 }}>{avatar(u.name,"linear-gradient(135deg,#059669,#10b981)")}<span style={{ fontWeight:600 }}>{u.name||"—"}</span></div></td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.phone||"—"}</td>
                        <td style={{ ...tdStyle, color:"#059669", fontWeight:600 }}>{u.designation||"—"}</td>
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
            ["rnd",      `🔬 R&D (${approvedRnd.length})`,             "#059669"],
          ]} />

          {approvedTab === "user" && (
            approvedSales.length === 0 ? <div className="empty-state">No approved sales persons yet.</div> : (
              <div style={tableWrap}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 620 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr>{["S.No","Name","Email","Phone","Requested On","Approved On","Action"].map((h,i) => <th key={i} style={thStyle("#059669")}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {approvedSales.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f0fdf4" : "white" }}>
                        <td style={{ ...tdStyle, fontWeight:700, color:"#6b7280", width:48 }}>{idx+1}</td>
                        <td style={tdStyle}><div style={{ display:"flex", alignItems:"center", gap:10 }}>{avatar(u.name,"linear-gradient(135deg,#10b981,#34d399)")}<span style={{ fontWeight:600 }}>{u.name||"—"}</span></div></td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.phone||"—"}</td>
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
              <>
                {/* ── MASTER SHEET FILTERS ── */}
                <div style={{ background:"white", borderRadius:12, border:"1.5px solid #e9d5ff", padding:"14px 16px", marginBottom:14, display:"flex", flexDirection:"column", gap:10 }}>
                  
                  {/* Row 1 — Type + State + Sales */}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    
                    <span style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>🏷️ Type:</span>
                    {[["all","All"],["Dealer","Dealer"],["Service Provider","Service Provider"],["SI Partner","SI Partner"]].map(([key,label]) => (
                      <button key={key} onClick={() => setCustTypeFilter(key)} style={{
                        padding:"5px 12px", borderRadius:16, fontSize:12, cursor:"pointer",
                        border: custTypeFilter===key ? "2px solid #7c3aed" : "1px solid #d1d5db",
                        background: custTypeFilter===key ? "#ede9fe" : "white",
                        color: custTypeFilter===key ? "#5b21b6" : "#555",
                        fontWeight: custTypeFilter===key ? 700 : 400,
                      }}>
                        {label}
                        <span style={{ marginLeft:4, background: custTypeFilter===key ? "#7c3aed" : "#e5e7eb", color: custTypeFilter===key ? "white" : "#555", borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:700 }}>
                          {key === "all" ? approvedCust.length : approvedCust.filter(u => (u.customerType||"") === key).length}
                        </span>
                      </button>
                    ))}

                  

                    <div style={{ width:1, height:20, background:"#e0d8d0" }} />

                    <span style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>💼 Sales:</span>
                    <select value={custSalesFilter} onChange={e => setCustSalesFilter(e.target.value)}
                      style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${custSalesFilter!=="all"?"#7c3aed":"#d1d5db"}`, fontSize:12, cursor:"pointer", background: custSalesFilter!=="all"?"#ede9fe":"white", color: custSalesFilter!=="all"?"#5b21b6":"#374151", outline:"none", fontFamily:"inherit" }}>
                      <option value="all">All Sales Persons</option>
                      {[...new Set(approvedCust.map(u => u.salesPerson).filter(Boolean))].sort().map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {(custTypeFilter!=="all" || custStateFilter!=="all" || custSalesFilter!=="all" || custSearch) && (
                      <button onClick={() => { setCustTypeFilter("all"); setCustStateFilter("all"); setCustSalesFilter("all"); setCustSearch(""); }}
                        style={{ background:"#fee2e2", border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:11, color:"#dc2626", fontWeight:700 }}>
                        ✕ Clear All
                      </button>
                    )}
                  </div>

                  {/* Row 2 — Sort */}
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>📅 Sort:</span>
                    <select value={custSort} onChange={e => setCustSort(e.target.value)}
                      style={{ padding:"6px 10px", borderRadius:8, border:"1.5px solid #d1d5db", fontSize:12, cursor:"pointer", background:"white", color:"#374151", outline:"none", fontFamily:"inherit" }}>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Name A→Z</option>
                    </select>
                  </div>

                  {/* Row 2 — Search + count */}
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <input
                      placeholder="🔍 Search by name, email, phone, company, city..."
                      value={custSearch}
                      onChange={e => setCustSearch(e.target.value)}
                      style={{ flex:1, padding:"8px 14px", borderRadius:9, border:"1.5px solid #d1d5db", fontSize:12, outline:"none", fontFamily:"inherit", color:"#111", background:"white" }}
                    />
                    {custSearch && (
                      <button onClick={() => setCustSearch("")}
                        style={{ background:"#f3f4f6", border:"1px solid #d1d5db", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12, color:"#6b7280", fontWeight:600 }}>✕</button>
                    )}
                    <span style={{ fontSize:12, color:"#9ca3af", whiteSpace:"nowrap" }}>
                      Showing <strong style={{ color:"#5b21b6" }}>
                        {approvedCust
                          .filter(u => custTypeFilter==="all" || (u.customerType||"")===custTypeFilter)
                          .filter(u => custStateFilter==="all" || (u.state||"")===custStateFilter)
                          .filter(u => custSalesFilter==="all" || (u.salesPerson||"")===custSalesFilter)
                          .filter(u => !custSearch.trim() || [u.name,u.email,u.phone,u.companyName,u.city].some(f=>(f||"").toLowerCase().includes(custSearch.toLowerCase())))
                          .length}
                      </strong> of <strong style={{ color:"#5b21b6" }}>{approvedCust.length}</strong> customers
                    </span>
                  </div>
                </div>

                {/* ── TABLE ── */}
                <div style={tableWrap}>
                  <table style={{ width:"100%", borderCollapse:"collapse", background:"white", minWidth:1000 }}>
                    <thead style={{ position:"sticky", top:0, zIndex:2 }}>
                      <tr>{["S.No","Name","Email","Phone","Company","Type","Sales Person","State","City","Joined On","Approved On","Action"].map((h,i) => <th key={i} style={thStyle("#7c3aed")}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {approvedCust
                        .filter(u => custTypeFilter==="all" || (u.customerType||"")===custTypeFilter)
                        .filter(u => custStateFilter==="all" || (u.state||"")===custStateFilter)
                        .filter(u => custSalesFilter==="all" || (u.salesPerson||"")===custSalesFilter)
                        .filter(u => !custSearch.trim() || [u.name,u.email,u.phone,u.companyName,u.city].some(f=>(f||"").toLowerCase().includes(custSearch.toLowerCase())))
                        .sort((a,b) => {
                          if (custSort==="name") return (a.name||"").localeCompare(b.name||"");
                          if (custSort==="oldest") return new Date(a.createdAt||0) - new Date(b.createdAt||0);
                          return new Date(b.createdAt||0) - new Date(a.createdAt||0);
                        })
                        .map((u, idx) => (
                          <tr key={u.email} style={{ borderBottom:"1px solid #f0ede8", background: idx%2===0 ? "#faf8ff" : "white" }}>
                            <td style={{ ...tdStyle, fontWeight:700, color:"#6b7280", width:48 }}>{idx+1}</td>
                            <td style={tdStyle}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                {avatar(u.name,"linear-gradient(135deg,#7c3aed,#6d28d9)")}
                                <span style={{ fontWeight:600 }}>{u.name||"—"}</span>
                              </div>
                            </td>
                            <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                            <td style={{ ...tdStyle, color:"#6b7280" }}>{u.phone||"—"}</td>
                            <td style={{ ...tdStyle, fontWeight:600, color:"#7c3aed" }}>{u.companyName||"—"}</td>
                            <td style={tdStyle}>
                              <span style={{ background:"#ede9fe", color:"#5b21b6", padding:"3px 10px", borderRadius:10, fontSize:11, fontWeight:700 }}>
                                {u.customerType||"—"}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontSize:12, fontWeight:600, color:"#059669" }}>{u.salesPerson||"—"}</span>
                            </td>
                            <td style={{ ...tdStyle, color:"#6b7280" }}>{u.state||"—"}</td>
                            <td style={{ ...tdStyle, color:"#6b7280" }}>{u.city||"—"}</td>
                            <td style={{ ...tdStyle, color:"#6b7280" }}>{fmtDate(u.createdAt)}</td>
                            <td style={{ ...tdStyle, color:"#059669", fontWeight:600 }}>{fmtDate(u.updatedAt||u.createdAt)}</td>
                            <td style={tdStyle}>
                              <button className="btn-reject" onClick={() => removeUser(u.email)}>Remove</button>
                            </td>
                          </tr>
                        ))
                      }
                      {approvedCust
                        .filter(u => custTypeFilter==="all" || (u.customerType||"")===custTypeFilter)
                        .filter(u => custStateFilter==="all" || (u.state||"")===custStateFilter)
                        .filter(u => custSalesFilter==="all" || (u.salesPerson||"")===custSalesFilter)
                        .filter(u => !custSearch.trim() || [u.name,u.email,u.phone,u.companyName,u.city].some(f=>(f||"").toLowerCase().includes(custSearch.toLowerCase())))
                        .length === 0 && (
                        <tr><td colSpan={12} style={{ textAlign:"center", padding:30, color:"#9ca3af", fontSize:13 }}>No customers found for selected filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}
        </>
      )}


{approvedTab === "rnd" && (
            approvedRnd.length === 0 ? <div className="empty-state">No approved R&D users yet.</div> : (
              <div style={tableWrap}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 700 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr>{["S.No","Name","Email","Phone","Designation","Joined On","Approved On","Action"].map((h,i) => <th key={i} style={thStyle("#059669")}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {approvedRnd.map((u, idx) => (
                      <tr key={u.email} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f0fdf4" : "white" }}>
                        <td style={{ ...tdStyle, fontWeight:700, color:"#6b7280", width:48 }}>{idx+1}</td>
                        <td style={tdStyle}><div style={{ display:"flex", alignItems:"center", gap:10 }}>{avatar(u.name,"linear-gradient(135deg,#059669,#10b981)")}<span style={{ fontWeight:600 }}>{u.name||"—"}</span></div></td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.email}</td>
                        <td style={{ ...tdStyle, color:"#6b7280" }}>{u.phone||"—"}</td>
                        <td style={{ ...tdStyle, color:"#059669", fontWeight:600 }}>{u.designation||"—"}</td>
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
      {/* ── SUPPORT PERSONS TABLE ── */}
      <h3 className="section-label" style={{ marginTop: 28 }}>🛠️ Support Persons ({supportPersons.length})</h3>
      <div style={{ background:"white", borderRadius:12, border:"1.5px solid #d1fae5", padding:"14px 16px", marginBottom:14, display:"flex", flexDirection:"column", gap:10 }}>
  
  {/* Row 1 — Level + Zone + Spec filters */}
  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
    
    <span style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>🎯 Level:</span>
    {[["all","All"],["1","L1"],["2","L2"],["3","L3"],["4","L4"]].map(([key,label]) => (
      <button key={key} onClick={() => setSuppLevelFilter(key)} style={{
        padding:"5px 12px", borderRadius:16, fontSize:12, cursor:"pointer",
        border: suppLevelFilter===key ? "2px solid #10b981" : "1px solid #d1d5db",
        background: suppLevelFilter===key ? "#ecfdf5" : "white",
        color: suppLevelFilter===key ? "#065f46" : "#555",
        fontWeight: suppLevelFilter===key ? 700 : 400,
      }}>{label}</button>
    ))}

    <div style={{ width:1, height:20, background:"#e0d8d0" }} />

    <span style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>🌐 Zone:</span>
    {[["all","All"],["all","All Zones"],["all except south","Except South"],["South Region","South"]].map(([key,label], i) => {
      if (i === 0) return null; // skip duplicate "all"
      return (
        <button key={key+label} onClick={() => setSuppZoneFilter(key)} style={{
          padding:"5px 12px", borderRadius:16, fontSize:12, cursor:"pointer",
          border: suppZoneFilter===key ? "2px solid #10b981" : "1px solid #d1d5db",
          background: suppZoneFilter===key ? "#ecfdf5" : "white",
          color: suppZoneFilter===key ? "#065f46" : "#555",
          fontWeight: suppZoneFilter===key ? 700 : 400,
        }}>{label}</button>
      );
    })}
  </div>

  {/* Row 2 — Specialization filter */}
  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
    <span style={{ fontSize:12, fontWeight:700, color:"#6b7280" }}>🔧 Spec:</span>
    <select value={suppSpecFilter} onChange={e => setSuppSpecFilter(e.target.value)}
      style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${suppSpecFilter!=="all"?"#10b981":"#d1d5db"}`, fontSize:12, cursor:"pointer", background: suppSpecFilter!=="all"?"#ecfdf5":"white", color: suppSpecFilter!=="all"?"#065f46":"#374151", outline:"none", fontFamily:"inherit" }}>
      <option value="all">All Specializations</option>
      {[...new Set(supportPersons.flatMap(u => u.specialization || []))].sort().map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>

    {(suppSearch || suppLevelFilter!=="all" || suppZoneFilter!=="all" || suppSpecFilter!=="all") && (
      <button onClick={() => { setSuppSearch(""); setSuppLevelFilter("all"); setSuppZoneFilter("all"); setSuppSpecFilter("all"); }}
        style={{ background:"#fee2e2", border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:11, color:"#dc2626", fontWeight:700 }}>
        ✕ Clear All
      </button>
    )}
  </div>

  {/* Row 3 — Search box */}
  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
    <input
      placeholder="🔍 Search by name, email, city..."
      value={suppSearch}
      onChange={e => setSuppSearch(e.target.value)}
      style={{ flex:1, padding:"8px 14px", borderRadius:9, border:"1.5px solid #d1d5db", fontSize:12, outline:"none", fontFamily:"inherit", color:"#111", background:"white" }}
    />
    {suppSearch && (
      <button onClick={() => setSuppSearch("")}
        style={{ background:"#f3f4f6", border:"1px solid #d1d5db", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12, color:"#6b7280", fontWeight:600 }}>✕</button>
    )}
    <span style={{ fontSize:12, color:"#9ca3af", whiteSpace:"nowrap" }}>
      Showing <strong style={{ color:"#059669" }}>
        {supportPersons
          .filter(u => suppLevelFilter==="all" || String(u.level||1)===suppLevelFilter)
          .filter(u => suppZoneFilter==="all" || (u.zone||"all")===suppZoneFilter)
          .filter(u => suppSpecFilter==="all" || (u.specialization||[]).includes(suppSpecFilter))
          .filter(u => !suppSearch.trim() || [u.name,u.email,u.city].some(f=>(f||"").toLowerCase().includes(suppSearch.toLowerCase())))
          .length}
      </strong> of <strong style={{ color:"#059669" }}>{supportPersons.length}</strong> support persons
    </span>
  </div>
</div>
      {supportPersons.length === 0 ? <div className="empty-state">No support persons found.</div> : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 900 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              {/* ✅ Added Action column */}
            <tr>{["S.No","Name","Email","Phone","City","Country","Specialization","Level","Zone","Added On","Status","Action"].map((h,i) => <th key={i} style={thStyle("#10b981")}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {supportPersons
  .filter(u => suppLevelFilter==="all" || String(u.level||1)===suppLevelFilter)
  .filter(u => suppZoneFilter==="all" || (u.zone||"all")===suppZoneFilter)
  .filter(u => suppSpecFilter==="all" || (u.specialization||[]).includes(suppSpecFilter))
  .filter(u => !suppSearch.trim() || [u.name,u.email,u.city].some(f=>(f||"").toLowerCase().includes(suppSearch.toLowerCase())))
  .map((u, idx) => (
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

                    <td style={tdStyle}>
                    <span style={{ background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe", padding:"3px 10px", borderRadius:10, fontSize:11, fontWeight:700 }}>
                      L{u.level || 1}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color:"#6b7280", fontSize:12 }}>{u.zone || "all"}</td>
                  <td style={{ ...tdStyle, color:"#6b7280" }}>{fmtDate(u.createdAt)}</td>
                  </td>
                  <td style={{ ...tdStyle, color:"#6b7280" }}>{fmtDate(u.createdAt)}</td>
                  <td style={tdStyle}>
                    <span style={{ background:"#ecfdf5", color:"#059669", padding:"3px 10px", borderRadius:10, fontSize:11, fontWeight:700 }}>✅ Active</span>
                  </td>
                  {/* ✅ NEW: Remove button */}
                  <td style={tdStyle}>
                    <button
                      className="btn-reject"
                      onClick={() => {
                        if (window.confirm(`Remove ${u.name} from support persons?`)) {
                          removeUser(u.email);
                        }
                      }}>
                      Remove
                    </button>
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