import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProduct } from "../lib/products";
import { useCart } from "../context/CartContext";
import { STORE } from "../config";

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchProduct(id)
      .then((p) => {
        setProduct(p);
        setSize(p.sizes?.[0] ?? "");
        setColor(p.colors?.[0] ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-center py-24 text-silver-dim text-sm">Loading…</p>;
  }

  if (!product) {
    return (
      <div className="text-center py-24">
        <p className="text-silver-dim mb-4">Product not found.</p>
        <Link to="/shop" className="eyebrow text-brass border-b border-brass pb-0.5">
          Back to shop
        </Link>
      </div>
    );
  }

  function handleAdd() {
    addItem(product, { size, color, quantity: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8 py-12 md:py-16 grid md:grid-cols-2 gap-10 md:gap-16">
      <div>
        <div className="aspect-[3/4] bg-graphite overflow-hidden">
          {product.images?.[activeImage] ? (
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-silver-dim text-sm">
              No photo yet
            </div>
          )}
        </div>
        {product.images?.length > 1 && (
          <div className="flex gap-3 mt-3">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-16 h-20 bg-graphite overflow-hidden border ${
                  i === activeImage ? "border-noir" : "border-transparent"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-md">
        <p className="eyebrow text-silver-dim mb-2">{product.category}</p>
        <h1 className="font-display text-3xl md:text-4xl mb-3">{product.name}</h1>
        <p className="font-display text-xl text-brass mb-6">
          {STORE.currency}
          {Number(product.price).toFixed(2)}
        </p>
        {product.description && (
          <p className="text-sm text-noir/80 leading-relaxed mb-8">{product.description}</p>
        )}

        {product.sizes?.length > 0 && (
          <div className="mb-6">
            <p className="eyebrow text-silver-dim mb-2">Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-11 h-11 border eyebrow text-xs transition-colors ${
                    size === s ? "bg-noir text-platinum border-noir" : "border-line/40 hover:border-noir"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.colors?.length > 0 && (
          <div className="mb-8">
            <p className="eyebrow text-silver-dim mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`px-4 py-2 border eyebrow text-xs transition-colors ${
                    color === c ? "bg-noir text-platinum border-noir" : "border-line/40 hover:border-noir"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={!product.in_stock}
          className="w-full bg-noir text-platinum py-4 eyebrow hover:bg-brass hover:text-noir transition-colors disabled:opacity-40 disabled:hover:bg-noir disabled:hover:text-platinum"
        >
          {!product.in_stock ? "Sold out" : added ? "Added ✓" : "Add to bag"}
        </button>
      </div>
    </div>
  );
}
