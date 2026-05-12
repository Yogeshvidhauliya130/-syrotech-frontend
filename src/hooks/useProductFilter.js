import { useState, useMemo } from "react";
import { useProducts } from "./useProducts"; // adjust path if needed

export function useProductFilter(tickets) {
  const { products } = useProducts();
  const [filterCat, setFilterCat]  = useState("all");
  const [filterSub, setFilterSub]  = useState("all");
  const [filterItem, setFilterItem] = useState("all");

  // Derived options based on selections above
  const subOptions  = filterCat  !== "all" ? Object.keys(products[filterCat]  || {}) : [];
  const itemOptions = filterCat  !== "all" && filterSub !== "all"
    ? products[filterCat]?.[filterSub] || []
    : [];

  // Reset dependent filters when parent changes
  const setCat = (val) => { setFilterCat(val); setFilterSub("all"); setFilterItem("all"); };
  const setSub = (val) => { setFilterSub(val); setFilterItem("all"); };

  // Apply filter to any ticket array
  const applyFilter = (list) => list.filter(t => {
    if (filterCat  !== "all" && t.category    !== filterCat)  return false;
    if (filterSub  !== "all" && t.subCategory !== filterSub)  return false;
    if (filterItem !== "all" && t.model       !== filterItem) return false;
    return true;
  });

  return {
    filterCat, filterSub, filterItem,
    setCat, setSub, setItem: setFilterItem,
    subOptions, itemOptions,
    applyFilter,
    categories: Object.keys(products),
  };
}