import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SALES_PRODUCT_MODELS, SALES_PRODUCTS } from "../data/productModels";
import "./Dashboard.css";

const BASE_URL = "https://syrotech-backend.onrender.com";

const STATUS_COLOR = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed" };
const STATUS_BG    = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff" };
const STATUS_ICON  = { open: "🔓", pending: "⏳", resolved: "✅", rma: "🔧" };

const openImageInNewTab = (imgSrc) => {
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head><title>Product Image</title></head>
      <body style="margin:0;background:#111;display:flex;justify-content:center;align-items:flex-start;min-height:100vh;padding:20px;box-sizing:border-box;">
        <img src="${imgSrc}" style="max-width:100%;height:auto;border-radius:8px;" />
      </body>
    </html>
  `);
  win.document.close();
};

export default function Dashboard() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [form, setForm] = useState({
    category: "", model: "", serialNo: "", mac: "", customer: "",
    email: "", phone: "", city: "", country: "", pincode: "",
    description: "", assignTo: "", productImage: ""
  });
  const [errors, setErrors]                 = useState({});
  const [tickets, setTickets]               = useState([]);
  const [supportPersons, setSupportPersons] = useState([]);
  const [activeTab, setActiveTab]           = useState("raise");
  const [submitting, setSubmitting]         = useState(false);
  const [successMsg, setSuccessMsg]         = useState("");
  const [imagePreview, setImagePreview]     = useState("");
  const [expandedImage, setExpandedImage]   = useState(null);
  const [issuePopup, setIssuePopup]         = useState(null);
  const [rmaPopup, setRmaPopup]             = useState(null);
  const [productPopup, setProductPopup]     = useState(null);
  const [customerPopup, setCustomerPopup]   = useState(null);
  const [assigneePopup, setAssigneePopup]   = useState(null);

  const [dateSort, setDateSort]           = useState("newest");
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [searchQuery, setSearchQuery]     = useState("");

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
    if (name === "category") {
      setForm(prev => ({ ...prev, [name]: value, model: "", assignTo: "" }));
    } else if (name === "city" || name === "country") {
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
    if (!form.model)        newErrors.model    = "Please select a model.";
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

    const cleanPhone = form.phone.replace(/\s+/g, "");
    const sameCustomerTicket = tickets.find(t =>
      t.phone === cleanPhone &&
      t.category === form.category &&
      t.serialNo.trim().toLowerCase() === form.serialNo.trim().toLowerCase()
    );

    if (sameCustomerTicket) {
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
      if (sameCustomerTicket.status === "resolved" || sameCustomerTicket.status === "rma") {
        updates.status     = "pending";
        updates.resolvedAt = null;
        updates.acceptedAt = null;
        updates.rmaStatus  = false;
        updates.rmaReason  = "";
      }
      if (form.productImage) updates.productImage = form.productImage;

      fetch(`${BASE_URL}/tickets/${sameCustomerTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
        .then(r => r.json())
        .then(updated => {
          setTickets(prev => prev.map(t => t.id === sameCustomerTicket.id ? updated : t));
          setForm({ category: "", model: "", serialNo: "", mac: "", customer: "", email: "", phone: "", city: "", country: "", pincode: "", description: "", assignTo: "", productImage: "" });
          setImagePreview("");
          setErrors({});
          setSuccessMsg(`✅ Same customer found! Issue updated in existing Ticket. Status reset to PENDING.`);
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
      status:       "open",
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
        setForm({ category: "", model: "", serialNo: "", mac: "", customer: "", email: "", phone: "", city: "", country: "", pincode: "", description: "", assignTo: "", productImage: "" });
        setImagePreview("");
        setErrors({});
        setSuccessMsg("✅ Ticket submitted successfully! Status: PENDING");
        setActiveTab("mytickets");
        setTimeout(() => setSuccessMsg(""), 4000);
      })
      .catch(() => setErrors({ submit: "❌ Failed to submit ticket." }))
      .finally(() => setSubmitting(false));
  };

  const myTickets = tickets
    .filter(t => t.raisedBy === currentUser?.email)
    .slice()
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const displayTickets = myTickets
    .filter(t => productFilter === "all" || t.category === productFilter)
    .filter(t => statusFilter === "all" || (t.status || "pending").toLowerCase() === statusFilter)
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (t.customer  || "").toLowerCase().includes(q) ||
        (t.date      || "").toLowerCase().includes(q) ||
        (t.serialNo  || "").toLowerCase().includes(q) ||
        (t.phone     || "").toLowerCase().includes(q) ||
        (t.city      || "").toLowerCase().includes(q) ||
        (t.assignTo  || "").toLowerCase().includes(q) ||
        (t.category  || "").toLowerCase().includes(q)
      );
    })
    .slice()
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.date).getTime();
      const db = new Date(b.createdAt || b.date).getTime();
      return dateSort === "newest" ? db - da : da - db;
    });

  const uniqueProducts = [...new Set(myTickets.map(t => t.category).filter(Boolean))];

  const statusCounts = {
    all:      myTickets.length,
    pending:  myTickets.filter(t => t.status === "pending").length,
    open:     myTickets.filter(t => t.status === "open").length,
    resolved: myTickets.filter(t => t.status === "resolved").length,
    rma:      myTickets.filter(t => t.status === "rma").length,
  };

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

  // ✅ Shared td style with dark right border line
  const tdStyle = (extra = {}) => ({
    borderRight: "1px solid #e0d8d0",
    ...extra,
  });

  return (
    <div className="dashboard-wrapper">

      {/* Issue/Resolution Popup Modal */}
      {issuePopup && (
        <div
          onClick={() => setIssuePopup(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 14, padding: "24px 28px",
              maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: "2px solid #fad8be"
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: issuePopup.resolutionNotes ? "#1a7a46" : "#c94500" }}>
                {issuePopup.resolutionNotes ? "✅ Ticket Resolved" : "📋 Issue Description"}
              </div>
              <button onClick={() => setIssuePopup(null)}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                ✕ Close
              </button>
            </div>
            {issuePopup.resolutionNotes ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  🔧 What was solved (by {issuePopup.resolvedBy || "Support"}):
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#ecfdf5", padding: "14px 16px", borderRadius: 10, border: "1px solid #6ee7b7", borderLeft: "4px solid #10b981", marginBottom: 14 }}>
                  {issuePopup.resolutionNotes}
                </div>
                {issuePopup.resolutionTimeTaken && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                    ⏱️ Time taken: <strong>{issuePopup.resolutionTimeTaken}</strong>
                  </div>
                )}
                {issuePopup.resolvedAt && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
                    📅 Resolved on: <strong>{new Date(issuePopup.resolvedAt).toLocaleString()}</strong>
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  📋 Original Issue:
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, background: "#f9fafb", padding: "12px 14px", borderRadius: 8, border: "1px solid #e5e7eb", borderLeft: "3px solid #ff5a00" }}>
                  {issuePopup.description}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#fff8f2", padding: "14px 16px", borderRadius: 10, border: "1px solid #fad8be", borderLeft: "4px solid #ff5a00" }}>
                {issuePopup.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RMA Detail Popup */}
      {rmaPopup && (
        <div onClick={() => setRmaPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #c4b5fd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#5b21b6" }}>🔧 RMA Details</div>
              <button onClick={() => setRmaPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "14px 16px", marginBottom: 14, border: "1px solid #c4b5fd" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", marginBottom: 6 }}>Reason for RMA:</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>{rmaPopup.rmaReason || "—"}</div>
            </div>
            <div style={{ background: "#faf7f4", borderRadius: 10, padding: "14px 16px", border: "1px solid #e0d8d0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 10 }}>RMA Center Details:</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 4 }}>📍 {rmaPopup.rmaCenterName || "—"}</div>
              {rmaPopup.rmaCenterCity && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>🏙️ {rmaPopup.rmaCenterCity}</div>}
              {rmaPopup.rmaCenterAddress && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>🗺️ {rmaPopup.rmaCenterAddress}</div>}
              {rmaPopup.rmaCenterPhone && <div style={{ fontSize: 12, color: "#6b7280" }}>📞 {rmaPopup.rmaCenterPhone}</div>}
            </div>
            {rmaPopup.rmaSentAt && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 12 }}>📅 Sent on: {new Date(rmaPopup.rmaSentAt).toLocaleString()}</div>}
          </div>
        </div>
      )}

      {/* Product Detail Popup */}
      {productPopup && (
        <div onClick={() => setProductPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fad8be" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#c94500" }}>📦 Product Details</div>
              <button onClick={() => setProductPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#fff8f2", borderRadius: 10, padding: "14px 16px", border: "1px solid #fad8be" }}>
              {[["🔧 Product", productPopup.category], ["📐 Model", productPopup.model], ["🔢 Serial No", productPopup.serialNo], ["📡 MAC Address", productPopup.mac]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 110 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Popup */}
      {customerPopup && (
        <div onClick={() => setCustomerPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #bfdbfe" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8" }}>👤 Customer Details</div>
              <button onClick={() => setCustomerPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#eff6ff", borderRadius: 10, padding: "14px 16px", border: "1px solid #bfdbfe" }}>
              {[["👤 Name", customerPopup.customer], ["📞 Phone", customerPopup.phone], ["🏙️ City", customerPopup.city], ["🌍 Country", customerPopup.country]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 90 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assignee Detail Popup */}
      {assigneePopup && (
        <div onClick={() => setAssigneePopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fde68a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#92400e" }}>🛠️ Assigned Support</div>
              <button onClick={() => setAssigneePopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#fffbeb", borderRadius: 10, padding: "14px 16px", border: "1px solid #fde68a" }}>
              {[["🛠️ Name", assigneePopup.name], ["📞 Phone", assigneePopup.phone], ["🏙️ City", assigneePopup.city], ["🎯 Specialization", assigneePopup.specialization]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", minWidth: 110 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <div className="dash-navbar">
        <div className="dash-brand">
          <img src="/logo.png" alt="Syrotech" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "contain" }} />
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

        {/* RAISE TICKET */}
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
              <div className="form-field">
                <label className="form-label">Product <span className="req">*</span></label>
                <select name="category" value={form.category} onChange={handleChange} style={inputStyle("category")}>
                  <option value="">Select Product</option>
                  {SALES_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Model <span className="req">*</span></label>
                <select name="model" value={form.model} onChange={handleChange} style={{ ...inputStyle("model"), color: !form.category ? "#888" : "#111" }} disabled={!form.category}>
                  <option value="">{form.category ? `Select ${form.category} model` : "Select product first"}</option>
                  {(SALES_PRODUCT_MODELS[form.category] || []).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.model && <span className="field-error">{errors.model}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Serial Number <span className="req">*</span></label>
                <input name="serialNo" placeholder="e.g. SYR-20240001"
                  value={form.serialNo} onChange={handleChange} style={inputStyle("serialNo")} />
                {errors.serialNo && <span className="field-error">{errors.serialNo}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">MAC Address</label>
                <input name="mac" placeholder="e.g. AA:BB:CC:DD:EE:FF"
                  value={form.mac} onChange={handleChange} style={inputStyle("mac")} />
              </div>

              <div className="form-field">
                <label className="form-label">Customer Name <span className="req">*</span></label>
                <input name="customer" placeholder="Full name (letters only)"
                  value={form.customer} onChange={handleChange} style={inputStyle("customer")} />
                {errors.customer && <span className="field-error">{errors.customer}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Customer Email <span className="req">*</span></label>
                <input name="email" placeholder="customer@email.com"
                  value={form.email} onChange={handleChange} style={inputStyle("email")} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Contact Number <span className="req">*</span><span className="form-hint"> (10 digits)</span></label>
                <input name="phone" placeholder="e.g. 9876543210"
                  value={form.phone} onChange={handleChange} maxLength={10} style={inputStyle("phone")} />
                {errors.phone
                  ? <span className="field-error">{errors.phone}</span>
                  : <span className="field-hint">{form.phone.replace(/\s+/g,"").length}/10 digits</span>
                }
              </div>

              <div className="form-field">
                <label className="form-label">City <span className="req">*</span></label>
                <input name="city" placeholder="e.g. Mumbai"
                  value={form.city} onChange={handleChange} style={inputStyle("city")} />
                {errors.city && <span className="field-error">{errors.city}</span>}
              </div>

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

              <div className="form-field">
                <label className="form-label">Pincode <span className="req">*</span><span className="form-hint"> (6 digits)</span></label>
                <input name="pincode" placeholder="e.g. 400001"
                  value={form.pincode} onChange={handleChange} maxLength={6} style={inputStyle("pincode")} />
                {errors.pincode
                  ? <span className="field-error">{errors.pincode}</span>
                  : <span className="field-hint">{form.pincode.length}/6 digits</span>
                }
              </div>

              <div className="form-field">
                <label className="form-label">
                  Assign Support Person <span className="req">*</span>
                  {form.category && <span className="form-hint"> (filtered by product & location)</span>}
                </label>
                {filterMessage && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: filterMessage.color, background: filterMessage.bg, padding: "6px 10px", borderRadius: 6, marginBottom: 6, border: `1px solid ${filterMessage.color}22` }}>
                    {filterMessage.msg}
                  </div>
                )}
                <select name="assignTo" value={form.assignTo} onChange={handleChange} style={inputStyle("assignTo")}>
                  <option value="">
                    {form.category ? `Choose ${form.category} specialist${form.city ? ` in ${form.city}` : ""}` : "Select product first to filter specialists"}
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

            {/* Product Image */}
            <div className="form-field" style={{ padding: "20px 36px 0" }}>
              <label className="form-label">
                Product Image
                <span className="form-hint"> (optional — upload photo showing serial no & MAC address)</span>
              </label>
              <div style={{
                border: `2px dashed ${errors.productImage ? "#ef4444" : "#ddd5c8"}`,
                borderRadius: 10, padding: "16px 20px",
                background: "#f9f7f4", textAlign: "center",
              }}>
                {!imagePreview ? (
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Upload product photo (max 3MB)</div>
                    <label style={{ background: "#ff5a00", color: "white", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-block" }}>
                      Choose Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    </label>
                  </div>
                ) : (
                  <div>
                    <img src={imagePreview} alt="Product"
                      style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, border: "2px solid #e0d8d0", marginBottom: 10 }} />
                    <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                      <label style={{ background: "#f0ebe3", color: "#555", border: "1px solid #ddd5c8", padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>
                        Change Image
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                      </label>
                      <button type="button"
                        onClick={() => { setImagePreview(""); setForm(prev => ({ ...prev, productImage: "" })); }}
                        style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        Remove
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: "#10b981", marginTop: 8, fontWeight: 600 }}>✅ Image uploaded</div>
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
                  {form.description.length < 20 ? `${20 - form.description.length} more chars needed` : `${500 - form.description.length} chars left`}
                </span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className={`submit-btn ${submitting ? "submit-btn-loading" : ""}`}>
              {submitting ? <><span className="btn-spinner" /> Submitting...</> : "🎫 Submit Ticket"}
            </button>
          </div>
        )}

        {/* MY TICKETS */}
        {activeTab === "mytickets" && (
          <div>
            <div className="tickets-header">
              <div>
                <h2 className="tickets-title">My Tickets</h2>
                <p className="tickets-sub">Track the status of all your raised tickets</p>
              </div>
              <button className="btn-raise-new" onClick={() => setActiveTab("raise")}>+ Raise New Ticket</button>
            </div>

            {myTickets.length === 0 ? (
              <div className="tickets-empty">
                <div className="tickets-empty-icon">🎫</div>
                <p className="tickets-empty-text">You haven't raised any tickets yet.</p>
                <button className="btn-raise-new" onClick={() => setActiveTab("raise")}>Raise First Ticket</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      placeholder="🔍 Search by name, date, serial no, phone, city, product..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        flex: 1, padding: "10px 16px", borderRadius: 10,
                        border: "1.5px solid #d1d5db", fontSize: 13,
                        background: "white", color: "#374151", outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")}
                        style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </div>

                <div style={{
                  background: "white", borderRadius: 12,
                  border: "1.5px solid #e0d8d0",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  marginBottom: 14, padding: "14px 16px",
                  display: "flex", flexDirection: "column", gap: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>📋 Status:</span>
                    {[
                      ["all",      "All",        "#374151", "#f3f4f6"],
                      ["pending",  "⏳ Pending",  "#b45309", "#fffbeb"],
                      ["open",     "🔓 Open",     "#e04e00", "#fff4ee"],
                      ["resolved", "✅ Resolved", "#1a7a46", "#edfaf3"],
                      ["rma",      "🔧 RMA",      "#7c3aed", "#f5f3ff"],
                    ].map(([key, label, col, bg]) => (
                      <button key={key} onClick={() => setStatusFilter(key)} style={{
                        padding: "5px 12px", borderRadius: 16,
                        border: statusFilter === key ? `2px solid ${col}` : "1px solid #d1d5db",
                        background: statusFilter === key ? bg : "white",
                        color: statusFilter === key ? col : "#555",
                        fontWeight: statusFilter === key ? 700 : 400,
                        fontSize: 12, cursor: "pointer", whiteSpace: "nowrap"
                      }}>
                        {label}
                        <span style={{
                          marginLeft: 5,
                          background: statusFilter === key ? col : "#e5e7eb",
                          color: statusFilter === key ? "white" : "#555",
                          borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700
                        }}>
                          {statusCounts[key] ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div style={{ height: 1, background: "#f0ede8" }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>🔧 Product:</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {["all", ...uniqueProducts].map(p => (
                          <button key={p} onClick={() => setProductFilter(p)} style={{
                            padding: "5px 12px", borderRadius: 16,
                            border: productFilter === p ? "none" : "1px solid #d1d5db",
                            background: productFilter === p ? "#ff5a00" : "white",
                            color: productFilter === p ? "white" : "#555",
                            fontWeight: productFilter === p ? 700 : 400,
                            fontSize: 12, cursor: "pointer", whiteSpace: "nowrap"
                          }}>
                            {p === "all" ? "All Products" : p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ width: 1, height: 24, background: "#e0d8d0", flexShrink: 0 }} />

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>📅 Sort by Date:</span>
                      <select
                        value={dateSort}
                        onChange={e => setDateSort(e.target.value)}
                        style={{
                          padding: "6px 14px", borderRadius: 8,
                          border: "1.5px solid #d1d5db", fontSize: 12,
                          cursor: "pointer", background: "white", color: "#374151",
                          outline: "none", minWidth: 160, fontWeight: 600,
                        }}
                      >
                        <option value="newest">🔽 Newest First</option>
                        <option value="oldest">🔼 Oldest First</option>
                      </select>
                    </div>

                    <div style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                      Showing <strong style={{ color: "#374151" }}>{displayTickets.length}</strong> of <strong style={{ color: "#374151" }}>{myTickets.length}</strong> tickets
                    </div>
                  </div>
                </div>

                <div style={{
                  borderRadius: 12,
                  border: "1.5px solid #e0d8d0",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  overflowX: "scroll",
                  overflowY: "auto",
                  maxHeight: "72vh",
                }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: 0,
                    background: "white",
                    minWidth: 1000,
                  }}>
                    <colgroup>
                      <col style={{ width: 85  }} />
                      <col style={{ width: 100 }} />
                      <col style={{ width: 120 }} />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 105 }} />
                      <col style={{ width: 75  }} />
                      <col style={{ width: 220 }} />
                    </colgroup>
                    <thead>
                      <tr style={{ background: "linear-gradient(135deg, #c94500 0%, #ff5a00 100%)", position: "sticky", top: 0, zIndex: 2 }}>
                        {["Ticket No","Date","Product","Customer","Assigned To","Status","Image","Issue"].map((h, i) => (
                          <th key={i} style={{
                            padding: "12px 10px", fontSize: 10, fontWeight: 800, color: "white",
                            textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left",
                            borderRight: "1px solid rgba(255,255,255,0.2)",
                            whiteSpace: "nowrap"
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayTickets.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>
                            No tickets found for selected filters.
                          </td>
                        </tr>
                      ) : (
                        displayTickets.reduce((acc, ticket, idx) => {
                          const s = (ticket.status || "pending").toLowerCase();
                          const assignedPerson = supportPersons.find(p =>
                            p.name && ticket.assignTo &&
                            p.name.toLowerCase().trim() === ticket.assignTo.toLowerCase().trim()
                          );

                          acc.push(
                            <tr key={ticket.id} style={{
                              borderBottom: "1px solid #f0ede8",
                              background: idx % 2 === 0 ? "#faf7f4" : "white",
                              borderLeft: `4px solid ${STATUS_COLOR[s] || "#ccc"}`,
                            }}>
                              {/* ✅ All td now have borderRight for dark column lines */}
                              <td style={tdStyle({ padding: "12px 10px", whiteSpace: "nowrap" })}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: "#ff5a00" }}>{ticket.ticketNumber || "—"}</div>
                                <div style={{ fontSize: 9, color: "#9ca3af" }}>Row {idx + 1}</div>
                              </td>
                              <td style={tdStyle({ padding: "12px 10px" })}>
                                <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, whiteSpace: "nowrap" }}>{ticket.date || "—"}</div>
                                {ticket.resolvedAt && (
                                  <div style={{ fontSize: 10, color: "#10b981", whiteSpace: "nowrap" }}>✅ {new Date(ticket.resolvedAt).toLocaleDateString()}</div>
                                )}
                              </td>
                              <td style={tdStyle({ padding: "12px 10px" })}>
                                <div
                                  onClick={() => setProductPopup({ category: ticket.category, model: ticket.model, serialNo: ticket.serialNo, mac: ticket.mac })}
                                  style={{ fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", color: "#ff5a00", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#fad8be" }}>
                                  {ticket.category || "—"}
                                </div>
                                {ticket.model && <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{ticket.model}</div>}
                              </td>
                              <td style={tdStyle({ padding: "12px 10px" })}>
                                <div
                                  onClick={() => setCustomerPopup({ customer: ticket.customer, phone: ticket.phone, city: ticket.city, country: ticket.country })}
                                  style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#93c5fd" }}>
                                  {ticket.customer || "—"}
                                </div>
                              </td>
                              <td style={tdStyle({ padding: "12px 10px" })}>
                                <div
                                  onClick={() => {
                                    const p = supportPersons.find(p => p.name && ticket.assignTo && p.name.toLowerCase().trim() === ticket.assignTo.toLowerCase().trim());
                                    setAssigneePopup({ name: ticket.assignTo, phone: p?.phone, city: p?.city, specialization: p?.specialization?.join(", ") });
                                  }}
                                  style={{ fontSize: 12, fontWeight: 700, color: "#92400e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#fde68a" }}>
                                  {ticket.assignTo || "—"}
                                </div>
                                {ticket.reassignedFrom && (
                                  <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700 }}>🔄 reassigned</div>
                                )}
                              </td>
                              <td style={tdStyle({ padding: "12px 10px" })}>
                                <span
                                  onClick={() => {
                                    if (s === "resolved") {
                                      setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken, resolvedBy: ticket.resolvedBy, resolvedAt: ticket.resolvedAt });
                                    } else if (s === "rma") {
                                      setRmaPopup({ rmaReason: ticket.rmaReason, rmaCenterName: ticket.rmaCenterName, rmaCenterCity: ticket.rmaCenterCity, rmaCenterAddress: ticket.rmaCenterAddress, rmaCenterPhone: ticket.rmaCenterPhone, rmaSentAt: ticket.rmaSentAt });
                                    }
                                  }}
                                  style={{
                                    padding: "3px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                                    color: STATUS_COLOR[s], background: STATUS_BG[s],
                                    display: "inline-block", whiteSpace: "nowrap",
                                    cursor: s === "resolved" || s === "rma" ? "pointer" : "default",
                                    border: s === "resolved" ? "1.5px solid #6ee7b7" : "none",
                                  }}
                                >
                                  {STATUS_ICON[s]} {s.toUpperCase()}
                                </span>
                                {s === "resolved" && ticket.resolutionNotes && (
                                  <div onClick={() => setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken, resolvedBy: ticket.resolvedBy, resolvedAt: ticket.resolvedAt })}
                                    style={{ fontSize: 9, color: "#059669", marginTop: 3, cursor: "pointer", fontWeight: 600 }}>📋 View details</div>
                                )}
                                {s === "rma" && (
                                  <div onClick={() => setRmaPopup({ rmaReason: ticket.rmaReason, rmaCenterName: ticket.rmaCenterName, rmaCenterCity: ticket.rmaCenterCity, rmaCenterAddress: ticket.rmaCenterAddress, rmaCenterPhone: ticket.rmaCenterPhone, rmaSentAt: ticket.rmaSentAt })}
                                    style={{ fontSize: 9, color: "#7c3aed", marginTop: 3, cursor: "pointer", fontWeight: 600 }}>🔧 View RMA details</div>
                                )}
                              </td>
                              <td style={tdStyle({ padding: "12px 6px", textAlign: "center" })}>
                                {ticket.productImage ? (
                                  <button
                                    onClick={() => setExpandedImage(prev => prev === ticket.id ? null : ticket.id)}
                                    style={{
                                      background: expandedImage === ticket.id ? "#dcfce7" : "#f0fdf4",
                                      border: "1.5px solid #86efac",
                                      borderRadius: 6, padding: "4px 8px", cursor: "pointer",
                                      fontSize: 10, fontWeight: 700, color: "#065f46",
                                      whiteSpace: "nowrap"
                                    }}>
                                    📷 {expandedImage === ticket.id ? "Hide" : "View"}
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                <div
                                  onClick={() => setIssuePopup({
                                    description: ticket.description,
                                    resolutionNotes: ticket.resolutionNotes,
                                    resolutionTimeTaken: ticket.resolutionTimeTaken,
                                    resolvedBy: ticket.resolvedBy,
                                    resolvedAt: ticket.resolvedAt,
                                  })}
                                  style={{
                                    fontSize: 12, color: "#374151", lineHeight: 1.6,
                                    cursor: "pointer",
                                    overflow: "hidden", textOverflow: "ellipsis",
                                    whiteSpace: "nowrap", maxWidth: 200,
                                    textDecoration: "underline", textDecorationStyle: "dotted",
                                    textDecorationColor: "#9ca3af"
                                  }}
                                  title="Click to view full issue"
                                >
                                  {ticket.description?.length > 40
                                    ? ticket.description.slice(0, 40) + "…"
                                    : ticket.description || "—"}
                                </div>
                                {s === "resolved" && ticket.resolutionNotes && (
                                  <div
                                    onClick={() => setIssuePopup({
                                      description: ticket.description,
                                      resolutionNotes: ticket.resolutionNotes,
                                      resolutionTimeTaken: ticket.resolutionTimeTaken,
                                      resolvedBy: ticket.resolvedBy,
                                      resolvedAt: ticket.resolvedAt,
                                    })}
                                    style={{ fontSize: 10, color: "#059669", fontWeight: 600, marginTop: 3, cursor: "pointer" }}>
                                    ✅ Resolved — click to view
                                  </div>
                                )}
                              </td>
                            </tr>
                          );

                          if (expandedImage === ticket.id && ticket.productImage) {
                            acc.push(
                              <tr key={`img-${ticket.id}`}>
                                <td colSpan={8} style={{ padding: 0, background: "#f0fdf4", borderBottom: "1px solid #86efac" }}>
                                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16, borderLeft: "4px solid #10b981" }}>
                                    <img
                                      src={ticket.productImage}
                                      alt="Product"
                                      style={{ maxHeight: 220, maxWidth: 300, borderRadius: 10, border: "2px solid #86efac", cursor: "pointer", objectFit: "contain", background: "white" }}
                                      onClick={() => openImageInNewTab(ticket.productImage)}
                                    />
                                    <div style={{ fontSize: 13, color: "#065f46" }}>
                                      <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 14 }}>📷 Product Image</div>
                                      <div style={{ color: "#6b7280", marginBottom: 4 }}>Product: <strong>{ticket.category}</strong></div>
                                      <div style={{ color: "#6b7280", marginBottom: 4 }}>Serial No: <strong>{ticket.serialNo}</strong></div>
                                      {ticket.mac && <div style={{ color: "#6b7280", marginBottom: 4 }}>MAC: <strong>{ticket.mac}</strong></div>}
                                      <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>Click image to open full size</div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          if (ticket.feedbackRating) {
                            acc.push(
                              <tr key={`fb-${ticket.id}`} style={{ background: "#eff6ff" }}>
                                <td colSpan={8} style={{ padding: "8px 20px" }}>
                                  <span style={{ fontSize: 12, color: "#1e40af", fontWeight: 600 }}>
                                    ⭐ Your Feedback: {"★".repeat(ticket.feedbackRating)}{"☆".repeat(5 - ticket.feedbackRating)} ({ticket.feedbackRating}/5)
                                    {ticket.feedbackComment && ` — "${ticket.feedbackComment}"`}
                                  </span>
                                </td>
                              </tr>
                            );
                          }

                          if (ticket.rmaStatus) {
                            acc.push(
                              <tr key={`rma-${ticket.id}`} style={{ background: "#f5f3ff" }}>
                                <td colSpan={8} style={{ padding: "8px 20px" }}>
                                  <span style={{ fontSize: 12, color: "#5b21b6", fontWeight: 600 }}>
                                    🔧 RMA Center: {ticket.rmaCenterName} | {ticket.rmaCenterAddress} | 📞 {ticket.rmaCenterPhone}
                                  </span>
                                </td>
                              </tr>
                            );
                          }

                          return acc;
                        }, [])
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}