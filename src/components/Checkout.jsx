import { useRef, useState } from "react";
import { X } from "lucide-react";
import { createOrder } from "../lib/orders";
import { takeStock } from "../lib/inventory";
import { STORE } from "../config";

export default function Checkout({ items, subtotal, onClose, onPlaced }) {
  const [fulfillment, setFulfillment] = useState("pickup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // If saving the order fails after stock was already taken, a retry must not
  // take the stock a second time.
  const stockTaken = useRef(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!stockTaken.current) {
        const result = await takeStock(items);
        if (!result.ok) {
          setError(
            result.reason === "insufficient"
              ? `Sorry, ${result.detail} just sold out. Please update your bag.`
              : "We couldn't reserve your items just now. Please try again in a moment."
          );
          return;
        }
        stockTaken.current = true;
      }

      await createOrder({
        items: items.map((i) => ({
          name: i.name,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          price: i.price,
        })),
        subtotal,
        fulfillment,
        customerName: name,
        phone,
        address: fulfillment === "delivery" ? address : "",
      });

      onPlaced();
    } catch (err) {
      setError(err.message || "Something went wrong placing this order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-noir/60 py-8 px-4">
      <div className="bg-platinum w-full max-w-md p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">Checkout</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <p className="eyebrow text-silver-dim mb-2">Get it by</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFulfillment("pickup")}
                className={`border px-3 py-3 text-sm transition-colors ${
                  fulfillment === "pickup"
                    ? "border-noir bg-noir text-platinum"
                    : "border-line/40 hover:border-noir"
                }`}
              >
                Pickup — KOURA
              </button>
              <button
                type="button"
                onClick={() => setFulfillment("delivery")}
                className={`border px-3 py-3 text-sm transition-colors ${
                  fulfillment === "delivery"
                    ? "border-noir bg-noir text-platinum"
                    : "border-line/40 hover:border-noir"
                }`}
              >
                Delivery
              </button>
            </div>
          </div>

          <div>
            <label className="block eyebrow text-silver-dim mb-2">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-line/40 px-4 py-3 bg-transparent focus:border-noir outline-none"
            />
          </div>

          <div>
            <label className="block eyebrow text-silver-dim mb-2">Phone</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-line/40 px-4 py-3 bg-transparent focus:border-noir outline-none"
            />
          </div>

          {fulfillment === "delivery" && (
            <div>
              <label className="block eyebrow text-silver-dim mb-2">Delivery address</label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full border border-line/40 px-4 py-3 bg-transparent focus:border-noir outline-none"
              />
              <p className="text-[11px] text-silver-dim mt-2">
                Delivery fee isn't shown here — we'll confirm it with you by phone.
              </p>
            </div>
          )}

          <div className="border-t border-line/20 pt-4">
            <div className="flex justify-between font-display text-lg mb-1">
              <span>Total</span>
              <span>
                {STORE.currency}
                {subtotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-silver-dim">
              {fulfillment === "pickup" ? "Pay in cash on pickup." : "Pay in cash on delivery."}
            </p>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-noir text-platinum py-3 eyebrow hover:bg-brass hover:text-noir transition-colors disabled:opacity-50"
          >
            {saving ? "Placing order…" : "Place order"}
          </button>
        </form>
      </div>
    </div>
  );
}
