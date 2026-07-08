import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { STORE } from "../config";
import { whatsappOrderLink } from "../lib/whatsapp";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-noir/60"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md h-full bg-platinum flex flex-col animate-fade-up">
        <div className="flex items-center justify-between px-6 h-16 border-b border-line/30">
          <h2 className="font-display text-xl">Your bag</h2>
          <button onClick={() => setIsOpen(false)} aria-label="Close cart">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-silver-dim text-sm mb-4">Your bag is empty.</p>
              <Link
                to="/shop"
                onClick={() => setIsOpen(false)}
                className="eyebrow text-brass border-b border-brass pb-1"
              >
                Browse the shop
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4">
                  <div className="w-20 h-24 bg-graphite shrink-0 overflow-hidden">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <h3 className="font-display text-sm">{item.name}</h3>
                      <button onClick={() => removeItem(item.key)} aria-label="Remove item">
                        <Trash2 size={15} className="text-silver-dim hover:text-noir" />
                      </button>
                    </div>
                    <p className="text-xs text-silver-dim mt-0.5">
                      {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ")}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border border-line/40 px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-sm w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="font-display text-sm">
                        {STORE.currency}
                        {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line/30 px-6 py-5">
            <div className="flex justify-between font-display text-lg mb-4">
              <span>Subtotal</span>
              <span>
                {STORE.currency}
                {subtotal.toFixed(2)}
              </span>
            </div>
            <a
              href={whatsappOrderLink(items, subtotal)}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-noir text-platinum py-3 eyebrow hover:bg-brass hover:text-noir transition-colors"
            >
              Order via WhatsApp
            </a>
            <p className="text-[11px] text-silver-dim mt-3 text-center">
              We'll confirm sizes, delivery & payment on WhatsApp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
