import { useState } from "react";

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

const LOGISTIC_ISSUE_TYPES = [
  "Customer not available at delivery location",
  "Customer refused to accept delivery",
  "Vehicle breakdown during transit",
  "Shipment misrouted to the wrong hub/branch",
  "Adverse weather conditions (heavy rain, flood, storm, etc.)",
  "Traffic congestion, road closure, or accident",
  "Vehicle detained by authorities (RTO, Police, State Check Post)",
  "Incorrect delivery address or contact details",
  "Shipment held at transit hub beyond committed TAT",
  "Delivery vehicle changed (vehicle interchange) causing delay",
  "Festival, strike, bandh, or government restrictions",
  "Month end dispatch delay",
  "Last-mile delivery delay",
  "Damage in transit requiring inspection or re-packing",
  "Shipment misrouted to the wrong hub/branch",
  "Shipment interchange/mislabeling with another customer's consignment",
  "Partial shipment delivered due to vehicle capacity or operational constraints",
  "Delivery rescheduled at customer's request",
  "Delivery rescheduled at customer's request",
  "Shortage or missing package identified during transit",
];

export default function RaiseLogisticTicket({ onSuccess }) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [form, setForm] = useState({
    customer: "", email: "", phone: "",
    courierCompany: "", invoiceNumber: "", invoiceDate: "",
    dispatchDate: "", deliveryDestination: "", trackingDetails: "",
    issuePrefix: "", issueSuffix: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.customer.trim()) e.customer = "Customer name is required.";
    else if (/\d/.test(form.customer)) e.customer = "Name cannot contain numbers.";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Contact number is required.";
    else if (!/^\d+$/.test(form.phone.replace(/\s+/g, ""))) e.phone = "Enter a valid phone number.";
    if (!form.courierCompany.trim()) e.courierCompany = "Courier company name is required.";
    if (!form.invoiceNumber.trim()) e.invoiceNumber = "Invoice number is required.";
    if (!form.invoiceDate.trim()) e.invoiceDate = "Invoice date is required.";
    if (!form.dispatchDate.trim()) e.dispatchDate = "Dispatch date is required.";
    if (!form.deliveryDestination.trim()) e.deliveryDestination = "Delivery destination is required.";
    if (!form.trackingDetails.trim()) e.trackingDetails = "Tracking details are required.";
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
        customer: "", email: "", phone: "",
        courierCompany: "", invoiceNumber: "", invoiceDate: "",
        dispatchDate: "", deliveryDestination: "", trackingDetails: "",
        issuePrefix: "", issueSuffix: "",
      });
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
          <label className="form-label">Courier Company Name <span className="req">*</span></label>
          <input name="courierCompany" placeholder="e.g. Delhivery, BlueDart" value={form.courierCompany} onChange={handleChange} style={inputStyle("courierCompany")} />
          {errors.courierCompany && <span className="field-error">{errors.courierCompany}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Invoice Number <span className="req">*</span></label>
          <input name="invoiceNumber" placeholder="e.g. INV-20240001" value={form.invoiceNumber} onChange={handleChange} style={inputStyle("invoiceNumber")} />
          {errors.invoiceNumber && <span className="field-error">{errors.invoiceNumber}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Invoice Date <span className="req">*</span></label>
          <input type="date" name="invoiceDate" value={form.invoiceDate} onChange={handleChange} style={inputStyle("invoiceDate")} />
          {errors.invoiceDate && <span className="field-error">{errors.invoiceDate}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Dispatch Date <span className="req">*</span></label>
          <input type="date" name="dispatchDate" value={form.dispatchDate} onChange={handleChange} style={inputStyle("dispatchDate")} />
          {errors.dispatchDate && <span className="field-error">{errors.dispatchDate}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Delivery Destination <span className="req">*</span></label>
          <input name="deliveryDestination" placeholder="e.g. Warehouse, Sector 12, Gurugram" value={form.deliveryDestination} onChange={handleChange} style={inputStyle("deliveryDestination")} />
          {errors.deliveryDestination && <span className="field-error">{errors.deliveryDestination}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Tracking Details <span className="req">*</span></label>
          <input name="trackingDetails" placeholder="Tracking ID / link" value={form.trackingDetails} onChange={handleChange} style={inputStyle("trackingDetails")} />
          {errors.trackingDetails && <span className="field-error">{errors.trackingDetails}</span>}
        </div>
      </div>

      {/* Issue Type + Description */}
      <div className="form-field" style={{ padding: "20px 36px 0" }}>
        <label className="form-label">Issue Type <span className="req">*</span></label>
        <select value={form.issuePrefix} onChange={e => { setForm(p => ({ ...p, issuePrefix: e.target.value })); setErrors(p => ({ ...p, description: "" })); }}
          style={{ ...inputStyle("description"), marginBottom: 10 }}>
          <option value="">Select Issue Type</option>
          {LOGISTIC_ISSUE_TYPES.map((issue, i) => (
            <option key={i} value={issue}>{issue}</option>
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