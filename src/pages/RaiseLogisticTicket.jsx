import { useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { getIssues } from "../data/issueList";

const BASE_URL = "https://api.syrotech.com";

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
  "Delhi": ["New Delhi","Dwarka","Rohini","Pitampura","Lajpat Nagar","Saket","Karol Bagh","Janakpuri"],
};
const INDIAN_STATES = Object.keys(STATE_CITY_MAP).sort();

export default function RaiseLogisticTicket({ onSuccess }) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const { getCategories, getSubCategories, getItems } = useProducts();
  const CATEGORIES = getCategories();

  const [form, setForm] = useState({
    category: "", subCategory: "", model: "", serialNo: "", mac: "", macPrefix: "", macSuffix: "",
    customer: "", email: "", phone: "", city: "", state: "", country: "", pincode: "", companyName: "",
    issuePrefix: "", issueSuffix: "", productImage: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const inputStyle = (field) => ({
    width: "100%", padding: "11px 14px",
    border: `2px solid ${errors[field] ? "#ef4444" : "#ddd5c8"}`,
    borderRadius: 10, fontSize: 13.5, boxSizing: "border-box",
    outline: "none",
    background: errors[field] ? "#fff5f5" : "#f0ebe3",
    fontFamily: "DM Sans, sans-serif", color: "#111",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "customer" && value !== "" && !/^[a-zA-Z\s]*$/.test(value)) return;
    if (name === "pincode" && value !== "" && !/^\d*$/.test(value)) return;
    if (name === "category") {
      setForm(p => ({ ...p, category: value, subCategory: "", model: "", issuePrefix: "", issueSuffix: "" }));
    } else if (name === "subCategory") {
      setForm(p => ({ ...p, subCategory: value, model: "", issuePrefix: "", issueSuffix: "" }));
    } else if (name === "state") {
      setForm(p => ({ ...p, state: value, city: "" }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setErrors(p => ({ ...p, productImage: "Image must be less than 3MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(p => ({ ...p, productImage: ev.target.result }));
      setImagePreview(ev.target.result);
      setErrors(p => ({ ...p, productImage: "" }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.category)    e.category    = "Please select a product category.";
    if (!form.subCategory) e.subCategory = "Please select a sub category.";
    if (!form.model)       e.model       = "Please select an item.";
    if (!form.customer.trim()) e.customer = "Customer name is required.";
    else if (/\d/.test(form.customer)) e.customer = "Name cannot contain numbers.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Contact number is required.";
    else if (!/^\d+$/.test(form.phone.replace(/\s+/g, ""))) e.phone = "Enter a valid phone number.";
    if (!form.city.trim())  e.city  = "City is required.";
    if (!form.state.trim()) e.state = "State is required.";
    if (!form.country)      e.country = "Please select a country.";
    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) e.pincode = "Enter a valid 6-digit pincode.";
    if (!form.issuePrefix) e.description = "Please select an issue type.";
    else if (!form.issueSuffix.trim()) e.description = "Please describe the issue in detail.";
    else if (form.issueSuffix.trim().length > 500) e.description = "Description cannot exceed 500 characters.";
    return e;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    const newTicket = {
      ...form,
      phone: form.phone.replace(/\s+/g, ""),
      description: `${form.issuePrefix} | ${form.issueSuffix}`,
      ticketType: "logistic",
      status: "open",
      raisedBy: currentUser?.email || "",
      raisedByName: currentUser?.name || "",
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await fetch(`${BASE_URL}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });
      if (!res.ok) throw new Error("Server error");
      setSuccessMsg("✅ Logistic Ticket submitted successfully!");
      setForm({
        category: "", subCategory: "", model: "", serialNo: "", mac: "", macPrefix: "", macSuffix: "",
        customer: "", email: "", phone: "", city: "", state: "", country: "", pincode: "", companyName: "",
        issuePrefix: "", issueSuffix: "", productImage: "",
      });
      setImagePreview("");
      setErrors({});
      setTimeout(() => {
        setSuccessMsg("");
        if (onSuccess) onSuccess();
      }, 1500);
    } catch {
      setErrors({ submit: "❌ Failed to submit ticket." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <div className="form-card-header">
        <div className="form-card-icon">📦</div>
        <div>
          <h2 className="form-card-title">Raise Logistic Ticket</h2>
          <p className="form-card-sub">Fields marked <span style={{ color: "#ff6b35" }}>*</span> are required.</p>
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
        <div className="form-field">
          <label className="form-label">Product Category <span className="req">*</span></label>
          <select name="category" value={form.category} onChange={handleChange} style={inputStyle("category")}>
            <option value="">Select Category</option>
            {CATEGORIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Sub Category <span className="req">*</span></label>
          <select name="subCategory" value={form.subCategory} onChange={handleChange}
            style={{ ...inputStyle("subCategory"), color: !form.category ? "#888" : "#111" }}
            disabled={!form.category}>
            <option value="">{form.category ? "Select Sub Category" : "Select category first"}</option>
            {getSubCategories(form.category).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.subCategory && <span className="field-error">{errors.subCategory}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Item Name <span className="req">*</span></label>
          <select name="model" value={form.model} onChange={handleChange}
            style={{ ...inputStyle("model"), color: !form.subCategory ? "#888" : "#111" }}
            disabled={!form.subCategory}>
            <option value="">{form.subCategory ? "Select Item" : "Select sub category first"}</option>
            {getItems(form.category, form.subCategory).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.model && <span className="field-error">{errors.model}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Serial Number <span style={{ fontSize: 11, color: "#6b7280" }}>(optional)</span></label>
          <input name="serialNo" placeholder="e.g. SYR-20240001" value={form.serialNo} onChange={handleChange} style={inputStyle("serialNo")} />
        </div>

        <div className="form-field">
          <label className="form-label">MAC Address</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={form.macPrefix || ""}
              onChange={e => setForm(p => ({ ...p, macPrefix: e.target.value, mac: `${e.target.value}:${p.macSuffix || ""}` }))}
              style={{ ...inputStyle("mac"), width: "45%" }}>
              <option value="">Select Prefix</option>
              <option value="38:94:E0">38:94:E0</option>
              <option value="7C:A9:6B">7C:A9:6B</option>
              <option value="54:47:E8">54:47:E8</option>
              <option value="A8:E2:07">A8:E2:07</option>
              <option value="B8:B7:DB">B8:B7:DB</option>
              <option value="98:9D:B2">98:9D:B2</option>
              <option value="74:61:D1">74:61:D1</option>
            </select>
            <input placeholder="11:22:33" value={form.macSuffix || ""}
              onChange={e => { const v = e.target.value.toUpperCase(); setForm(p => ({ ...p, macSuffix: v, mac: `${p.macPrefix || ""}:${v}` })); }}
              style={{ ...inputStyle("mac"), width: "55%" }} />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Customer Name <span className="req">*</span></label>
          <input name="customer" placeholder="Full name (letters only)" value={form.customer} onChange={handleChange} style={inputStyle("customer")} />
          {errors.customer && <span className="field-error">{errors.customer}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Customer Email <span style={{ fontSize: 11, color: "#6b7280" }}>(optional)</span></label>
          <input name="email" placeholder="customer@email.com" value={form.email} onChange={handleChange} style={inputStyle("email")} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Contact Number <span className="req">*</span></label>
          <input name="phone" placeholder="e.g. 9876543210" value={form.phone} onChange={handleChange} style={inputStyle("phone")} />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Company Name</label>
          <input name="companyName" placeholder="e.g. ABC Pvt Ltd" value={form.companyName} onChange={handleChange} style={inputStyle("companyName")} />
        </div>

        <div className="form-field">
          <label className="form-label">Country <span className="req">*</span></label>
          <select name="country" value={form.country} onChange={handleChange} style={inputStyle("country")}>
            <option value="">Select Country</option>
            <option>India</option><option>United States</option><option>United Kingdom</option>
            <option>United Arab Emirates</option><option>Saudi Arabia</option><option>Canada</option>
            <option>Australia</option><option>Singapore</option><option>Other</option>
          </select>
          {errors.country && <span className="field-error">{errors.country}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">State <span className="req">*</span></label>
          <select name="state" value={form.state} onChange={handleChange} style={inputStyle("state")}>
            <option value="">Select State</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state && <span className="field-error">{errors.state}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">City <span className="req">*</span></label>
          <select name="city" value={form.city} onChange={handleChange} disabled={!form.state} style={inputStyle("city")}>
            <option value="">{form.state ? "Select City" : "Select state first"}</option>
            {(STATE_CITY_MAP[form.state] || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.city && <span className="field-error">{errors.city}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Pincode <span style={{ fontSize: 11, color: "#6b7280" }}>(optional)</span></label>
          <input name="pincode" placeholder="e.g. 400001" value={form.pincode} onChange={handleChange} maxLength={6} style={inputStyle("pincode")} />
          {errors.pincode && <span className="field-error">{errors.pincode}</span>}
        </div>
      </div>

      {/* Product Image */}
      <div className="form-field" style={{ padding: "20px 36px 0" }}>
        <label className="form-label">Product Image <span style={{ fontSize: 11, color: "#6b7280" }}>(optional)</span></label>
        <div style={{ border: `2px dashed ${errors.productImage ? "#ef4444" : "#ddd5c8"}`, borderRadius: 10, padding: "16px 20px", background: "#f9f7f4", textAlign: "center" }}>
          {!imagePreview ? (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Upload photo (max 3MB)</div>
              <label style={{ background: "#ff5a00", color: "white", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-block" }}>
                Choose Image
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              </label>
            </div>
          ) : (
            <div>
              <img src={imagePreview} alt="Product" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, border: "2px solid #e0d8d0", marginBottom: 10 }} />
              <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                <label style={{ background: "#f0ebe3", color: "#555", border: "1px solid #ddd5c8", padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>
                  Change Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                </label>
                <button type="button" onClick={() => { setImagePreview(""); setForm(p => ({ ...p, productImage: "" })); }}
                  style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
        {errors.productImage && <span className="field-error">{errors.productImage}</span>}
      </div>

      {/* Issue Type + Description */}
      <div className="form-field" style={{ padding: "20px 36px 0" }}>
        <label className="form-label">Issue Type <span className="req">*</span></label>
        <select value={form.issuePrefix} onChange={e => { setForm(p => ({ ...p, issuePrefix: e.target.value })); setErrors(p => ({ ...p, description: "" })); }}
          disabled={!form.category}
          style={{ ...inputStyle("description"), marginBottom: 10 }}>
          <option value="">{form.category ? "Select Issue Type" : "Select category first"}</option>
          {getIssues(form.category, form.subCategory).map(issue => (
            <option key={issue} value={issue}>{issue}</option>
          ))}
        </select>

        <label className="form-label">Issue Description <span className="req">*</span>
          <span className="form-hint"> (max 500 characters)</span>
        </label>
        <textarea rows={4}
          placeholder="Describe the logistic issue in detail..."
          value={form.issueSuffix}
          onChange={e => { setForm(p => ({ ...p, issueSuffix: e.target.value })); setErrors(p => ({ ...p, description: "" })); }}
          disabled={!form.issuePrefix}
          style={{ ...inputStyle("description"), resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, opacity: !form.issuePrefix ? 0.5 : 1 }} />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <button onClick={handleSubmit} disabled={submitting}
        className={`submit-btn ${submitting ? "submit-btn-loading" : ""}`}>
        {submitting ? <><span className="btn-spinner" /> Submitting...</> : "📦 Submit Logistic Ticket"}
      </button>
    </div>
  );
}