import { useState, useEffect } from "react";

const BASE_URL = "https://api.syrotech.com";

const LOCKIN_STRUCTURE = {
  "Lockin ONT": {
    subCategories: ["With TR069", "Without TR069"],
    models: {
      "With TR069": [
         "SY-GPON-1000R-DONT",
    "SY-GPON-4000R-DONT",
    "SY-GPON-1010-DONT",
    "SY-GPON-1001-DONT",
    "SY-GPON-1000-2WDONT",
    "SY-GPON-1100-WDONT",
    "SY-GPON-1110-R2-WDONT",
    "SY-GPON-1110-WDONT",
    "SY-GPON-2000-WADONT",
    "SY-GPON-2000-WADONT-PRO",
    "SY-GPON-2010-WADONT",
    "SY-GPON-2010-WADONT (HR)",
    "SY-GPON-2010R2-WADONT",
    "SY-GPON-2010-WADONT-PRO",
    "SY-GPON-2010-WADONT-PRO-V2",
    "SY-GPON-2010 WADONT (LOCKING}",
    "SY-GPON-4010-WADONT",
    "SY-GPON-4010-AX1500",
    "SY-GPON-4010-AX3000"
      ],
      "Without TR069": [
        "SY-GPON-1000R-DONT",
    "SY-GPON-4000R-DONT",
    "SY-GPON-1010-DONT",
    "SY-GPON-1001-DONT",
    "SY-GPON-1000-2WDONT",
    "SY-GPON-1100-WDONT",
    "SY-GPON-1110-R2-WDONT",
    "SY-GPON-1110-WDONT",
    "SY-GPON-2000-WADONT",
    "SY-GPON-2000-WADONT-PRO",
    "SY-GPON-2010-WADONT",
    "SY-GPON-2010-WADONT (HR)",
    "SY-GPON-2010R2-WADONT",
    "SY-GPON-2010-WADONT-PRO",
    "SY-GPON-2010-WADONT-PRO-V2",
    "SY-GPON-2010 WADONT (LOCKING}",
    "SY-GPON-4010-WADONT",
    "SY-GPON-4010-AX1500",
    "SY-GPON-4010-AX3000"
      ],
    },
  },
  "Lockin OLT": {
    subCategories: ["Register Lock", "Customization"],
    models: {
      "Register Lock": [
        "SY-GOPON-4OLT-L3",
    "SY-GOPON-4OLT-L3-ECO",
    "SY-GOPON-4OLT-L3-DC",
    "SY-GOPON-8OLT-L3",
    "SY-GOPON-8OLT-L3-ECO",
    "SY-GPON-1 OLT",
    "SY-GPON-2OLT",
    "SY-GPON-4OLT",
    "SY-GPON-8OLT",
    "SY-GPON-16OLT",
     "SY-GOPON-4OLT-L3-AC-PS",
    "SY-GOPON-4OLT-L3-DC-PS",
    "SY-GOPON-8OLT-L3-AC-PS",
    "SY-GOPON-16OLT-L3-AC-PS", "SY-GPON-4OLT-AC-PS",
    "SY-GPON-8OLT-AC-PS",
    "SY-GPON-16OLT-AC-PS",
      ],
      "Customization": [
       "SY-GOPON-4OLT-L3",
    "SY-GOPON-4OLT-L3-ECO",
    "SY-GOPON-4OLT-L3-DC",
    "SY-GOPON-8OLT-L3",
    "SY-GOPON-8OLT-L3-ECO",
    "SY-GPON-1 OLT",
    "SY-GPON-2OLT",
    "SY-GPON-4OLT",
    "SY-GPON-8OLT",
    "SY-GPON-16OLT",
     "SY-GOPON-4OLT-L3-AC-PS",
    "SY-GOPON-4OLT-L3-DC-PS",
    "SY-GOPON-8OLT-L3-AC-PS",
    "SY-GOPON-16OLT-L3-AC-PS", "SY-GPON-4OLT-AC-PS",
    "SY-GPON-8OLT-AC-PS",
    "SY-GPON-16OLT-AC-PS",
      ],
    },
  },
};


const STATE_CITY_MAP = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Tirupati","Rajahmundry","Kakinada"],
  "Arunachal Pradesh": ["Itanagar","Naharlagun","Pasighat","Tawang"],
  "Assam": ["Guwahati","Silchar","Dibrugarh","Jorhat","Nagaon","Tezpur"],
  "Bihar": ["Patna","Gaya","Muzaffarpur","Bhagalpur","Darbhanga","Purnia"],
  "Chhattisgarh": ["Raipur","Bhilai","Bilaspur","Korba","Raigarh","Jagdalpur"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa","Ponda"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Gandhinagar","Anand"],
  "Haryana": ["Gurugram","Faridabad","Panipat","Ambala","Hisar","Rohtak","Karnal","Sonipat"],
  "Himachal Pradesh": ["Shimla","Dharamsala","Manali","Solan","Mandi","Kullu"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Hazaribagh","Deoghar"],
  "Karnataka": ["Bangalore","Mysuru","Mangaluru","Hubli","Belagavi","Davangere","Shimoga","Tumkur"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam","Kannur","Palakkad"],
  "Madhya Pradesh": ["Bhopal","Indore","Gwalior","Jabalpur","Ujjain","Sagar","Rewa"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Thane","Navi Mumbai","Solapur","Kolhapur","Amravati"],
  "Manipur": ["Imphal","Thoubal","Bishnupur","Churachandpur"],
  "Meghalaya": ["Shillong","Tura","Jowai","Nongstoin"],
  "Mizoram": ["Aizawl","Lunglei","Champhai","Serchhip"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung","Tuensang"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Berhampur","Sambalpur","Puri"],
  "Punjab": ["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Mohali","Gurdaspur"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer","Bikaner","Bharatpur","Alwar"],
  "Sikkim": ["Gangtok","Namchi","Gyalshing","Mangan"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Vellore","Erode"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Mahbubnagar"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar","Kailasahar"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Meerut","Allahabad","Ghaziabad","Noida","Bareilly","Aligarh","Moradabad","Saharanpur"],
  "Uttarakhand": ["Dehradun","Haridwar","Roorkee","Haldwani","Rudrapur","Nainital","Rishikesh"],
  "West Bengal": ["Kolkata","Howrah","Asansol","Siliguri","Durgapur","Bardhaman","Malda"],
  "Andaman and Nicobar Islands": ["Port Blair","Car Nicobar","Diglipur"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman","Diu","Silvassa"],
  "Delhi": ["New Delhi","Dwarka","Rohini","Pitampura","Lajpat Nagar","Saket","Karol Bagh","Janakpuri"],
  "Jammu and Kashmir": ["Srinagar","Jammu","Anantnag","Baramulla","Sopore","Udhampur"],
  "Ladakh": ["Leh","Kargil"],
  "Lakshadweep": ["Kavaratti","Agatti","Minicoy"],
  "Puducherry": ["Puducherry","Karaikal","Mahe","Yanam"],
};


const INDIAN_STATES = Object.keys(STATE_CITY_MAP).sort();

export default function RaiseLockinTicket({ onSuccess }) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

 const [form, setForm] = useState({
    category: "",
    subCategory: "",
    model: "",
    hardwareVersion: "",
    customer: "",
    email: "",
    phone: "",
    companyName: "",
    state: "",
    city: "",
    pincode: "",
  });

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [logoFile, setLogoFile] = useState(null);
const [logoPreview, setLogoPreview] = useState("");
const [logoType, setLogoType] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const subCategories = form.category
    ? LOCKIN_STRUCTURE[form.category].subCategories
    : [];

  const models =
    form.category && form.subCategory
      ? LOCKIN_STRUCTURE[form.category].models[form.subCategory] || []
      : [];

  const cities = STATE_CITY_MAP[form.state] || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setForm((p) => ({ ...p, category: value, subCategory: "", model: "" }));
    } else if (name === "subCategory") {
      setForm((p) => ({ ...p, subCategory: value, model: "" }));
    } else if (name === "state") {
      setForm((p) => ({ ...p, state: value, city: "" }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleLogoChange = (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 2 * 1024 * 1024) {
    setErrors(p => ({ ...p, logo: "Logo must be less than 2MB" }));
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    setLogoFile(ev.target.result);
    setLogoPreview(ev.target.result);
    setErrors(p => ({ ...p, logo: "" }));
  };
  reader.readAsDataURL(f);
};
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, file: "File must be less than 5MB" }));
      return;
    }
    setFile(f);
    setFileName(f.name);
    setErrors((p) => ({ ...p, file: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.category)    e.category    = "Please select a category.";
   if (!logoType) e.logoType = "Please select a logo type.";
if (logoType === "customized" && !logoFile) e.logo = "Company logo is required.";
if (!file) e.file = "File upload is required.";
    if (!form.subCategory) e.subCategory = "Please select a sub category.";
    if (!form.model)       e.model       = "Please select a model.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
else if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter valid 10-digit phone.";
    if (!form.customer.trim()) e.customer = "Customer name is required.";
   if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email.";
    if (!form.state) e.state = "State is required.";
    if (!form.city)  e.city  = "City is required.";
    if (!form.pincode.trim()) e.pincode = "Pincode is required.";
    else if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter valid 6-digit pincode.";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);

    // Convert file to base64 if uploaded
    let fileBase64 = "";
    let fileNameSaved = "";
    if (file) {
      fileBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
      fileNameSaved = fileName;
    }

    const ticketData = {
      ...form,
      ticketType:   "lockin",
       logoImage:    logoType === "customized" ? (logoFile || "") : "syrotech",
logoType:     logoType,
      assignTo:     "Tejvir Singh",
      raisedBy:     currentUser?.email || "",
      raisedByName: currentUser?.name  || "",
      status:       "open",
      source:       "sales-lockin",
      date:         new Date().toISOString().slice(0, 10),
      createdAt:    new Date().toISOString(),
      fileBase64,
      fileName:     fileNameSaved,
    };

    try {
      const res = await fetch(`${BASE_URL}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData),
      });
      if (!res.ok) throw new Error("Server error");
      setSuccessMsg("✅ Lockin Ticket submitted successfully!");
      setForm({
        category: "", subCategory: "", model: "", hardwareVersion: "",
        customer: "", email: "", companyName: "", state: "", city: "", pincode: "",
      });
      setFile(null);
      setFileName("");
      setLogoFile(null);
setLogoPreview("");
      setTimeout(() => {
        setSuccessMsg("");
        if (onSuccess) onSuccess(); // switch to My Lockin Tickets tab
      }, 2000);
    } catch {
      setErrors({ submit: "❌ Failed to submit ticket." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Styles ──────────────────────────────────
  const inputStyle = (field) => ({
    width: "100%",
    padding: "11px 14px",
    border: `2px solid ${errors[field] ? "#ef4444" : "#ddd5c8"}`,
    borderRadius: 10,
    fontSize: 13.5,
    boxSizing: "border-box",
    outline: "none",
    background: errors[field] ? "#fff5f5" : "#f0ebe3",
    fontFamily: "DM Sans, sans-serif",
    color: "#111",
  });

  return (
    <div className="form-card">
      <div className="form-card-header">
        <div className="form-card-icon">🔒</div>
        <div>
          <h2 className="form-card-title">Raise Lockin Ticket</h2>
          <p className="form-card-sub">
            Fields marked <span style={{ color: "#ff6b35" }}>*</span> are required.
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: "12px 20px", marginBottom: 16, fontSize: 14, fontWeight: 600, color: "#065f46" }}>
          {successMsg}
        </div>
      )}

      {errors.submit && (
        <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "12px 20px", marginBottom: 16, fontSize: 14, color: "#dc2626" }}>
          {errors.submit}
        </div>
      )}

      <div className="form-grid">

        {/* Category */}
        <div className="form-field">
          <label className="form-label">Category <span className="req">*</span></label>
          <div style={{ display: "flex", gap: 10 }}>
            {["Lockin ONT", "Lockin OLT"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setForm((p) => ({ ...p, category: cat, subCategory: "", model: "" }));
                  setErrors((p) => ({ ...p, category: "" }));
                }}
                style={{
                  flex: 1, padding: "11px 14px", borderRadius: 10, fontSize: 13.5,
                  fontWeight: form.category === cat ? 800 : 500,
                  border: `2px solid ${form.category === cat ? "#ff5a00" : (errors.category ? "#ef4444" : "#ddd5c8")}`,
                  background: form.category === cat ? "#fff4ee" : "#f0ebe3",
                  color: form.category === cat ? "#ff5a00" : "#555",
                  cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {cat === "Lockin ONT" ? "📡 Lockin ONT" : "🔁 Lockin OLT"}
              </button>
            ))}
          </div>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>

        {/* Sub Category */}
        <div className="form-field">
          <label className="form-label">Sub Category <span className="req">*</span></label>
          <select
            name="subCategory"
            value={form.subCategory}
            onChange={handleChange}
            disabled={!form.category}
            style={{ ...inputStyle("subCategory"), color: !form.category ? "#888" : "#111" }}
          >
            <option value="">{form.category ? "Select Sub Category" : "Select category first"}</option>
            {subCategories.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.subCategory && <span className="field-error">{errors.subCategory}</span>}
        </div>

        {/* Model */}
        <div className="form-field">
          <label className="form-label">ONT / OLT Model <span className="req">*</span></label>
          <select
            name="model"
            value={form.model}
            onChange={handleChange}
            disabled={!form.subCategory}
            style={{ ...inputStyle("model"), color: !form.subCategory ? "#888" : "#111" }}
          >
            <option value="">{form.subCategory ? "Select Model" : "Select sub category first"}</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.model && <span className="field-error">{errors.model}</span>}
        </div>

        {/* Hardware Version */}
        <div className="form-field">
          <label className="form-label">Hardware Version</label>
          <input
            name="hardwareVersion"
            placeholder="e.g. v1.2"
            value={form.hardwareVersion}
            onChange={handleChange}
            style={inputStyle("hardwareVersion")}
          />
        </div>

        {/* Customer Name */}
        <div className="form-field">
          <label className="form-label">Customer Name <span className="req">*</span></label>
          <input
            name="customer"
            placeholder="Full name"
            value={form.customer}
            onChange={handleChange}
            style={inputStyle("customer")}
          />
          {errors.customer && <span className="field-error">{errors.customer}</span>}
        </div>

        {/* Customer Email */}
        <div className="form-field">
         <label className="form-label">Customer Email <span style={{ fontSize:11, color:"#6b7280" }}>(optional)</span></label>
          <input
            name="email"
            placeholder="customer@email.com"
            value={form.email}
            onChange={handleChange}
            style={inputStyle("email")}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        {/* Phone */}
<div className="form-field">
  <label className="form-label">Phone Number <span className="req">*</span></label>
  <input
    name="phone"
    placeholder="10-digit number"
    value={form.phone}
    onChange={handleChange}
    maxLength={10}
   style={inputStyle("phone")}
  />
  {errors.phone && <span className="field-error">{errors.phone}</span>}
</div>

        {/* Company Name */}
        <div className="form-field">
          <label className="form-label">Company Name</label>
          <input
            name="companyName"
            placeholder="e.g. ABC Pvt Ltd"
            value={form.companyName}
            onChange={handleChange}
            style={inputStyle("companyName")}
          />
        </div>

        {/* State */}
        <div className="form-field">
          <label className="form-label">State <span className="req">*</span></label>
          <select name="state" value={form.state} onChange={handleChange} style={inputStyle("state")}>
            <option value="">Select State</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state && <span className="field-error">{errors.state}</span>}
        </div>

        {/* City */}
        <div className="form-field">
          <label className="form-label">City <span className="req">*</span></label>
          <select
            name="city"
            value={form.city}
            onChange={handleChange}
            disabled={!form.state}
            style={{ ...inputStyle("city"), color: !form.state ? "#888" : "#111" }}
          >
            <option value="">{form.state ? "Select City" : "Select state first"}</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.city && <span className="field-error">{errors.city}</span>}
        </div>

        {/* Pincode */}
        <div className="form-field">
          <label className="form-label">Pincode <span className="req">*</span> <span className="form-hint">(6 digits)</span></label>
          <input
            name="pincode"
            placeholder="e.g. 110001"
            value={form.pincode}
            onChange={handleChange}
            maxLength={6}
            style={inputStyle("pincode")}
          />
          {errors.pincode && <span className="field-error">{errors.pincode}</span>}
        </div>

      </div>

{/* Logo Type Select */}
<div className="form-field" style={{ padding: "20px 36px 0" }}>
  <label className="form-label">Logo Type <span className="req">*</span></label>
  <select
    value={logoType}
    onChange={(e) => {
      setLogoType(e.target.value);
      if (e.target.value === "syrotech") {
        setLogoFile(null);
        setLogoPreview("");
      }
      setErrors(p => ({ ...p, logoType: "" }));
    }}
    style={inputStyle("logoType")}
  >
    <option value="">-- Select Logo Type --</option>
    <option value="syrotech">🏢 Syrotech Logo</option>
    <option value="customized">🎨 Customized Logo</option>
  </select>
  {errors.logoType && <span className="field-error">{errors.logoType}</span>}
</div>

{/* Logo Upload — only show if customized */}
{logoType === "customized" && (
<div className="form-field" style={{ padding: "20px 36px 0" }}>
  <label className="form-label">
   Company Logo <span className="req">*</span>
  </label>
  <div style={{ border: `2px dashed ${errors.logo ? "#ef4444" : "#ddd5c8"}`, borderRadius: 10, padding: "16px 20px", background: "#f9f7f4", textAlign: "center" }}>
    {!logoPreview ? (
      <div>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Upload company logo</div>
        <label style={{ background: "#ff5a00", color: "white", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-block" }}>
          Choose Logo
          <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: "none" }} />
        </label>
      </div>
    ) : (
      <div>
        <img src={logoPreview} alt="Logo" style={{ maxHeight: 80, maxWidth: 200, borderRadius: 8, marginBottom: 8, objectFit: "contain" }} />
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <label style={{ background: "#f0ebe3", color: "#555", border: "1px solid #ddd5c8", padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>
            Change
            <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: "none" }} />
          </label>
          <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(""); }}
            style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Remove
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#10b981", marginTop: 6, fontWeight: 600 }}>✅ Logo uploaded</div>
      </div>
    )}
  </div>
  {errors.logo && <span className="field-error">{errors.logo}</span>}
</div>
)}
      {/* File Upload */}
      <div className="form-field" style={{ padding: "20px 36px 0" }}>
        <label className="form-label">
          Upload File <span className="req">*</span>
        </label>
        <div style={{
          border: `2px dashed ${errors.file ? "#ef4444" : "#ddd5c8"}`,
          borderRadius: 10, padding: "16px 20px",
          background: "#f9f7f4", textAlign: "center",
        }}>
          {!fileName ? (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>
                Upload any file (PDF, Excel, Image, etc.)
              </div>
              <label style={{
                background: "#ff5a00", color: "white",
                padding: "8px 20px", borderRadius: 8,
                cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-block",
              }}>
                Choose File
                <input type="file" onChange={handleFileChange} style={{ display: "none" }} />
              </label>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                {fileName}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                <label style={{
                  background: "#f0ebe3", color: "#555",
                  border: "1px solid #ddd5c8", padding: "6px 14px",
                  borderRadius: 7, cursor: "pointer", fontSize: 12,
                }}>
                  Change File
                  <input type="file" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
                <button
                  type="button"
                  onClick={() => { setFile(null); setFileName(""); }}
                  style={{
                    background: "#fee2e2", color: "#dc2626",
                    border: "1px solid #fca5a5", padding: "6px 14px",
                    borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}
                >
                  Remove
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#10b981", marginTop: 8, fontWeight: 600 }}>
                ✅ File attached
              </div>
            </div>
          )}
        </div>
        {errors.file && <span className="field-error">{errors.file}</span>}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={`submit-btn ${submitting ? "submit-btn-loading" : ""}`}
        style={{ margin: "24px 36px 0" }}
      >
        {submitting
          ? <><span className="btn-spinner" /> Submitting...</>
          : "🔒 Submit Lockin Ticket"}
      </button>
    </div>
  );
}