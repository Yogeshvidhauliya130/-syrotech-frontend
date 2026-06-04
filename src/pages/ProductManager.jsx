import { useState, useEffect } from "react";
import { PRODUCT_MODELS } from "../data/productModels";
import "./ProductManager.css";

export default function ProductManager() {
 const [products, setProducts] = useState(JSON.parse(JSON.stringify(PRODUCT_MODELS)));

useEffect(() => {
  fetch("https://api.syrotech.com/api/products")
    .then(r => r.json())
    .then(data => {
  const hasSubCats = data && Object.values(data).some(cat => Object.keys(cat).length > 0);
  if (hasSubCats) setProducts(data);
})
    .catch(() => {});
}, []);

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Modal states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  

  const categories = Object.keys(products);

  // Stats
  const totalCategories = categories.length;
  const totalSubCategories = categories.reduce((sum, cat) => sum + Object.keys(products[cat] || {}).length, 0);
  const totalItems = categories.reduce((sum, cat) =>
    sum + Object.values(products[cat] || {}).reduce((s, items) => s + (Array.isArray(items) ? items.length : 0), 0), 0);

  // Search filter
  const filteredCategories = categories.filter(cat => {
    if (filterCategory !== "all" && cat !== filterCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (cat.toLowerCase().includes(q)) return true;
    const subCats = Object.keys(products[cat] || {});
    return subCats.some(sub => {
      if (sub.toLowerCase().includes(q)) return true;
      const items = products[cat][sub] || [];
      return items.some(item => item.toLowerCase().includes(q));
    });
  });

  // Add Category
  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) { alert("Please enter a category name."); return; }
    if (products[name]) { alert("Category already exists!"); return; }
    setProducts(prev => ({ ...prev, [name]: {} }));
    setNewCategoryName("");
    setShowAddCategory(false);
    setActiveCategory(name);
  };

  // Delete Category
  const handleDeleteCategory = (cat) => {
    const updated = { ...products };
    delete updated[cat];
    setProducts(updated);
    if (activeCategory === cat) { setActiveCategory(null); setActiveSubCategory(null); }
    setDeleteConfirm(null);

    fetch("https://api.syrotech.com/api/products", {
  method: "DELETE", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ category: cat })
});

  };

  // Add SubCategory
  const handleAddSubCategory = () => {
    const name = newSubCategoryName.trim();
    if (!name) { alert("Please enter a sub-category name."); return; }
    if (!activeCategory) { alert("Please select a category first."); return; }
    if (products[activeCategory][name]) { alert("Sub-category already exists!"); return; }
    setProducts(prev => ({
      ...prev,
      [activeCategory]: { ...prev[activeCategory], [name]: [] }
    }));
    setNewSubCategoryName("");
    setShowAddSubCategory(false);
    setActiveSubCategory(name);
  };

  // Delete SubCategory
  const handleDeleteSubCategory = (cat, sub) => {
    const updated = { ...products, [cat]: { ...products[cat] } };
    delete updated[cat][sub];
    setProducts(updated);
    if (activeSubCategory === sub) setActiveSubCategory(null);
    setDeleteConfirm(null);

    fetch("https://api.syrotech.com/api/products", {
  method: "DELETE", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ category: cat, subCategory: sub })
});

  };

  // Add Item
  const handleAddItem = () => {
    const name = newItemName.trim();
    if (!name) { alert("Please enter an item name."); return; }
    if (!activeCategory || !activeSubCategory) { alert("Please select a category and sub-category first."); return; }
    const existing = products[activeCategory][activeSubCategory] || [];
    if (existing.includes(name)) { alert("Item already exists!"); return; }
    setProducts(prev => ({
      ...prev,
      [activeCategory]: {
        ...prev[activeCategory],
        [activeSubCategory]: [...(prev[activeCategory][activeSubCategory] || []), name]
      }
    }));
    setNewItemName("");
    setShowAddItem(false);

    fetch("https://api.syrotech.com/api/products", {
  method: "PATCH", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ category: activeCategory, subCategory: activeSubCategory, items: [...(products[activeCategory][activeSubCategory] || []), name] })
});
  };

  // Delete Item
  const handleDeleteItem = (cat, sub, item) => {
    setProducts(prev => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [sub]: prev[cat][sub].filter(i => i !== item)
      }
    }));
    setDeleteConfirm(null);


    fetch("https://api.syrotech.com/api/products", {
  method: "PATCH", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ category: cat, subCategory: sub, items: products[cat][sub].filter(i => i !== item) })
});

  };

  // Reset to original


  const inputStyle = {
    width: "100%", padding: "10px 14px", border: "1.5px solid #e0d8d0",
    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "DM Sans, sans-serif",
    background: "#f9f7f4", color: "#111", boxSizing: "border-box",
  };

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", minHeight: "100vh" }}>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "28px 32px", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fca5a5", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#dc2626", marginBottom: 8 }}>Confirm Delete</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to delete <strong style={{ color: "#111" }}>"{deleteConfirm.name}"</strong>?
              {deleteConfirm.type === "category" && " This will also delete all its sub-categories and items."}
              {deleteConfirm.type === "subcategory" && " This will also delete all its items."}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #d1d5db", background: "white", color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Cancel</button>
              <button onClick={() => {
                if (deleteConfirm.type === "category") handleDeleteCategory(deleteConfirm.cat);
                else if (deleteConfirm.type === "subcategory") handleDeleteSubCategory(deleteConfirm.cat, deleteConfirm.sub);
                else if (deleteConfirm.type === "item") handleDeleteItem(deleteConfirm.cat, deleteConfirm.sub, deleteConfirm.name);
              }} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div onClick={() => setShowAddCategory(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "28px 32px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #fad8be" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#c94500", marginBottom: 16 }}>➕ Add New Category</div>
            <input style={inputStyle} placeholder="e.g. Network Cameras" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddCategory()} autoFocus />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowAddCategory(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #d1d5db", background: "white", color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleAddCategory} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c94500,#ff5a00)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>✅ Add Category</button>
            </div>
          </div>
        </div>
      )}

      {/* Add SubCategory Modal */}
      {showAddSubCategory && (
        <div onClick={() => setShowAddSubCategory(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "28px 32px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #bfdbfe" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1d4ed8", marginBottom: 6 }}>➕ Add Sub-Category</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Under: <strong>{activeCategory}</strong></div>
            <input style={inputStyle} placeholder="e.g. Indoor Cameras" value={newSubCategoryName} onChange={e => setNewSubCategoryName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddSubCategory()} autoFocus />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowAddSubCategory(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #d1d5db", background: "white", color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleAddSubCategory} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>✅ Add Sub-Category</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div onClick={() => setShowAddItem(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: "28px 32px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "2px solid #d1fae5" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#059669", marginBottom: 6 }}>➕ Add Item / Model</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Under: <strong>{activeCategory}</strong> → <strong>{activeSubCategory}</strong></div>
            <input style={inputStyle} placeholder="e.g. SY-GPON-2010-WADONT" value={newItemName} onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddItem()} autoFocus />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowAddItem(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #d1d5db", background: "white", color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleAddItem} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#059669,#10b981)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>✅ Add Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>📦 Product Manager</h2>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>Manage product categories, sub-categories and model names</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            

            <button onClick={async () => {
  if (!window.confirm("Push all products to database?")) return;
  const res = await fetch("https://api.syrotech.com/api/products/seed", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products })
  });
  const data = await res.json();
  if (data.success) alert(`✅ ${data.count} products saved to database!`);
}} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #6ee7b7", background: "#ecfdf5", color: "#059669", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
  🚀 Push to Database
</button>

            <button onClick={() => setShowAddCategory(true)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c94500,#ff5a00)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>➕ Add Category</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          ["📁 Categories", totalCategories, "#c94500", "#fff4ee"],
          ["📂 Sub-Categories", totalSubCategories, "#1d4ed8", "#eff6ff"],
          ["📋 Total Items", totalItems, "#059669", "#ecfdf5"],
        ].map(([label, val, col, bg]) => (
          <div key={label} style={{ background: "white", borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderTop: `4px solid ${col}`, textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: col }}>{val}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="🔍 Search categories, sub-categories, items..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "10px 16px", border: "1.5px solid #d1d5db", borderRadius: 10, fontSize: 13, outline: "none", background: "white", fontFamily: "DM Sans, sans-serif", color: "#111" }}
        />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${filterCategory !== "all" ? "#c94500" : "#d1d5db"}`, fontSize: 12, cursor: "pointer", background: filterCategory !== "all" ? "#fff4ee" : "white", color: filterCategory !== "all" ? "#c94500" : "#374151", outline: "none", fontFamily: "DM Sans, sans-serif" }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(searchQuery || filterCategory !== "all") && (
          <button onClick={() => { setSearchQuery(""); setFilterCategory("all"); }}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>✕ Clear</button>
        )}
      </div>

      {/* Main 3-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 240px 1fr", gap: 14, alignItems: "start" }}>

        {/* Column 1 — Categories */}
        <div style={{ background: "white", borderRadius: 12, border: "1.5px solid #e0d8d0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "12px 16px", background: "linear-gradient(135deg,#c94500,#ff5a00)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>📁 Categories</div>
            <span style={{ background: "rgba(255,255,255,0.25)", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 7px" }}>{filteredCategories.length}</span>
          </div>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {filteredCategories.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#9ca3af", fontSize: 12 }}>No categories found</div>
            ) : filteredCategories.map(cat => (
              <div key={cat}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", cursor: "pointer",
                  background: activeCategory === cat ? "#fff4ee" : "white",
                  borderBottom: "1px solid #f0ede8",
                  borderLeft: activeCategory === cat ? "3px solid #ff5a00" : "3px solid transparent",
                }}
                onClick={() => { setActiveCategory(cat); setActiveSubCategory(null); }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: activeCategory === cat ? 700 : 500, color: activeCategory === cat ? "#c94500" : "#374151" }}>{cat}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{Object.keys(products[cat] || {}).length} sub-cats</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setDeleteConfirm({ type: "category", cat, name: cat }); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#fca5a5", padding: "2px 4px", borderRadius: 4, opacity: 0.7 }}
                  title="Delete category">🗑️</button>
              </div>
            ))}
          </div>
          <div style={{ padding: 10, borderTop: "1px solid #f0ede8" }}>
            <button onClick={() => setShowAddCategory(true)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1.5px dashed #fad8be", background: "#fff4ee", color: "#c94500", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>➕ Add Category</button>
          </div>
        </div>

        {/* Column 2 — Sub Categories */}
        <div style={{ background: "white", borderRadius: 12, border: "1.5px solid #e0d8d0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "12px 16px", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>📂 Sub-Categories</div>
            {activeCategory && <span style={{ background: "rgba(255,255,255,0.25)", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 7px" }}>{Object.keys(products[activeCategory] || {}).length}</span>}
          </div>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {!activeCategory ? (
              <div style={{ textAlign: "center", padding: 30, color: "#9ca3af", fontSize: 12 }}>← Select a category</div>
            ) : Object.keys(products[activeCategory] || {}).length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#9ca3af", fontSize: 12 }}>No sub-categories yet</div>
            ) : Object.keys(products[activeCategory]).filter(sub => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              if (sub.toLowerCase().includes(q)) return true;
              return (products[activeCategory][sub] || []).some(item => item.toLowerCase().includes(q));
            }).map(sub => (
              <div key={sub}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", cursor: "pointer",
                  background: activeSubCategory === sub ? "#eff6ff" : "white",
                  borderBottom: "1px solid #f0ede8",
                  borderLeft: activeSubCategory === sub ? "3px solid #3b82f6" : "3px solid transparent",
                }}
                onClick={() => setActiveSubCategory(sub)}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: activeSubCategory === sub ? 700 : 500, color: activeSubCategory === sub ? "#1d4ed8" : "#374151" }}>{sub}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{(products[activeCategory][sub] || []).length} items</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setDeleteConfirm({ type: "subcategory", cat: activeCategory, sub, name: sub }); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#fca5a5", padding: "2px 4px", borderRadius: 4, opacity: 0.7 }}
                  title="Delete sub-category">🗑️</button>
              </div>
            ))}
          </div>
          <div style={{ padding: 10, borderTop: "1px solid #f0ede8" }}>
            <button onClick={() => { if (!activeCategory) { alert("Select a category first!"); return; } setShowAddSubCategory(true); }}
              style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1.5px dashed #bfdbfe", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>➕ Add Sub-Category</button>
          </div>
        </div>

        {/* Column 3 — Items */}
        <div style={{ background: "white", borderRadius: 12, border: "1.5px solid #e0d8d0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "12px 16px", background: "linear-gradient(135deg,#059669,#10b981)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Items / Models</div>
              {activeCategory && activeSubCategory && (
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{activeCategory} → {activeSubCategory}</div>
              )}
            </div>
            {activeCategory && activeSubCategory && (
              <span style={{ background: "rgba(255,255,255,0.25)", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 7px" }}>
                {(products[activeCategory]?.[activeSubCategory] || []).length}
              </span>
            )}
          </div>

          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {!activeCategory || !activeSubCategory ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 13 }}>Select a category and sub-category to view items</div>
              </div>
            ) : (products[activeCategory]?.[activeSubCategory] || []).length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <div style={{ fontSize: 13 }}>No items yet. Add your first item!</div>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {(products[activeCategory]?.[activeSubCategory] || [])
                  .filter(item => !searchQuery.trim() || item.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item, idx) => (
                    <div key={idx} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 16px", borderBottom: "1px solid #f0ede8",
                      background: idx % 2 === 0 ? "#f0fdf4" : "white",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#059669", flexShrink: 0 }}>{idx + 1}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{item}</div>
                      </div>
                      <button onClick={() => setDeleteConfirm({ type: "item", cat: activeCategory, sub: activeSubCategory, name: item })}
                        style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, cursor: "pointer", fontSize: 11, color: "#dc2626", padding: "3px 8px", fontWeight: 600, fontFamily: "inherit" }}>🗑️</button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div style={{ padding: 10, borderTop: "1px solid #f0ede8" }}>
            <button onClick={() => { if (!activeCategory || !activeSubCategory) { alert("Select a category and sub-category first!"); return; } setShowAddItem(true); }}
              style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1.5px dashed #6ee7b7", background: "#f0fdf4", color: "#059669", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>➕ Add Item / Model</button>
          </div>
        </div>
      </div>

      {/* Full list view when search active */}
      {searchQuery && (
        <div style={{ marginTop: 20, background: "white", borderRadius: 12, border: "1.5px solid #e0d8d0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "12px 16px", background: "#f9f7f4", borderBottom: "1px solid #e0d8d0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>🔍 Search Results for "{searchQuery}"</div>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {filteredCategories.flatMap(cat =>
              Object.keys(products[cat] || {}).flatMap(sub =>
                (products[cat][sub] || [])
                  .filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => ({ cat, sub, item }))
              )
            ).map(({ cat, sub, item }, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #f0ede8", background: idx % 2 === 0 ? "#fafafa" : "white" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{item}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                    <span style={{ background: "#fff4ee", color: "#c94500", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{cat}</span>
                    {" → "}
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{sub}</span>
                  </div>
                </div>
                <button onClick={() => setDeleteConfirm({ type: "item", cat, sub, name: item })}
                  style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, cursor: "pointer", fontSize: 11, color: "#dc2626", padding: "3px 8px", fontWeight: 600, fontFamily: "inherit" }}>🗑️</button>
              </div>
            ))}
            {filteredCategories.flatMap(cat =>
              Object.keys(products[cat] || {}).flatMap(sub =>
                (products[cat][sub] || []).filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
              )
            ).length === 0 && (
              <div style={{ textAlign: "center", padding: 30, color: "#9ca3af", fontSize: 13 }}>No items found matching "{searchQuery}"</div>
            )}
          </div>
        </div>
      )}

      {/* Info note */}
     <div style={{ marginTop: 16, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#92400e" }}>
  ⚠️ <strong>Note:</strong> All changes (add/delete) are saved directly to the database in real time.
</div>
    </div>
  );
}