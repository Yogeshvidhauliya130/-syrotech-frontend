import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { SALES_PRODUCT_MODELS, SALES_PRODUCTS } from "../data/productModels";

const BASE_URL = "https://syrotech-backend.onrender.com";
const STATUS_COLOR = { open: "#e04e00", pending: "#b45309", resolved: "#1a7a46", rma: "#7c3aed" };
const STATUS_BG    = { open: "#fff4ee", pending: "#fffbeb", resolved: "#edfaf3", rma: "#f5f3ff" };

const RMA_REASONS = [
  "Damaged Product","Hardware Fault","Physical Damage",
  "Water Damage","Burnt Component","Manufacturing Defect","Other",
];

function sendWhatsAppFeedback(ticket, supportName) {
  const phone = (ticket.phone || "").replace(/\D/g, "");
  if (!phone || phone.length < 10) {
    alert("❌ Cannot send WhatsApp!\n\nCustomer phone number is missing or invalid.");
    return false;
  }
  const fullPhone    = phone.startsWith("91") ? phone : `91${phone}`;
  const resolvedDate = ticket.resolvedAt
    ? new Date(ticket.resolvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-IN");
  const message =
    `Hello ${ticket.customer || "Customer"} 👋\n\n` +
    `Your support request has been resolved ✅\n\n` +
    `━━━━━━━━━━━━━━━━━━\n📋 *Ticket Summary*\n━━━━━━━━━━━━━━━━━━\n` +
    `• Product   : ${ticket.category}\n• Serial No : ${ticket.serialNo}\n` +
    `• Issue     : ${(ticket.description || "").slice(0, 60)}...\n` +
    `• Handled by: ${supportName}\n• Date      : ${resolvedDate}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n⭐ *Please share your feedback:*\n━━━━━━━━━━━━━━━━━━\n\n` +
    `1️⃣  Was your issue fully resolved?\n    Reply: *Yes* or *No*\n\n` +
    `2️⃣  Rate our service out of 5:\n    Reply: ⭐⭐⭐⭐⭐ (1 to 5)\n\n` +
    `3️⃣  Any comments or suggestions?\n    Feel free to share!\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Thank you for choosing *Syrotech Networks* 🙏\n📞 Support: +91 9205229997\n🌐 www.Syrotech.com`;
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
  return true;
}

function sendRMAWhatsApp(ticket, rmaCenter, reason) {
  const phone = (ticket.phone || "").replace(/\D/g, "");
  if (!phone || phone.length < 10) {
    alert("❌ Cannot send WhatsApp!\n\nCustomer phone number is missing or invalid.");
    return false;
  }
  const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
  const message =
    `Hello ${ticket.customer || "Customer"} 👋\n\n` +
    `We have assessed your product and unfortunately it requires physical repair at our RMA center.\n\n` +
    `━━━━━━━━━━━━━━━━━━\n📦 *Product Details*\n━━━━━━━━━━━━━━━━━━\n` +
    `• Product    : ${ticket.category}\n• Serial No  : ${ticket.serialNo}\n` +
    `• MAC Address: ${ticket.mac || "—"}\n• Issue Type : ${reason}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n🔧 *Please Visit RMA Center*\n━━━━━━━━━━━━━━━━━━\n` +
    `• Center  : ${rmaCenter.name}\n• City    : ${rmaCenter.city}\n` +
    `• Address : ${rmaCenter.address}\n• Phone   : ${rmaCenter.phone}\n\n` +
    `📌 *Please carry:*\n  ✅ Your product\n  ✅ This message / ticket reference\n  ✅ Purchase invoice (if available)\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Thank you for choosing *Syrotech Networks* 🙏\n📞 Support: +91 9205229997\n🌐 www.Syrotech.com`;
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
  return true;
}

function getFilteredReassignPersons(allPersons, ticket, currentUserName) {
  const others = allPersons.filter(u =>
    u.role === "support" && u.approved &&
    u.name.toLowerCase().trim() !== (currentUserName || "").toLowerCase().trim()
  );
  const product = (ticket.category || "").toLowerCase();
  const city    = (ticket.city    || "").toLowerCase().trim();
  const country = (ticket.country || "").toLowerCase().trim();
  if (!product) return others;
  const level1 = others.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return specs.map(s => s.toLowerCase()).includes(product) && city && p.city && p.city.toLowerCase().trim() === city;
  });
  if (level1.length > 0) return level1;
  const level2 = others.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return specs.map(s => s.toLowerCase()).includes(product) && country && p.country && p.country.toLowerCase().trim() === country;
  });
  if (level2.length > 0) return level2;
  const level3 = others.filter(p => {
    const specs = Array.isArray(p.specialization) ? p.specialization : [];
    return specs.map(s => s.toLowerCase()).includes(product);
  });
  if (level3.length > 0) return level3;
  return others;
}

function getFilteredRMACenters(rmaCenters, ticket) {
  if (!rmaCenters || rmaCenters.length === 0) return [];
  const city    = (ticket.city    || "").toLowerCase().trim();
  const country = (ticket.country || "").toLowerCase().trim();
  const level1  = rmaCenters.filter(c => c.city && c.city.toLowerCase().trim() === city);
  if (level1.length > 0) return level1;
  const level2  = rmaCenters.filter(c => c.country && c.country.toLowerCase().trim() === country);
  if (level2.length > 0) return level2;
  return rmaCenters;
}

const openImageInNewTab = (imgSrc) => {
  const win = window.open("", "_blank");
  win.document.write(`<html><head><title>Product Image</title></head><body style="margin:0;background:#111;display:flex;justify-content:center;align-items:flex-start;min-height:100vh;padding:20px;box-sizing:border-box;"><img src="${imgSrc}" style="max-width:100%;height:auto;border-radius:8px;" /></body></html>`);
  win.document.close();
};

export default function SupportDashboard() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const autoAcceptingRef = useRef(new Set());

  const [tickets, setTickets]                     = useState([]);
  const [allTickets, setAllTickets]               = useState([]);
  const [filter, setFilter]                       = useState("all");
  const [sourceFilter, setSourceFilter]           = useState("all"); // ✅ CHANGE 1: source filter
  const [allSupportPersons, setAllSupportPersons] = useState([]);
  const [rmaCenters, setRmaCenters]               = useState([]);
  const [reassignForm, setReassignForm]           = useState({});
  const [rmaForm, setRmaForm]                     = useState({});
  const [reassigning, setReassigning]             = useState(null);
  const [submittingRma, setSubmittingRma]         = useState(null);
  const [expandedRow, setExpandedRow]             = useState(null);
  const [expandedImage, setExpandedImage]         = useState(null);
  const [dateSort, setDateSort]                   = useState("newest");
  const [filterMonth, setFilterMonth]             = useState("");
  const [filterYear, setFilterYear]               = useState("");
  const [resolveForm, setResolveForm]             = useState({});
  const [issuePopup, setIssuePopup]               = useState(null);
  const [rmaPopup, setRmaPopup]                   = useState(null);
  const [assignedSearch, setAssignedSearch]       = useState("");
  const [productPopup, setProductPopup]           = useState(null);
  const [customerPopup, setCustomerPopup]         = useState(null);
  const [assigneePopup, setAssigneePopup]         = useState(null);

  const [activeTab, setActiveTab] = useState("tickets");

  const [form, setForm] = useState({
    category: "", model: "", serialNo: "", mac: "", customer: "",
    email: "", phone: "", city: "", country: "", pincode: "",
    description: "", assignTo: currentUser?.name || "",
    productImage: "",
    raisedVia: "call", // ✅ CHANGE 2: how ticket was raised
  });
  const [formErrors, setFormErrors]   = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [successMsg, setSuccessMsg]   = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const fetchTickets = () => {
    fetch(`${BASE_URL}/tickets`)
      .then(r => r.json())
      .then(data => {
        setAllTickets(data);
        const mine = data.filter(t =>
          t.assignTo && currentUser?.name &&
          t.assignTo.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
        );
        setTickets(mine);
        mine.filter(t => t.status === "pending" && !autoAcceptingRef.current.has(t.id))
          .forEach(ticket => {
            autoAcceptingRef.current.add(ticket.id);
            fetch(`${BASE_URL}/tickets/${ticket.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "open", acceptedAt: new Date().toISOString() })
            })
              .then(r => r.json())
              .then(updated => {
                setTickets(prev => prev.map(t => t.id === ticket.id ? updated : t));
                autoAcceptingRef.current.delete(ticket.id);
              })
              .catch(() => autoAcceptingRef.current.delete(ticket.id));
          });
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchTickets();
    const poll = setInterval(fetchTickets, 8000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(users => setAllSupportPersons(users.filter(u => u.role === "support" && u.approved)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/rma-centers`)
      .then(r => r.json())
      .then(setRmaCenters)
      .catch(console.error);
  }, []);

  const updateStatus = (id, status) => {
    const ticket  = tickets.find(t => t.id === id);
    const now     = new Date().toISOString();
    const updates = { status };
    if (status === "open"     && !ticket?.acceptedAt) updates.acceptedAt = now;
    if (status === "resolved" && !ticket?.resolvedAt) updates.resolvedAt = now;
    fetch(`${BASE_URL}/tickets/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    })
      .then(r => r.json())
      .then(updated => setTickets(prev => prev.map(t => t.id === id ? updated : t)))
      .catch(err => console.error("Update failed:", err));
  };

  const handleReassign = (ticketId) => {
    const rf = reassignForm[ticketId] || {};
    if (!rf.newPerson) { alert("Please select a support person to reassign to."); return; }
    if (!rf.reason?.trim() || rf.reason.trim().length < 5) { alert("Please enter a reason (minimum 5 characters)."); return; }
    const ticket = tickets.find(t => t.id === ticketId);
    setReassigning(ticketId);
    const historyEntry = { from: currentUser?.name, to: rf.newPerson, reason: rf.reason.trim(), timestamp: new Date().toISOString() };
    const existingHistory = Array.isArray(ticket?.reassignHistory) ? ticket.reassignHistory : [];
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignTo: rf.newPerson, reassignedFrom: currentUser?.name,
        reassignReason: rf.reason.trim(), reassignedAt: new Date().toISOString(),
        reassignHistory: [...existingHistory, historyEntry],
        acceptedAt: null, status: "pending",
      })
    })
      .then(r => r.json())
      .then(() => {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        setReassigning(null);
        setReassignForm(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
        alert(`✅ Ticket reassigned to ${rf.newPerson}!\n\nReason: ${rf.reason}`);
      })
      .catch(err => { console.error("Reassign failed:", err); setReassigning(null); });
  };

  const handleRMASubmit = (ticketId) => {
    const rf     = rmaForm[ticketId] || {};
    const ticket = tickets.find(t => t.id === ticketId);
    if (!rf.reason)   { alert("Please select a reason for RMA."); return; }
    if (!rf.centerId) { alert("Please select an RMA center."); return; }
    const center = rmaCenters.find(c => c.id === parseInt(rf.centerId));
    if (!center) { alert("Invalid RMA center."); return; }
    const sent = sendRMAWhatsApp(ticket, center, rf.reason);
    if (!sent) return;
    setSubmittingRma(ticketId);
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "rma", rmaStatus: true, rmaReason: rf.reason,
        rmaCenterName: center.name, rmaCenterCity: center.city,
        rmaCenterAddress: center.address, rmaCenterPhone: center.phone,
        rmaSentAt: new Date().toISOString(), rmaSentBy: currentUser?.name, resolvedAt: null,
      })
    })
      .then(r => r.json())
      .then(updated => {
        setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
        setSubmittingRma(null);
        setRmaForm(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
        alert(`✅ RMA processed!\n\nReason: ${rf.reason}\nCenter: ${center.name}\nWhatsApp sent ✅`);
      })
      .catch(err => { console.error("RMA failed:", err); setSubmittingRma(null); });
  };

  const handleResolveSubmit = (ticketId) => {
    const rf = resolveForm[ticketId] || {};
    if (!rf.notes?.trim()) { alert("Please describe what issue was solved."); return; }
    const now = new Date().toISOString();
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "resolved",
        resolvedAt: now,
        resolutionNotes: rf.notes.trim(),
        resolvedBy: currentUser?.name,
      })
    })
      .then(r => r.json())
      .then(updated => {
        setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
        setResolveForm(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
      })
      .catch(err => console.error("Resolve failed:", err));
  };

  const markWhatsAppSent = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const sent   = sendWhatsAppFeedback(ticket, currentUser?.name);
    if (!sent) return;
    fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackSent: true, feedbackSentAt: new Date().toISOString(), feedbackSentBy: currentUser?.name })
    })
      .then(r => r.json())
      .then(updated => setTickets(prev => prev.map(t => t.id === ticketId ? updated : t)))
      .catch(err => console.error("Failed:", err));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, productImage: "Image must be less than 3MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({ ...prev, productImage: ev.target.result }));
      setImagePreview(ev.target.result);
      setFormErrors(prev => ({ ...prev, productImage: "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "customer" && value !== "" && !/^[a-zA-Z\s]*$/.test(value)) return;
    if (name === "pincode"  && value !== "" && !/^\d*$/.test(value))          return;
    if (name === "category") {
      setForm(prev => ({ ...prev, [name]: value, model: "" }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    setFormErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.category)        e.category    = "Please select a product.";
    if (!form.model)           e.model       = "Please select a model.";
    if (!form.serialNo.trim()) e.serialNo    = "Serial number is required.";
    if (!form.mac.trim())      e.mac         = "MAC address is required.";
    if (!form.customer.trim()) e.customer    = "Customer name is required.";
    else if (/\d/.test(form.customer)) e.customer = "Name cannot contain numbers.";
    else if (form.customer.trim().length < 2) e.customer = "Enter a valid full name.";
    if (!form.email.trim())    e.email       = "Customer email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.phone.trim())    e.phone       = "Contact number is required.";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s+/g, ""))) e.phone = "Enter a valid 10-digit phone number.";
    if (!form.city.trim())     e.city        = "City is required.";
    if (!form.country)         e.country     = "Please select a country.";
    if (!form.pincode.trim())  e.pincode     = "Pincode is required.";
    else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = "Enter a valid 6-digit pincode.";
    // ✅ CHANGE 3: No minimum character limit — only required + max 500
    if (!form.description.trim()) e.description = "Description is required.";
    else if (form.description.trim().length > 500) e.description = "Description cannot exceed 500 characters.";
    return e;
  };

  const handleSubmit = () => {
    if (submitting) return;
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      const firstErr = document.querySelector(".field-error");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    const cleanPhone = form.phone.replace(/\s+/g, "");
    fetch(`${BASE_URL}/tickets`)
      .then(r => r.json())
      .then(allTicketsData => {
        const sameCustomerTicket = allTicketsData.find(t =>
          t.phone === cleanPhone &&
          t.category === form.category &&
          t.serialNo.trim().toLowerCase() === form.serialNo.trim().toLowerCase()
        );
        if (sameCustomerTicket) {
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
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          })
            .then(r => r.json())
            .then(() => {
              setForm({ category: "", model: "", serialNo: "", mac: "", customer: "", email: "", phone: "", city: "", country: "", pincode: "", description: "", assignTo: currentUser?.name || "", productImage: "", raisedVia: "call" });
              setImagePreview(""); setFormErrors({});
              setSuccessMsg("✅ Same customer found! Issue updated in existing Ticket. Status reset to PENDING.");
              setActiveTab("tickets");
              fetchTickets();
              setTimeout(() => setSuccessMsg(""), 6000);
            })
            .catch(() => setFormErrors({ submit: "❌ Failed to update ticket." }))
            .finally(() => setSubmitting(false));
          return;
        }
        // ✅ CHANGE 4: status = "open", acceptedAt set immediately
        const newTicket = {
          ...form,
          phone:        cleanPhone,
          status:       "open",
          acceptedAt:   new Date().toISOString(),
          raisedBy:     currentUser?.email || "unknown",
          raisedByName: currentUser?.name  || "Unknown",
          date:         new Date().toISOString().slice(0, 10),
          createdAt:    new Date().toISOString(),
          source:       "support",
          raisedVia:    form.raisedVia,
        };
        fetch(`${BASE_URL}/tickets`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTicket)
        })
          .then(res => { if (!res.ok) throw new Error("Server error"); return res.json(); })
          .then(() => {
            setForm({ category: "", model: "", serialNo: "", mac: "", customer: "", email: "", phone: "", city: "", country: "", pincode: "", description: "", assignTo: currentUser?.name || "", productImage: "", raisedVia: "call" });
            setImagePreview(""); setFormErrors({});
            setSuccessMsg("✅ Ticket submitted successfully! Status: OPEN");
            setActiveTab("myraised");
            fetchTickets();
            setTimeout(() => setSuccessMsg(""), 4000);
          })
          .catch(() => setFormErrors({ submit: "❌ Failed to submit ticket." }))
          .finally(() => setSubmitting(false));
      })
      .catch(() => {
        setFormErrors({ submit: "❌ Failed to check existing tickets." });
        setSubmitting(false);
      });
  };

  const borderColor = (field) => formErrors[field] ? "#ef4444" : "#ddd5c8";
  const inputStyle  = (field) => ({
    width: "100%", padding: "11px 14px",
    border: `2px solid ${borderColor(field)}`,
    borderRadius: 10, fontSize: 13.5, boxSizing: "border-box",
    outline: "none", transition: "border-color 0.2s, box-shadow 0.25s",
    background: formErrors[field] ? "#fff5f5" : "#f0ebe3",
    fontFamily: "DM Sans, sans-serif", color: "#111",
  });

  const counts = {
    all:      tickets.length,
    open:     tickets.filter(t => t.status === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    rma:      tickets.filter(t => t.status === "rma").length,
  };
  const resolutionPct = counts.all === 0 ? 0 : Math.round((counts.resolved / counts.all) * 100);
  const resolved      = tickets.filter(t => t.status === "resolved" && t.createdAt && t.resolvedAt);
  const within24      = resolved.filter(t => new Date(t.resolvedAt) - new Date(t.createdAt) <= 24 * 60 * 60 * 1000).length;
  const avgHours      = resolved.length === 0 ? 0 : (
    resolved.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0)
    / resolved.length / (1000 * 60 * 60)
  ).toFixed(1);

  // ✅ CHANGE 1: source filter applied + CHANGE 4: no pending filter
  const filtered = (filter === "all" ? tickets : tickets.filter(t => t.status === filter))
    .filter(t => {
      if (sourceFilter === "all") return true;
      if (sourceFilter === "customer") return t.source === "customer";
      if (sourceFilter === "support")  return t.source === "support";
      if (sourceFilter === "sales")    return !t.source || (t.source !== "customer" && t.source !== "support");
      return true;
    })
    .filter(t => {
      if (!filterMonth && !filterYear) return true;
      const d = new Date(t.createdAt || t.date);
      if (filterMonth && filterYear) return d.getMonth()+1 === parseInt(filterMonth) && d.getFullYear() === parseInt(filterYear);
      if (filterMonth) return d.getMonth()+1 === parseInt(filterMonth);
      if (filterYear)  return d.getFullYear() === parseInt(filterYear);
      return true;
    })
    .filter(t => {
      if (!assignedSearch.trim()) return true;
      const q = assignedSearch.toLowerCase();
      return (
        (t.customer     || "").toLowerCase().includes(q) ||
        (t.serialNo     || "").toLowerCase().includes(q) ||
        (t.mac          || "").toLowerCase().includes(q) ||
        (t.phone        || "").toLowerCase().includes(q) ||
        (t.city         || "").toLowerCase().includes(q) ||
        (t.category     || "").toLowerCase().includes(q) ||
        (t.date         || "").toLowerCase().includes(q) ||
        (t.raisedByName || "").toLowerCase().includes(q)
      );
    })
    .slice()
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.date).getTime();
      const db = new Date(b.createdAt || b.date).getTime();
      return dateSort === "newest" ? db - da : da - db;
    });

  const myRaisedTickets = allTickets
    .filter(t => t.raisedBy === currentUser?.email && t.source === "support")
    .slice()
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  // ✅ raisedVia label helper
  const raisedViaLabel = (via) => {
    if (via === "email") return "📧 Email";
    if (via === "walk-in") return "🚶 Walk-in";
    if (via === "whatsapp") return "💬 WhatsApp";
    return "📞 Call";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8" }}>

      {issuePopup && (
        <div onClick={() => setIssuePopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: `2px solid ${issuePopup.resolutionNotes ? "#d1fae5" : "#e5e7eb"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: issuePopup.resolutionNotes ? "#1a7a46" : "#059669" }}>{issuePopup.resolutionNotes ? "✅ Ticket Resolved" : "📋 Issue Description"}</div>
              <button onClick={() => setIssuePopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            {issuePopup.resolutionNotes ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>🔧 What was solved:</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#ecfdf5", padding: "14px 16px", borderRadius: 10, border: "1px solid #6ee7b7", borderLeft: "4px solid #10b981", marginBottom: 14 }}>{issuePopup.resolutionNotes}</div>
                {issuePopup.resolutionTimeTaken && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>⏱️ Time taken: <strong>{issuePopup.resolutionTimeTaken}</strong></div>}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>📋 Original Issue Raised:</div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, background: "#f9fafb", padding: "12px 14px", borderRadius: 8, border: "1px solid #e5e7eb", borderLeft: "3px solid #10b981" }}>{issuePopup.description}</div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, background: "#f9fafb", padding: "14px 16px", borderRadius: 10, border: "1px solid #e5e7eb", borderLeft: "4px solid #10b981" }}>{issuePopup.description}</div>
            )}
          </div>
        </div>
      )}

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

      {productPopup && (
        <div onClick={() => setProductPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #d1fae5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>📦 Product Details</div>
              <button onClick={() => setProductPopup(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: "#374151" }}>✕ Close</button>
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "14px 16px", border: "1px solid #bbf7d0" }}>
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

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 12px rgba(16,185,129,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="Syrotech" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "contain", background: "white", padding: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Syrotech — Support Portal</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>🛠️ {currentUser?.name}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", color: "white", padding: "6px 16px", borderRadius: 6, cursor: "pointer" }}>Logout</button>
      </div>

      {/* Tabs */}
      <div style={{ background: "white", borderBottom: "2px solid #e5e7eb", padding: "0 28px", display: "flex", gap: 0 }}>
        {[
          ["tickets",  `📋 Assigned Tickets (${tickets.length})`],
          ["myraised", `📞 My Raised (${myRaisedTickets.length})`],
          ["raise",    "🎫 Raise Ticket"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: "14px 22px", fontSize: 13, fontWeight: activeTab === key ? 800 : 500,
            color: activeTab === key ? "#059669" : "#6b7280",
            background: "none", border: "none", borderBottom: activeTab === key ? "3px solid #10b981" : "3px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap", marginBottom: -2,
          }}>{label}</button>
        ))}
      </div>

      {successMsg && (
        <div style={{ margin: "16px 28px 0", background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, color: "#065f46" }}>
          {successMsg}
        </div>
      )}

      {/* ══ RAISE TICKET TAB ══ */}
      {activeTab === "raise" && (
        <div style={{ maxWidth: 1100, margin: "28px auto", padding: "0 16px" }}>
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">🎫</div>
              <div>
                <h2 className="form-card-title">Raise New Support Ticket</h2>
                <p className="form-card-sub">All fields marked <span style={{ color: "#ff6b35" }}>*</span> are required.</p>
              </div>
            </div>

            {formErrors.submit && <div className="form-error-banner">{formErrors.submit}</div>}

            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Product <span className="req">*</span></label>
                <select name="category" value={form.category} onChange={handleChange} style={inputStyle("category")}>
                  <option value="">Select Product</option>
                  {SALES_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {formErrors.category && <span className="field-error">{formErrors.category}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Model <span className="req">*</span></label>
                <select name="model" value={form.model} onChange={handleChange} style={{ ...inputStyle("model"), color: !form.category ? "#888" : "#111" }} disabled={!form.category}>
                  <option value="">{form.category ? `Select ${form.category} model` : "Select product first"}</option>
                  {(SALES_PRODUCT_MODELS[form.category] || []).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {formErrors.model && <span className="field-error">{formErrors.model}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Serial Number <span className="req">*</span></label>
                <input name="serialNo" placeholder="e.g. SYR-20240001" value={form.serialNo} onChange={handleChange} style={inputStyle("serialNo")} />
                {formErrors.serialNo && <span className="field-error">{formErrors.serialNo}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">MAC Address <span className="req">*</span></label>
                <input name="mac" placeholder="e.g. AA:BB:CC:DD:EE:FF" value={form.mac} onChange={handleChange} style={inputStyle("mac")} />
                {formErrors.mac && <span className="field-error">{formErrors.mac}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Customer Name <span className="req">*</span></label>
                <input name="customer" placeholder="Full name (letters only)" value={form.customer} onChange={handleChange} style={inputStyle("customer")} />
                {formErrors.customer && <span className="field-error">{formErrors.customer}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Customer Email <span className="req">*</span></label>
                <input name="email" placeholder="customer@email.com" value={form.email} onChange={handleChange} style={inputStyle("email")} />
                {formErrors.email && <span className="field-error">{formErrors.email}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Contact Number <span className="req">*</span><span className="form-hint"> (10 digits)</span></label>
                <input name="phone" placeholder="e.g. 9876543210" value={form.phone} onChange={handleChange} maxLength={10} style={inputStyle("phone")} />
                {formErrors.phone ? <span className="field-error">{formErrors.phone}</span> : <span className="field-hint">{form.phone.replace(/\s+/g, "").length}/10 digits</span>}
              </div>

              <div className="form-field">
                <label className="form-label">City <span className="req">*</span></label>
                <input name="city" placeholder="e.g. Mumbai" value={form.city} onChange={handleChange} style={inputStyle("city")} />
                {formErrors.city && <span className="field-error">{formErrors.city}</span>}
              </div>

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
                {formErrors.country && <span className="field-error">{formErrors.country}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Pincode <span className="req">*</span><span className="form-hint"> (6 digits)</span></label>
                <input name="pincode" placeholder="e.g. 400001" value={form.pincode} onChange={handleChange} maxLength={6} style={inputStyle("pincode")} />
                {formErrors.pincode ? <span className="field-error">{formErrors.pincode}</span> : <span className="field-hint">{form.pincode.length}/6 digits</span>}
              </div>

              {/* ✅ CHANGE 2: Assign To with Raised Via option */}
              <div className="form-field" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Assign To & Raised Via <span className="req">*</span></label>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{
                    flex: 1, ...inputStyle("assignTo"),
                    background: "#e8f5e9", color: "#059669", fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 8,
                    cursor: "not-allowed", userSelect: "none",
                  }}>
                    <span>🛠️</span>
                    <span>{currentUser?.name || "—"}</span>
                  </div>
                  <select
                    name="raisedVia"
                    value={form.raisedVia}
                    onChange={handleChange}
                    style={{ ...inputStyle("raisedVia"), width: "auto", minWidth: 160, flex: "0 0 auto", background: "#f0ebe3" }}>
                    <option value="call">📞 Via Call</option>
                    <option value="email">📧 Via Email</option>
                    <option value="whatsapp">💬 Via WhatsApp</option>
                    <option value="walk-in">🚶 Walk-in</option>
                  </select>
                </div>
                <span className="field-hint">🔒 Assigned to you · Select how you received this request</span>
              </div>
            </div>

            {/* Product Image */}
            <div className="form-field" style={{ padding: "20px 36px 0" }}>
              <label className="form-label">Product Image <span className="form-hint">(optional — upload photo showing serial no & MAC address)</span></label>
              <div style={{ border: `2px dashed ${formErrors.productImage ? "#ef4444" : "#ddd5c8"}`, borderRadius: 10, padding: "16px 20px", background: "#f9f7f4", textAlign: "center" }}>
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
              {formErrors.productImage && <span className="field-error">{formErrors.productImage}</span>}
            </div>

            {/* Description — ✅ CHANGE 3: No min limit */}
            <div className="form-field" style={{ padding: "20px 36px 0" }}>
              <label className="form-label">Issue Description <span className="req">*</span><span className="form-hint"> (max 500 characters)</span></label>
              <textarea name="description" rows={4}
                placeholder="Describe the issue in detail — what happened, when it started, what error you see..."
                value={form.description} onChange={handleChange}
                style={{ ...inputStyle("description"), resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {formErrors.description ? <span className="field-error">{formErrors.description}</span> : <span className="field-hint">{form.description.length}/500 characters</span>}
                <span className={`char-count ${form.description.length > 450 ? "char-warn" : "char-ok"}`}>
                  {500 - form.description.length} chars left
                </span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting} className={`submit-btn ${submitting ? "submit-btn-loading" : ""}`}>
              {submitting ? <><span className="btn-spinner" /> Submitting...</> : "🎫 Submit Ticket"}
            </button>
          </div>
        </div>
      )}

      {/* ══ MY RAISED TICKETS TAB ══ */}
      {activeTab === "myraised" && (
        <div style={{ maxWidth: 1200, margin: "28px auto", padding: "0 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#374151", margin: 0 }}>📞 My Raised Tickets</h2>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Tickets you raised on behalf of customers via toll-free / call support</p>
            </div>
            <button onClick={() => setActiveTab("raise")} style={{ background: "#10b981", color: "white", border: "none", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+ Raise New Ticket</button>
          </div>

          {myRaisedTickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 14, color: "#aaa" }}>
              <div style={{ fontSize: 48 }}>📞</div>
              <p style={{ marginTop: 12 }}>You haven't raised any tickets yet.</p>
              <button onClick={() => setActiveTab("raise")} style={{ marginTop: 12, background: "#10b981", color: "white", border: "none", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Raise First Ticket</button>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "scroll", overflowY: "auto", maxHeight: "75vh", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1100, background: "white" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", position: "sticky", top: 0, zIndex: 2 }}>
                      {["Ticket No","Date","Product","Customer","Assigned To","Status","Issue","RMA"].map((h, i) => (
                        <th key={i} style={{ padding: "12px 12px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myRaisedTickets.map((ticket, idx) => {
                      const s = (ticket.status || "open").toLowerCase();
                      return (
                        <tr key={ticket.id} style={{ borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#f0fdf4" : "white", borderLeft: `4px solid ${STATUS_COLOR[s] || "#ccc"}` }}>
                          <td style={{ padding: "12px 12px", whiteSpace: "nowrap", borderRight: "1px solid #d1fae5" }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "#059669" }}>{ticket.ticketNumber || "—"}</div>
                            <div style={{ fontSize: 8, color: "#9ca3af" }}>Row {idx + 1}</div>
                            {/* ✅ CHANGE 2: show raisedVia in table */}
                            <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, marginTop: 2, background: "#d1fae5", padding: "1px 5px", borderRadius: 4, display: "inline-block" }}>
                              {raisedViaLabel(ticket.raisedVia)}
                            </div>
                          </td>
                          <td style={{ padding: "12px 12px", borderRight: "1px solid #d1fae5" }}>
                            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, whiteSpace: "nowrap" }}>{ticket.date || "—"}</div>
                            {ticket.resolvedAt && <div style={{ fontSize: 10, color: "#10b981", whiteSpace: "nowrap" }}>✅ {new Date(ticket.resolvedAt).toLocaleDateString()}</div>}
                          </td>
                          <td style={{ padding: "12px 12px", whiteSpace: "nowrap", borderRight: "1px solid #d1fae5", cursor: "pointer" }}
                            onClick={() => setProductPopup({ category: ticket.category, model: ticket.model, serialNo: ticket.serialNo, mac: ticket.mac })}>
                            <div style={{ fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", color: "#059669", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#6ee7b7" }}>{ticket.category || "—"}</div>
                          </td>
                          <td style={{ padding: "12px 12px", whiteSpace: "nowrap", borderRight: "1px solid #d1fae5", cursor: "pointer" }}
                            onClick={() => setCustomerPopup({ customer: ticket.customer, phone: ticket.phone, city: ticket.city, country: ticket.country })}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8", whiteSpace: "nowrap", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#93c5fd" }}>{ticket.customer || "—"}</div>
                          </td>
                          <td style={{ padding: "12px 12px", whiteSpace: "nowrap", borderRight: "1px solid #d1fae5", cursor: "pointer" }}
                            onClick={() => {
                              const p = allSupportPersons.find(p => p.name && ticket.assignTo && p.name.toLowerCase().trim() === ticket.assignTo.toLowerCase().trim());
                              setAssigneePopup({ name: ticket.assignTo, phone: p?.phone, city: p?.city, specialization: p?.specialization?.join(", ") });
                            }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", whiteSpace: "nowrap", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#fde68a" }}>{ticket.assignTo || "—"}</div>
                            {ticket.reassignedFrom && <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700 }}>🔄 reassigned</div>}
                          </td>
                          <td style={{ padding: "12px 12px", borderRight: "1px solid #d1fae5" }}>
                            <span onClick={() => {
                              if (s === "resolved" && ticket.resolutionNotes) setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken });
                              else if (s === "rma") setRmaPopup({ rmaReason: ticket.rmaReason, rmaCenterName: ticket.rmaCenterName, rmaCenterCity: ticket.rmaCenterCity, rmaCenterAddress: ticket.rmaCenterAddress, rmaCenterPhone: ticket.rmaCenterPhone, rmaSentAt: ticket.rmaSentAt });
                            }} style={{ padding: "3px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, color: STATUS_COLOR[s], background: STATUS_BG[s], display: "inline-block", whiteSpace: "nowrap", cursor: (s === "resolved" || s === "rma") ? "pointer" : "default", border: s === "resolved" ? "1.5px solid #6ee7b7" : s === "rma" ? "1.5px solid #c4b5fd" : "none" }}>
                              {s.toUpperCase()}
                            </span>
                            {s === "rma" && (
                              <div onClick={() => setRmaPopup({ rmaReason: ticket.rmaReason, rmaCenterName: ticket.rmaCenterName, rmaCenterCity: ticket.rmaCenterCity, rmaCenterAddress: ticket.rmaCenterAddress, rmaCenterPhone: ticket.rmaCenterPhone, rmaSentAt: ticket.rmaSentAt })}
                                style={{ fontSize: 9, color: "#7c3aed", marginTop: 3, cursor: "pointer", fontWeight: 600 }}>🔧 View RMA details</div>
                            )}
                          </td>
                          <td style={{ padding: "12px 12px", maxWidth: 200, borderRight: "1px solid #d1fae5" }}>
                            <div onClick={() => setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken })}
                              style={{ fontSize: 12, color: "#374151", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150, textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#9ca3af" }}
                              title="Click to view full issue">
                              {ticket.description?.length > 35 ? ticket.description.slice(0, 35) + "…" : ticket.description || "—"}
                            </div>
                            {s === "resolved" && ticket.resolutionNotes && (
                              <div onClick={() => setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken })}
                                style={{ fontSize: 10, color: "#059669", fontWeight: 600, marginTop: 3, cursor: "pointer" }}>✅ Resolved — click to view</div>
                            )}
                          </td>
                          <td style={{ padding: "12px 12px", maxWidth: 80 }}>
                            {ticket.rmaStatus ? (
                              <div>
                                <span style={{ background: "#f5f3ff", color: "#7c3aed", padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>🔧 RMA</span>
                                <div style={{ fontSize: 9, color: "#6d28d9", marginTop: 2 }}>{ticket.rmaCenterName}</div>
                              </div>
                            ) : <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", textAlign: "right" }}>
                Total raised by you: <strong style={{ color: "#374151" }}>{myRaisedTickets.length}</strong>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ ASSIGNED TICKETS TAB ══ */}
      {activeTab === "tickets" && (
        <div style={{ maxWidth: 1200, margin: "28px auto", padding: "0 16px" }}>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              ["Total Tickets",  counts.all,         "🎫", "#3b82f6", "#eff6ff"],
              ["Resolved",       counts.resolved,     "✅", "#10b981", "#ecfdf5"],
              ["Avg Resolution", `${avgHours}h`,      "⏱️", "#f59e0b", "#fffbeb"],
              ["Resolution %",   `${resolutionPct}%`, "📊", "#8b5cf6", "#f5f3ff"],
            ].map(([label, val, icon, col, bg]) => (
              <div key={label} style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderTop: `4px solid ${col}` }}>
                <div style={{ fontSize: 24 }}>{icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: col, marginTop: 6 }}>{val}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {counts.resolved > 0 && (
            <div style={{ background: within24 === counts.resolved ? "#ecfdf5" : "#fffbeb", border: `1px solid ${within24 === counts.resolved ? "#6ee7b7" : "#fcd34d"}`, borderRadius: 10, padding: "12px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{within24 === counts.resolved ? "🎯" : "⚠️"}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>24hr Compliance: {within24}/{counts.resolved} tickets resolved within 24 hours{within24 < counts.resolved && " — Some tickets exceeded the 24hr limit"}</span>
            </div>
          )}

          {counts.rma > 0 && (
            <div style={{ background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 10, padding: "12px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🔧</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#5b21b6" }}>{counts.rma} ticket{counts.rma > 1 ? "s" : ""} sent to RMA center — click RMA status badge to see details</span>
            </div>
          )}

          {/* ✅ CHANGE 1: Status filter (no pending) + Source filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {/* ✅ CHANGE 4: removed pending from status filter */}
              {[["all","All"],["open","🔓 Open"],["resolved","✅ Resolved"],["rma","🔧 RMA"]].map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  padding: "8px 16px", borderRadius: 20,
                  border: filter === key ? "none" : "1px solid #d1d5db",
                  background: filter === key ? (key === "rma" ? "#7c3aed" : "#10b981") : "white",
                  color: filter === key ? "white" : "#555",
                  fontWeight: filter === key ? 700 : 400,
                  fontSize: 13, cursor: "pointer"
                }}>
                  {label} ({counts[key] ?? 0})
                </button>
              ))}

              <div style={{ width: 1, height: 24, background: "#e0d8d0", margin: "0 4px" }} />

              {/* ✅ CHANGE 1: Source filter buttons */}
              {[["all","👥 All Sources"],["customer","👥 Customer"],["support","📞 Support"],["sales","🧑‍💼 Sales"]].map(([key, label]) => (
                <button key={key} onClick={() => setSourceFilter(key)} style={{
                  padding: "8px 14px", borderRadius: 20,
                  border: sourceFilter === key ? "none" : "1px solid #d1d5db",
                  background: sourceFilter === key ? (key === "customer" ? "#5b21b6" : key === "support" ? "#d97706" : key === "sales" ? "#e04e00" : "#374151") : "white",
                  color: sourceFilter === key ? "white" : "#555",
                  fontWeight: sourceFilter === key ? 700 : 400,
                  fontSize: 12, cursor: "pointer"
                }}>{label}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>📅 Sort:</span>
              <select value={dateSort} onChange={e => setDateSort(e.target.value)}
                style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 12, cursor: "pointer", background: "white", color: "#374151" }}>
                <option value="newest">Newest First ↓</option>
                <option value="oldest">Oldest First ↑</option>
              </select>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:"#6b7280", fontWeight:600 }}>🗓️ Filter by:</span>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              style={{ padding:"6px 12px", borderRadius:8, border:`1.5px solid ${filterMonth?"#10b981":"#d1d5db"}`, fontSize:12, cursor:"pointer", background:filterMonth?"#ecfdf5":"white", color:filterMonth?"#059669":"#374151", outline:"none", fontFamily:"inherit" }}>
              <option value="">All Months</option>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
              style={{ padding:"6px 12px", borderRadius:8, border:`1.5px solid ${filterYear?"#10b981":"#d1d5db"}`, fontSize:12, cursor:"pointer", background:filterYear?"#ecfdf5":"white", color:filterYear?"#059669":"#374151", outline:"none", fontFamily:"inherit" }}>
              <option value="">All Years</option>
              {[2020,2021,2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {(filterMonth || filterYear) && (
              <button onClick={() => { setFilterMonth(""); setFilterYear(""); }}
                style={{ background:"#fee2e2", border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:11, color:"#dc2626", fontWeight:700 }}>✕ Clear</button>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                placeholder="🔍 Search by customer, serial no, MAC, phone, city, product..."
                value={assignedSearch}
                onChange={e => setAssignedSearch(e.target.value)}
                style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #d1d5db", fontSize: 13, background: "white", color: "#374151", outline: "none", fontFamily: "inherit" }}
              />
              {assignedSearch && (
                <button onClick={() => setAssignedSearch("")}
                  style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>✕ Clear</button>
              )}
            </div>
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 14, color: "#aaa" }}>
              <div style={{ fontSize: 48 }}>📭</div>
              <p style={{ marginTop: 12 }}>No tickets in this category.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{ overflowX: "scroll", overflowY: "auto", maxHeight: "72vh", borderRadius: 12, border: "1.5px solid #e0d8d0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1100, background: "white" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", position: "sticky", top: 0, zIndex: 2 }}>
                    {["Ticket No","Raised By","Product / S/N + MAC","Customer / KYC","Issue","Status","Image","Actions"].map((h, i) => (
                      <th key={i} style={{ padding: "12px 14px", fontSize: 10, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket, idx) => {
                    const s            = (ticket.status || "open").toLowerCase();
                    const isReassigned = !!ticket.reassignedFrom;
                    const isSupportRaised = ticket.source === "support";
                    const isCustomerRaised = ticket.source === "customer";
                    const isSalesRaised = !ticket.source || (ticket.source !== "customer" && ticket.source !== "support");
                    const rf           = reassignForm[ticket.id] || {};
                    const rmaf         = rmaForm[ticket.id] || {};
                    const showReassign = rf.show || false;
                    const showRma      = rmaf.show || false;
                    const showResolve  = resolveForm[ticket.id]?.show || false;
                    const filteredReassignPersons = getFilteredReassignPersons(allSupportPersons, ticket, currentUser?.name);
                    const nearbyRmaCenters        = getFilteredRMACenters(rmaCenters, ticket);

                    return (
                      <>
                        <tr key={ticket.id} style={{
                          borderBottom: "1px solid #f0ede8",
                          background: isSupportRaised
                            ? "#fef9c3"
                            : isCustomerRaised ? "#f5f3ff"
                            : (s === "rma" ? "#faf5ff" : isReassigned ? "#fffdf0" : idx % 2 === 0 ? "#f9f9f9" : "white"),
                          borderLeft: `6px solid ${isSupportRaised ? "#d97706" : isCustomerRaised ? "#7c3aed" : (s === "rma" ? "#7c3aed" : isReassigned ? "#f59e0b" : (STATUS_COLOR[s] || "#ccc"))}`,
                        }}>

                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap", borderRight: "1px solid #d1fae5" }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "#059669" }}>{ticket.ticketNumber || "—"}</div>
                            <div style={{ fontSize: 8, color: "#9ca3af" }}>Row {idx + 1}</div>
                            {ticket.issueHistory && ticket.issueHistory.length > 0 && (
                              <div style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, marginTop: 2 }}>🔁 repeat</div>
                            )}
                          </td>

                          {/* ✅ CHANGE 1: Raised By with source badge + raisedVia */}
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap", borderRight: "1px solid #d1fae5" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{ticket.raisedByName || "—"}</div>
                            <div style={{ fontSize: 10, color: "#9ca3af" }}>{ticket.date}</div>
                            {isCustomerRaised && (
                              <div style={{ fontSize: 9, fontWeight: 700, marginTop: 3, background: "#ede9fe", color: "#5b21b6", padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>👥 Customer</div>
                            )}
                            {isSupportRaised && (
                              <div style={{ fontSize: 9, fontWeight: 700, marginTop: 3, background: "#fde68a", color: "#92400e", padding: "2px 6px", borderRadius: 4, display: "inline-block", border: "1px solid #d97706" }}>
                                📞 Support · {raisedViaLabel(ticket.raisedVia)}
                              </div>
                            )}
                            {isSalesRaised && (
                              <div style={{ fontSize: 9, fontWeight: 700, marginTop: 3, background: "#fff4ee", color: "#e04e00", padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>🧑‍💼 Sales</div>
                            )}
                          </td>

                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap", borderRight: "1px solid #d1fae5", cursor: "pointer" }}
                            onClick={() => setProductPopup({ category: ticket.category, model: ticket.model, serialNo: ticket.serialNo, mac: ticket.mac })}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#059669", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#6ee7b7" }}>{ticket.category || "—"}</div>
                          </td>

                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap", borderRight: "1px solid #d1fae5", cursor: "pointer" }}
                            onClick={() => setCustomerPopup({ customer: ticket.customer, phone: ticket.phone, city: ticket.city, country: ticket.country })}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#1d4ed8", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#93c5fd" }}>{ticket.customer || "—"}</div>
                          </td>

                          <td style={{ padding: "12px 14px", maxWidth: 130, borderRight: "1px solid #d1fae5" }}>
                            <div onClick={() => setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken })}
                              style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#9ca3af" }}
                              title="Click to view full issue">
                              {ticket.description?.length > 35 ? ticket.description.slice(0, 35) + "…" : ticket.description || "—"}
                            </div>
                            {isReassigned && <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, marginTop: 2 }}>🔄 from {ticket.reassignedFrom}</div>}
                            {s === "resolved" && ticket.resolutionNotes && (
                              <div onClick={() => setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken })}
                                style={{ fontSize: 10, color: "#059669", fontWeight: 600, marginTop: 3, cursor: "pointer" }}>✅ Resolved — click to view</div>
                            )}
                          </td>

                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap", borderRight: "1px solid #d1fae5" }}>
                            <span onClick={() => {
                              if (s === "resolved" && ticket.resolutionNotes) setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken });
                              else if (s === "rma") setRmaPopup({ rmaReason: ticket.rmaReason, rmaCenterName: ticket.rmaCenterName, rmaCenterCity: ticket.rmaCenterCity, rmaCenterAddress: ticket.rmaCenterAddress, rmaCenterPhone: ticket.rmaCenterPhone, rmaSentAt: ticket.rmaSentAt });
                            }} style={{
                              padding: "3px 8px", borderRadius: 12, fontSize: 9, fontWeight: 700,
                              color: STATUS_COLOR[s], background: STATUS_BG[s],
                              cursor: (s === "resolved" && ticket.resolutionNotes) || s === "rma" ? "pointer" : "default",
                              border: s === "resolved" && ticket.resolutionNotes ? "1.5px solid #6ee7b7" : s === "rma" ? "1.5px solid #c4b5fd" : "none",
                              display: "inline-block"
                            }}>
                              {s.toUpperCase()}
                            </span>
                            {s === "resolved" && ticket.resolutionNotes && (
                              <div onClick={() => setIssuePopup({ description: ticket.description, resolutionNotes: ticket.resolutionNotes, resolutionTimeTaken: ticket.resolutionTimeTaken })}
                                style={{ fontSize: 9, color: "#059669", marginTop: 3, cursor: "pointer", fontWeight: 600 }}>📋 View details</div>
                            )}
                            {s === "rma" && (
                              <div onClick={() => setRmaPopup({ rmaReason: ticket.rmaReason, rmaCenterName: ticket.rmaCenterName, rmaCenterCity: ticket.rmaCenterCity, rmaCenterAddress: ticket.rmaCenterAddress, rmaCenterPhone: ticket.rmaCenterPhone, rmaSentAt: ticket.rmaSentAt })}
                                style={{ fontSize: 9, color: "#7c3aed", marginTop: 3, cursor: "pointer", fontWeight: 600 }}>🔧 View RMA details</div>
                            )}
                            {ticket.createdAt && s !== "resolved" && s !== "rma" && (() => {
                              const remaining = new Date(ticket.createdAt).getTime() + 24 * 60 * 60 * 1000 - Date.now();
                              if (remaining <= 0) return <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, marginTop: 2 }}>⏱️ OVERDUE</div>;
                              const hrs  = Math.floor(remaining / (1000 * 60 * 60));
                              const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                              return <div style={{ fontSize: 10, color: remaining < 4 * 60 * 60 * 1000 ? "#dc2626" : "#059669", marginTop: 2 }}>⏱️ {hrs}h {mins}m left</div>;
                            })()}
                          </td>

                          <td style={{ padding: "12px 14px", textAlign: "center", borderRight: "1px solid #d1fae5" }}>
                            {ticket.productImage ? (
                              <button onClick={() => setExpandedImage(expandedImage === ticket.id ? null : ticket.id)}
                                style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#065f46" }}>
                                📷 {expandedImage === ticket.id ? "Hide" : "View"}
                              </button>
                            ) : <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>}
                          </td>

                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {s === "open" && (
                                <button onClick={() => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: !prev[ticket.id]?.show } }))}
                                  style={{ background: showResolve ? "#ecfdf5" : "#10b981", color: showResolve ? "#065f46" : "white", border: showResolve ? "1.5px solid #6ee7b7" : "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                                  ✅ {showResolve ? "Cancel" : "Resolve"}
                                </button>
                              )}
                              {s === "resolved" && (
                                <button onClick={() => markWhatsAppSent(ticket.id)}
                                  style={{ background: "#25D366", color: "white", border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                                  📱 WhatsApp
                                </button>
                              )}
                              {(s === "open" || s === "pending") && (
                                <button onClick={() => setRmaForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: !showRma } }))}
                                  style={{ background: showRma ? "#ede9fe" : "#f5f3ff", border: `1.5px solid ${showRma ? "#7c3aed" : "#c4b5fd"}`, color: "#5b21b6", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                                  🔧 RMA
                                </button>
                              )}
                              {s !== "resolved" && s !== "rma" && (
                                <button onClick={() => setReassignForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: !showReassign } }))}
                                  style={{ background: showReassign ? "#fef9c3" : "#fff7ed", border: `1.5px solid ${showReassign ? "#f59e0b" : "#fed7aa"}`, color: "#92400e", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                                  🔄 Reassign
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {expandedImage === ticket.id && ticket.productImage && (
                          <tr key={`img-${ticket.id}`} style={{ background: "#f0fdf4" }}>
                            <td colSpan={8} style={{ padding: "12px 20px" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                                <img src={ticket.productImage} alt="Product" style={{ maxHeight: 200, maxWidth: 300, borderRadius: 8, border: "2px solid #86efac", cursor: "pointer" }} onClick={() => openImageInNewTab(ticket.productImage)} />
                                <div style={{ fontSize: 12, color: "#065f46" }}>
                                  <div style={{ fontWeight: 700, marginBottom: 4 }}>📷 Product Image</div>
                                  <div style={{ color: "#6b7280" }}>Click image to open full size</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {showResolve && s === "open" && (
                          <tr key={`resolveform-${ticket.id}`} style={{ background: "#f0fdf4" }}>
                            <td colSpan={8} style={{ padding: "16px 20px" }}>
                              <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", border: "2px solid #10b981", borderRadius: 12, padding: "18px 20px" }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46", marginBottom: 4 }}>✅ Confirm Resolution</div>
                                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Describe what issue was resolved before marking as done.</div>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>What issue was solved? <span style={{ color: "#ef4444" }}>*</span></div>
                                  <textarea rows={3} placeholder="e.g. Router was not connecting — reset factory settings and reconfigured PPPoE..."
                                    value={resolveForm[ticket.id]?.notes || ""}
                                    onChange={e => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], notes: e.target.value } }))}
                                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #6ee7b7", borderRadius: 8, fontSize: 12, outline: "none", fontFamily: "inherit", background: "white", resize: "vertical", color: "#111", lineHeight: 1.5, boxSizing: "border-box" }}
                                  />
                                  {ticket.createdAt && <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280" }}>⏱️ Raised: <strong>{new Date(ticket.createdAt).toLocaleString()}</strong></div>}
                                  {ticket.acceptedAt && <div style={{ marginTop: 4, fontSize: 11, color: "#6b7280" }}>🔓 Accepted: <strong>{new Date(ticket.acceptedAt).toLocaleString()}</strong></div>}
                                </div>
                                {resolveForm[ticket.id]?.notes && (
                                  <div style={{ background: "white", border: "1px solid #6ee7b7", borderRadius: 8, padding: "10px 14px", marginTop: 14, fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
                                    <strong>📋 Summary:</strong><br />🔧 Resolved: {resolveForm[ticket.id].notes}
                                  </div>
                                )}
                                <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
                                  <button onClick={() => handleResolveSubmit(ticket.id)}
                                    style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", padding: "10px 28px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "inherit", boxShadow: "0 3px 12px rgba(16,185,129,0.4)" }}>
                                    ✅ Confirm Resolved
                                  </button>
                                  <button onClick={() => setResolveForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: false } }))}
                                    style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, color: "#64748b" }}>Cancel</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {showRma && (s === "open" || s === "pending") && (
                          <tr key={`rmaform-${ticket.id}`} style={{ background: "#faf5ff" }}>
                            <td colSpan={8} style={{ padding: "16px 20px" }}>
                              <div style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "2px solid #7c3aed", borderRadius: 12, padding: "16px 20px" }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6", marginBottom: 12 }}>🔧 Cannot Resolve — Send to RMA</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Reason *</div>
                                    <select value={rmaf.reason || ""} onChange={e => setRmaForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], reason: e.target.value } }))}
                                      style={{ width: "100%", padding: "10px 12px", border: "2px solid #c4b5fd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", cursor: "pointer" }}>
                                      <option value="">Select reason</option>
                                      {RMA_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Nearest RMA Center *</div>
                                    {nearbyRmaCenters.length > 0 && nearbyRmaCenters[0].city?.toLowerCase() === (ticket.city || "").toLowerCase() && (
                                      <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>✅ Showing centers near {ticket.city}</div>
                                    )}
                                    <select value={rmaf.centerId || ""} onChange={e => setRmaForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], centerId: e.target.value } }))}
                                      style={{ width: "100%", padding: "10px 12px", border: "2px solid #c4b5fd", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", cursor: "pointer" }}>
                                      <option value="">Select RMA center</option>
                                      {nearbyRmaCenters.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
                                    </select>
                                  </div>
                                </div>
                                {rmaf.centerId && (() => {
                                  const center = rmaCenters.find(c => c.id === parseInt(rmaf.centerId));
                                  if (!center) return null;
                                  return (
                                    <div style={{ background: "white", border: "1px solid #c4b5fd", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
                                      <strong>📍 {center.name}</strong> — {center.city} | 📞 {center.phone}<br />{center.address}
                                    </div>
                                  );
                                })()}
                                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                                  <button onClick={() => handleRMASubmit(ticket.id)} disabled={submittingRma === ticket.id}
                                    style={{ background: submittingRma === ticket.id ? "#94a3b8" : "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "inherit" }}>
                                    {submittingRma === ticket.id ? "⏳ Processing..." : "🔧 Confirm RMA + Send WhatsApp"}
                                  </button>
                                  <button onClick={() => setRmaForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: false } }))}
                                    style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, color: "#64748b" }}>Cancel</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {showReassign && s !== "resolved" && s !== "rma" && (
                          <tr key={`reassignform-${ticket.id}`} style={{ background: "#fffdf0" }}>
                            <td colSpan={8} style={{ padding: "16px 20px" }}>
                              <div style={{ background: "linear-gradient(135deg, #fffbeb, #fef9c3)", border: "2px solid #f59e0b", borderRadius: 12, padding: "16px 20px" }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginBottom: 12 }}>🔄 Reassign This Ticket</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Reassign To *</div>
                                    <select value={rf.newPerson || ""} onChange={e => setReassignForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], newPerson: e.target.value } }))}
                                      style={{ width: "100%", padding: "10px 12px", border: "2px solid #fcd34d", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", cursor: "pointer" }}>
                                      <option value="">Select specialist</option>
                                      {filteredReassignPersons.map(p => (
                                        <option key={p.email} value={p.name}>{p.name} — {p.city || "—"}{p.specialization?.length > 0 ? ` (${p.specialization.join(", ")})` : ""}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Reason *</div>
                                    <input type="text" placeholder="e.g. Busy with other tickets..."
                                      value={rf.reason || ""}
                                      onChange={e => setReassignForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], reason: e.target.value } }))}
                                      style={{ width: "100%", padding: "10px 12px", border: "2px solid #fcd34d", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "white", boxSizing: "border-box", color: "#111" }}
                                    />
                                  </div>
                                </div>
                                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                                  <button onClick={() => handleReassign(ticket.id)} disabled={reassigning === ticket.id}
                                    style={{ background: reassigning === ticket.id ? "#94a3b8" : "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "inherit" }}>
                                    {reassigning === ticket.id ? "⏳ Reassigning..." : "🔄 Confirm Reassign"}
                                  </button>
                                  <button onClick={() => setReassignForm(prev => ({ ...prev, [ticket.id]: { ...prev[ticket.id], show: false } }))}
                                    style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, color: "#64748b" }}>Cancel</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {s === "resolved" && (
                          <tr key={`fb-${ticket.id}`} style={{ background: "#f0fdf4" }}>
                            <td colSpan={8} style={{ padding: "8px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                                {ticket.feedbackRating ? (
                                  <span style={{ fontSize: 12, color: "#065f46", fontWeight: 600 }}>
                                    ⭐ Customer Rating: {"★".repeat(ticket.feedbackRating)}{"☆".repeat(5 - ticket.feedbackRating)} ({ticket.feedbackRating}/5)
                                    {ticket.feedbackComment && ` — "${ticket.feedbackComment}"`}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                                    {ticket.feedbackSent ? `✅ WhatsApp sent to ${ticket.customer} — waiting for admin to record feedback` : "📱 Send WhatsApp to request customer feedback"}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}