import React, { useState } from "react";
import { useProducts } from "../hooks/useProducts";

const BASE_URL = "https://api.syrotech.com";
const CATEGORY_ASSIGNEE_EMAIL = {
  "OLT": "nitesh.kumar1@syrotech.com",
  "ONT": "nitesh.kumar1@syrotech.com",
  "Wireless Access Point": "tushar.panchal@goip.in",
  "EMS/NMS": "nitesh.kumar1@syrotech.com",
  "Media Converter": "baidyanath.mishra1@goip.in",
  "Optical Transceivers": "mohit.mittal1@goip.in",
  "Networking Switch": "baidyanath.mishra1@goip.in",
  "Entrance Product": "gagandeep.sodhi@goip.in",
  "CCTV": "run.singh@goip.in",
  "Passive Products": "archna.verma@goip.in",
  "Grandstream UC": "tushar.panchal@goip.in",
  "Grandstream Networking": "tushar.panchal@goip.in",
  "Firewall/SDWAN":"naman.gupta@goip.in",
  "Anroid Box":"naman.gupta@goip.in"
};

export default function ProductTesting({ currentUser, supportPersons = [], autoAssign = false }) {
  const { getCategories, getSubCategories, getItems } = useProducts();
  const [form, setForm] = useState({
    category: "", subCategory: "", model: "",
    serialNo: "", macPrefix: "", macSuffix: "", mac: "",
    oemName: "", sampleReceiveDate: "", dcNumber: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const inputStyle = (field) => ({
    width: "100%", padding: "11px 14px",
    border: `2px solid ${formErrors[field] ? "#ef4444" : "#ddd5c8"}`,
    borderRadius: 10, fontSize: 13.5, boxSizing: "border-box",
    outline: "none", background: formErrors[field] ? "#fff5f5" : "#f0ebe3",
    fontFamily: "DM Sans, sans-serif", color: "#111",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setForm(prev => ({ ...prev, category: value, subCategory: "", model: "" }));
    } else if (name === "subCategory") {
      setForm(prev => ({ ...prev, subCategory: value, model: "" }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    setFormErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.category) e.category = "Please select a product category.";
    if (!form.subCategory) e.subCategory = "Please select a sub category.";
    if (!form.model) e.model = "Please select an item.";
    if (!form.serialNo.trim()) e.serialNo = "Serial number is required.";
    if (!form.sampleReceiveDate) e.sampleReceiveDate = "Sample receive date is required.";
    return e;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSubmitting(true);
    const mac = form.macPrefix && form.macSuffix ? `${form.macPrefix}:${form.macSuffix}` : "";

    let assignTo  = currentUser?.name || "";
    let source    = "support";
    let raisedVia = "direct-call";

    if (autoAssign) {
      const targetEmail = CATEGORY_ASSIGNEE_EMAIL[form.category];
      const person = supportPersons.find(
        p => p.email && targetEmail && p.email.toLowerCase().trim() === targetEmail.toLowerCase().trim()
      );
      if (!person) {
        setFormErrors({ submit: "❌ No testing specialist mapped for this category. Please contact admin." });
        setSubmitting(false);
        return;
      }
      assignTo  = person.name;
      source    = "sales";
      raisedVia = "sales";
    }

    const ticket = {
      category: form.category,
      subCategory: form.subCategory,
      model: form.model,
      serialNo: form.serialNo,
      mac,
      oemName: form.oemName,
      sampleReceiveDate: form.sampleReceiveDate,
      dcNumber: form.dcNumber,
        productDescription: form.productDescription || "",
     ticketType: "product_testing",
      source,
      raisedVia,
      status: "open",
      assignTo,
      raisedBy: currentUser?.email || "",
      raisedByName: currentUser?.name || "",
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await fetch(`${BASE_URL}/tickets`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticket),
      });
      if (!res.ok) throw new Error("Failed");
     setForm({ category: "", subCategory: "", model: "", serialNo: "", macPrefix: "", macSuffix: "", mac: "", oemName: "", sampleReceiveDate: "", dcNumber: "", productDescription: "" });
      setSuccessMsg("✅ Product Testing Ticket raised successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setFormErrors({ submit: "❌ Failed to submit ticket." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "28px auto", padding: "0 16px" }}>
      <div style={{ background: "white", borderRadius: 16, padding: "28px 36px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1.5px solid #e0d8d0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ fontSize: 32 }}>🧪</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#374151" }}>Raise Product Testing Ticket</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Fields marked <span style={{ color: "#ff6b35" }}>*</span> are required.</div>
          </div>
        </div>

        {successMsg && <div style={{ background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 14, fontWeight: 600, color: "#065f46" }}>{successMsg}</div>}
        {formErrors.submit && <div style={{ background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#dc2626" }}>{formErrors.submit}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Category */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Product Category <span style={{ color: "#ff6b35" }}>*</span></label>
            <select name="category" value={form.category} onChange={handleChange} style={inputStyle("category")}>
              <option value="">Select Category</option>
              {getCategories().map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {formErrors.category && <span style={{ fontSize: 12, color: "#ef4444" }}>{formErrors.category}</span>}
          </div>


          {/* Sub Category */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Sub Category <span style={{ color: "#ff6b35" }}>*</span></label>
            <select name="subCategory" value={form.subCategory} onChange={handleChange} style={{ ...inputStyle("subCategory"), color: !form.category ? "#888" : "#111" }} disabled={!form.category}>
              <option value="">{form.category ? "Select Sub Category" : "Select category first"}</option>
              {getSubCategories(form.category).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {formErrors.subCategory && <span style={{ fontSize: 12, color: "#ef4444" }}>{formErrors.subCategory}</span>}
          </div>

          {/* Item Name */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Item Name <span style={{ color: "#ff6b35" }}>*</span></label>
            <select name="model" value={form.model} onChange={handleChange} style={{ ...inputStyle("model"), color: !form.subCategory ? "#888" : "#111" }} disabled={!form.subCategory}>
              <option value="">{form.subCategory ? "Select Item" : "Select sub category first"}</option>
              {getItems(form.category, form.subCategory).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {formErrors.model && <span style={{ fontSize: 12, color: "#ef4444" }}>{formErrors.model}</span>}
          </div>

          {/* Serial No */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Serial Number <span style={{ color: "#ff6b35" }}>*</span></label>
            <input name="serialNo" placeholder="e.g. SYR-20240001" value={form.serialNo} onChange={handleChange} style={inputStyle("serialNo")} />
            {formErrors.serialNo && <span style={{ fontSize: 12, color: "#ef4444" }}>{formErrors.serialNo}</span>}
          </div>

          {/* MAC Address */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>MAC Address</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={form.macPrefix} onChange={e => setForm(prev => ({ ...prev, macPrefix: e.target.value, mac: `${e.target.value}:${prev.macSuffix}` }))} style={{ ...inputStyle("mac"), width: "45%" }}>
                <option value="">Select Prefix</option>
                {["38:94:E0","7C:A9:6B","54:47:E8","A8:E2:07","B8:B7:DB","98:9D:B2","74:61:D1"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input placeholder="11:22:33" value={form.macSuffix} onChange={e => { const v = e.target.value.toUpperCase(); setForm(prev => ({ ...prev, macSuffix: v, mac: `${prev.macPrefix}:${v}` })); }} style={{ ...inputStyle("mac"), width: "55%" }} />
            </div>
          </div>

          {/* OEM Name */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>OEM Name <span style={{ fontSize: 11, color: "#6b7280" }}>(optional)</span></label>
            <input name="oemName" placeholder="e.g. Huawei, ZTE..." value={form.oemName} onChange={handleChange} style={inputStyle("oemName")} />
          </div>

          {/* Sample Receive Date */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Sample Receive Date <span style={{ color: "#ff6b35" }}>*</span></label>
            <input type="date" name="sampleReceiveDate" value={form.sampleReceiveDate} onChange={handleChange} style={inputStyle("sampleReceiveDate")} />
            {formErrors.sampleReceiveDate && <span style={{ fontSize: 12, color: "#ef4444" }}>{formErrors.sampleReceiveDate}</span>}
          </div>

          {/* DC Number */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>DC Number <span style={{ fontSize: 11, color: "#6b7280" }}>(optional)</span></label>
            <input name="dcNumber" placeholder="e.g. DC-2024-001" value={form.dcNumber} onChange={handleChange} style={inputStyle("dcNumber")} />
          </div>
{/* Product Description */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Product Description <span style={{ fontSize: 11, color: "#6b7280" }}>(optional)</span></label>
            <textarea name="productDescription" rows={4}
              placeholder="Describe the product, testing requirements, observations..."
              value={form.productDescription || ""}
              onChange={e => setForm(prev => ({ ...prev, productDescription: e.target.value }))}
              style={{ ...inputStyle("productDescription"), resize: "vertical", fontFamily: "DM Sans, sans-serif", lineHeight: 1.6 }}
            />
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={submitting} style={{ background: submitting ? "#94a3b8" : "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", marginTop: 8, fontFamily: "inherit" }}>
            {submitting ? "⏳ Submitting..." : "🧪 Submit Testing Ticket"}
          </button>

        </div>
      </div>
    </div>
  );
}