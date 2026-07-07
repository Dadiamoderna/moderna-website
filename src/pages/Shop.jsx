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
    <div className="mx-auto max-w-7xl px-5 md:px-8 py-12 md:py-16">
      <h1 className="font-display text-3xl md:text-4xl mb-8">Shop</h1>

      <div className="flex flex-wrap gap-2 mb-10">
        <button
          onClick={() => setCategory("")}
          className={`eyebrow px-4 py-2 border transition-colors ${
            !activeCategory
              ? "bg-noir text-platinum border-noir"
              : "border-line/40 text-silver-dim hover:border-noir"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`eyebrow px-4 py-2 border transition-colors ${
              activeCategory === c
                ? "bg-noir text-platinum border-noir"
                : "border-line/40 text-silver-dim hover:border-noir"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-silver-dim text-sm">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-silver-dim text-sm">No products found in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
