import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { getIssues } from "../data/issueList";

const BASE_URL = "https://syrotech-backend.onrender.com";

const STATUS_COLOR = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed", reopened: "#dc2626" };
const STATUS_BG    = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff", reopened: "#fee2e2" };
const STATUS_ICON  = { open: "🔓", pending: "⏳", resolved: "✅", rma: "🔧", reopened: "🔄" };

const openImageInNewTab = (imgSrc) => {
  const win = window.open("", "_blank");
  win.document.write(`<html><head><title>Product Image</title></head><body style="margin:0;background:#111;display:flex;justify-content:center;align-items:flex-start;min-height:100vh;padding:20px;box-sizing:border-box;"><img src="${imgSrc}" style="max-width:100%;height:auto;border-radius:8px;" /></body></html>`);
  win.document.close();
};

const tdStyle = (extra = {}) => ({
  padding: "12px 12px",
  borderRight: "1px solid #c4b5fd",
  textAlign: "left",
  ...extra,
});

// ✅ Indian States list


// ✅ Indian Cities list




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



const SOUTH_STATES = ["kerala", "tamil nadu", "karnataka", "andhra pradesh", "telangana"];

function getAutoAssign(supportPersons, category, state, tickets) {
  if (!supportPersons || supportPersons.length === 0) return "";
  const isSouth = SOUTH_STATES.includes((state || "").toLowerCase().trim());
  const product = (category || "").toLowerCase();
  const countOpen = (name) =>
    tickets.filter(t => t.assignTo === name && (t.status === "open" || t.status === "pending")).length;
  let matched = supportPersons.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return p.level === 1 && specs.map(s => s.toLowerCase()).includes(product);
  });
 if (isSouth) {
    const southOnly = matched.filter(p => p.zone === "South Region");
    const allZone   = matched.filter(p => p.zone === "all");
    matched = southOnly.length > 0 ? southOnly : allZone;
  } else {
    matched = matched.filter(p => p.zone === "all" || p.zone === "all except south");
  }
  if (matched.length === 0) return "";
  return matched.reduce((best, p) =>
    countOpen(p.name) < countOpen(best.name) ? p : best, matched[0]
  ).name;
}

export default function CustomerDashboard() {
  const { getCategories, getSubCategories, getItems } = useProducts();
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [activeTab, setActiveTab]           = useState("raise");
  const [tickets, setTickets]               = useState([]);
  const [supportPersons, setSupportPersons] = useState([]);
  const [submitting, setSubmitting]         = useState(false);
  const [successMsg, setSuccessMsg]         = useState("");
  const [imagePreview, setImagePreview]     = useState("");
  const [expandedImage, setExpandedImage]   = useState(null);
  const [issuePopup, setIssuePopup]         = useState(null);
  const [rmaPopup, setRmaPopup]             = useState(null);
  const [productPopup, setProductPopup]     = useState(null);
  const [assigneePopup, setAssigneePopup]   = useState(null);
  const [searchQuery, setSearchQuery]       = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [dateSort, setDateSort]             = useState("newest");
  const [hoverRating, setHoverRating]       = useState({});

  // ✅ city/state custom input toggle


  const currentUserForForm = JSON.parse(localStorage.getItem("currentUser")) || {};
  const [form, setForm] = useState({
    category: "", subCategory: "", model: "",serialNo: "", mac: "",
    customer: currentUserForForm.name  || "",
    email:    currentUserForForm.email || "",
    phone:    currentUserForForm.phone || "",
    city: "", state: "", country: "", pincode: "", companyName: "",
    description: "", assignTo: "", productImage: "",
    macPrefix: "",
macSuffix: "",
issuePrefix: "",
issueSuffix: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(users => setSupportPersons(users.filter(u => u.role === "support" && u.approved)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (supportPersons.length === 0) return;
    const assigned = getAutoAssign(supportPersons, form.category, form.state, tickets);
    setForm(prev => ({ ...prev, assignTo: assigned }));
  }, [form.category, form.state, supportPersons, tickets]);

  const fetchTickets = () => {
    fetch(`${BASE_URL}/tickets`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTickets(data); })
      .catch(console.error);
  };

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 10000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "pincode" && value !== "" && !/^\d*$/.test(value)) return;
    if (name === "category") {
  setForm(prev => ({ ...prev, [name]: value, subCategory: "", model: "", issuePrefix: "", issueSuffix: "" }));
} else if (name === "subCategory") {
  setForm(prev => ({ ...prev, [name]: value, model: "", issuePrefix: "", issueSuffix: "" }));
} else if (name === "state") {
  setForm(prev => ({ ...prev, state: value, city: "" }));
} else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setErrors(prev => ({ ...prev, productImage: "Image must be less than 3MB" })); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setForm(prev => ({ ...prev, productImage: ev.target.result })); setImagePreview(ev.target.result); setErrors(prev => ({ ...prev, productImage: "" })); };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
  if (!form.category)        e.category    = "Please select a product category.";
if (!form.subCategory)     e.subCategory = "Please select a sub category.";
if (!form.model)           e.model       = "Please select an item.";
    if (!form.serialNo.trim()) e.serialNo    = "Serial number is required.";
    if (!form.customer.trim()) e.customer    = "Customer name is required.";
    else if (/\d/.test(form.customer)) e.customer = "Name cannot contain numbers.";
    if (!form.email.trim())    e.email       = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.phone.trim())    e.phone       = "Phone number is required.";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s+/g,""))) e.phone = "Enter a valid 10-digit phone.";
    if (!form.city.trim())     e.city        = "City is required.";
    if (!form.state.trim())    e.state       = "State is required.";
    if (!form.country)         e.country     = "Please select a country.";
    if (!form.pincode.trim())  e.pincode     = "Pincode is required.";
    else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = "Enter a valid 6-digit pincode.";
    if (!form.issuePrefix) e.description = "Please select an issue type.";
else if (!form.issueSuffix.trim()) e.description = "Please describe your issue in detail.";
else if (form.issueSuffix.trim().length > 500) e.description = "Description cannot exceed 500 characters.";
    return e;
  };

 const handleSubmit = async () => {
    let customerType = currentUser?.customerType || "";
    try {
      const freshUser = await fetch(`${BASE_URL}/api/users/me/${currentUser?.email}`)
        .then(r => r.json());
      customerType = freshUser?.customerType || currentUser?.customerType || "";
    } catch(e) {
      console.error("Could not fetch user", e);
    }
    console.log("Final customerType:", customerType);
    form.description = `${form.issuePrefix} | ${form.issueSuffix}`;
const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErr = document.querySelector(".cust-field-error");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const sameTicket = tickets.find(t =>
      t.phone === (currentUser?.phone || "") &&
      t.category === form.category &&
      t.serialNo.trim().toLowerCase() === form.serialNo.trim().toLowerCase()
    );

    setSubmitting(true);

    if (sameTicket) {
      const issueEntry = { description: form.description, raisedBy: currentUser?.email, raisedByName: currentUser?.name, raisedAt: new Date().toISOString(), assignTo: form.assignTo };
      const existingHistory = Array.isArray(sameTicket.issueHistory) ? sameTicket.issueHistory : [];
      const updates = { issueHistory: [...existingHistory, issueEntry], description: form.description, assignTo: form.assignTo, date: new Date().toISOString().slice(0, 10), customerType: currentUser?.customerType || "" };
      if (sameTicket.status === "resolved" || sameTicket.status === "rma") { updates.status = "pending"; updates.resolvedAt = null; updates.acceptedAt = null; updates.rmaStatus = false; updates.rmaReason = ""; }
      if (form.productImage) updates.productImage = form.productImage;
      fetch(`${BASE_URL}/tickets/${sameTicket.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) })
        .then(r => r.json())
        .then(() => { setForm({ category:"", subCategory:"", model:"", serialNo:"", mac:"", macPrefix:"", macSuffix:"", customer:currentUser?.name||"", email:currentUser?.email||"", phone:currentUser?.phone||"", city:"", state:"", country:"", pincode:"", companyName:"", description:"", assignTo:"", productImage:"", issuePrefix:"", issueSuffix:""}); setImagePreview(""); setErrors({}); setSuccessMsg("✅ Same device found! Your issue has been updated. Status reset to PENDING."); setActiveTab("mytickets"); fetchTickets(); setTimeout(() => setSuccessMsg(""), 6000); })
        .catch(() => setErrors({ submit: "❌ Failed to update ticket." }))
        .finally(() => setSubmitting(false));
      return;
    }

    const newTicket = {
      ...form,
      customer:     form.customer || currentUser?.name  || "",
      email:        form.email    || currentUser?.email || "",
      phone:        form.phone    || currentUser?.phone || "",
      status:       "open",
      acceptedAt:   new Date().toISOString(),
      raisedBy:     currentUser?.email || "unknown",
      raisedByName: currentUser?.name  || "Unknown",
      date:         new Date().toISOString().slice(0, 10),
      createdAt:    new Date().toISOString(),
      source:       "customer",
customerType: customerType,
    };
    fetch(`${BASE_URL}/tickets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTicket) })
      .then(res => { if (!res.ok) throw new Error("Server error"); return res.json(); })
      .then(() => { setForm({ category:"", subCategory:"", model:"", serialNo:"", mac:"", macPrefix:"", macSuffix:"", customer:currentUser?.name||"", email:currentUser?.email||"", phone:currentUser?.phone||"", city:"", state:"", country:"", pincode:"", companyName:"", description:"", assignTo:"", productImage:"", issuePrefix:"", issueSuffix:""}); setImagePreview(""); setErrors({}); setSuccessMsg("✅ Ticket submitted successfully! Status: OPEN"); setActiveTab("mytickets"); fetchTickets(); setTimeout(() => setSuccessMsg(""), 4000); })
      .catch(() => setErrors({ submit: "❌ Failed to submit ticket." }))
      .finally(() => setSubmitting(false));
  };

  const myTickets = tickets
    .filter(t => t.raisedBy === currentUser?.email)
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const displayTickets = myTickets
    .filter(t => {
  if (statusFilter === "all") return true;
  if (statusFilter === "reopened") return t.reopenCount > 0;
  return (t.status || "pending").toLowerCase() === statusFilter;
})
    .filter(t => {
  if (!searchQuery.trim()) return true;
  const q = searchQuery.toLowerCase();
  return (
    (t.serialNo    ||"").toLowerCase().includes(q) ||
    (t.category    ||"").toLowerCase().includes(q) ||
    (t.subCategory ||"").toLowerCase().includes(q) ||
    (t.model       ||"").toLowerCase().includes(q) ||
    (t.date        ||"").toLowerCase().includes(q) ||
    (t.assignTo    ||"").toLowerCase().includes(q) ||
    (t.city        ||"").toLowerCase().includes(q)
  );
})
    .sort((a, b) => { const da = new Date(a.createdAt||a.date).getTime(); const db = new Date(b.createdAt||b.date).getTime(); return dateSort === "newest" ? db - da : da - db; });

 const statusCounts = { all: myTickets.length, open: myTickets.filter(t=>t.status==="open").length, resolved: myTickets.filter(t=>t.status==="resolved").length, rma: myTickets.filter(t=>t.status==="rma").length, reopened: myTickets.filter(t=>t.reopenCount > 0).length };

  const iStyle = (field) => ({
    width:"100%", padding:"10px 13px", borderRadius:9,
    border:`1.5px solid ${errors[field] ? "#ef4444" : "#d1d5db"}`,
    background: errors[field] ? "#fff5f5" : "#fafafa",
    fontSize:14, outline:"none", fontFamily:"inherit",
    boxSizing:"border-box", color:"#111827", transition:"border-color 0.18s",
  });

  return (
    <div style={{ minHeight:"100vh", background:"#f4f0fa", fontFamily:"DM Sans, sans-serif" }}>

      {/* Issue Popup */}
      {issuePopup && (
        <div onClick={() => setIssuePopup(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"24px 28px", maxWidth:520, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #c4b5fd" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:800, color: issuePopup.resolutionNotes ? "#1a7a46" : "#5b21b6" }}>{issuePopup.resolutionNotes ? "✅ Ticket Resolved" : "📋 Issue Description"}</div>
              <button onClick={() => setIssuePopup(null)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
            </div>
    {(() => {
  const allHistory = [];
  // Stage 1: the original ticket
  allHistory.push({
    description: issuePopup.firstDescription || issuePopup.description,
    raisedAt: issuePopup.firstCreatedAt,
    raisedByName: issuePopup.firstRaisedByName,
    resolvedNotes: Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length > 0
      ? (issuePopup.issueHistory[0]?.resolvedNotes || null)
      : issuePopup.resolutionNotes,
    resolvedAt: Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length > 0
      ? (issuePopup.issueHistory[0]?.resolvedAt || null)
      : issuePopup.resolvedAt,
    resolvedBy: Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length > 0
      ? (issuePopup.issueHistory[0]?.resolvedBy || null)
      : issuePopup.resolvedBy,
    isRma: Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length > 0
      ? (issuePopup.issueHistory[0]?.isRma || false)
      : (issuePopup.rmaStatus || false),
  });
  // Stages 2+: from issueHistory (reopens)
  if (Array.isArray(issuePopup.issueHistory)) {
    issuePopup.issueHistory.forEach((h, i) => {
      allHistory.push({
        description: h.description,
        raisedAt: h.raisedAt,
        raisedByName: h.raisedByName,
        resolvedNotes: h.resolvedNotes || null,
        resolvedAt: h.resolvedAt || null,
        resolvedBy: h.resolvedBy || null,
        isRma: h.isRma || false,
      });
    });
  }
  if (allHistory.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>
        📋 Ticket History — {allHistory.length} Stage{allHistory.length > 1 ? "s" : ""}
      </div>
      <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
        {allHistory.map((h, i) => (
          <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", fontSize: 12 }}>
            {/* Issue row */}
            <div style={{ background: "#f9fafb", padding: "7px 10px", borderLeft: "3px solid #6b7280" }}>
              <div style={{ fontWeight: 700, color: "#374151", marginBottom: 2 }}>
                🔴 Stage {i + 1}
                {h.raisedAt && <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400, marginLeft: 6 }}>{new Date(h.raisedAt).toLocaleString()}</span>}
                {h.raisedByName && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>· {h.raisedByName}</span>}
              </div>
              <div style={{ color: "#374151" }}>{h.description || "—"}</div>
            </div>
            {/* Resolution row */}
            {h.isRma ? (
              <div style={{ background: "#f5f3ff", padding: "6px 10px", borderLeft: "3px solid #7c3aed" }}>
                <div style={{ fontWeight: 700, color: "#7c3aed", fontSize: 11 }}>🔧 Sent to RMA</div>
              </div>
            ) : h.resolvedNotes ? (
              <div style={{ background: "#f0fdf4", padding: "6px 10px", borderLeft: "3px solid #10b981" }}>
                <div style={{ fontWeight: 700, color: "#059669", fontSize: 11, marginBottom: 2 }}>
                  ✅ Resolved
                  {h.resolvedAt && <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400, marginLeft: 6 }}>{new Date(h.resolvedAt).toLocaleString()}</span>}
                  {h.resolvedBy && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>· {h.resolvedBy}</span>}
                </div>
                <div style={{ color: "#374151" }}>{h.resolvedNotes}</div>
              </div>
            ) : (
              <div style={{ background: "#fffbeb", padding: "5px 10px", borderLeft: "3px solid #f59e0b" }}>
                <div style={{ color: "#92400e", fontSize: 11 }}>⏳ Pending...</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
})()}
            {issuePopup.resolutionNotes ? (
              <>
                <div style={{ fontSize:11, fontWeight:700, color:"#065f46", textTransform:"uppercase", marginBottom:8 }}>🔧 What was solved:</div>
                <div style={{ fontSize:13, color:"#374151", lineHeight:1.7, background:"#ecfdf5", padding:"14px 16px", borderRadius:10, border:"1px solid #6ee7b7", borderLeft:"4px solid #10b981", marginBottom:14 }}>{issuePopup.resolutionNotes}</div>
                {issuePopup.resolvedAt && <div style={{ fontSize:12, color:"#6b7280", marginBottom:14 }}>📅 Resolved on: <strong>{new Date(issuePopup.resolvedAt).toLocaleString()}</strong></div>}
                <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", marginBottom:8 }}>📋 Original Issue:</div>
                <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.6, background:"#f9fafb", padding:"12px 14px", borderRadius:8, border:"1px solid #e5e7eb", borderLeft:"3px solid #7c3aed" }}>{issuePopup.description}</div>
              </>
            ) : (
              <div style={{ fontSize:13, color:"#374151", lineHeight:1.7, background:"#f5f3ff", padding:"14px 16px", borderRadius:10, border:"1px solid #c4b5fd", borderLeft:"4px solid #7c3aed" }}>{issuePopup.description}</div>
            )}
          </div>
        </div>
      )}

      {/* RMA Popup */}
      {rmaPopup && (
        <div onClick={() => setRmaPopup(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"24px 28px", maxWidth:480, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #c4b5fd" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#5b21b6" }}>🔧 RMA Details</div>
              <button onClick={() => setRmaPopup(null)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
            </div>
            <div style={{ background:"#f5f3ff", borderRadius:10, padding:"14px 16px", marginBottom:14, border:"1px solid #c4b5fd" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#7c3aed", textTransform:"uppercase", marginBottom:6 }}>Reason for RMA:</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#374151" }}>{rmaPopup.rmaReason||"—"}</div>
            </div>
            <div style={{ background:"#faf7f4", borderRadius:10, padding:"14px 16px", border:"1px solid #e0d8d0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", marginBottom:10 }}>RMA Center Details:</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:4 }}>📍 {rmaPopup.rmaCenterName||"—"}</div>
              {rmaPopup.rmaCenterCity && <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>🏙️ {rmaPopup.rmaCenterCity}</div>}
              {rmaPopup.rmaCenterAddress && <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>🗺️ {rmaPopup.rmaCenterAddress}</div>}
              {rmaPopup.rmaCenterPhone && <div style={{ fontSize:12, color:"#6b7280" }}>📞 {rmaPopup.rmaCenterPhone}</div>}
            </div>
            {rmaPopup.rmaSentAt && <div style={{ fontSize:11, color:"#9ca3af", marginTop:12 }}>📅 Sent on: {new Date(rmaPopup.rmaSentAt).toLocaleString()}</div>}
          </div>
        </div>
      )}

      {/* ✅ Product Detail Popup */}
      {productPopup && (
        <div onClick={() => setProductPopup(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"24px 28px", maxWidth:420, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #c4b5fd" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#5b21b6" }}>📦 Product Details</div>
              <button onClick={() => setProductPopup(null)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
            </div>
            <div style={{ background:"#f5f3ff", borderRadius:10, padding:"14px 16px", border:"1px solid #c4b5fd" }}>
             {[["📦 Category", productPopup.category], ["📂 Sub Category", productPopup.subCategory], ["📐 Item Name", productPopup.model], ["🔢 Serial No", productPopup.serialNo], ["📡 MAC Address", productPopup.mac]].map(([label, val]) => (
                <div key={label} style={{ display:"flex", gap:10, marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#6b7280", minWidth:110 }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#111" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Assignee Detail Popup */}
      {assigneePopup && (
        <div onClick={() => setAssigneePopup(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"24px 28px", maxWidth:420, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #fde68a" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#92400e" }}>🛠️ Support Person</div>
              <button onClick={() => setAssigneePopup(null)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
            </div>
            <div style={{ background:"#fffbeb", borderRadius:10, padding:"14px 16px", border:"1px solid #fde68a" }}>
              {[["🛠️ Name", assigneePopup.name], ["📞 Phone", assigneePopup.phone], ["🏙️ City", assigneePopup.city]].map(([label, val]) => (
                <div key={label} style={{ display:"flex", gap:10, marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#6b7280", minWidth:90 }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#111" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <div style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", color:"white", padding:"14px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 2px 12px rgba(124,58,237,0.3)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <img src="/GOIPIMAGE2.png" alt="Syrotech" style={{ width:50, height:50, borderRadius:8, objectFit:"contain", background:"rgba(255,255,255,0.15)", padding:2 }} />
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Syrotech — Customer Portal</div>
           <div style={{ fontSize:11, opacity:0.85 }}>👥 {currentUser?.name}{currentUser?.companyName ? ` · 🏢 ${currentUser.companyName}` : ""}{currentUser?.customerType ? ` · 🏷️ ${currentUser.customerType}` : ""}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.35)", color:"white", padding:"6px 16px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>Logout</button>
      </div>

      {/* Tabs */}
      <div style={{ background:"white", borderBottom:"2px solid #e5e7eb", padding:"0 28px", display:"flex", gap:0 }}>
        {[["raise","🎫 Raise Ticket"],["mytickets",`📋 My Tickets (${myTickets.length})`]].map(([key,label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding:"14px 22px", fontSize:13, fontWeight:activeTab===key?800:500, color:activeTab===key?"#7c3aed":"#6b7280", background:"none", border:"none", borderBottom:activeTab===key?"3px solid #7c3aed":"3px solid transparent", cursor:"pointer", whiteSpace:"nowrap", marginBottom:-2, fontFamily:"inherit" }}>{label}</button>
        ))}
      </div>

      {successMsg && (
        <div style={{ margin:"16px 28px 0", background:"#ecfdf5", border:"1.5px solid #6ee7b7", borderRadius:10, padding:"12px 20px", fontSize:14, fontWeight:600, color:"#065f46" }}>{successMsg}</div>
      )}

      <div style={{ maxWidth:1000, margin:"28px auto", padding:"0 16px" }}>

        {/* ── RAISE TICKET ── */}
        {activeTab === "raise" && (
          <div style={{ background:"white", borderRadius:20, padding:"28px 32px", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", border:"1px solid #e9d5ff" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24, paddingBottom:20, borderBottom:"1px solid #f3e8ff" }}>
              <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#7c3aed,#6d28d9)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🎫</div>
              <div>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", margin:0 }}>Raise Support Ticket</h2>
                <p style={{ fontSize:13, color:"#6b7280", margin:0, marginTop:2 }}>All fields marked <span style={{ color:"#7c3aed" }}>*</span> are required.</p>
              </div>
            </div>

            {/* Customer info banner */}
            <div style={{ background:"#f5f3ff", border:"1px solid #c4b5fd", borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", gap:16, flexWrap:"wrap" }}>
              <div style={{ fontSize:13, color:"#5b21b6" }}>👤 <strong>{currentUser?.name}</strong></div>
              <div style={{ fontSize:13, color:"#5b21b6" }}>✉️ {currentUser?.email}</div>
              {currentUser?.phone && <div style={{ fontSize:13, color:"#5b21b6" }}>📞 {currentUser.phone}</div>}
              {currentUser?.companyName && <div style={{ fontSize:13, color:"#5b21b6" }}>🏢 {currentUser.companyName}</div>}
              {currentUser?.customerType && <div style={{ fontSize:13, color:"#5b21b6" }}>🏷️ {currentUser.customerType}</div>}
            </div>

            {errors.submit && <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderLeft:"3px solid #ef4444", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#b91c1c", marginBottom:16 }}>{errors.submit}</div>}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div>
  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Product Category <span style={{ color:"#7c3aed" }}>*</span></label>
  <select name="category" value={form.category} onChange={handleChange} style={iStyle("category")}>
    <option value="">Select Category</option>
    {getCategories().map(p => <option key={p} value={p}>{p}</option>)}
  </select>
  {errors.category && <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.category}</span>}
</div>
<div>
  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Sub Category <span style={{ color:"#7c3aed" }}>*</span></label>
  <select name="subCategory" value={form.subCategory} onChange={handleChange} style={iStyle("subCategory")} disabled={!form.category}>
    <option value="">{form.category ? "Select Sub Category" : "Select category first"}</option>
    {getSubCategories(form.category).map(s => <option key={s} value={s}>{s}</option>)}
  </select>
  {errors.subCategory && <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.subCategory}</span>}
</div>
<div>
  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Item Name <span style={{ color:"#7c3aed" }}>*</span></label>
  <select name="model" value={form.model} onChange={handleChange} style={iStyle("model")} disabled={!form.subCategory}>
    <option value="">{form.subCategory ? "Select Item" : "Select sub category first"}</option>
    {getItems(form.category, form.subCategory).map(m => <option key={m} value={m}>{m}</option>)}
  </select>
  {errors.model && <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.model}</span>}
</div>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Serial Number <span style={{ color:"#7c3aed" }}>*</span></label>
                <input name="serialNo" placeholder="e.g. SYR-20240001" value={form.serialNo} onChange={handleChange} style={iStyle("serialNo")} />
                {errors.serialNo && <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.serialNo}</span>}
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>MAC Address</label>
               <div>


  <div style={{ display:"flex", gap:8 }}>

    {/* Prefix Select */}
    <select
      value={form.macPrefix || ""}
      onChange={(e) => {
        setForm(prev => ({
          ...prev,
          macPrefix: e.target.value,
          mac: `${e.target.value}:${prev.macSuffix || ""}`
        }));
      }}
      style={{ ...iStyle("mac"), width:"45%" }}
    >
      <option value="">Select Prefix</option>

      <option value="38:94:E0">38:94:E0</option>
      <option value="7C:A9:6B">7C:A9:6B</option>
      <option value="54:47:E8">54:47:E8</option>
      <option value="A8:E2:07">A8:E2:07</option>
      <option value="B8:B7:DB">B8:B7:DB</option>
      <option value="98:9D:B2">98:9D:B2</option>
      <option value="74:61:D1">74:61:D1</option>
    </select>

    {/* Remaining MAC */}
    <input
      placeholder="11:22:33"
      value={form.macSuffix || ""}
      onChange={(e) => {
        const value = e.target.value.toUpperCase();

        setForm(prev => ({
          ...prev,
          macSuffix: value,
          mac: `${prev.macPrefix || ""}:${value}`
        }));
      }}
      style={{ ...iStyle("mac"), width:"55%" }}
    />

  </div>
</div>
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Customer Name <span style={{ color:"#7c3aed" }}>*</span></label>
                <input name="customer" placeholder="Your full name" value={form.customer} onChange={handleChange} style={iStyle("customer")} />
                {errors.customer && <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.customer}</span>}
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Email Address <span style={{ color:"#7c3aed" }}>*</span></label>
                <input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} style={iStyle("email")} />
                {errors.email && <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.email}</span>}
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Contact Number <span style={{ color:"#7c3aed" }}>*</span></label>
                <input name="phone" placeholder="10-digit mobile number" value={form.phone} onChange={handleChange} maxLength={10} style={iStyle("phone")} />
                {errors.phone
                  ? <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.phone}</span>
                  : <span style={{ fontSize:10, color:"#9ca3af", marginTop:3, display:"block" }}>{(form.phone||"").replace(/\s+/g,"").length}/10 digits</span>
                }
              </div>



              <div>
  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Company Name</label>
  <input name="companyName" placeholder="e.g. ABC Pvt Ltd" value={form.companyName} onChange={handleChange} style={iStyle("companyName")} />
</div>

{/* Country  */}

 <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Country <span style={{ color:"#7c3aed" }}>*</span></label>
                <select name="country" value={form.country} onChange={handleChange} style={iStyle("country")}>
                  <option value="">Select Country</option>
                  <option>India</option><option>United States</option><option>United Kingdom</option>
                  <option>United Arab Emirates</option><option>Saudi Arabia</option><option>Canada</option>
                  <option>Australia</option><option>Singapore</option><option>Germany</option>
                  <option>France</option><option>Nepal</option><option>Bangladesh</option>
                  <option>Sri Lanka</option><option>Pakistan</option><option>Other</option>
                </select>
                {errors.country && <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.country}</span>}
              </div>
              

              
         

           

              {/* STATE */}
<div>
  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>State <span style={{ color:"#7c3aed" }}>*</span></label>
  <select name="state" value={form.state} onChange={handleChange} style={iStyle("state")}>
    <option value="">Select State</option>
    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
  </select>
  {errors.state && <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.state}</span>}
</div>

{/* CITY */}
<div>
  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>City <span style={{ color:"#7c3aed" }}>*</span></label>
  {form.city === "__other__" ? (
    <div style={{ display:"flex", gap:6 }}>
      <input name="city" placeholder="Type your city name" value="" onChange={handleChange} style={{ ...iStyle("city"), flex:1 }} autoFocus />
      <button type="button" onClick={() => setForm(prev => ({ ...prev, city: "" }))}
        style={{ padding:"8px 10px", borderRadius:9, border:"1.5px solid #d1d5db", background:"#f3f4f6", cursor:"pointer", fontSize:12, color:"#6b7280", whiteSpace:"nowrap" }}>
        ↩ Back
      </button>
    </div>
  ) : (STATE_CITY_MAP[form.state] || []).includes(form.city) || form.city === "" ? (
    <select name="city" value={form.city}
      onChange={e => {
        if (e.target.value === "__other__") setForm(prev => ({ ...prev, city: "__other__" }));
        else handleChange(e);
      }}
      style={iStyle("city")} disabled={!form.state}>
      <option value="">{form.state ? "Select City" : "Select state first"}</option>
      {(STATE_CITY_MAP[form.state] || []).map(c => <option key={c} value={c}>{c}</option>)}
      <option value="__other__">✏️ My city is not listed...</option>
    </select>
  ) : (
    <div style={{ display:"flex", gap:6 }}>
      <input name="city" placeholder="Type your city name" value={form.city} onChange={handleChange} style={{ ...iStyle("city"), flex:1 }} />
      <button type="button" onClick={() => setForm(prev => ({ ...prev, city: "" }))}
        style={{ padding:"8px 10px", borderRadius:9, border:"1.5px solid #d1d5db", background:"#f3f4f6", cursor:"pointer", fontSize:12, color:"#6b7280", whiteSpace:"nowrap" }}>
        ↩ Back
      </button>
    </div>
  )}
  {errors.city && <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.city}</span>}
</div>
</div>

<div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Pincode <span style={{ color:"#7c3aed" }}>*</span></label>
                <input name="pincode" placeholder="e.g. 400001" value={form.pincode} onChange={handleChange} maxLength={6} style={iStyle("pincode")} />
                {errors.pincode && <span className="cust-field-error" style={{ fontSize:11, color:"#ef4444", marginTop:3, display:"block" }}>{errors.pincode}</span>}
              </div>

             

            {/* Product Image */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Product Image <span style={{ fontSize:10, color:"#9ca3af", textTransform:"none", fontWeight:400 }}>(optional)</span></label>
              <div style={{ border:`2px dashed ${errors.productImage?"#ef4444":"#c4b5fd"}`, borderRadius:10, padding:"16px 20px", background:"#faf5ff", textAlign:"center" }}>
                {!imagePreview ? (
                  <div>
                    <div style={{ fontSize:28, marginBottom:6 }}>📷</div>
                    <div style={{ fontSize:12, color:"#888", marginBottom:10 }}>Upload product photo (max 3MB)</div>
                    <label style={{ background:"#7c3aed", color:"white", padding:"7px 18px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, display:"inline-block" }}>
                      Choose Image<input type="file" accept="image/*" onChange={handleImageUpload} style={{ display:"none" }} />
                    </label>
                  </div>
                ) : (
                  <div>
                    <img src={imagePreview} alt="Product" style={{ maxWidth:"100%", maxHeight:180, borderRadius:8, border:"2px solid #c4b5fd", marginBottom:10 }} />
                    <div style={{ display:"flex", justifyContent:"center", gap:10 }}>
                      <label style={{ background:"#f0ebe3", color:"#555", border:"1px solid #ddd5c8", padding:"6px 14px", borderRadius:7, cursor:"pointer", fontSize:12 }}>
                        Change<input type="file" accept="image/*" onChange={handleImageUpload} style={{ display:"none" }} />
                      </label>
                      <button type="button" onClick={() => { setImagePreview(""); setForm(p=>({...p,productImage:""})); }} style={{ background:"#fee2e2", color:"#dc2626", border:"1px solid #fca5a5", padding:"6px 14px", borderRadius:7, cursor:"pointer", fontSize:12, fontWeight:600 }}>Remove</button>
                    </div>
                    <div style={{ fontSize:11, color:"#10b981", marginTop:6, fontWeight:600 }}>✅ Image uploaded</div>
                  </div>
                )}
              </div>
            </div>

           {/* Description */}
<div style={{ marginBottom:20 }}>
  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>
    Issue Type <span style={{ color:"#7c3aed" }}>*</span>
  </label>
  <select
    value={form.issuePrefix}
    onChange={(e) => { setForm(prev => ({ ...prev, issuePrefix: e.target.value })); setErrors(prev => ({ ...prev, description: "" })); }}
    disabled={!form.category}
    style={{ ...iStyle("description"), marginBottom:10 }}
  >
    <option value="">{form.category ? "Select Issue Type" : "Select category first"}</option>
    {getIssues(form.category, form.subCategory).map(issue => (
      <option key={issue} value={issue}>{issue}</option>
    ))}
  </select>

  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>
    Issue Description <span style={{ color:"#7c3aed" }}>*</span>
    <span style={{ fontSize:10, color:"#9ca3af", textTransform:"none", fontWeight:400 }}> (max 500 chars)</span>
  </label>
  <textarea
    placeholder="Describe the issue in detail — what happened, when it started, what error you see..."
    rows={4}
    value={form.issueSuffix}
    onChange={(e) => { setForm(prev => ({ ...prev, issueSuffix: e.target.value })); setErrors(prev => ({ ...prev, description: "" })); }}
    disabled={!form.issuePrefix}
    style={{ ...iStyle("description"), resize:"vertical", fontFamily:"inherit", lineHeight:1.6, opacity: !form.issuePrefix ? 0.5 : 1 }}
  />
  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginTop:3 }}>
    {errors.description ? <span className="cust-field-error" style={{ color:"#ef4444" }}>{errors.description}</span> : <span style={{ color:"#9ca3af" }}>{(form.issueSuffix||"").length}/500</span>}
    <span style={{ color:(form.issueSuffix||"").length > 450 ? "#ef4444" : "#10b981", fontWeight:600 }}>
      {500 - (form.issueSuffix||"").length} left
    </span>
  </div>
</div>

            <button onClick={handleSubmit} disabled={submitting} style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background:submitting?"#9ca3af":"linear-gradient(135deg,#7c3aed,#6d28d9)", color:"white", fontFamily:"inherit", fontSize:15, fontWeight:700, cursor:submitting?"not-allowed":"pointer", boxShadow:"0 4px 14px rgba(124,58,237,0.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {submitting ? "⏳ Submitting..." : "🎫 Submit Ticket"}
            </button>
          </div>
        )}

        {/* ── MY TICKETS ── */}
        {activeTab === "mytickets" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#374151", margin:0 }}>My Tickets</h2>
                <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>Track all your support requests</p>
              </div>
              <button onClick={() => setActiveTab("raise")} style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", color:"white", border:"none", padding:"9px 20px", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>+ New Ticket</button>
            </div>

            {myTickets.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", background:"white", borderRadius:16, boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎫</div>
                <p style={{ color:"#9ca3af", fontSize:14 }}>You haven't raised any tickets yet.</p>
                <button onClick={() => setActiveTab("raise")} style={{ marginTop:14, background:"linear-gradient(135deg,#7c3aed,#6d28d9)", color:"white", border:"none", padding:"9px 20px", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>Raise First Ticket</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:12, display:"flex", gap:10 }}>
                  <input placeholder="🔍 Search by serial no, product, subcategory, item, date, city..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{ flex:1, padding:"10px 16px", borderRadius:10, border:"1.5px solid #d1d5db", fontSize:13, background:"white", color:"#374151", outline:"none", fontFamily:"inherit" }} />
                  {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background:"#f3f4f6", border:"1px solid #d1d5db", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:12, color:"#6b7280", fontWeight:600 }}>✕ Clear</button>}
                </div>

                <div style={{ background:"white", borderRadius:12, border:"1.5px solid #e9d5ff", padding:"12px 16px", marginBottom:14, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {[["all","All","#374151","#f3f4f6"],["open","🔓 Open","#e04e00","#fff4ee"],["resolved","✅ Resolved","#1a7a46","#edfaf3"],["rma","🔧 RMA","#7c3aed","#f5f3ff"],["reopened","🔄 Reopened","#dc2626","#fee2e2"]].map(([key,label,col,bg]) => (
                      <button key={key} onClick={() => setStatusFilter(key)} style={{ padding:"5px 12px", borderRadius:16, border:statusFilter===key?`2px solid ${col}`:"1px solid #d1d5db", background:statusFilter===key?bg:"white", color:statusFilter===key?col:"#555", fontWeight:statusFilter===key?700:400, fontSize:12, cursor:"pointer" }}>
                        {label} <span style={{ marginLeft:4, background:statusFilter===key?col:"#e5e7eb", color:statusFilter===key?"white":"#555", borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:700 }}>{statusCounts[key]??0}</span>
                      </button>
                    ))}
                  </div>
                  <select value={dateSort} onChange={e => setDateSort(e.target.value)} style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid #d1d5db", fontSize:12, cursor:"pointer", background:"white", color:"#374151", outline:"none", fontFamily:"inherit" }}>
                    <option value="newest">🔽 Newest First</option>
                    <option value="oldest">🔼 Oldest First</option>
                  </select>
                </div>

                <div style={{ borderRadius:12, border:"1.5px solid #e9d5ff", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", overflowX:"auto", overflowY:"auto", maxHeight:"65vh" }}>
                  <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:0, background:"white", minWidth:960 }}>
                    <thead>
                      <tr style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", position:"sticky", top:0, zIndex:2 }}>
                        {["Ticket No","Date","Product","Item Name","Status","Image","Issue","History","Feedback"].map((h,i) => (
                          <th key={i} style={{ padding:"12px 12px", fontSize:10, fontWeight:800, color:"white", textTransform:"uppercase", letterSpacing:"0.05em", textAlign:"left", borderRight:"1px solid rgba(255,255,255,0.2)", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayTickets.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign:"center", padding:40, color:"#9ca3af", fontSize:14 }}>No tickets found.</td></tr>
                      ) : displayTickets.reduce((acc, ticket, idx) => {
                        const s = (ticket.status||"pending").toLowerCase();
                        acc.push(
                          <tr key={ticket.id} style={{ borderBottom:"1px solid #e9d5ff", background:idx%2===0?"#faf8ff":"white", borderLeft:`4px solid ${STATUS_COLOR[s]||"#ccc"}` }}>
                            <td style={tdStyle({ whiteSpace:"nowrap" })}>
                              <div style={{ fontSize:10, fontWeight:800, color:"#7c3aed" }}>{ticket.ticketNumber||"—"}</div>
                            </td>
                            <td style={tdStyle()}>
                              <div style={{ fontSize:11, color:"#374151", fontWeight:600, whiteSpace:"nowrap" }}>{ticket.date||"—"}</div>
                              {ticket.resolvedAt && <div style={{ fontSize:10, color:"#10b981", whiteSpace:"nowrap" }}>✅ {new Date(ticket.resolvedAt).toLocaleDateString()}</div>}
                            </td>
                            <td style={tdStyle()}>
  <div style={{ fontWeight:700, fontSize:12, whiteSpace:"nowrap", color:"#374151" }}>{ticket.category||"—"}</div>
</td>
                            <td style={tdStyle({ cursor:"pointer" })}
  onClick={() => setProductPopup({ category:ticket.category, subCategory:ticket.subCategory, model:ticket.model, serialNo:ticket.serialNo, mac:ticket.mac })}>
  <div style={{ fontSize:11, whiteSpace:"nowrap", color:"#7c3aed", textDecoration:"underline", textDecorationStyle:"dotted", textDecorationColor:"#c4b5fd" }}>{ticket.model||"—"}</div>
</td>
                            <td style={tdStyle()}>
                              <span onClick={() => {
                                if (s==="resolved" && ticket.resolutionNotes) setIssuePopup({ description:ticket.description, resolutionNotes:ticket.resolutionNotes, resolvedAt:ticket.resolvedAt });
                                else if (s==="rma") setRmaPopup({ rmaReason:ticket.rmaReason, rmaCenterName:ticket.rmaCenterName, rmaCenterCity:ticket.rmaCenterCity, rmaCenterAddress:ticket.rmaCenterAddress, rmaCenterPhone:ticket.rmaCenterPhone, rmaSentAt:ticket.rmaSentAt });
                              }} style={{ padding:"3px 8px", borderRadius:10, fontSize:9, fontWeight:700, color:STATUS_COLOR[s], background:STATUS_BG[s], display:"inline-block", whiteSpace:"nowrap", cursor:(s==="resolved"||s==="rma")?"pointer":"default" }}>
                                {STATUS_ICON[s]} {s.toUpperCase()}
                              </span>
                              {s==="resolved" && ticket.resolutionNotes && <div onClick={() => setIssuePopup({ description:ticket.description, resolutionNotes:ticket.resolutionNotes, resolvedAt:ticket.resolvedAt })} style={{ fontSize:9, color:"#059669", marginTop:3, cursor:"pointer", fontWeight:600 }}>📋 View details</div>}
                              {s==="resolved" && (() => {
  const hrs = ticket.resolvedAt ? (Date.now() - new Date(ticket.resolvedAt).getTime()) / (1000*60*60) : 999;
  if (hrs > 48) return null;
  return (
    <div>
      <div onClick={() => {
        const newIssue = window.prompt("Please describe the issue you are still facing:");
        if (!newIssue || !newIssue.trim()) return;
        const existingHistory = Array.isArray(ticket.issueHistory) ? ticket.issueHistory : [];
        const newEntry = {
          description: newIssue.trim(),
          raisedBy: currentUser?.email,
          raisedByName: currentUser?.name,
          raisedAt: new Date().toISOString(),
          assignTo: ticket.assignTo,
        };
        fetch(`${BASE_URL}/tickets/${ticket.id}`, {
          method:"PATCH", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
  status: "reopened",
  resolvedAt: null,
  resolutionNotes: "",
  reopenedAt: new Date().toISOString(),
  reopenCount: (ticket.reopenCount || 0) + 1,
  issueHistory: [...existingHistory, newEntry],
  description: newIssue.trim(),
})
        }).then(() => fetchTickets());
      }} style={{ fontSize:9, color:"#dc2626", marginTop:3, cursor:"pointer", fontWeight:700, background:"#fee2e2", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
        🔄 Reopen
      </div>
    </div>
  );
})()}
                              {s==="rma" && <div onClick={() => setRmaPopup({ rmaReason:ticket.rmaReason, rmaCenterName:ticket.rmaCenterName, rmaCenterCity:ticket.rmaCenterCity, rmaCenterAddress:ticket.rmaCenterAddress, rmaCenterPhone:ticket.rmaCenterPhone, rmaSentAt:ticket.rmaSentAt })} style={{ fontSize:9, color:"#7c3aed", marginTop:3, cursor:"pointer", fontWeight:600 }}>🔧 View RMA</div>}
                              {ticket.createdAt && ticket.resolvedAt && s === "resolved" && (() => {
                                const diff = new Date(ticket.resolvedAt) - new Date(ticket.createdAt);
                                const hrs  = Math.floor(diff / (1000 * 60 * 60));
                                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                return <div style={{ fontSize:9, color:"#6b7280", marginTop:3, fontWeight:600 }}>⏱️ Closed in {hrs}h {mins}m</div>;
                              })()}
                            </td>
                            <td style={tdStyle()}>
                              {ticket.productImage ? (
                                <button onClick={() => setExpandedImage(prev => prev===ticket.id?null:ticket.id)} style={{ background:expandedImage===ticket.id?"#dcfce7":"#f0fdf4", border:"1.5px solid #86efac", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:10, fontWeight:700, color:"#065f46" }}>📷 {expandedImage===ticket.id?"Hide":"View"}</button>
                              ) : <span style={{ fontSize:11, color:"#d1d5db" }}>—</span>}
                            </td>
                            <td style={tdStyle()}>
                              <div onClick={() => setIssuePopup({ description:ticket.description, resolutionNotes:ticket.resolutionNotes, resolvedAt:ticket.resolvedAt })}
                                style={{ fontSize:12, color:"#374151", cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160, textDecoration:"underline", textDecorationStyle:"dotted", textDecorationColor:"#9ca3af" }}>
                                {ticket.description?.length>40?ticket.description.slice(0,40)+"…":ticket.description||"—"}
                              </div>
                            </td>
                            <td style={tdStyle()}>
  <div onClick={() => setIssuePopup({
    description: ticket.description,
    resolutionNotes: ticket.resolutionNotes,
    resolvedAt: ticket.resolvedAt,
    issueHistory: ticket.issueHistory,
    firstDescription: ticket.description,
    firstCreatedAt: ticket.createdAt,
    firstRaisedByName: ticket.raisedByName,
    firstResolvedNotes: Array.isArray(ticket.issueHistory) && ticket.issueHistory.length > 0 ? null : ticket.resolutionNotes,
    firstResolvedAt: Array.isArray(ticket.issueHistory) && ticket.issueHistory.length > 0 ? null : ticket.resolvedAt,
    firstResolvedBy: Array.isArray(ticket.issueHistory) && ticket.issueHistory.length > 0 ? null : ticket.resolvedBy,
  })} style={{ fontSize:10, color:"#7c3aed", cursor:"pointer", fontWeight:700, background:"#f5f3ff", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
    📋 {(Array.isArray(ticket.issueHistory) ? ticket.issueHistory.length : 0) + 1} History
  </div>
</td>
                            <td style={{ padding:"12px 12px", borderRight:"1px solid #c4b5fd" }}>
                              {ticket.feedbackRating ? (
                                <div style={{ fontSize:11, color:"#f59e0b", fontWeight:700 }}>
                                  {"★".repeat(ticket.feedbackRating)}{"☆".repeat(5-ticket.feedbackRating)} {ticket.feedbackRating}/5
                                </div>
                              ) : s === "resolved" ? (
                                <div>
                                  <div style={{ display:"flex", gap:2, marginBottom:4 }}>
                                    {[1,2,3,4,5].map(star => (
                                      <span key={star}
                                        onMouseEnter={() => setHoverRating(prev => ({ ...prev, [ticket.id]: star }))}
                                        onMouseLeave={() => setHoverRating(prev => ({ ...prev, [ticket.id]: 0 }))}
                                        onClick={() => {
                                          fetch(`${BASE_URL}/tickets/${ticket.id}`, {
                                            method:"PATCH", headers:{"Content-Type":"application/json"},
                                            body: JSON.stringify({ feedbackRating: star, feedbackReceivedAt: new Date().toISOString() })
                                          }).then(r => r.json()).then(() => fetchTickets()).catch(console.error);
                                        }}
                                        style={{ fontSize:16, cursor:"pointer", color: (hoverRating[ticket.id]||0) >= star ? "#f59e0b" : "#d1d5db", transition:"color 0.1s" }}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ fontSize:9, color:"#6b7280" }}>Click to rate</div>
                                </div>
                              ) : (
                                <div style={{ display:"flex", gap:2 }}>
                                  {[1,2,3,4,5].map(star => (
                                    <span key={star} style={{ fontSize:16, color:"#e5e7eb", cursor:"not-allowed" }}>★</span>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                        if (expandedImage===ticket.id && ticket.productImage) {
                          acc.push(
                            <tr key={`img-${ticket.id}`} style={{ background:"#f0fdf4" }}>
                              <td colSpan={8} style={{ padding:"12px 20px" }}>
                                <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
                                  <img src={ticket.productImage} alt="Product" style={{ maxHeight:180, maxWidth:260, borderRadius:8, border:"2px solid #86efac", cursor:"pointer" }} onClick={() => openImageInNewTab(ticket.productImage)} />
                                  <div style={{ fontSize:12, color:"#065f46" }}>
                                    <div style={{ fontWeight:700, marginBottom:4 }}>📷 Product Image</div>
                                    <div style={{ color:"#6b7280" }}>Click image to open full size</div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return acc;
                      }, [])}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop:10, fontSize:12, color:"#9ca3af", textAlign:"right" }}>
                  Showing <strong style={{ color:"#374151" }}>{displayTickets.length}</strong> of <strong style={{ color:"#374151" }}>{myTickets.length}</strong> tickets
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}