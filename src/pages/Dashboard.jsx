import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { getIssues } from "../data/issueList";
import "./Dashboard.css";
import RaiseLockinTicket from "./raiselockinticket";
import MyLockinTickets from "./mylockinticket";
import RaiseProductionTicket from "./RaiseProductionTicket";
import MyProductionTickets from "./MyProductionTickets";
import ProductTesting from "./ProductTesting";
import ProductTestingTickets from "./ProductTestingTicket";

const BASE_URL = "https://api.syrotech.com";

// ✅ Centralized status styles

const STATUS_COLOR = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed", reopened: "#dc2626" };
const STATUS_BG    = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff", reopened: "#fee2e2" };
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


// ✅ Auto-assign: pick specialist with fewest open tickets
const SOUTH_STATES = ["kerala", "tamil nadu", "karnataka", "andhra pradesh", "telangana"];

function getAutoAssignByLeastTickets(supportPersons, category, state, tickets) {
  if (!supportPersons || supportPersons.length === 0) return "";
  const isSouth = SOUTH_STATES.includes((state || "").toLowerCase().trim());
  const product = (category || "").toLowerCase();
  const countOpen = (name) =>
    tickets.filter(t => t.assignTo === name).length;
  for (let level = 1; level <= 4; level++) {
    let matched = supportPersons.filter(p => {
      const specs = Array.isArray(p.specialization) ? p.specialization : [];
      return p.level === level && !p.isOnLeave && specs.map(s => s.toLowerCase()).includes(product);
    });
    if (isSouth) {
      const southOnly = matched.filter(p => p.zone === "South Region");
      const allZone   = matched.filter(p => p.zone === "all");
      matched = southOnly.length > 0 ? southOnly : allZone;
    } else {
      matched = matched.filter(p => p.zone === "all" || p.zone === "all except south");
    }
    if (matched.length > 0) {
      return matched.reduce((best, p) =>
        countOpen(p.name) < countOpen(best.name) ? p : best, matched[0]
      ).name;
    }
  }
  return "";
}

export default function Dashboard() {
  const { products, getCategories, getSubCategories, getItems } = useProducts();
const SALES_CATEGORIES = getCategories();
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [form, setForm] = useState({
    category: "", subCategory: "", model: "", serialNo: "", mac: "",macPrefix: "",macSuffix: "", customer: "",
    email: "", phone: "", city: "", state: "", country: "", pincode: "", companyName: "",
    description: "", assignTo: "", productImage: "", issuePrefix: "", issueSuffix: ""
  });
  const [errors, setErrors]                 = useState({});
  const [tickets, setTickets]               = useState([]);
  const [supportPersons, setSupportPersons] = useState([]);
  const [activeTab, setActiveTab]           = useState("raise");
  // lockin 
  const [lockinTab, setLockinTab] = useState("raiselockin");
  const [submitting, setSubmitting]         = useState(false);
  const [successMsg, setSuccessMsg]         = useState("");
  const [imagePreview, setImagePreview]     = useState("");
  const [expandedImage, setExpandedImage]   = useState(null);
  const [issuePopup, setIssuePopup]         = useState(null);
  const [rmaPopup, setRmaPopup]             = useState(null);
  const [productPopup, setProductPopup]     = useState(null);
  const [customerPopup, setCustomerPopup]   = useState(null);
  const [assigneePopup, setAssigneePopup]   = useState(null);
  const [reassignPopup, setReassignPopup]   = useState(null); // ✅ reassign popup

 

  const [dateSort, setDateSort]             = useState("newest");
  const [productFilter, setProductFilter]       = useState("all");
const [subCategoryFilter, setSubCategoryFilter] = useState("all");
const [itemFilter, setItemFilter]               = useState("all");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [searchQuery, setSearchQuery]       = useState("");
 const [statusUpdatePopup, setStatusUpdatePopup] = useState(null);
const [statusUpdateForm, setStatusUpdateForm] = useState({});
const [updateNotifications, setUpdateNotifications] = useState(() => {
  try { return JSON.parse(localStorage.getItem("sales_updateNotifications")) || []; }
  catch { return []; }
});
const prevTicketUpdatesRef = useRef({});
  const [filterYear, setFilterYear]         = useState("");  // ✅ Year first
  const [filterMonth, setFilterMonth]       = useState(""); // ✅ Month second
  const [reassignFilter, setReassignFilter] = useState(false); // ✅ reassign filter

  useEffect(() => {
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(users => setSupportPersons(users.filter(u => u.role === "support" && u.approved)))
      .catch(console.error);
  }, []);

  const fetchTickets = () => {
   const email = currentUser?.email || "";
   if (!email) return;
   fetch(`${BASE_URL}/tickets?raisedBy=${encodeURIComponent(email)}&limit=2000`)
      .then(res => res.json())
     .then(data => {
        const newTickets = data.tickets || [];
        
        // Check for new updates from support
        const newNotifs = [];
        newTickets.forEach(ticket => {
          const prevCount = prevTicketUpdatesRef.current[ticket.id] ?? null;
          const currentCount = Array.isArray(ticket.statusUpdates) ? ticket.statusUpdates.length : 0;
          
          if (prevCount !== null && currentCount > prevCount) {
            // Check if latest update is from support
            const latestUpdate = ticket.statusUpdates[ticket.statusUpdates.length - 1];
            if (latestUpdate?.updatedByRole !== "sales") {
              newNotifs.push({
                id: `${ticket.id}-${currentCount}`,
                ticketNumber: ticket.ticketNumber,
                message: `🔔 Ticket #${ticket.ticketNumber} has a new update from Support — please check`,
              });
            }
          }
          prevTicketUpdatesRef.current[ticket.id] = currentCount;
        });

        if (newNotifs.length > 0) {
          setUpdateNotifications(prev => [...prev, ...newNotifs]);
        }

        setTickets(newTickets);
      })
      .catch(err => console.error("Failed to load tickets:", err));
  };

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem("sales_updateNotifications", JSON.stringify(updateNotifications));
  }, [updateNotifications]);

  // ✅ Auto-assign whenever category/city/country/tickets changes
//   useEffect(() => {
//     if (supportPersons.length === 0 || !form.category) return;
//     const assigned = getAutoAssignByLeastTickets(supportPersons, form.category, form.state, tickets);
//     setForm(prev => ({ ...prev, assignTo: assigned }));
// }, [form.category, form.state, supportPersons, tickets]);

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
  setForm(prev => ({ ...prev, [name]: value, subCategory: "", model: "", assignTo: "", issuePrefix: "", issueSuffix: "" }));
} else if (name === "subCategory") {
  setForm(prev => ({ ...prev, [name]: value, model: "", issuePrefix: "", issueSuffix: "" }));
  } else if (name === "state") {
  setForm(prev => ({ ...prev, state: value, city: "", assignTo: "" }));
} else if (name === "country") {
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
   if (!form.category)    newErrors.category    = "Please select a product category.";
if (!form.subCategory) newErrors.subCategory = "Please select a sub category.";
if (!form.model)       newErrors.model       = "Please select an item.";
   
    if (!form.customer.trim()) newErrors.customer = "Customer name is required.";
    else if (/\d/.test(form.customer)) newErrors.customer = "Name cannot contain numbers.";
    else if (form.customer.trim().length < 2) newErrors.customer = "Enter a valid full name.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Enter a valid email address.";
    if (!form.phone.trim()) newErrors.phone = "Contact number is required.";
else if (!/^\d+$/.test(form.phone.replace(/\s+/g, ""))) newErrors.phone = "Enter a valid phone number (digits only).";
    if (!form.city.trim())    newErrors.city    = "City is required.";
    if (!form.state.trim())   newErrors.state   = "State is required.";
    if (!form.country)        newErrors.country = "Please select a country.";
    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) newErrors.pincode = "Enter a valid 6-digit pincode.";
   if (!form.issuePrefix) newErrors.description = "Please select an issue type.";
else if (!form.issueSuffix.trim()) newErrors.description = "Please describe the issue in detail.";
else if (form.issueSuffix.trim().length > 500) newErrors.description = "Description cannot exceed 500 characters.";
    return newErrors;
  };

 const handleSubmit = () => {
    if (submitting) return;
    form.description = `${form.issuePrefix} | ${form.issueSuffix}`;
const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErr = document.querySelector(".field-error");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

   
  

    setSubmitting(true);
    const newTicket = {
      ...form,
      phone:        form.phone.replace(/\s+/g, ""),
      status:       "open",
      acceptedAt:   new Date().toISOString(),
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
       setForm({ category: "", subCategory: "", model: "", serialNo: "", mac: "", macPrefix: "", macSuffix: "", customer: "", email: "", phone: "", city: "", state: "", country: "", pincode: "", companyName: "", description: "", assignTo: "", productImage: "", issuePrefix: "", issueSuffix: "" });
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
    .filter(t => t.raisedBy === currentUser?.email && t.ticketType !== "lockin")
    .slice()
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  const displayTickets = myTickets
    .filter(t => productFilter === "all" || t.category === productFilter)
.filter(t => subCategoryFilter === "all" || t.subCategory === subCategoryFilter)
.filter(t => itemFilter === "all" || t.model === itemFilter)
   .filter(t => {
  if (statusFilter === "all") return true;
  if (statusFilter === "reopened") return (t.status || "").toLowerCase() === "reopened";
  return (t.status || "open").toLowerCase() === statusFilter;
})
    .filter(t => {
      if (!filterMonth && !filterYear) return true;
      const d = new Date(t.createdAt || t.date);
      if (filterMonth && filterYear) {
        return d.getMonth() + 1 === parseInt(filterMonth) && d.getFullYear() === parseInt(filterYear);
      }
      if (filterMonth) return d.getMonth() + 1 === parseInt(filterMonth);
      if (filterYear)  return d.getFullYear() === parseInt(filterYear);
      return true;
    })
    .filter(t => !reassignFilter || !!t.reassignedFrom)
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
    (t.customer     || "").toLowerCase().includes(q) ||
    (t.date         || "").toLowerCase().includes(q) ||
    (t.serialNo     || "").toLowerCase().includes(q) ||
    (t.phone        || "").toLowerCase().includes(q) ||
    (t.city         || "").toLowerCase().includes(q) ||
    (t.assignTo     || "").toLowerCase().includes(q) ||
    (t.category     || "").toLowerCase().includes(q) ||
    (t.subCategory  || "").toLowerCase().includes(q) ||
    (t.model        || "").toLowerCase().includes(q)
  );
    })
    .slice()
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.date).getTime();
      const db = new Date(b.createdAt || b.date).getTime();
      return dateSort === "newest" ? db - da : da - db;
    });

  const uniqueProducts = getCategories();

  const statusCounts = {
    all:      myTickets.length,
    open:     myTickets.filter(t => t.status === "open").length,
    resolved: myTickets.filter(t => t.status === "resolved").length,
    rma:      myTickets.filter(t => t.status === "rma").length,
    reopened: myTickets.filter(t => (t.status || "").toLowerCase() === "reopened").length,
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

  // ✅ Shared td style with left-aligned text
  const tdStyle = (extra = {}) => ({
    borderRight: "1px solid #e0d8d0",
    textAlign: "left",
    ...extra,
  });

  return (
    <div className="dashboard-wrapper">

      {/* Issue/Resolution Popup Modal */}
      {issuePopup && (
        <div onClick={() => setIssuePopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fad8be", maxHeight: "85vh", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#ff5a00 #fff4ee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: issuePopup.resolutionNotes ? "#1a7a46" : "#c94500" }}>
                {issuePopup.resolutionNotes ? "✅ Ticket Resolved" : "📋 Issue Description"}
              </div>
              <button onClick={() => setIssuePopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>

{(() => {
  const allHistory = [];
  // Stage 1: the original ticket
  allHistory.push({
    description: issuePopup.firstDescription || issuePopup.description,
    raisedAt: issuePopup.firstCreatedAt,
    raisedByName: issuePopup.firstRaisedByName,
   resolvedNotes: issuePopup.firstResolvedNotes || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolutionNotes : null) || null,
resolvedAt: issuePopup.firstResolvedAt || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolvedAt : null) || null,
resolvedBy: issuePopup.firstResolvedBy || (Array.isArray(issuePopup.issueHistory) && issuePopup.issueHistory.length === 0 ? issuePopup.resolvedBy : null) || null,
isRma: issuePopup.firstIsRma || false,
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
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
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  🔧 What was solved (by {issuePopup.resolvedBy || "Support"}):
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#ecfdf5", padding: "14px 16px", borderRadius: 10, border: "1px solid #6ee7b7", borderLeft: "4px solid #10b981", marginBottom: 14 }}>
                  {issuePopup.resolutionNotes}
                </div>
                {issuePopup.resolutionTimeTaken && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>⏱️ Time taken: <strong>{issuePopup.resolutionTimeTaken}</strong></div>
                )}
                {issuePopup.resolvedAt && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>📅 Resolved on: <strong>{new Date(issuePopup.resolvedAt).toLocaleString()}</strong></div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>📋 Original Issue:</div>
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
             {[["🔧 Category", productPopup.category], ["📂 Sub Category", productPopup.subCategory], ["📐 Item Name", productPopup.model], ["🔢 Serial No", productPopup.serialNo], ["📡 MAC Address", productPopup.mac]].map(([label, val]) => (
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
              {[["👤 Name", customerPopup.customer], ["📞 Phone", customerPopup.phone], ["🏙️ City", customerPopup.city], ["🗺️ State", customerPopup.state], ["🌍 Country", customerPopup.country], ["🏢 Company", customerPopup.companyName]].map(([label, val]) => (
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

      {/* ✅ Reassign Detail Popup — compact timeline */}
{reassignPopup && (
  <div onClick={() => setReassignPopup(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"20px 22px", maxWidth:420, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #fed7aa", maxHeight:"80vh", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:800, color:"#c2410c" }}>🔄 Reassignment History</div>
        <button onClick={() => setReassignPopup(null)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:12, color:"#374151" }}>✕</button>
      </div>

      {/* Full history from reassignHistory array */}
      {Array.isArray(reassignPopup.reassignHistory) && reassignPopup.reassignHistory.length > 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {reassignPopup.reassignHistory.map((entry, i) => {
            const fromP = supportPersons.find(p => p.name && entry.from && p.name.toLowerCase().trim() === entry.from.toLowerCase().trim());
            const toP   = supportPersons.find(p => p.name && entry.to   && p.name.toLowerCase().trim() === entry.to.toLowerCase().trim());
            return (
              <div key={i} style={{ border:"1px solid #e0d8d0", borderRadius:10, overflow:"hidden", fontSize:12 }}>
                <div style={{ background:"#fff7ed", padding:"6px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontWeight:700, color:"#c2410c", fontSize:11 }}>Step {i+1}</span>
              {(entry.at || entry.timestamp) && <span style={{ fontSize:10, color:"#9ca3af" }}>{new Date(entry.at || entry.timestamp).toLocaleString()}</span>}
                </div>
                <div style={{ padding:"8px 12px", display:"flex", gap:8, alignItems:"center" }}>
                  {/* FROM */}
                  <div style={{ flex:1, background:"#fef2f2", borderRadius:8, padding:"6px 10px", border:"1px solid #fca5a5" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#dc2626", marginBottom:4 }}>FROM</div>
                    <div style={{ fontWeight:700, color:"#111" }}>{entry.from || "—"}</div>
                    {fromP?.city && <div style={{ fontSize:10, color:"#6b7280" }}>🏙️ {fromP.city}</div>}
                    {fromP?.email && <div style={{ fontSize:10, color:"#6b7280" }}>✉️ {fromP.email}</div>}
                   
                  </div>
                  <div style={{ fontSize:16 }}>→</div>
                  {/* TO */}
                  <div style={{ flex:1, background:"#f0fdf4", borderRadius:8, padding:"6px 10px", border:"1px solid #86efac" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#059669", marginBottom:4 }}>TO</div>
                    <div style={{ fontWeight:700, color:"#111" }}>{entry.to || "—"}</div>
                    {toP?.city && <div style={{ fontSize:10, color:"#6b7280" }}>🏙️ {toP.city}</div>}
                    {toP?.email && <div style={{ fontSize:10, color:"#6b7280" }}>✉️ {toP.email}</div>}
                    {toP?.specialization && <div style={{ fontSize:10, color:"#6b7280" }}>🎯 {toP.specialization.join(", ")}</div>}
                  </div>
                </div>
                {entry.reason && <div style={{ padding:"4px 12px 8px", fontSize:11, color:"#92400e", background:"#fffbeb" }}>📝 {entry.reason}</div>}
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback: show single reassign from reassignedFrom/assignTo */
        <div style={{ border:"1px solid #e0d8d0", borderRadius:10, overflow:"hidden", fontSize:12 }}>
          <div style={{ background:"#fff7ed", padding:"6px 12px" }}>
            <span style={{ fontWeight:700, color:"#c2410c", fontSize:11 }}>Reassigned</span>
            {reassignPopup.reassignedAt && <span style={{ fontSize:10, color:"#9ca3af", marginLeft:8 }}>{new Date(reassignPopup.reassignedAt).toLocaleString()}</span>}
          </div>
          <div style={{ padding:"8px 12px", display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ flex:1, background:"#fef2f2", borderRadius:8, padding:"6px 10px", border:"1px solid #fca5a5" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#dc2626", marginBottom:4 }}>FROM</div>
              <div style={{ fontWeight:700, color:"#111" }}>{reassignPopup.reassignedFrom || "—"}</div>
              {(() => { const p = supportPersons.find(x => x.name && reassignPopup.reassignedFrom && x.name.toLowerCase().trim() === reassignPopup.reassignedFrom.toLowerCase().trim()); return p ? <><div style={{ fontSize:10, color:"#6b7280" }}>🏙️ {p.city}</div><div style={{ fontSize:10, color:"#6b7280" }}>✉️ {p.email}</div></> : null; })()}
            </div>
            <div style={{ fontSize:16 }}>→</div>
            <div style={{ flex:1, background:"#f0fdf4", borderRadius:8, padding:"6px 10px", border:"1px solid #86efac" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#059669", marginBottom:4 }}>TO</div>
              <div style={{ fontWeight:700, color:"#111" }}>{reassignPopup.assignTo || "—"}</div>
              {(() => { const p = supportPersons.find(x => x.name && reassignPopup.assignTo && x.name.toLowerCase().trim() === reassignPopup.assignTo.toLowerCase().trim()); return p ? <><div style={{ fontSize:10, color:"#6b7280" }}>🏙️ {p.city}</div><div style={{ fontSize:10, color:"#6b7280" }}>✉️ {p.email}</div></> : null; })()}
            </div>
          </div>
          {reassignPopup.reassignReason && <div style={{ padding:"4px 12px 8px", fontSize:11, color:"#92400e", background:"#fffbeb" }}>📝 {reassignPopup.reassignReason}</div>}
        </div>
      )}
    </div>
  </div>
)}
      

{/* Status Update History Popup */}
{statusUpdatePopup && (
  <div onClick={() => setStatusUpdatePopup(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"24px 28px", maxWidth:500, width:"100%", maxHeight:"80vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #bfdbfe" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#1d4ed8" }}>📝 Status Update History</div>
        <button onClick={() => setStatusUpdatePopup(null)} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
      </div>
      {Array.isArray(statusUpdatePopup) && statusUpdatePopup.length > 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {statusUpdatePopup.map((entry, i) => (
            <div key={i} style={{ borderRadius:8, border:"1px solid #e5e7eb", overflow:"hidden", fontSize:12 }}>
              <div style={{ background:"#eff6ff", padding:"6px 12px", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontWeight:700, color:"#1d4ed8" }}>Update {i+1}</span>
                <span style={{ fontSize:10, color:"#9ca3af" }}>{new Date(entry.updatedAt).toLocaleString()}</span>
              </div>
              <div style={{ padding:"8px 12px", background:"white" }}>
          <div style={{ fontSize:11, color:"#6b7280", marginBottom:3 }}>
  By: <strong>{entry.updatedBy}</strong>
  {entry.updatedByRole === "sales" 
    ? <span style={{ marginLeft:6, background:"#fff4ee", color:"#e04e00", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:4 }}>🧑‍💼 Sales</span>
    : <span style={{ marginLeft:6, background:"#ecfdf5", color:"#059669", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:4 }}>🛠️ Support</span>
  }
</div>
                <div style={{ color:"#374151", lineHeight:1.5 }}>{entry.note}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign:"center", color:"#9ca3af", padding:20 }}>No status updates yet.</div>
      )}
    </div>
  </div>
)}


{statusUpdateForm?.show && (
  <div onClick={() => setStatusUpdateForm({})} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:14, padding:"28px 32px", maxWidth:560, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", border:"2px solid #bfdbfe" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:"#1d4ed8" }}>📝 Add Update</div>
        <button onClick={() => setStatusUpdateForm({})} style={{ background:"#f3f4f6", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:13, color:"#374151" }}>✕ Close</button>
      </div>
      <textarea rows={5} placeholder="Write your update here..."
        value={statusUpdateForm.note || ""}
        onChange={e => setStatusUpdateForm(prev => ({ ...prev, note: e.target.value }))}
        style={{ width:"100%", padding:"11px 14px", border:"2px solid #bfdbfe", borderRadius:10, fontSize:13, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box", color:"#000000", lineHeight:1.6 }} />
      <div style={{ display:"flex", gap:12, marginTop:12 }}>
        <button onClick={() => {
          const note = statusUpdateForm.note?.trim();
          if (!note) { alert("Please write an update."); return; }
          const ticketId = statusUpdateForm.id;
          const ticket = tickets.find(t => t.id === ticketId);
          const newEntry = { note, updatedBy: currentUser?.name, updatedAt: new Date().toISOString(), updatedByRole: "sales" };
          const existing = Array.isArray(ticket?.statusUpdates) ? ticket.statusUpdates : [];
          fetch(`${BASE_URL}/tickets/${ticketId}`, {
            method:"PATCH", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ statusUpdates: [...existing, newEntry], latestStatusUpdate: note, pendingUpdateFrom: "sales" })
          }).then(() => { setStatusUpdateForm({}); fetchTickets(); });
        }} style={{ flex:1, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", padding:"12px 24px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:800, fontFamily:"inherit" }}>
          ✅ Submit Update
        </button>
        <button onClick={() => setStatusUpdateForm({})}
          style={{ background:"#e2e8f0", border:"none", borderRadius:10, padding:"12px 20px", cursor:"pointer", fontSize:13, color:"#64748b", fontFamily:"inherit" }}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{updateNotifications.length > 0 && (
  <div style={{ position:"fixed", top:16, right:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8, maxWidth:420 }}>
    {updateNotifications.map(notif => (
      <div key={notif.id} style={{ background:"#fffbeb", border:"1.5px solid #f59e0b", borderRadius:10, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 4px 12px rgba(0,0,0,0.15)" }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#92400e" }}>{notif.message}</span>
        <button onClick={() => setUpdateNotifications(prev => prev.filter(n => n.id !== notif.id))}
          style={{ background:"#f59e0b", color:"white", border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:12, fontWeight:700, marginLeft:12, whiteSpace:"nowrap" }}>
          ✕
        </button>
      </div>
    ))}
  </div>
)}
      {/* Navbar */}
      <div className="dash-navbar">
        <div className="dash-brand">
          <img src="/logo.png" alt="Syrotech" style={{ width: 50, height: 50, borderRadius: 8, objectFit: "contain" }} />
          <div>
            <div className="dash-brand-name">Syrotech Networks Support</div>
            <div className="dash-brand-sub">Sales Portal</div>
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
      {/* <div className="dash-tabs">
        {[
          ["raise",     "🎫 Raise Ticket"],
          ["mytickets", `📋 My Tickets (${myTickets.length})`],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`dash-tab-btn ${activeTab === key ? "dash-tab-active" : ""}`}>
            {label}
          </button>
        ))}
      </div> */}



{/* Lockin  to replace above  */}
<div className="dash-tabs">
  {[
    ["raise",       "🎫 Raise Ticket"],
    ["mytickets",   `📋 My Tickets (${myTickets.length})`],
    ["raiselockin", "🔒 Raise Lockin Ticket"],
    ["mylockin",    "🔒 My Lockin Tickets"],
     ["raiseproduction",  "🏭 Raise Production Ticket"],
    ["myproduction",     "🏭 My Production Tickets"],
    ["producttesting",   "🧪 Product Testing"],
    ["mytestingtickets", "🧪 My Testing Tickets"],
  ].map(([key, label]) => (
    <button key={key} onClick={() => setActiveTab(key)}
      className={`dash-tab-btn ${activeTab === key ? "dash-tab-active" : ""}`}>
      {label}
    </button>
  ))}
</div>

<div className="dash-layout-wrapper">

      <div className="dash-body">

        {successMsg && (
          <div style={{ background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: "12px 20px", marginBottom: 16, fontSize: 14, fontWeight: 600, color: "#065f46", display: "flex", alignItems: "center", gap: 10 }}>
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
  <label className="form-label">Product Category <span className="req">*</span></label>
  <select name="category" value={form.category} onChange={handleChange} style={inputStyle("category")}>
    <option value="">Select Category</option>
    {SALES_CATEGORIES.map(p => <option key={p} value={p}>{p}</option>)}
  </select>
  {errors.category && <span className="field-error">{errors.category}</span>}
</div>

<div className="form-field">
  <label className="form-label">Sub Category <span className="req">*</span></label>
  <select name="subCategory" value={form.subCategory} onChange={handleChange} style={{ ...inputStyle("subCategory"), color: !form.category ? "#888" : "#111" }} disabled={!form.category}>
    <option value="">{form.category ? "Select Sub Category" : "Select category first"}</option>
    {getSubCategories(form.category).map(s => <option key={s} value={s}>{s}</option>)}
  </select>
  {errors.subCategory && <span className="field-error">{errors.subCategory}</span>}
</div>

<div className="form-field">
  <label className="form-label">Item Name <span className="req">*</span></label>
  <select name="model" value={form.model} onChange={handleChange} style={{ ...inputStyle("model"), color: !form.subCategory ? "#888" : "#111" }} disabled={!form.subCategory}>
    <option value="">{form.subCategory ? "Select Item" : "Select sub category first"}</option>
    {getItems(form.category, form.subCategory).map(m => <option key={m} value={m}>{m}</option>)}
  </select>
  {errors.model && <span className="field-error">{errors.model}</span>}
</div>

              <div className="form-field">
                <label className="form-label">Serial Number <span style={{ fontSize:11, color:"#6b7280" }}>(optional)</span></label>
                <input name="serialNo" placeholder="e.g. SYR-20240001" value={form.serialNo} onChange={handleChange} style={inputStyle("serialNo")} />
                {errors.serialNo && <span className="field-error">{errors.serialNo}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">MAC Address</label>
               <div style={{ display:"flex", gap:8 }}>
  <select 
    value={form.macPrefix||""} 
    onChange={(e)=>setForm(prev=>({...prev, macPrefix:e.target.value, mac:`${e.target.value}:${prev.macSuffix||""}`}))} 
    style={{...inputStyle("mac"), width:"45%"}}>
    <option value="">Select Prefix</option>
    <option value="38:94:E0">38:94:E0</option>
    <option value="7C:A9:6B">7C:A9:6B</option>
    <option value="54:47:E8">54:47:E8</option>
    <option value="A8:E2:07">A8:E2:07</option>
    <option value="B8:B7:DB">B8:B7:DB</option>
    <option value="98:9D:B2">98:9D:B2</option>
    <option value="74:61:D1">74:61:D1</option>
  </select>
  <input 
    placeholder="11:22:33" 
    value={form.macSuffix||""} 
    onChange={(e)=>{ const v=e.target.value.toUpperCase(); setForm(prev=>({...prev, macSuffix:v, mac:`${prev.macPrefix||""}:${v}`}))}} 
    style={{...inputStyle("mac"), width:"55%"}}
  />
</div>
              </div>

              <div className="form-field">
                <label className="form-label">Customer Name <span className="req">*</span></label>
                <input name="customer" placeholder="Full name (letters only)" value={form.customer} onChange={handleChange} style={inputStyle("customer")} />
                {errors.customer && <span className="field-error">{errors.customer}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Customer Email <span style={{ fontSize:11, color:"#6b7280" }}>(optional)</span></label>
                <input name="email" placeholder="customer@email.com" value={form.email} onChange={handleChange} style={inputStyle("email")} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-field">
              <label className="form-label">Contact Number <span className="req">*</span></label>
<input name="phone" placeholder="e.g. 9876543210" value={form.phone} onChange={handleChange} style={inputStyle("phone")} />
{errors.phone
  ? <span className="field-error">{errors.phone}</span>
  : <span className="field-hint">{form.phone.replace(/\s+/g,"").length} digits entered</span>
}
              </div>

              <div className="form-field">
                <label className="form-label">Company Name</label>
                <input name="companyName" placeholder="e.g. ABC Pvt Ltd" value={form.companyName} onChange={handleChange} style={inputStyle("companyName")} />
              </div>

{/* Country */}

 <div className="form-field">
                <label className="form-label">Country <span className="req">*</span></label>
                <select name="country" value={form.country} onChange={handleChange} style={inputStyle("country")}>
                  <option value="">Select Country</option>
                  <option>India</option><option>United States</option><option>United Kingdom</option>
                  <option>United Arab Emirates</option><option>Saudi Arabia</option><option>Canada</option>
                  <option>Australia</option><option>Singapore</option><option>Germany</option>
                  <option>France</option><option>Nepal</option><option>Bangladesh</option>
                  <option>Sri Lanka</option><option>Pakistan</option><option>Other</option>
                </select>
                {errors.country && <span className="field-error">{errors.country}</span>}
              </div>

             
           



            
{/* STATE — always first */}
<div className="form-field">
  <label className="form-label">State <span className="req">*</span></label>
  <select name="state" value={form.state} onChange={handleChange} style={inputStyle("state")}>
    <option value="">Select State</option>
    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
  </select>
  {errors.state && <span className="field-error">{errors.state}</span>}
</div>

{/* CITY — depends on state, with manual fallback */}
<div className="form-field">
  <label className="form-label">City <span className="req">*</span></label>
  {form.city === "__other__" ? (
    <div style={{ display:"flex", gap:6 }}>
      <input name="city" placeholder="Type your city name" value=""
        onChange={handleChange} style={{ ...inputStyle("city"), flex:1 }} autoFocus />
      <button type="button" onClick={() => setForm(prev => ({ ...prev, city: "", assignTo: "" }))}
        style={{ padding:"8px 10px", borderRadius:9, border:"1.5px solid #ddd5c8", background:"#f0ebe3", cursor:"pointer", fontSize:12, color:"#6b7280", whiteSpace:"nowrap" }}>
        ↩ Back
      </button>
    </div>
  ) : (STATE_CITY_MAP[form.state] || []).includes(form.city) || form.city === "" ? (
    <select name="city" value={form.city}
      onChange={e => {
        if (e.target.value === "__other__") setForm(prev => ({ ...prev, city: "__other__", assignTo: "" }));
        else handleChange(e);
      }}
      style={inputStyle("city")} disabled={!form.state}>
      <option value="">{form.state ? "Select City" : "Select state first"}</option>
      {(STATE_CITY_MAP[form.state] || []).map(c => <option key={c} value={c}>{c}</option>)}
      <option value="__other__">✏️ My city is not listed...</option>
    </select>
  ) : (
    <div style={{ display:"flex", gap:6 }}>
      <input name="city" placeholder="Type your city name" value={form.city}
        onChange={handleChange} style={{ ...inputStyle("city"), flex:1 }} />
      <button type="button" onClick={() => setForm(prev => ({ ...prev, city: "", assignTo: "" }))}
        style={{ padding:"8px 10px", borderRadius:9, border:"1.5px solid #ddd5c8", background:"#f0ebe3", cursor:"pointer", fontSize:12, color:"#6b7280", whiteSpace:"nowrap" }}>
        ↩ Back
      </button>
    </div>
  )}
  {errors.city && <span className="field-error">{errors.city}</span>}
</div>

             </div>

{/* PINCODE */}
              <div className="form-field">
               <label className="form-label">Pincode <span style={{ fontSize:11, color:"#6b7280" }}>(optional)</span><span className="form-hint"> (6 digits if provided)</span></label>
                <input name="pincode" placeholder="e.g. 400001" value={form.pincode} onChange={handleChange} maxLength={6} style={inputStyle("pincode")} />
              {errors.pincode
  ? <span className="field-error">{errors.pincode}</span>
  : <span className="field-hint">{form.pincode.length > 0 ? `${form.pincode.length}/6 digits` : "Optional"}</span>
}
              </div>

            {/* Product Image */}
            <div className="form-field" style={{ padding: "20px 36px 0" }}>
              <label className="form-label">
                Product Image
                <span className="form-hint"> (optional — upload photo showing serial no & MAC address)</span>
              </label>
              <div style={{ border: `2px dashed ${errors.productImage ? "#ef4444" : "#ddd5c8"}`, borderRadius: 10, padding: "16px 20px", background: "#f9f7f4", textAlign: "center" }}>
                {!imagePreview ? (
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Upload product photo (max 3MB)</div>
                    <label style={{ background: "#ff5a00", color: "white", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-block" }}>
                      Choose Image<input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    </label>
                  </div>
                ) : (
                  <div>
                    <img src={imagePreview} alt="Product" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, border: "2px solid #e0d8d0", marginBottom: 10 }} />
                    <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                      <label style={{ background: "#f0ebe3", color: "#555", border: "1px solid #ddd5c8", padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>
                        Change Image<input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                      </label>
                      <button type="button" onClick={() => { setImagePreview(""); setForm(prev => ({ ...prev, productImage: "" })); }}
                        style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Remove</button>
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
    Issue Type <span className="req">*</span>
  </label>
  <select
    value={form.issuePrefix}
    onChange={(e) => { setForm(prev => ({ ...prev, issuePrefix: e.target.value })); setErrors(prev => ({ ...prev, description: "" })); }}
    disabled={!form.category}
    style={{ ...inputStyle("description"), marginBottom: 10 }}
  >
    <option value="">{form.category ? "Select Issue Type" : "Select category first"}</option>
    {getIssues(form.category, form.subCategory).map(issue => (
      <option key={issue} value={issue}>{issue}</option>
    ))}
  </select>

  <label className="form-label">
    Issue Description <span className="req">*</span>
    <span className="form-hint"> (max 500 characters)</span>
  </label>
  <textarea
    rows={4}
    placeholder="Describe the issue in detail — what happened, when it started, what error you see..."
    value={form.issueSuffix}
    onChange={(e) => { setForm(prev => ({ ...prev, issueSuffix: e.target.value })); setErrors(prev => ({ ...prev, description: "" })); }}
    disabled={!form.issuePrefix}
    style={{ ...inputStyle("description"), resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, opacity: !form.issuePrefix ? 0.5 : 1 }}
  />
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
    {errors.description
      ? <span className="field-error">{errors.description}</span>
      : <span className="field-hint">{(form.issueSuffix||"").length}/500 characters</span>
    }
    <span className={`char-count ${(form.issueSuffix||"").length > 450 ? "char-warn" : "char-ok"}`}>
      {500 - (form.issueSuffix||"").length} chars left
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
                      placeholder="🔍 Search by name, date, serial no, phone, city, product, subcategory, item..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #d1d5db", fontSize: 13, background: "white", color: "#374151", outline: "none", fontFamily: "inherit" }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")}
                        style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ background: "white", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>📋 Status:</span>
                    {[
  ["all",      "All",           "#374151", "#f3f4f6"],
  ["open",     "🔓 Open",       "#e04e00", "#fff4ee"],
  ["resolved", "✅ Resolved",   "#1a7a46", "#edfaf3"],
  ["rma",      "🔧 RMA",        "#7c3aed", "#f5f3ff"],
  ["reopened", "🔄 Reopened",   "#dc2626", "#fee2e2"],
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
                        <span style={{ marginLeft: 5, background: statusFilter === key ? col : "#e5e7eb", color: statusFilter === key ? "white" : "#555", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                          {statusCounts[key] ?? 0}
                        </span>
                      </button>
                    ))}
                    {/* ✅ Reassign filter button */}
                    <button onClick={() => setReassignFilter(p => !p)} style={{
                      padding: "5px 12px", borderRadius: 16,
                      border: reassignFilter ? "2px solid #c2410c" : "1px solid #d1d5db",
                      background: reassignFilter ? "#fff7ed" : "white",
                      color: reassignFilter ? "#c2410c" : "#555",
                      fontWeight: reassignFilter ? 700 : 400,
                      fontSize: 12, cursor: "pointer", whiteSpace: "nowrap"
                    }}>
                      🔄 Reassigned
                      <span style={{ marginLeft: 5, background: reassignFilter ? "#c2410c" : "#e5e7eb", color: reassignFilter ? "white" : "#555", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                        {myTickets.filter(t => !!t.reassignedFrom).length}
                      </span>
                    </button>
                  </div>

                  <div style={{ height: 1, background: "#f0ede8" }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {/* ✅ Product — select dropdown */}
                   <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>🔧 Product:</span>

{/* Category */}
<select value={productFilter} onChange={e => { setProductFilter(e.target.value); setSubCategoryFilter("all"); setItemFilter("all"); }}
  style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${productFilter !== "all" ? "#ff5a00" : "#d1d5db"}`, fontSize: 12, cursor: "pointer", background: productFilter !== "all" ? "#fff4ee" : "white", color: productFilter !== "all" ? "#ff5a00" : "#374151", outline: "none", fontWeight: productFilter !== "all" ? 700 : 400, fontFamily: "inherit" }}>
  <option value="all">All Categories</option>
  {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
</select>

{/* Sub-Category */}
<select
  value={subCategoryFilter}
  onChange={e => { setSubCategoryFilter(e.target.value); setItemFilter("all"); }}
  disabled={productFilter === "all"}
  style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${subCategoryFilter !== "all" ? "#ff5a00" : "#d1d5db"}`, fontSize: 12, cursor: productFilter === "all" ? "not-allowed" : "pointer", background: subCategoryFilter !== "all" ? "#fff4ee" : "white", color: subCategoryFilter !== "all" ? "#ff5a00" : "#374151", outline: "none", fontWeight: subCategoryFilter !== "all" ? 700 : 400, fontFamily: "inherit", opacity: productFilter === "all" ? 0.4 : 1 }}>
  <option value="all">All Sub-Categories</option>
  {getSubCategories(productFilter).map(s => <option key={s} value={s}>{s}</option>)}
</select>

{/* Item */}
<select
  value={itemFilter}
  onChange={e => setItemFilter(e.target.value)}
  disabled={subCategoryFilter === "all"}
  style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${itemFilter !== "all" ? "#ff5a00" : "#d1d5db"}`, fontSize: 12, cursor: subCategoryFilter === "all" ? "not-allowed" : "pointer", background: itemFilter !== "all" ? "#fff4ee" : "white", color: itemFilter !== "all" ? "#ff5a00" : "#374151", outline: "none", fontWeight: itemFilter !== "all" ? 700 : 400, fontFamily: "inherit", opacity: subCategoryFilter === "all" ? 0.4 : 1 }}>
  <option value="all">All Models</option>
  {getItems(productFilter, subCategoryFilter).map(i => <option key={i} value={i}>{i}</option>)}
</select>

{/* Clear if any active */}
{(productFilter !== "all" || subCategoryFilter !== "all" || itemFilter !== "all") && (
  <button onClick={() => { setProductFilter("all"); setSubCategoryFilter("all"); setItemFilter("all"); }}
    style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, color: "#dc2626", fontWeight: 700, fontFamily: "inherit" }}>✕ Clear</button>
)}

                    <div style={{ width: 1, height: 24, background: "#e0d8d0", flexShrink: 0 }} />

                    {/* Sort by Date */}
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>📅 Sort:</span>
                    <select value={dateSort} onChange={e => setDateSort(e.target.value)} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 12, cursor: "pointer", background: "white", color: "#374151", outline: "none", minWidth: 140, fontWeight: 600, fontFamily: "inherit" }}>
                      <option value="newest">🔽 Newest First</option>
                      <option value="oldest">🔼 Oldest First</option>
                    </select>

                    <div style={{ width: 1, height: 24, background: "#e0d8d0", flexShrink: 0 }} />

                    {/* ✅ Year then Month dropdowns */}
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>🗓️ Filter:</span>
                    <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${filterYear ? "#ff5a00" : "#d1d5db"}`, fontSize: 12, cursor: "pointer", background: filterYear ? "#fff4ee" : "white", color: filterYear ? "#ff5a00" : "#374151", outline: "none", fontWeight: filterYear ? 700 : 400, fontFamily: "inherit" }}>
                      <option value="">All Years</option>
                      {[2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${filterMonth ? "#ff5a00" : "#d1d5db"}`, fontSize: 12, cursor: "pointer", background: filterMonth ? "#fff4ee" : "white", color: filterMonth ? "#ff5a00" : "#374151", outline: "none", fontWeight: filterMonth ? 700 : 400, fontFamily: "inherit" }}>
                      <option value="">All Months</option>
                      {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                        <option key={i+1} value={i+1}>{m}</option>
                      ))}
                    </select>
                    {(filterMonth || filterYear) && (
                      <button onClick={() => { setFilterMonth(""); setFilterYear(""); }} style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, color: "#dc2626", fontWeight: 700 }}>✕ Clear</button>
                    )}

                    <div style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                      Showing <strong style={{ color: "#374151" }}>{displayTickets.length}</strong> of <strong style={{ color: "#374151" }}>{myTickets.length}</strong> tickets
                    </div>
                  </div>
                </div>

                <div style={{ borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflowX: "scroll", overflowY: "auto", maxHeight: "72vh" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "white", minWidth: 1100 }}>
                    <colgroup>
                      <col style={{ width: 85  }} />
                      <col style={{ width: 100 }} />
                      <col style={{ width: 110 }} />
                      <col style={{ width: 110 }} />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 105 }} />
                      <col style={{ width: 75  }} />
                      <col style={{ width: 220 }} />
                    </colgroup>
                    <thead>
                      <tr style={{ background: "linear-gradient(135deg, #c94500 0%, #ff5a00 100%)", position: "sticky", top: 0, zIndex: 2 }}>
                       {["Ticket No","Date","Product","Item Name","Customer","Assigned To","Status","Image","Issue","History","Sup. Updates"].map((h, i) => (
                          <th key={i} style={{ padding: "12px 10px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayTickets.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>No tickets found for selected filters.</td>
                        </tr>
                      ) : (
                        displayTickets.reduce((acc, ticket, idx) => {
                         const s = (ticket.status || "open").toLowerCase();
                          const assignedPerson = supportPersons.find(p =>
                            p.name && ticket.assignTo &&
                            p.name.toLowerCase().trim() === ticket.assignTo.toLowerCase().trim()
                          );

                         acc.push(
                            <tr key={ticket.id} style={{ borderBottom: "1px solid #f0ede8", background: (ticket.pendingUpdateFrom === "support" && !["resolved","rma"].includes(s)) ? "#fee2e2" : (idx % 2 === 0 ? "#faf7f4" : "white"), borderLeft: `4px solid ${(ticket.pendingUpdateFrom === "support" && !["resolved","rma"].includes(s)) ? "#dc2626" : (STATUS_COLOR[s] || "#ccc")}` }}>
                              {/* ✅ Ticket No — no Row number */}
                              <td style={tdStyle({ padding: "12px 10px", whiteSpace: "nowrap", verticalAlign: "middle" })}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: "#ff5a00" }}>{ticket.ticketNumber || "—"}</div>
                              </td>
                              <td style={tdStyle({ padding: "12px 10px" })}>
                                <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, whiteSpace: "nowrap" }}>{ticket.date || "—"}</div>
                                {ticket.resolvedAt && (
                                  <div style={{ fontSize: 10, color: "#10b981", whiteSpace: "nowrap" }}>✅ {new Date(ticket.resolvedAt).toLocaleDateString()}</div>
                                )}
                              </td>
                              {/* ✅ Product column — click opens popup */}
                              <td style={tdStyle({ padding: "12px 10px" })}>
  <div style={{ fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#374151" }}>
    {ticket.category || "—"}
  </div>
</td>
                              {/* ✅ Model column */}
                              <td style={tdStyle({ padding: "12px 10px" })}>
  <div onClick={() => setProductPopup({ category: ticket.category, subCategory: ticket.subCategory, model: ticket.model, serialNo: ticket.serialNo, mac: ticket.mac })}
    style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", color: "#ff5a00", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#fad8be" }}>
    {ticket.model || "—"}
  </div>
</td>
                              <td style={tdStyle({ padding: "12px 10px" })}>
                                <div onClick={() => setCustomerPopup({ customer: ticket.customer, phone: ticket.phone, city: ticket.city, state: ticket.state, country: ticket.country, companyName: ticket.companyName })}
                                  style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#93c5fd" }}>
                                  {ticket.customer || "—"}
                                </div>
                              </td>
                              <td style={tdStyle({ padding: "12px 10px" })}>
                                <div onClick={() => {
                                  const p = supportPersons.find(p => p.name && ticket.assignTo && p.name.toLowerCase().trim() === ticket.assignTo.toLowerCase().trim());
                                  setAssigneePopup({ name: ticket.assignTo, phone: p?.phone, city: p?.city, specialization: p?.specialization?.join(", ") });
                                }} style={{ fontSize: 12, fontWeight: 700, color: "#92400e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#fde68a" }}>
                                  {ticket.assignTo || "—"}
                                </div>
                                {ticket.reassignedFrom && (
                                  <div onClick={() => setReassignPopup({ reassignedFrom: ticket.reassignedFrom, assignTo: ticket.assignTo, reassignReason: ticket.reassignReason, reassignedAt: ticket.reassignedAt, reassignHistory: ticket.reassignHistory })}
                                    style={{ fontSize: 9, color: "#c2410c", fontWeight: 700, cursor: "pointer", marginTop: 2 }}>🔄 reassigned — click</div>
                                )}
                              </td>
                              <td style={tdStyle({ padding: "12px 10px" })}>
                               <span onClick={() => {
                                  if (s === "rma") {
                                    setRmaPopup({ rmaReason: ticket.rmaReason, rmaCenterName: ticket.rmaCenterName, rmaCenterCity: ticket.rmaCenterCity, rmaCenterAddress: ticket.rmaCenterAddress, rmaCenterPhone: ticket.rmaCenterPhone, rmaSentAt: ticket.rmaSentAt });
                                  }
                                }}style={{ padding: "3px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s], display: "inline-block", whiteSpace: "nowrap", cursor: s === "resolved" || s === "rma" ? "pointer" : "default", border: s === "resolved" ? "1.5px solid #6ee7b7" : "none" }}>
                                  {STATUS_ICON[s]} {s.toUpperCase()}
                                </span>
                                {s === "resolved" && (() => {
  const hrs = ticket.resolvedAt
    ? (Date.now() - new Date(ticket.resolvedAt).getTime()) / (1000*60*60)
    : 999;
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
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "reopened",
            resolvedAt: null,
            resolutionNotes: "",
            reopenedAt: new Date().toISOString(),
            reopenCount: (ticket.reopenCount || 0) + 1,
            issueHistory: [...existingHistory, newEntry],
            description: newIssue.trim(),
            firstDescription: ticket.firstDescription || ticket.description,
            firstCreatedAt: ticket.firstCreatedAt || ticket.createdAt,
            firstRaisedByName: ticket.firstRaisedByName || ticket.raisedByName,
            firstResolvedNotes: ticket.firstResolvedNotes || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolutionNotes : null) || null,
firstResolvedAt: ticket.firstResolvedAt || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedAt : null) || null,
firstResolvedBy: ticket.firstResolvedBy || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedBy : null) || null,
firstIsRma: ticket.firstIsRma || false,
          })
        }).then(() => fetchTickets());
      }} style={{ fontSize:9, color:"#dc2626", marginTop:3, cursor:"pointer", fontWeight:700, background:"#fee2e2", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
        🔄 Reopen
      </div>
    </div>
  );
})()}
                               
                                {s === "rma" && (
                                  <div onClick={() => setRmaPopup({ rmaReason: ticket.rmaReason, rmaCenterName: ticket.rmaCenterName, rmaCenterCity: ticket.rmaCenterCity, rmaCenterAddress: ticket.rmaCenterAddress, rmaCenterPhone: ticket.rmaCenterPhone, rmaSentAt: ticket.rmaSentAt })}
                                    style={{ fontSize: 9, color: "#7c3aed", marginTop: 3, cursor: "pointer", fontWeight: 600 }}>🔧 View RMA details</div>
                                )}
                              </td>
                              <td style={tdStyle({ padding: "12px 6px", textAlign: "center" })}>
                                {ticket.productImage ? (
                                  <button onClick={() => setExpandedImage(prev => prev === ticket.id ? null : ticket.id)}
                                    style={{ background: expandedImage === ticket.id ? "#dcfce7" : "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#065f46", whiteSpace: "nowrap" }}>
                                    📷 {expandedImage === ticket.id ? "Hide" : "View"}
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                                )}
                              </td>

                                <td style={{ padding:"12px 10px", borderRight:"1px solid #e9d5ff" }}>
  <div onClick={() => setIssuePopup({
    description: ticket.description,
    resolutionNotes: ticket.resolutionNotes,
    resolutionTimeTaken: ticket.resolutionTimeTaken,
    resolvedBy: ticket.resolvedBy,
    resolvedAt: ticket.resolvedAt,
    rmaStatus: ticket.rmaStatus,
    issueHistory: ticket.issueHistory,
    firstDescription: ticket.firstDescription || ticket.description,
    firstCreatedAt: ticket.firstCreatedAt || ticket.createdAt,
    firstRaisedByName: ticket.firstRaisedByName || ticket.raisedByName,
    firstResolvedNotes: ticket.firstResolvedNotes || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolutionNotes : null) || null,
firstResolvedAt: ticket.firstResolvedAt || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedAt : null) || null,
firstResolvedBy: ticket.firstResolvedBy || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedBy : null) || null,
firstIsRma: ticket.firstIsRma || false,
  })}style={{ fontSize:10, color:"#ff5a00", cursor:"pointer", fontWeight:700, background:"#fff4ee", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
    📋 {(Array.isArray(ticket.issueHistory) ? ticket.issueHistory.length : 0) + 1} History
  </div>
</td>


<td style={tdStyle({ padding: "12px 10px" })}>
  {Array.isArray(ticket.statusUpdates) && ticket.statusUpdates.length > 0 ? (
    <div onClick={() => setStatusUpdatePopup(ticket.statusUpdates)}
      style={{ fontSize:10, color:"#1d4ed8", cursor:"pointer", fontWeight:700, background:"#eff6ff", padding:"2px 6px", borderRadius:4, display:"inline-block" }}>
      📝 {ticket.statusUpdates.length} Update{ticket.statusUpdates.length > 1 ? "s" : ""} — View
    </div>
 ) : (
    <span style={{ fontSize:11, color:"#d1d5db" }}>—</span>
  )}
  {!["resolved","rma"].includes(ticket.status || "open") && (
    <button onClick={() => setStatusUpdateForm({ show: true, id: ticket.id, note: "" })}
      style={{ background:"#1d4ed8", color:"white", border:"none", padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, marginTop:4, display:"block" }}>
      📝 Update
    </button>
  )}
</td>

                              <td style={{ padding: "12px 10px" }}>
                               <div onClick={() => setIssuePopup({
  description: ticket.firstDescription || ticket.description,
  resolutionNotes: ticket.resolutionNotes,
  resolutionTimeTaken: ticket.resolutionTimeTaken,
  resolvedBy: ticket.resolvedBy,
  resolvedAt: ticket.resolvedAt,
  issueHistory: ticket.issueHistory,
  firstDescription: ticket.firstDescription || ticket.description,
  firstCreatedAt: ticket.firstCreatedAt || ticket.createdAt,
  firstRaisedByName: ticket.firstRaisedByName || ticket.raisedByName,
  firstResolvedNotes: ticket.firstResolvedNotes || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolutionNotes : null) || null,
  firstResolvedAt: ticket.firstResolvedAt || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedAt : null) || null,
  firstResolvedBy: ticket.firstResolvedBy || (Array.isArray(ticket.issueHistory) && ticket.issueHistory.length === 0 ? ticket.resolvedBy : null) || null,
  firstIsRma: ticket.firstIsRma || false,
})}
                                  style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200, textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#9ca3af" }}
                                  title="Click to view full issue">
                                  {ticket.description?.length > 40 ? ticket.description.slice(0, 40) + "…" : ticket.description || "—"}
                                </div>
                                

              


                              </td>
                            </tr>
                          );

                          if (expandedImage === ticket.id && ticket.productImage) {
                            acc.push(
                              <tr key={`img-${ticket.id}`}>
                                <td colSpan={9} style={{ padding: 0, background: "#f0fdf4", borderBottom: "1px solid #86efac" }}>
                                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16, borderLeft: "4px solid #10b981" }}>
                                    <img src={ticket.productImage} alt="Product" style={{ maxHeight: 220, maxWidth: 300, borderRadius: 10, border: "2px solid #86efac", cursor: "pointer", objectFit: "contain", background: "white" }} onClick={() => openImageInNewTab(ticket.productImage)} />
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
                                <td colSpan={9} style={{ padding: "8px 20px" }}>
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
                                <td colSpan={9} style={{ padding: "8px 20px" }}>
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

        {/* RAISE LOCKIN TICKET */}
        {activeTab === "raiselockin" && (
          <RaiseLockinTicket onSuccess={() => setActiveTab("mylockin")} />
        )}

        {/* MY LOCKIN TICKETS */}
        {activeTab === "mylockin" && (
  <MyLockinTickets tickets={tickets} />
)}
  {/* RAISE PRODUCTION TICKET */}
        {activeTab === "raiseproduction" && (
          <RaiseProductionTicket onSuccess={() => setActiveTab("myproduction")} />
        )}

      {/* MY PRODUCTION TICKETS */}
        {activeTab === "myproduction" && (
          <MyProductionTickets tickets={tickets} />
        )}

        {/* RAISE PRODUCT TESTING TICKET */}
        {activeTab === "producttesting" && (
          <ProductTesting currentUser={currentUser} supportPersons={supportPersons} autoAssign={true} />
        )}

        {/* MY PRODUCT TESTING TICKETS (raised by me) */}
        {activeTab === "mytestingtickets" && (
          <ProductTestingTickets currentUser={currentUser} viewMode="raised" />
        )}

     </div>

</div>
    </div>
  );
}