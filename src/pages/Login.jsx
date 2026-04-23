import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";

const BASE_URL = "https://syrotech-backend.onrender.com";

export default function Login() {
  const navigate = useNavigate();
  const [page, setPage]                 = useState("login");
  const [selectedRole, setSelectedRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", companyName: "" });

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); setSuccess(""); };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    if (!selectedRole) { setError("Please select your role."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, password: form.password, role: selectedRole }) });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Login failed."); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      if      (data.user.role === "admin")    navigate("/admin",    { replace: true });
      else if (data.user.role === "support")  navigate("/support",  { replace: true });
      else if (data.user.role === "customer") navigate("/customer", { replace: true });
      else                                    navigate("/dashboard",{ replace: true });
    } catch { setLoading(false); setError("Cannot connect to server."); }
  };

  const handleSignup = async () => {
    if (!form.name?.trim()) { setError("Enter your full name."); return; }
    if (selectedRole === "customer" && !form.companyName?.trim()) { setError("Enter your company name."); return; }
    if (selectedRole === "customer" && !/^\d{10}$/.test((form.phone || "").replace(/\s/g, ""))) { setError("Enter a valid 10-digit phone number."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email."); return; }
    if (!form.password || form.password.length < 4) { setError("Password min 4 characters."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone || "", companyName: form.companyName || "", role: selectedRole === "customer" ? "customer" : "user" }) });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Signup failed."); return; }
      setSuccess("Account created! Waiting for admin approval.");
      setTimeout(() => { setPage("login"); setSelectedRole(""); setForm({ name: "", email: "", password: "", phone: "", companyName: "" }); }, 2500);
    } catch { setLoading(false); setError("Cannot connect to server."); }
  };

  return (
    <div className="lp-root">
      {/* Left panel */}
      <div className="lp-left">
        <div className="lp-left-inner">
          <div className="lp-brand">
            <img src="/logo.png" alt="Syrotech" className="lp-brand-logo" />
            <span className="lp-brand-name">Syrotech</span>
          </div>
          <div className="lp-hero">
            <div className="lp-hero-tag">Support Management</div>
            <h1 className="lp-hero-title">Resolve faster.<br/>Deliver better.</h1>
            <p className="lp-hero-sub">One platform for your entire support workflow — from ticket creation to resolution.</p>
          </div>
          <div className="lp-stats">
            {[["99.9%","Uptime SLA"],["< 24h","Avg Resolution"],["4 Roles","Access Control"]].map(([v,l]) => (
              <div key={l} className="lp-stat">
                <div className="lp-stat-val">{v}</div>
                <div className="lp-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lp-right">
        <div className="lp-card">

          {error   && <div className="lp-alert lp-alert-error"><span className="lp-alert-icon">✕</span>{error}</div>}
          {success && <div className="lp-alert lp-alert-success"><span className="lp-alert-icon">✓</span>{success}</div>}

          {/* LOGIN */}
          {page === "login" && (
            <div className="lp-form">
              <div className="lp-form-header">
                <h2 className="lp-form-title">Welcome back</h2>
                <p className="lp-form-sub">Sign in to your account</p>
              </div>

              <div className="lp-field">
                <label className="lp-label">Email address</label>
                <input type="text" name="email" placeholder="you@company.com" value={form.email} onChange={handleChange} className="lp-input" />
              </div>

              <div className="lp-field">
                <label className="lp-label">Password</label>
                <div className="lp-input-wrap">
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" value={form.password} onChange={handleChange} className="lp-input" />
                  <button type="button" className="lp-eye" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label">Role</label>
                <select value={selectedRole} onChange={e => { setSelectedRole(e.target.value); setError(""); }} className="lp-input lp-select">
                  <option value="">Select your role</option>
                  <option value="admin">🔐  Admin</option>
                  <option value="user">💼  Sales Person</option>
                  <option value="support">🛠️  Support Person</option>
                  <option value="customer">👥  Customer</option>
                </select>
              </div>

              <button className="lp-btn" onClick={handleLogin} disabled={loading}>
                {loading ? <span className="lp-spinner" /> : "Sign in →"}
              </button>

              <p className="lp-switch">
                Don't have an account?{" "}
                <span className="lp-link" onClick={() => { setSelectedRole("user"); setPage("signup"); setError(""); setForm({ name: "", email: "", password: "", phone: "", companyName: "" }); }}>
                  Create account
                </span>
              </p>
            </div>
          )}

          {/* SIGNUP */}
          {page === "signup" && (
            <div className="lp-form">
              <div className="lp-form-header">
                <h2 className="lp-form-title">Create account</h2>
                <p className="lp-form-sub">Fill in your details below</p>
              </div>

              <div className="lp-tabs">
                <button className={`lp-tab ${selectedRole !== "customer" ? "lp-tab-active" : ""}`} onClick={() => { setSelectedRole("user"); setError(""); }}>💼 Sales Person</button>
                <button className={`lp-tab ${selectedRole === "customer" ? "lp-tab-active" : ""}`} onClick={() => { setSelectedRole("customer"); setError(""); }}>👥 Customer</button>
              </div>

              {selectedRole === "customer" && (
                <div className="lp-field">
                  <label className="lp-label">Company name <span className="lp-req">*</span></label>
                  <input type="text" name="companyName" placeholder="e.g. ABC Pvt. Ltd." value={form.companyName} onChange={handleChange} className="lp-input" />
                </div>
              )}

              <div className="lp-field">
                <label className="lp-label">Full name <span className="lp-req">*</span></label>
                <input type="text" name="name" placeholder="Your full name" value={form.name} onChange={handleChange} className="lp-input" />
              </div>

              <div className="lp-field">
                <label className="lp-label">Email address <span className="lp-req">*</span></label>
                <input type="email" name="email" placeholder="you@company.com" value={form.email} onChange={handleChange} className="lp-input" />
              </div>

              {selectedRole === "customer" && (
                <div className="lp-field">
                  <label className="lp-label">Phone number <span className="lp-req">*</span></label>
                  <input type="text" name="phone" placeholder="10-digit mobile number" value={form.phone} onChange={handleChange} className="lp-input" maxLength={10} />
                </div>
              )}

              <div className="lp-field">
                <label className="lp-label">Password <span className="lp-req">*</span></label>
                <div className="lp-input-wrap">
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="Min. 4 characters" value={form.password} onChange={handleChange} className="lp-input" />
                  <button type="button" className="lp-eye" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                </div>
              </div>

              {selectedRole === "customer" && (
                <div className="lp-notice">ℹ️ Account requires admin approval before login.</div>
              )}

              <button className="lp-btn" style={{ background: selectedRole === "customer" ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "linear-gradient(135deg,#2563eb,#1d4ed8)" }} onClick={handleSignup} disabled={loading}>
                {loading ? <span className="lp-spinner" /> : "Create account →"}
              </button>

              <p className="lp-switch">
                Already have an account?{" "}
                <span className="lp-link" onClick={() => { setPage("login"); setError(""); }}>Sign in</span>
              </p>
            </div>
          )}

          <p className="lp-footer">© 2026 Syrotech Networks Pvt. Ltd.</p>
        </div>
      </div>
    </div>
  );
}