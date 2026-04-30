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
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", companyName: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); setSuccess("");
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    if (!selectedRole) { setError("Please select your role."); return; }
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
          phone:       form.phone       || "",
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
        setSelectedRole("");
        setForm({ name: "", email: "", password: "", phone: "", companyName: "" });
      }, 2000);
    } catch {
      setLoading(false);
      setError("Cannot connect to server.");
    }
  };

  const ROLES = [
    { key: "admin",    label: "Admin",          icon: "🔐" },
    { key: "user",     label: "Sales Person",   icon: "💼" },
    { key: "support",  label: "Support Person", icon: "🛠️" },
    { key: "customer", label: "Customer",       icon: "👥" },
  ];

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-logo-area">
          <img src="/logo.png" alt="Syrotech" className="login-logo" />
          <div className="login-brand-text">
            <div className="login-brand-name">Syrotech</div>
          </div>
        </div>

        <div className="login-divider" />

        {error   && <div className="alert alert-error">  <span className="alert-icon">!</span>{error}</div>}
        {success && <div className="alert alert-success"><span className="alert-icon">✓</span>{success}</div>}

        {/* LOGIN FORM */}
        {page === "login" && (
          <div className="form-section">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Sign in to your account</p>


             <div className="field-group">
              <label className="field-label">Select Role</label>
              <select value={selectedRole}
                onChange={e => { setSelectedRole(e.target.value); setError(""); }}
                className="field-input">
                <option value="">-- Select your role --</option>
                {ROLES.map(r => (
                  <option key={r.key} value={r.key}>{r.icon} {r.label}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Email </label>
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
              onClick={handleLogin} disabled={loading}>
              {loading ? <span className="spinner" /> : "Sign In →"}
            </button>

            <p className="switch-text" style={{ marginTop: 20 }}>
              New here?{" "}
              <span className="link" onClick={() => {
                setSelectedRole("user"); setPage("signup"); setError("");
                setForm({ name: "", email: "", password: "", phone: "", companyName: "" });
              }}>Create account</span>
            </p>
          </div>
        )}

        {/* SIGNUP FORM */}
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
              <span className="link" onClick={() => { setPage("login"); setError(""); }}>Sign in</span>
            </p>
          </div>
        )}

        <p className="footer">© 2026 Syrotech Networks Pvt. Ltd.</p>
      </div>
    </div>
  );
}