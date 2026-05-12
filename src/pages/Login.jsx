import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
    name: "", email: "", password: "", phone: "", companyName: "", customerType: "",
  });

  const [otpInput,    setOtpInput]    = useState(["","","","","",""]);
const [resetForm,   setResetForm]   = useState({ newPassword: "", confirmPassword: "" });
const [resendTimer, setResendTimer] = useState(0);

useEffect(() => {
  if (resendTimer <= 0) return;
  const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
  return () => clearTimeout(t);
}, [resendTimer]);

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
    if (selectedRole === "customer" && !form.customerType) { setError("Please select your customer type."); return; }
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
          customerType: form.customerType || "",
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
        setForm({ name: "", email: "", password: "", phone: "", companyName: "", customerType: "" });
      }, 2000);
    } catch {
      setLoading(false);
      setError("Cannot connect to server.");
    }
  };





  const handleForgotPassword = async () => {
  if (!form.email) { setError("Please enter your email."); return; }
  if (!selectedRole || selectedRole === "admin") { setError("Please select a valid role."); return; }
  setLoading(true);
  try {
    const res  = await fetch(`${BASE_URL}/api/forgot-password`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, role: selectedRole }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to send OTP."); return; }
    setSuccess("OTP sent to your email!");
    setPage("otp");
    setResendTimer(30);
  } catch {
    setLoading(false);
    setError("Cannot connect to server.");
  }
};

const handleVerifyOtp = async () => {
  const otp = otpInput.join("");
  if (otp.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
  setLoading(true);
  try {
    const res  = await fetch(`${BASE_URL}/api/verify-otp`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, otp, role: selectedRole }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "OTP verification failed."); return; }
    setSuccess("OTP verified! Set your new password.");
    setPage("reset");
  } catch {
    setLoading(false);
    setError("Cannot connect to server.");
  }
};

const handleResetPassword = async () => {
  if (!resetForm.newPassword || resetForm.newPassword.length < 4)
    { setError("Password must be at least 4 characters."); return; }
  if (resetForm.newPassword !== resetForm.confirmPassword)
    { setError("Passwords do not match."); return; }
  setLoading(true);
  try {
    const res  = await fetch(`${BASE_URL}/api/reset-password`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email, otp: otpInput.join(""),
        role: selectedRole, newPassword: resetForm.newPassword,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Reset failed."); return; }
    setSuccess("Password reset! Redirecting to login...");
    setTimeout(() => {
      setPage("login");
      setOtpInput(["","","","","",""]);
      setResetForm({ newPassword:"", confirmPassword:"" });
      setSelectedRole("");
      setForm({ name:"", email:"", password:"", phone:"", companyName:"" });
      setSuccess("");
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
          <img src="/GOIPIMAGE2.png" alt="Syrotech" className="login-logo" />
          <div className="login-brand-text">
            <div className="login-brand-name">GO IP Global Services</div>
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
              <label className="field-label">Email/UserName </label>
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

         <div style={{ textAlign: "right", marginBottom: 6 }}>
  <span className="link" style={{ fontSize: 12 }}
    onClick={() => {
      setPage("forgot"); setError(""); setSuccess("");
      setForm(f => ({ ...f, password: "" }));
    }}>
    Forgot password?
  </span>
</div>

            <button className={`btn-primary ${loading ? "btn-loading" : ""}`}
              onClick={handleLogin} disabled={loading}>
              {loading ? <span className="spinner" /> : "Sign In →"}
            </button>

            <p className="switch-text" style={{ marginTop: 20 }}>
              New here?{" "}
              <span className="link" onClick={() => {
                setSelectedRole("user"); setPage("signup"); setError("");
                setForm({ name: "", email: "", password: "", phone: "", companyName: "", customerType: "" });
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
    <label className="field-label">Customer Type <span style={{ color: "#ff5a00" }}>*</span></label>
    <select name="customerType" value={form.customerType} onChange={handleChange} className="field-input">
      <option value="">-- Select Type --</option>
      <option value="Dealer">Dealer</option>
      <option value="Distributor">Distributor</option>
      <option value="SI Partner">SI Partner</option>
    </select>
  </div>
)}

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

        {/* FORGOT PASSWORD FORM */}
{page === "forgot" && (
  <div className="form-section">
    <h2 className="form-title">Forgot Password</h2>
    <p className="form-subtitle">Enter your email and role to receive an OTP</p>

    <div className="field-group">
      <label className="field-label">Select Role</label>
      <select value={selectedRole}
        onChange={e => { setSelectedRole(e.target.value); setError(""); }}
        className="field-input">
        <option value="">-- Select your role --</option>
        {ROLES.filter(r => r.key !== "admin").map(r => (
          <option key={r.key} value={r.key}>{r.icon} {r.label}</option>
        ))}
      </select>
    </div>

    <div className="field-group">
      <label className="field-label">Registered Email</label>
      <input type="email" name="email" placeholder="you@example.com"
        value={form.email} onChange={handleChange} className="field-input" />
    </div>

    <button className={`btn-primary ${loading ? "btn-loading" : ""}`}
      onClick={handleForgotPassword} disabled={loading}>
      {loading ? <span className="spinner" /> : "Send OTP →"}
    </button>

    <p className="switch-text" style={{ marginTop: 16 }}>
      <span className="link"
        onClick={() => { setPage("login"); setError(""); setSuccess(""); }}>
        ← Back to Login
      </span>
    </p>
  </div>
)}

{/* OTP VERIFICATION FORM */}
{page === "otp" && (
  <div className="form-section">
    <h2 className="form-title">Enter OTP</h2>
    <p className="form-subtitle">
      We sent a 6-digit code to <strong>{form.email}</strong>
    </p>

    <div className="otp-boxes">
      {otpInput.map((val, i) => (
        <input
          key={i} type="text" inputMode="numeric" maxLength={1}
          value={val} className="otp-box"
          onChange={e => {
            const v = e.target.value.replace(/\D/,"");
            const next = [...otpInput]; next[i] = v; setOtpInput(next); setError("");
            if (v && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
          }}
          onKeyDown={e => {
            if (e.key === "Backspace" && !otpInput[i] && i > 0)
              document.getElementById(`otp-${i-1}`)?.focus();
          }}
          id={`otp-${i}`}
        />
      ))}
    </div>

    <button className={`btn-primary ${loading ? "btn-loading" : ""}`}
      onClick={handleVerifyOtp} disabled={loading} style={{ marginTop: 8 }}>
      {loading ? <span className="spinner" /> : "Verify OTP →"}
    </button>

    <p className="switch-text" style={{ marginTop: 14 }}>
      {resendTimer > 0
        ? <span style={{ color: "#6b7280" }}>Resend OTP in {resendTimer}s</span>
        : <span className="link" onClick={handleForgotPassword}>Resend OTP</span>
      }
    </p>

    <p className="switch-text">
      <span className="link"
        onClick={() => { setPage("forgot"); setError(""); setSuccess(""); setOtpInput(["","","","","",""]); }}>
        ← Change Email
      </span>
    </p>
  </div>
)}

{/* RESET PASSWORD FORM */}
{page === "reset" && (
  <div className="form-section">
    <h2 className="form-title">New Password</h2>
    <p className="form-subtitle">Choose a strong new password</p>

    <div className="field-group">
      <label className="field-label">New Password</label>
      <div className="password-box">
        <input type={showPassword ? "text" : "password"}
          placeholder="Min. 4 characters"
          value={resetForm.newPassword} className="field-input"
          onChange={e => { setResetForm(f => ({ ...f, newPassword: e.target.value })); setError(""); }} />
        <button type="button" className="eye-btn"
          onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>
    </div>

    <div className="field-group">
      <label className="field-label">Confirm Password</label>
      <div className="password-box">
        <input type={showPassword ? "text" : "password"}
          placeholder="Repeat your password"
          value={resetForm.confirmPassword} className="field-input"
          onChange={e => { setResetForm(f => ({ ...f, confirmPassword: e.target.value })); setError(""); }} />
      </div>
    </div>

    <button className={`btn-primary ${loading ? "btn-loading" : ""}`}
      onClick={handleResetPassword} disabled={loading}>
      {loading ? <span className="spinner" /> : "Reset Password →"}
    </button>
  </div>
)}

        {/* <p className="footer">© 2026 Syrotech Networks Pvt. Ltd.</p> */}
      </div>
    </div>
  );
}

