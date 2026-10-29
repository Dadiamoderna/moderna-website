import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { fetchProduct } from "../lib/products";
import { fetchInventoryItem, stockForVariant, stockForSize } from "../lib/inventory";
import { discountedPrice, hasDiscount } from "../lib/pricing";
import { useCart } from "../context/CartContext";
import { STORE, MAX_QTY_PER_ITEM } from "../config";

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem, items } = useCart();
  const [product, setProduct] = useState(null);
  const [inventoryItem, setInventoryItem] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchProduct(id)
      .then((p) => {
        setProduct(p);
        setSize(p.sizes?.[0] ?? "");
        setColor(p.colors?.[0] ?? "");
        return fetchInventoryItem(p.name);
      })
      .then(setInventoryItem)
      .finally(() => setLoading(false));
  }, [id]);

  // When the product's name links to a Stockroom item, the real quantity
  // for the selected size/color decides sold-out state; otherwise fall
  // back to the manual toggle.
  const variantStock = inventoryItem ? stockForVariant(inventoryItem, size, color) : null;
  const inStock = inventoryItem ? variantStock > 0 : product?.in_stock;

  // How many more of this size/color can be added: its stock (when linked to
  // Stockroom), at most MAX_QTY_PER_ITEM, minus what's already in the bag.
  const lineKey = `${product?.id}__${size ?? ""}__${color ?? ""}`;
  const inBag = items.find((i) => i.key === lineKey)?.quantity ?? 0;
  const cap = Math.min(MAX_QTY_PER_ITEM, variantStock ?? MAX_QTY_PER_ITEM);
  const remaining = Math.max(0, cap - inBag);

  useEffect(() => {
    setQty(1);
  }, [size, color]);

  useEffect(() => {
    setQty((q) => Math.min(Math.max(1, q), Math.max(1, remaining)));
  }, [remaining]);

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
    addItem(
      { ...product, price: discountedPrice(product) },
      { size, color, quantity: Math.min(qty, remaining), max: cap }
    );
    setQty(1);
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
        <p className="font-display text-xl text-brass mb-6 flex items-center gap-3">
          {hasDiscount(product) && (
            <span className="text-base text-silver-dim line-through">
              {STORE.currency}
              {Number(product.price).toFixed(2)}
            </span>
          )}
          <span>
            {STORE.currency}
            {discountedPrice(product).toFixed(2)}
          </span>
          {hasDiscount(product) && (
            <span className="eyebrow bg-brass text-noir px-2 py-1 text-[10px]">
              -{product.discount_percent}%
            </span>
          )}
        </p>
        {product.description && (
          <p className="text-sm text-noir/80 leading-relaxed mb-8">{product.description}</p>
        )}

        {product.sizes?.length > 0 && (
          <div className="mb-6">
            <p className="eyebrow text-silver-dim mb-2">Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const sizeOut = inventoryItem && stockForSize(inventoryItem, s) <= 0;
                return (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    disabled={sizeOut}
                    className={`w-11 h-11 border eyebrow text-xs transition-colors ${
                      size === s ? "bg-noir text-platinum border-noir" : "border-line/40 hover:border-noir"
                    } ${sizeOut ? "opacity-30 line-through hover:border-line/40" : ""}`}
                  >
                    {s}
                  </button>
                );
              })}
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

        {inventoryItem && variantStock <= 0 && (
          <p className="text-xs text-silver-dim mb-3">Out of stock in this size/color</p>
        )}

        {inStock && remaining > 0 && (
          <div className="mb-5">
            <p className="eyebrow text-silver-dim mb-2">Quantity</p>
            <div className="inline-flex items-center border border-line/40">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
                className="w-11 h-11 flex items-center justify-center disabled:opacity-30"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(remaining, q + 1))}
                disabled={qty >= remaining}
                aria-label="Increase quantity"
                className="w-11 h-11 flex items-center justify-center disabled:opacity-30"
              >
                <Plus size={14} />
              </button>
            </div>
            {qty >= remaining && (inBag > 0 || remaining > 1) && (
              <p className="text-xs text-silver-dim mt-2">
                {cap < MAX_QTY_PER_ITEM || variantStock === MAX_QTY_PER_ITEM
                  ? inBag > 0
                    ? "That's all we have in this size. Some are already in your bag."
                    : "That's all we have in this size."
                  : `Maximum ${MAX_QTY_PER_ITEM} per order.`}
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={!inStock || remaining <= 0}
          className="w-full bg-noir text-platinum py-4 eyebrow hover:bg-brass hover:text-noir transition-colors disabled:opacity-40 disabled:hover:bg-noir disabled:hover:text-platinum"
        >
          {!inStock
            ? "Sold out"
            : remaining <= 0
              ? "All available are in your bag"
              : added
                ? "Added ✓"
                : "Add to bag"}
        </button>
      </div>
    </div>
  );
}
