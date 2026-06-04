export default function ProductFilterBar({
  categories, subOptions, itemOptions,
  filterCat, filterSub, filterItem,
  setCat, setSub, setItem,
  resultCount,
}) {
  const selectStyle = (active) => ({
    padding: "7px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
    border: `1.5px solid ${active ? "#c94500" : "#d1d5db"}`,
    background: active ? "#fff4ee" : "white",
    color: active ? "#c94500" : "#374151",
    outline: "none", fontFamily: "DM Sans, sans-serif",
    minWidth: 160,
  });

  const isFiltered = filterCat !== "all" || filterSub !== "all" || filterItem !== "all";

  return (
    <div style={{
      display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
      background: "white", borderRadius: 10, padding: "10px 14px",
      border: `1.5px solid ${isFiltered ? "#fad8be" : "#e0d8d0"}`,
      marginBottom: 14,
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>
        📦 Product:
      </span>

      {/* Category */}
      <select value={filterCat} onChange={e => setCat(e.target.value)} style={selectStyle(filterCat !== "all")}>
        <option value="all">All Categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Sub-Category — always visible, disabled until category picked */}
      <select
        value={filterSub}
        onChange={e => setSub(e.target.value)}
        disabled={filterCat === "all"}
        style={{
          ...selectStyle(filterSub !== "all"),
          opacity: filterCat === "all" ? 0.4 : 1,
          cursor: filterCat === "all" ? "not-allowed" : "pointer",
        }}>
        <option value="all">All Sub-Categories</option>
        {subOptions.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Item — always visible, disabled until sub-category picked */}
      <select
        value={filterItem}
        onChange={e => setItem(e.target.value)}
        disabled={filterSub === "all"}
        style={{
          ...selectStyle(filterItem !== "all"),
          opacity: filterSub === "all" ? 0.4 : 1,
          cursor: filterSub === "all" ? "not-allowed" : "pointer",
        }}>
        <option value="all">All Models</option>
        {itemOptions.map(i => <option key={i} value={i}>{i}</option>)}
      </select>

      {/* Clear button */}
      {isFiltered && (
        <button onClick={() => setCat("all")}
          style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
          ✕ Clear
        </button>
      )}

      {/* Result count */}
      {isFiltered && resultCount !== undefined && (
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
          <strong style={{ color: "#c94500" }}>{resultCount}</strong> ticket{resultCount !== 1 ? "s" : ""} match
        </span>
      )}
    </div>
  );
}