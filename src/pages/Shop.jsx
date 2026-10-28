import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../lib/products";
import ProductCard from "../components/ProductCard";
import { CATEGORIES } from "../config";

const COLLECTION_TITLES = {
  new: "New Collection",
  sale: "Sale",
};

const SALE_SUBTABS = [
  { value: "", label: "All Sale" },
  { value: "20", label: "$20 Shoes" },
  { value: "last", label: "Last Pairs" },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const collection = searchParams.get("collection") || "";
  const saleFilter = searchParams.get("filter") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const effectiveCollection = collection === "sale" && saleFilter ? saleFilter : collection;

  useEffect(() => {
    setLoading(true);
    fetchProducts({
      category: activeCategory || undefined,
      collection: effectiveCollection || undefined,
    })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCategory, effectiveCollection]);

  function setCategory(cat) {
    const next = new URLSearchParams(searchParams);
    if (cat) next.set("category", cat);
    else next.delete("category");
    setSearchParams(next);
  }

  function setSaleFilter(value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("filter", value);
    else next.delete("filter");
    setSearchParams(next);
  }

  const title = COLLECTION_TITLES[collection] || "Shop All";

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24">
      <h1 className="font-display text-3xl md:text-5xl mb-12 text-center">{title}</h1>

      {collection === "sale" && (
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8">
          {SALE_SUBTABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setSaleFilter(t.value)}
              className={`eyebrow pb-1 border-b transition-colors ${
                saleFilter === t.value
                  ? "border-noir text-noir"
                  : "border-transparent text-silver-dim hover:text-noir"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

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
        <p className="text-silver-dim text-sm text-center">Nothing here yet.</p>
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
