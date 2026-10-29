import { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { fetchInventoryItem, stockForVariant } from "../lib/inventory";
import { STORE, MAX_QTY_PER_ITEM } from "../config";
import Checkout from "./Checkout";

// Live stock for every line in the bag, by line key. A line that isn't in
// Stockroom has no entry (null), so it's only held to MAX_QTY_PER_ITEM.
function useLineStock(items, enabled) {
  const [stock, setStock] = useState({});
  // Only the lines themselves matter here, not their quantities, so changing
  // a quantity doesn't trigger a refetch.
  const signature = JSON.stringify(items.map((i) => [i.key, i.name, i.size, i.color]));

  useEffect(() => {
    const lines = JSON.parse(signature);
    if (!enabled || lines.length === 0) return;
    let cancelled = false;
    const names = [...new Set(lines.map(([, name]) => name))];
    Promise.all(names.map(async (name) => [name, await fetchInventoryItem(name)])).then(
      (entries) => {
        if (cancelled) return;
        const byName = Object.fromEntries(entries);
        const next = {};
        for (const [key, name, size, color] of lines) {
          const inv = byName[name];
          next[key] = inv ? stockForVariant(inv, size, color) : null;
        }
        setStock(next);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, signature]);

  return stock;
}

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [placed, setPlaced] = useState(false);
  const lineStock = useLineStock(items, isOpen);

  const lineMax = (item) => Math.min(MAX_QTY_PER_ITEM, lineStock[item.key] ?? MAX_QTY_PER_ITEM);

  // If a line holds more than can be bought (older bag, or stock dropped),
  // bring it down to what's available.
  useEffect(() => {
    if (!isOpen) return;
    for (const item of items) {
      const max = Math.min(MAX_QTY_PER_ITEM, lineStock[item.key] ?? MAX_QTY_PER_ITEM);
      if (max >= 1 && item.quantity > max) updateQuantity(item.key, max);
    }
  }, [isOpen, items, lineStock, updateQuantity]);

  if (!isOpen) return null;

  const unavailable = items.some((i) => lineStock[i.key] === 0);

  function handlePlaced() {
    setShowCheckout(false);
    setPlaced(true);
    clearCart();
  }

  function handleCloseAfterPlaced() {
    setPlaced(false);
    setIsOpen(false);
  }

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

        {placed ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <h3 className="font-display text-2xl mb-2">Order placed!</h3>
            <p className="text-sm text-silver-dim mb-6">
              We'll call you shortly to confirm your order.
            </p>
            <button
              onClick={handleCloseAfterPlaced}
              className="bg-noir text-platinum px-6 py-3 eyebrow hover:bg-brass hover:text-noir transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
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
                              disabled={item.quantity >= lineMax(item)}
                              aria-label="Increase quantity"
                              className="disabled:opacity-30"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="font-display text-sm">
                            {STORE.currency}
                            {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        {lineStock[item.key] === 0 ? (
                          <p className="text-[11px] text-red-700 mt-1.5">
                            No longer available. Please remove it.
                          </p>
                        ) : (
                          item.quantity >= lineMax(item) && (
                            <p className="text-[11px] text-silver-dim mt-1.5">
                              {lineStock[item.key] != null && lineStock[item.key] <= MAX_QTY_PER_ITEM
                                ? "That's all we have in this size."
                                : `Maximum ${MAX_QTY_PER_ITEM} per order.`}
                            </p>
                          )
                        )}
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
                <button
                  onClick={() => setShowCheckout(true)}
                  disabled={unavailable}
                  className="block w-full text-center bg-noir text-platinum py-3 eyebrow hover:bg-brass hover:text-noir transition-colors disabled:opacity-40 disabled:hover:bg-noir disabled:hover:text-platinum"
                >
                  Checkout
                </button>
                <p className="text-[11px] text-silver-dim mt-3 text-center">
                  Pickup from KOURA or delivery — pay in cash.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {showCheckout && (
        <Checkout
          items={items}
          subtotal={subtotal}
          onClose={() => setShowCheckout(false)}
          onPlaced={handlePlaced}
        />
      )}
    </div>
  );
}
