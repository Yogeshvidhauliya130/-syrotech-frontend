import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";

const BASE_URL = "https://syrotech-backend.onrender.com";

export default function Login() {
  const navigate = useNavigate();
  const [page, setPage]               = useState("role");
  const [selectedRole, setSelectedRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [loading, setLoading]         = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", companyName: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); setSuccess("");
  };

  const goToLogin = (role) => {
    setSelectedRole(role);
    setPage("login");
    setError(""); setSuccess("");
    setForm({ name: "", email: "", password: "", phone: "", companyName: "" });
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, role: selectedRole }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Login failed."); return; }
      localStorage.setItem("token",       data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      if      (data.user.role === "admin")    navigate("/admin",    { replace: true });
      else if (data.user.role === "support")  navigate("/support",  { replace: true });
      else if (data.user.role === "customer") navigate("/customer", { replace: true });
      else                                    navigate("/dashboard",{ replace: true });
    } catch {
      setLoading(false);
      setError("Cannot connect to server.");
    }
  };

  const handleSignup = async () => {
    // Validation
    if (!form.name?.trim())  { setError("Enter your full name."); return; }
    if (selectedRole === "customer" && !form.companyName?.trim()) { setError("Enter your company name."); return; }
    if (selectedRole === "customer" && !/^\d{10}$/.test((form.phone || "").replace(/\s/g,""))) { setError("Enter a valid 10-digit phone number."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email."); return; }
    if (!form.password || form.password.length < 4) { setError("Password min 4 characters."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/signup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        form.name,
          email:       form.email,
          password:    form.password,
          phone:       form.phone    || "",
          companyName: form.companyName || "",
          role:        selectedRole === "customer" ? "customer" : "user",
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Signup failed."); return; }
      setSuccess("Account created! Wait for admin approval.");
      setTimeout(() => {
        setPage("login");
        setForm({ name: "", email: "", password: "", phone: "", companyName: "" });
      }, 2000);
    } catch {
      setLoading(false);
      setError("Cannot connect to server.");
    }
  };

  const ROLES = [
    { key: "admin",    label: "Admin",          icon: "🔐", color: "#ff5a00", desc: "Full system access" },
    { key: "user",     label: "Sales Person",   icon: "💼", color: "#2563eb", desc: "Raise & track tickets" },
    { key: "support",  label: "Support Person", icon: "🛠️", color: "#10b981", desc: "Resolve customer issues" },
    { key: "customer", label: "Customer",       icon: "👥", color: "#7c3aed", desc: "Track your complaints" },
  ];

  const roleInfo = ROLES.find(r => r.key === selectedRole);

  return (
    <div className="login-container">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo-area">
          <img src="/logo.png" alt="Syrotech" className="login-logo" />
          <div className="login-brand-text">
            <div className="login-brand-name">Syrotech</div>
            <div className="login-brand-sub">Support Management System</div>
          </div>
        </div>

        <div className="login-divider" />

        {error   && <div className="alert alert-error">  <span className="alert-icon">!</span>{error}</div>}
        {success && <div className="alert alert-success"><span className="alert-icon">✓</span>{success}</div>}

        {/* ── ROLE SELECTION ── */}
        {page === "role" && (
          <div className="form-section">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Select your role to continue</p>

            <div className="role-grid">
              {ROLES.map(r => (
                <button key={r.key} className="role-card" onClick={() => goToLogin(r.key)}
                  style={{ "--role-color": r.color }}>
                  <div className="role-icon">{r.icon}</div>
                  <div className="role-label">{r.label}</div>
                  <div className="role-desc">{r.desc}</div>
                </button>
              ))}
            </div>

            <p className="switch-text" style={{ marginTop: 20 }}>
              New here?{" "}
              <span className="link" onClick={() => { setSelectedRole("user"); setPage("signup"); }}>
                Create account
              </span>
            </p>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {page === "login" && (
          <div className="form-section">
            <div className="form-role-badge" style={{ background: roleInfo?.color + "18", color: roleInfo?.color, border: `1px solid ${roleInfo?.color}33` }}>
              {roleInfo?.icon} {roleInfo?.label}
            </div>
            <h2 className="form-title">Sign In</h2>
            <p className="form-subtitle">Enter your credentials to continue</p>

            <div className="field-group">
              <label className="field-label">Email / Username</label>
              <input type="text" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} className="field-input" />
            </div>

            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="password-box">
                <input type={showPassword ? "text" : "password"} name="password"
                  placeholder="Enter your password" value={form.password}
                  onChange={handleChange} className="field-input" />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button className={`btn-primary ${loading ? "btn-loading" : ""}`}
              style={{ background: roleInfo?.color }}
              onClick={handleLogin} disabled={loading}>
              {loading ? <span className="spinner" /> : "Sign In →"}
            </button>

            <p className="switch-text">
              <span className="link" onClick={() => setPage("role")}>← Back to role selection</span>
            </p>

            {(selectedRole === "user" || selectedRole === "customer") && (
              <p className="switch-text">
                Don't have an account?{" "}
                <span className="link" onClick={() => setPage("signup")}>Create one</span>
              </p>
            )}

            {selectedRole === "support" && (
              <p className="switch-text" style={{ color: "#888", fontSize: 12 }}>
                💡 Support credentials are provided by the admin.
              </p>
            )}
          </div>
        )}

        {/* ── SIGNUP FORM ── */}
        {page === "signup" && (
          <div className="form-section">
            <div className="signup-tabs">
              <button
                className={`signup-tab ${selectedRole !== "customer" ? "active" : ""}`}
                onClick={() => { setSelectedRole("user"); setError(""); }}>
                💼 Sales Person
              </button>
              <button
                className={`signup-tab ${selectedRole === "customer" ? "active" : ""}`}
                onClick={() => { setSelectedRole("customer"); setError(""); }}>
                👥 Customer
              </button>
            </div>

            <h2 className="form-title" style={{ marginTop: 16 }}>
              {selectedRole === "customer" ? "Customer Registration" : "Create Account"}
            </h2>
            <p className="form-subtitle">Fill in your details to register</p>

            {/* Customer-only: Company Name */}
            {selectedRole === "customer" && (
              <div className="field-group">
                <label className="field-label">Company Name <span style={{ color: "#ff5a00" }}>*</span></label>
                <input type="text" name="companyName" placeholder="e.g. ABC Pvt. Ltd."
                  value={form.companyName} onChange={handleChange} className="field-input" />
              </div>
            )}

            <div className="field-group">
              <label className="field-label">Full Name <span style={{ color: "#ff5a00" }}>*</span></label>
              <input type="text" name="name" placeholder="Your full name"
                value={form.name} onChange={handleChange} className="field-input" />
            </div>

            <div className="field-group">
              <label className="field-label">Email Address <span style={{ color: "#ff5a00" }}>*</span></label>
              <input type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} className="field-input" />
            </div>

            {/* Customer-only: Phone */}
            {selectedRole === "customer" && (
              <div className="field-group">
                <label className="field-label">Phone Number <span style={{ color: "#ff5a00" }}>*</span></label>
                <input type="text" name="phone" placeholder="10-digit mobile number"
                  value={form.phone} onChange={handleChange} className="field-input" maxLength={10} />
              </div>
            )}

            <div className="field-group">
              <label className="field-label">Password <span style={{ color: "#ff5a00" }}>*</span></label>
              <div className="password-box">
                <input type={showPassword ? "text" : "password"} name="password"
                  placeholder="Min. 4 characters" value={form.password}
                  onChange={handleChange} className="field-input" />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {selectedRole === "customer" && (
              <div className="info-box">
                ℹ️ Your account will be reviewed and approved by admin before you can login.
              </div>
            )}

            <button className={`btn-primary ${loading ? "btn-loading" : ""}`}
              style={{ background: selectedRole === "customer" ? "#7c3aed" : "#2563eb" }}
              onClick={handleSignup} disabled={loading}>
              {loading ? <span className="spinner" /> : "Create Account →"}
            </button>

            <p className="switch-text">
              Already have an account?{" "}
              <span className="link" onClick={() => { setPage("login"); }}>Sign in</span>
            </p>
            <p className="switch-text">
              <span className="link" onClick={() => setPage("role")}>← Back to role selection</span>
            </p>
          </div>
        )}

        <p className="footer">© 2026 Syrotech Networks Pvt. Ltd.</p>
      </div>
    </div>
  );
}