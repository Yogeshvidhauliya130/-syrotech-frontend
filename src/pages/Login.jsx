import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [page, setPage] = useState("role");
  const [selectedRole, setSelectedRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); setSuccess("");
  };

  const goToLogin = (role) => {
    setSelectedRole(role);
    setPage("login");
    setError(""); setSuccess("");
    setForm({ name: "", email: "", password: "" });
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
     const res = await fetch("https://syrotech-backend.onrender.com/api/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email:    form.email,
          password: form.password,
          role:     selectedRole,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Login failed."); return; }

      // ✅ Use localStorage so session survives refresh
      localStorage.setItem("token",       data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // ✅ replace:true so back button cannot go to login page
      if (data.user.role === "admin")        navigate("/admin",     { replace: true });
      else if (data.user.role === "support") navigate("/support",   { replace: true });
      else                                   navigate("/dashboard", { replace: true });

    } catch {
      setLoading(false);
      setError("Cannot connect to server. Make sure backend is running.");
    }
  };

  const handleSignup = async () => {
    if (!form.name?.trim())  { setError("Enter your full name."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter valid email."); return; }
    if (!form.password || form.password.length < 4) { setError("Password min 4 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("https://syrotech-backend.onrender.com/api/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:     form.name,
          email:    form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || "Signup failed."); return; }
      setSuccess("Account created! Wait for admin approval.");
      setTimeout(() => {
        setPage("login");
        setSelectedRole("user");
        setForm({ name: "", email: "", password: "" });
      }, 2000);
    } catch {
      setLoading(false);
      setError("Cannot connect to server. Make sure backend is running.");
    }
  };

  const roleLabels = { admin: "Admin", user: "User", support: "Support Person" };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-divider" />

        {error   && <div className="alert alert-error">  <span className="alert-icon">!</span>{error}</div>}
        {success && <div className="alert alert-success"><span className="alert-icon">✓</span>{success}</div>}

        {/* ── ROLE SELECTION ── */}
        {page === "role" && (
          <div className="form-section">
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <img src="/logo.png" alt="Syrotech" style={{ width: 80, height: 80,borderRadius: "20%", objectFit: "contain", marginBottom: 4 }} />
              <h2 className="form-title" style={{ marginTop: 8 }}>Welcome to Syrotech</h2>
              <p className="form-subtitle">Select your role to continue</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                className="btn-primary"
                style={{ background: "#ff5a00", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 20px", fontSize: 15 }}
                onClick={() => goToLogin("admin")}
              >
                <span style={{ fontSize: 20 }}>🔐</span> Login as Admin
              </button>
              <button
                className="btn-primary"
                style={{ background: "#0088cc", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 20px", fontSize: 15 }}
                onClick={() => goToLogin("user")}
              >
                <span style={{ fontSize: 20 }}>👤</span> Login as User
              </button>
              <button
                className="btn-primary"
                style={{ background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 20px", fontSize: 15 }}
                onClick={() => goToLogin("support")}
              >
                <span style={{ fontSize: 20 }}>🛠️</span> Login as Support Person
              </button>
            </div>

            <p className="switch-text" style={{ marginTop: 20 }}>
              New user?{" "}
              <span className="link" onClick={() => setPage("signup")}>Create account</span>
            </p>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {page === "login" && (
          <div className="form-section">
            <h2 className="form-title">Sign in as {roleLabels[selectedRole]}</h2>
            <p className="form-subtitle">Enter your credentials to continue</p>

            <div className="field-group">
              <label className="field-label">Email / Username</label>
              <input type="text" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} className="field-input" />
            </div>

            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="password-box">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" placeholder="Enter your password"
                  value={form.password} onChange={handleChange} className="field-input"
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button className={`btn-primary ${loading ? "btn-loading" : ""}`} onClick={handleLogin} disabled={loading}>
              {loading ? <span className="spinner" /> : "Sign In"}
            </button>

            <p className="switch-text">
              <span className="link" onClick={() => setPage("role")}>← Back to role selection</span>
            </p>

            {selectedRole === "user" && (
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
            <h2 className="form-title">Create account</h2>
            <p className="form-subtitle">Fill in your details to register</p>

            <div className="field-group">
              <label className="field-label">Full Name</label>
              <input type="text" name="name" placeholder="Your full name" value={form.name} onChange={handleChange} className="field-input" />
            </div>
            <div className="field-group">
              <label className="field-label">Email address</label>
              <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} className="field-input" />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input type="password" name="password" placeholder="Min. 4 characters" value={form.password} onChange={handleChange} className="field-input" />
            </div>

            <button className={`btn-primary ${loading ? "btn-loading" : ""}`} onClick={handleSignup} disabled={loading}>
              {loading ? <span className="spinner" /> : "Create Account"}
            </button>
            <p className="switch-text">
              Already have an account?{" "}
              <span className="link" onClick={() => { setPage("login"); setSelectedRole("user"); }}>Sign in</span>
            </p>
          </div>
        )}

        <p className="footer">© 2026 Syrotech Networks Pvt. Ltd.</p>
      </div>
    </div>
  );
}
