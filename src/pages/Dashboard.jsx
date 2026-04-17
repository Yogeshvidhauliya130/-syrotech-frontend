import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

// const BASE_URL = "http://localhost:3001";
const BASE_URL = "https://syrotech-backend.onrender.com";

const STATUS_COLOR = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed" };
const STATUS_BG    = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff" };
const STATUS_ICON  = { open: "🔓", pending: "⏳", resolved: "✅", rma: "🔧" };
const STEPS        = ["pending", "open", "resolved"];

export default function Dashboard() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [form, setForm] = useState({
    category: "", serialNo: "", mac: "", customer: "",
    email: "", phone: "", city: "", country: "", pincode: "",
    description: "", assignTo: "", productImage: ""  // ✅ NEW: productImage
  });
  const [errors, setErrors]                 = useState({});
  const [tickets, setTickets]               = useState([]);
  const [supportPersons, setSupportPersons] = useState([]);
  const [activeTab, setActiveTab]           = useState("raise");
  const [submitting, setSubmitting]         = useState(false);
  const [successMsg, setSuccessMsg]         = useState("");
  const [imagePreview, setImagePreview]     = useState(""); // ✅ NEW

  useEffect(() => {
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(users => setSupportPersons(users.filter(u => u.role === "support" && u.approved)))
      .catch(console.error);
  }, []);

  const fetchTickets = () => {
    fetch(`${BASE_URL}/tickets`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTickets(data); })
      .catch(err => console.error("Failed to load tickets:", err));
  };

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 10000);
    return () => clearInterval(id);
  }, []);

  // ✅ SMART FILTER
  const getFilteredSupportPersons = () => {
    const product = form.category;
    const city    = (form.city    || "").toLowerCase().trim();
    const country = (form.country || "").toLowerCase().trim();
    if (!product) return supportPersons;
    const level1 = supportPersons.filter(p => {
      const specs = Array.isArray(p.specialization) ? p.specialization : [];
      return specs.map(s => s.toLowerCase()).includes(product.toLowerCase()) &&
        city && p.city && p.city.toLowerCase().trim() === city;
    });
    if (level1.length > 0) return level1;
    const level2 = supportPersons.filter(p => {
      const specs = Array.isArray(p.specialization) ? p.specialization : [];
      return specs.map(s => s.toLowerCase()).includes(product.toLowerCase()) &&
        country && p.country && p.country.toLowerCase().trim() === country;
    });
    if (level2.length > 0) return level2;
    const level3 = supportPersons.filter(p => {
      const specs = Array.isArray(p.specialization) ? p.specialization : [];
      return specs.map(s => s.toLowerCase()).includes(product.toLowerCase());
    });
    if (level3.length > 0) return level3;
    return supportPersons;
  };

  const getFilterMessage = () => {
    const product = form.category;
    const city    = (form.city    || "").toLowerCase().trim();
    const country = (form.country || "").toLowerCase().trim();
    if (!product) return null;
    const level1 = supportPersons.filter(p => {
      const specs = Array.isArray(p.specialization) ? p.specialization : [];
      return specs.map(s => s.toLowerCase()).includes(product.toLowerCase()) &&
        city && p.city && p.city.toLowerCase().trim() === city;
    });
    if (level1.length > 0 && city)
      return { msg: `✅ Showing ${product} specialists in ${form.city}`, color: "#10b981", bg: "#ecfdf5" };
    const level2 = supportPersons.filter(p => {
      const specs = Array.isArray(p.specialization) ? p.specialization : [];
      return specs.map(s => s.toLowerCase()).includes(product.toLowerCase()) &&
        country && p.country && p.country.toLowerCase().trim() === country;
    });
    if (level2.length > 0 && country)
      return { msg: `⚠️ No specialist in ${form.city || "your city"} — showing ${product} specialists in ${form.country}`, color: "#f59e0b", bg: "#fffbeb" };
    const level3 = supportPersons.filter(p => {
      const specs = Array.isArray(p.specialization) ? p.specialization : [];
      return specs.map(s => s.toLowerCase()).includes(product.toLowerCase());
    });
    if (level3.length > 0)
      return { msg: `ℹ️ No location match — showing all ${product} specialists`, color: "#3b82f6", bg: "#eff6ff" };
    return { msg: `⚠️ No specialist found for ${product} — showing all support persons`, color: "#ef4444", bg: "#fef2f2" };
  };

  const filteredSupportPersons = getFilteredSupportPersons();
  const filterMessage          = getFilterMessage();

  // ✅ NEW: Image upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, productImage: "Image must be less than 3MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({ ...prev, productImage: ev.target.result }));
      setImagePreview(ev.target.result);
      setErrors(prev => ({ ...prev, productImage: "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "customer" && value !== "" && !/^[a-zA-Z\s]*$/.test(value)) return;
    if (name === "pincode"  && value !== "" && !/^\d*$/.test(value))          return;
    if (name === "category" || name === "city" || name === "country") {
      setForm(prev => ({ ...prev, [name]: value, assignTo: "" }));
    } else {
      setForm({ ...form, [name]: value });
    }
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.category)     newErrors.category = "Please select a product.";
    if (!form.serialNo.trim()) newErrors.serialNo = "Serial number is required.";
    if (!form.customer.trim()) newErrors.customer = "Customer name is required.";
    else if (/\d/.test(form.customer)) newErrors.customer = "Name cannot contain numbers.";
    else if (form.customer.trim().length < 2) newErrors.customer = "Enter a valid full name.";
    if (!form.email.trim()) newErrors.email = "Customer email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Enter a valid email address.";
    if (!form.phone.trim()) newErrors.phone = "Contact number is required.";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s+/g, ""))) newErrors.phone = "Enter a valid 10-digit phone number.";
    if (!form.city.trim())    newErrors.city    = "City is required.";
    if (!form.country)        newErrors.country = "Please select a country.";
    if (!form.pincode.trim()) newErrors.pincode = "Pincode is required.";
    else if (!/^\d{6}$/.test(form.pincode.trim())) newErrors.pincode = "Enter a valid 6-digit pincode.";
    if (!form.assignTo)       newErrors.assignTo = "Please assign a support person.";
    if (!form.productImage)   newErrors.productImage = "Product image is required.";
    if (!form.description.trim()) newErrors.description = "Description is required.";
    else if (form.description.trim().length < 20) newErrors.description = "Description must be at least 20 characters.";
    else if (form.description.trim().length > 500) newErrors.description = "Description cannot exceed 500 characters.";
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErr = document.querySelector(".field-error");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // ✅ NEW: Check same customer (same phone + product + serial)
    const cleanPhone = form.phone.replace(/\s+/g, "");
    const sameCustomerTicket = tickets.find(t =>
      t.phone === cleanPhone &&
      t.category === form.category &&
      t.serialNo.trim().toLowerCase() === form.serialNo.trim().toLowerCase()
    );

    if (sameCustomerTicket) {
      // ✅ Add new issue to existing ticket instead of creating new
      setSubmitting(true);
      const issueEntry = {
        description:  form.description,
        raisedBy:     currentUser?.email,
        raisedByName: currentUser?.name,
        raisedAt:     new Date().toISOString(),
        assignTo:     form.assignTo,
      };
      const existingHistory = Array.isArray(sameCustomerTicket.issueHistory) ? sameCustomerTicket.issueHistory : [];
      const updates = {
        issueHistory: [...existingHistory, issueEntry],
        description:  form.description,
        assignTo:     form.assignTo,
        date:         new Date().toISOString().slice(0, 10),
      };
      // If ticket was resolved, reopen it
      if (sameCustomerTicket.status === "resolved" || sameCustomerTicket.status === "rma") {
        updates.status     = "pending";
        updates.resolvedAt = null;
        updates.acceptedAt = null;
        updates.rmaStatus  = false;
        updates.rmaReason  = "";
      }
      // Update image if new one uploaded
      if (form.productImage) updates.productImage = form.productImage;

      fetch(`${BASE_URL}/tickets/${sameCustomerTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
        .then(r => r.json())
        .then(updated => {
          setTickets(prev => prev.map(t => t.id === sameCustomerTicket.id ? updated : t));
          setForm({ category: "", serialNo: "", mac: "", customer: "", email: "", phone: "", city: "", country: "", pincode: "", description: "", assignTo: "", productImage: "" });
          setImagePreview("");
          setErrors({});
          setSuccessMsg(`✅ Same customer found! Issue updated in existing Ticket #${sameCustomerTicket.id.slice(-8)}. Status reset to PENDING.`);
          setActiveTab("mytickets");
          setTimeout(() => setSuccessMsg(""), 6000);
        })
        .catch(() => setErrors({ submit: "❌ Failed to update ticket." }))
        .finally(() => setSubmitting(false));
      return;
    }

    setSubmitting(true);
    const newTicket = {
      ...form,
      phone:        form.phone.replace(/\s+/g, ""),
      status:       "pending",
      raisedBy:     currentUser?.email || "unknown",
      raisedByName: currentUser?.name  || "Unknown",
      date:         new Date().toISOString().slice(0, 10),
      createdAt:    new Date().toISOString(),
    };
    fetch(`${BASE_URL}/tickets`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTicket)
    })
      .then(res => { if (!res.ok) throw new Error("Server error"); return res.json(); })
      .then(saved => {
        setTickets(prev => [...prev, saved]);
        setForm({ category: "", serialNo: "", mac: "", customer: "", email: "", phone: "", city: "", country: "", pincode: "", description: "", assignTo: "", productImage: "" });
        setImagePreview("");
        setErrors({});
        setSuccessMsg("✅ Ticket submitted successfully! Status: PENDING");
        setActiveTab("mytickets");
        setTimeout(() => setSuccessMsg(""), 4000);
      })
      .catch(() => setErrors({ submit: "❌ Failed to submit ticket. Make sure backend is running on port 3001." }))
      .finally(() => setSubmitting(false));
  };

  const myTickets = tickets
    .filter(t => t.raisedBy === currentUser?.email)
    .slice()
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const borderColor = (field) => errors[field] ? "#ef4444" : "#ddd5c8";
  const inputStyle  = (field) => ({
    width: "100%", padding: "11px 14px",
    border: `2px solid ${borderColor(field)}`,
    borderRadius: 10, fontSize: 13.5, boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.25s",
    background: errors[field] ? "#fff5f5" : "#f0ebe3",
    fontFamily: "DM Sans, sans-serif", color: "#111",
  });

  return (
    <div className="dashboard-wrapper">

      {/* Navbar */}
      <div className="dash-navbar">
        <div className="dash-brand">
          <div className="dash-logo">S</div>
          <div>
            <div className="dash-brand-name">Syrotech Support</div>
            <div className="dash-brand-sub">Customer Portal</div>
          </div>
        </div>
        <div className="dash-user-area">
          <div className="dash-user-badge">
            <span className="dash-user-icon">👤</span>
            <span className="dash-user-name">{currentUser?.name || currentUser?.email}</span>
          </div>
          <button className="dash-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        {[
          ["raise",     "🎫 Raise Ticket"],
          ["mytickets", `📋 My Tickets (${myTickets.length})`],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`dash-tab-btn ${activeTab === key ? "dash-tab-active" : ""}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="dash-body">

        {successMsg && (
          <div style={{
            background: "#ecfdf5", border: "1.5px solid #6ee7b7",
            borderRadius: 10, padding: "12px 20px", marginBottom: 16,
            fontSize: 14, fontWeight: 600, color: "#065f46",
            display: "flex", alignItems: "center", gap: 10
          }}>
            {successMsg}
          </div>
        )}

        {/* ══ RAISE TICKET ══ */}
        {activeTab === "raise" && (
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">🎫</div>
              <div>
                <h2 className="form-card-title">Raise New Support Ticket</h2>
                <p className="form-card-sub">All fields marked <span style={{color:"#ff6b35"}}>*</span> are required.</p>
              </div>
            </div>

            {errors.submit && <div className="form-error-banner">{errors.submit}</div>}

            <div className="form-grid">

              {/* Product */}
              <div className="form-field">
                <label className="form-label">Product <span className="req">*</span></label>
                <select name="category" value={form.category} onChange={handleChange} style={inputStyle("category")}>
                  <option value="">Select Product</option>
                  <option>Router</option>
                  <option>ONU</option>
                  <option>Switch</option>
                </select>
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>

              {/* Serial Number */}
              <div className="form-field">
                <label className="form-label">Serial Number <span className="req">*</span></label>
                <input name="serialNo" placeholder="e.g. SYR-20240001"
                  value={form.serialNo} onChange={handleChange} style={inputStyle("serialNo")} />
                {errors.serialNo && <span className="field-error">{errors.serialNo}</span>}
              </div>

              {/* MAC Address */}
              <div className="form-field">
                <label className="form-label">MAC Address</label>
                <input name="mac" placeholder="e.g. AA:BB:CC:DD:EE:FF"
                  value={form.mac} onChange={handleChange} style={inputStyle("mac")} />
              </div>

              {/* Customer Name */}
              <div className="form-field">
                <label className="form-label">Customer Name <span className="req">*</span></label>
                <input name="customer" placeholder="Full name (letters only)"
                  value={form.customer} onChange={handleChange} style={inputStyle("customer")} />
                {errors.customer && <span className="field-error">{errors.customer}</span>}
              </div>

              {/* Customer Email */}
              <div className="form-field">
                <label className="form-label">Customer Email <span className="req">*</span></label>
                <input name="email" placeholder="customer@email.com"
                  value={form.email} onChange={handleChange} style={inputStyle("email")} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              {/* Phone */}
              <div className="form-field">
                <label className="form-label">
                  Contact Number <span className="req">*</span>
                  <span className="form-hint"> (10 digits)</span>
                </label>
                <input name="phone" placeholder="e.g. 9876543210"
                  value={form.phone} onChange={handleChange} maxLength={10} style={inputStyle("phone")} />
                {errors.phone
                  ? <span className="field-error">{errors.phone}</span>
                  : <span className="field-hint">{form.phone.replace(/\s+/g,"").length}/10 digits</span>
                }
              </div>

              {/* City */}
              <div className="form-field">
                <label className="form-label">City <span className="req">*</span></label>
                <input name="city" placeholder="e.g. Mumbai"
                  value={form.city} onChange={handleChange} style={inputStyle("city")} />
                {errors.city && <span className="field-error">{errors.city}</span>}
              </div>

              {/* Country */}
              <div className="form-field">
                <label className="form-label">Country <span className="req">*</span></label>
                <select name="country" value={form.country} onChange={handleChange} style={inputStyle("country")}>
                  <option value="">Select Country</option>
                  <option>India</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>United Arab Emirates</option>
                  <option>Saudi Arabia</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>Singapore</option>
                  <option>Germany</option>
                  <option>France</option>
                  <option>Nepal</option>
                  <option>Bangladesh</option>
                  <option>Sri Lanka</option>
                  <option>Pakistan</option>
                  <option>Other</option>
                </select>
                {errors.country && <span className="field-error">{errors.country}</span>}
              </div>

              {/* Pincode */}
              <div className="form-field">
                <label className="form-label">
                  Pincode <span className="req">*</span>
                  <span className="form-hint"> (6 digits)</span>
                </label>
                <input name="pincode" placeholder="e.g. 400001"
                  value={form.pincode} onChange={handleChange} maxLength={6} style={inputStyle("pincode")} />
                {errors.pincode
                  ? <span className="field-error">{errors.pincode}</span>
                  : <span className="field-hint">{form.pincode.length}/6 digits</span>
                }
              </div>

              {/* Assign Support — Smart Filtered */}
              <div className="form-field">
                <label className="form-label">
                  Assign Support Person <span className="req">*</span>
                  {form.category && <span className="form-hint"> (filtered by product & location)</span>}
                </label>
                {filterMessage && (
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: filterMessage.color, background: filterMessage.bg,
                    padding: "6px 10px", borderRadius: 6, marginBottom: 6,
                    border: `1px solid ${filterMessage.color}22`,
                  }}>
                    {filterMessage.msg}
                  </div>
                )}
                <select name="assignTo" value={form.assignTo} onChange={handleChange} style={inputStyle("assignTo")}>
                  <option value="">
                    {form.category
                      ? `Choose ${form.category} specialist${form.city ? ` in ${form.city}` : ""}`
                      : "Select product first to filter specialists"
                    }
                  </option>
                  {filteredSupportPersons.map(p => (
                    <option key={p.email} value={p.name}>
                      {p.name} — {p.city || "—"}
                      {p.specialization && p.specialization.length > 0 ? ` (${p.specialization.join(", ")})` : ""}
                    </option>
                  ))}
                </select>
                {errors.assignTo && <span className="field-error">{errors.assignTo}</span>}
              </div>

            </div>

            {/* ✅ NEW: Product Image Upload */}
            <div className="form-field" style={{ padding: "20px 36px 0" }}>
              <label className="form-label">
  Product Image <span className="req">*</span>
  <span className="form-hint"> (upload photo showing serial no & MAC address)</span>
</label>
              <div style={{
                border: `2px dashed ${errors.productImage ? "#ef4444" : "#ddd5c8"}`,
                borderRadius: 10, padding: "16px 20px",
                background: "#f9f7f4", textAlign: "center",
              }}>
                {!imagePreview ? (
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>
                      Upload product photo (max 3MB)
                    </div>
                    <label style={{
                      background: "#ff5a00", color: "white",
                      padding: "8px 20px", borderRadius: 8, cursor: "pointer",
                      fontSize: 13, fontWeight: 600, display: "inline-block",
                    }}>
                      Choose Image
                      <input type="file" accept="image/*" onChange={handleImageUpload}
                        style={{ display: "none" }} />
                    </label>
                  </div>
                ) : (
                  <div>
                    <img src={imagePreview} alt="Product"
                      style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, border: "2px solid #e0d8d0", marginBottom: 10 }} />
                    <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                      <label style={{
                        background: "#f0ebe3", color: "#555", border: "1px solid #ddd5c8",
                        padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12,
                      }}>
                        Change Image
                        <input type="file" accept="image/*" onChange={handleImageUpload}
                          style={{ display: "none" }} />
                      </label>
                      <button type="button"
                        onClick={() => { setImagePreview(""); setForm(prev => ({ ...prev, productImage: "" })); }}
                        style={{
                          background: "#fee2e2", color: "#dc2626",
                          border: "1px solid #fca5a5", padding: "6px 14px",
                          borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600,
                        }}>
                        Remove
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: "#10b981", marginTop: 8, fontWeight: 600 }}>
                      ✅ Image uploaded — serial no & MAC will be visible
                    </div>
                  </div>
                )}
              </div>
              {errors.productImage && <span className="field-error">{errors.productImage}</span>}
            </div>

            {/* Description */}
            <div className="form-field" style={{ padding: "20px 36px 0" }}>
              <label className="form-label">
                Issue Description <span className="req">*</span>
                <span className="form-hint"> (min 20, max 500 characters)</span>
              </label>
              <textarea name="description" rows={4}
                placeholder="Describe the issue in detail — what happened, when it started, what error you see..."
                value={form.description} onChange={handleChange}
                style={{ ...inputStyle("description"), resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                {errors.description
                  ? <span className="field-error">{errors.description}</span>
                  : <span className="field-hint">{form.description.length}/500 characters</span>
                }
                <span className={`char-count ${form.description.length < 20 ? "char-short" : form.description.length > 450 ? "char-warn" : "char-ok"}`}>
                  {form.description.length < 20
                    ? `${20 - form.description.length} more chars needed`
                    : `${500 - form.description.length} chars left`}
                </span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className={`submit-btn ${submitting ? "submit-btn-loading" : ""}`}>
              {submitting ? <><span className="btn-spinner" /> Submitting...</> : "🎫 Submit Ticket"}
            </button>
          </div>
        )}

        {/* ══ MY TICKETS ══ */}
        {activeTab === "mytickets" && (
          <div>
            <div className="tickets-header">
              <div>
                <h2 className="tickets-title">My Tickets</h2>
                <p className="tickets-sub">Track the status of all your raised tickets</p>
              </div>
              <button className="btn-raise-new" onClick={() => setActiveTab("raise")}>
                + Raise New Ticket
              </button>
            </div>

            {myTickets.length > 0 && (
              <div className="tickets-summary">
                {[
                  ["pending","⏳","#fffbeb","#b45309"],
                  ["open",   "🔓","#fff4ee","#e04e00"],
                  ["resolved","✅","#edfaf3","#1a7a46"],
                  ["rma",    "🔧","#f5f3ff","#7c3aed"],
                ].map(([s, icon, bg, col]) => (
                  myTickets.filter(t => t.status === s).length > 0 && (
                    <div key={s} className="summary-pill" style={{ background: bg, color: col }}>
                      {icon} {myTickets.filter(t => t.status === s).length}{" "}
                      {s.toUpperCase()}
                    </div>
                  )
                ))}
              </div>
            )}

            {myTickets.length === 0 ? (
              <div className="tickets-empty">
                <div className="tickets-empty-icon">🎫</div>
                <p className="tickets-empty-text">You haven't raised any tickets yet.</p>
                <button className="btn-raise-new" onClick={() => setActiveTab("raise")}>
                  Raise First Ticket
                </button>
              </div>
            ) : (
              <div className="tickets-list">
                {myTickets.map(ticket => {
                  const s           = (ticket.status || "pending").toLowerCase();
                  const currentStep = STEPS.indexOf(s);
                  return (
                    <div key={ticket.id} className="ticket-card"
                      style={{ borderLeftColor: STATUS_COLOR[s] || "#ccc" }}>

                      <div className="ticket-card-header">
                        <div className="ticket-card-title-row">
                          <span className="ticket-product">{ticket.category}</span>
                          <span className="ticket-id">Ticket #{ticket.id?.slice(-8)}</span>
                        </div>
                        <span className="ticket-status-badge"
                          style={{ color: STATUS_COLOR[s], background: STATUS_BG[s] }}>
                          {STATUS_ICON[s] || "🎫"} {s.toUpperCase()}
                        </span>
                      </div>

                      <div className="ticket-details-grid">
                        <div className="labels-row">
                          <div className="ticket-detail-item"><span className="detail-label">Serial No</span></div>
                          <div className="ticket-detail-item"><span className="detail-label">Assigned To</span></div>
                          <div className="ticket-detail-item"><span className="detail-label">Date Raised</span></div>
                          <div className="ticket-detail-item"><span className="detail-label">Customer</span></div>
                          <div className="ticket-detail-item"><span className="detail-label">Contact</span></div>
                          {ticket.city    && <div className="ticket-detail-item"><span className="detail-label">City</span></div>}
                          {ticket.country && <div className="ticket-detail-item"><span className="detail-label">Country</span></div>}
                          {ticket.resolvedAt && <div className="ticket-detail-item"><span className="detail-label">Resolved On</span></div>}
                        </div>
                        <div className="values-row">
                          <div className="ticket-detail-item"><span className="detail-value">{ticket.serialNo}</span></div>
                          <div className="ticket-detail-item"><span className="detail-value">{ticket.assignTo || "—"}</span></div>
                          <div className="ticket-detail-item"><span className="detail-value">{ticket.date}</span></div>
                          <div className="ticket-detail-item"><span className="detail-value">{ticket.customer || "—"}</span></div>
                          <div className="ticket-detail-item"><span className="detail-value">{ticket.phone || "—"}</span></div>
                          {ticket.city    && <div className="ticket-detail-item"><span className="detail-value">{ticket.city}</span></div>}
                          {ticket.country && <div className="ticket-detail-item"><span className="detail-value">{ticket.country}</span></div>}
                          {ticket.resolvedAt && <div className="ticket-detail-item"><span className="detail-value">{new Date(ticket.resolvedAt).toLocaleDateString()}</span></div>}
                        </div>
                      </div>

                      {/* ✅ NEW: Product Image */}
                      {ticket.productImage && (
                        <div style={{ margin: "0 24px 14px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                            📷 Product Image
                          </div>
                          <img src={ticket.productImage} alt="Product"
                            style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, border: "2px solid #e0d8d0", cursor: "pointer" }}
                            onClick={() => window.open(ticket.productImage, "_blank")}
                          />
                        </div>
                      )}

                      {/* ✅ NEW: RMA Info */}
                      {ticket.rmaStatus && (
                        <div style={{
                          margin: "0 24px 14px",
                          background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                          border: "1.5px solid #c4b5fd", borderRadius: 10, padding: "12px 16px",
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6", marginBottom: 6 }}>
                            🔧 Product Sent to RMA Center
                          </div>
                          <div style={{ fontSize: 12, color: "#6d28d9", lineHeight: 1.8 }}>
                            <div>Reason: <strong>{ticket.rmaReason}</strong></div>
                            <div>Center: <strong>{ticket.rmaCenterName}</strong></div>
                            <div>Address: {ticket.rmaCenterAddress}</div>
                            <div>📞 {ticket.rmaCenterPhone}</div>
                          </div>
                        </div>
                      )}

                      {/* ✅ NEW: Issue History */}
                      {ticket.issueHistory && ticket.issueHistory.length > 0 && (
                        <div style={{ margin: "0 24px 14px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                            🔁 Previous Issues ({ticket.issueHistory.length})
                          </div>
                          {ticket.issueHistory.map((h, i) => (
                            <div key={i} style={{
                              background: "#f9f7f4", border: "1px solid #e8ddd4",
                              borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 12,
                            }}>
                              <div style={{ color: "#555", marginBottom: 2 }}>
                                {h.description}
                              </div>
                              <div style={{ color: "#9ca3af", fontSize: 11 }}>
                                Raised on: {h.raisedAt ? new Date(h.raisedAt).toLocaleString() : "—"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {ticket.reassignedFrom && (
                        <div style={{
                          margin: "0 24px 14px",
                          background: "#fffbeb", border: "1px solid #fde68a",
                          borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e",
                        }}>
                          🔄 This ticket was reassigned to <strong>{ticket.assignTo}</strong>
                          {ticket.reassignReason && <> — Reason: "<em>{ticket.reassignReason}</em>"</>}
                        </div>
                      )}

                      <div className="ticket-description">
                        <span className="detail-label">Issue: </span>
                        {ticket.description}
                      </div>

                      {ticket.feedbackRating && (
                        <div style={{
                          margin: "0 24px 16px", background: "#eff6ff",
                          border: "1.5px solid #93c5fd", borderRadius: 10, padding: "12px 16px",
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", marginBottom: 6, textTransform: "uppercase" }}>
                            ⭐ Your Feedback
                          </div>
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                            <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                              {"★".repeat(ticket.feedbackRating)}{"☆".repeat(5 - ticket.feedbackRating)} ({ticket.feedbackRating}/5)
                            </span>
                            {ticket.feedbackResolved && <span>Resolved: <strong>{ticket.feedbackResolved}</strong></span>}
                            {ticket.feedbackComment  && <span>"{ticket.feedbackComment}"</span>}
                          </div>
                        </div>
                      )}

                      {/* Progress — only for non-RMA */}
                      {s !== "rma" && (
                        <div className="ticket-progress">
                          <div className="progress-label">TICKET PROGRESS</div>
                          <div className="progress-steps">
                            {STEPS.map((step, i) => {
                              const stepIdx = STEPS.indexOf(step);
                              const done    = stepIdx <= currentStep;
                              const active  = stepIdx === currentStep;
                              return (
                                <div key={step} className="step-wrapper"
                                  style={{ flex: i < STEPS.length - 1 ? 1 : 0 }}>
                                  <div className="step-item">
                                    <div className="step-circle" style={{
                                      background: done ? (STATUS_COLOR[step] || "#ff5a00") : "#e5e7eb",
                                      color:      done ? "white" : "#9ca3af",
                                      boxShadow:  active ? `0 0 0 4px ${STATUS_BG[step]}` : "none",
                                      border:     active ? `2px solid ${STATUS_COLOR[step]}` : "2px solid transparent",
                                    }}>
                                      {stepIdx < currentStep ? "✓" : STATUS_ICON[step]}
                                    </div>
                                    <span className="step-label" style={{ color: done ? "#333" : "#9ca3af", fontWeight: done ? 600 : 400 }}>
                                      {step}
                                    </span>
                                  </div>
                                  {i < STEPS.length - 1 && (
                                    <div className="step-connector"
                                      style={{ background: stepIdx < currentStep ? "#10b981" : "#e5e7eb" }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {(ticket.acceptedAt || ticket.resolvedAt) && (
                        <div className="ticket-timestamps">
                          {ticket.acceptedAt && (
                            <span className="timestamp open">
                              🔓 Accepted: {new Date(ticket.acceptedAt).toLocaleString()}
                            </span>
                          )}
                          {ticket.resolvedAt && (
                            <span className="timestamp resolved">
                              ✅ Resolved: {new Date(ticket.resolvedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}