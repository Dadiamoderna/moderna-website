import { Link } from "react-router-dom";
import { STORE } from "../config";
import { discountedPrice, hasDiscount } from "../lib/pricing";

export default function ProductCard({ product }) {
  const onSale = hasDiscount(product);

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="aspect-[3/4] bg-graphite overflow-hidden relative">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-silver-dim text-sm">
            No photo yet
          </div>
        )}
        {!product.in_stock && (
          <span className="absolute top-3 left-3 eyebrow bg-noir/80 text-silver px-2 py-1">
            Sold out
          </span>
        )}
        {product.in_stock && onSale && (
          <span className="absolute top-3 left-3 eyebrow bg-brass text-noir px-2 py-1">
            -{product.discount_percent}%
          </span>
        )}
      </div>
      <div className="pt-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base text-noir">{product.name}</h3>
          <p className="eyebrow text-silver-dim mt-1.5">{product.category}</p>
        </div>
        <p className="font-display text-base text-noir shrink-0 text-right">
          {onSale && (
            <span className="block text-xs text-silver-dim line-through">
              {STORE.currency}
              {Number(product.price).toFixed(2)}
            </span>
          )}
          {STORE.currency}
          {discountedPrice(product).toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
