import { useState, useEffect } from "react";
import { PRODUCT_MODELS } from "../data/productModels";

const BASE_URL = "https://api.syrotech.com";

export function useProducts() {
  const [products, setProducts] = useState(PRODUCT_MODELS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products`)
      .then(r => r.json())
      .then(data => {
        if (data && Object.keys(data).some(k => Object.keys(data[k]).length > 0)) setProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getCategories    = () => Object.keys(products);
  const getSubCategories = (cat) => Object.keys(products[cat] || {});
  const getItems         = (cat, sub) => products[cat]?.[sub] || [];

  return { products, loading, getCategories, getSubCategories, getItems };
}