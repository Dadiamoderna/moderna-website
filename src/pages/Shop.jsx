import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../lib/products";
import ProductCard from "../components/ProductCard";
import { CATEGORIES } from "../config";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProducts({ category: activeCategory || undefined })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  function setCategory(cat) {
    if (cat) setSearchParams({ category: cat });
    else setSearchParams({});
  }

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24">
      <h1 className="font-display text-3xl md:text-5xl mb-12 text-center">Shop</h1>

      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-16 border-b border-line/20 pb-6">
        <button
          onClick={() => setCategory("")}
          className={`eyebrow pb-1 border-b transition-colors ${
            !activeCategory
              ? "border-noir text-noir"
              : "border-transparent text-silver-dim hover:text-noir"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`eyebrow pb-1 border-b transition-colors ${
              activeCategory === c
                ? "border-noir text-noir"
                : "border-transparent text-silver-dim hover:text-noir"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-silver-dim text-sm text-center">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-silver-dim text-sm text-center">No products found in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
