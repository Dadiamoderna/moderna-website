import { useState } from "react";
import { Trash2 } from "lucide-react";
import { updateOrderStatus, deleteOrder } from "../../lib/orders";
import { STORE } from "../../config";

const TABS = [
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

// The one button that moves an order forward.
const NEXT_STEP = {
  new: { status: "confirmed", label: "Confirm order" },
  confirmed: { status: "fulfilled", label: "Mark fulfilled" },
};

const BADGE = {
  new: "bg-brass text-noir",
  confirmed: "bg-noir text-platinum",
  fulfilled: "bg-green-700 text-platinum",
  cancelled: "bg-silver-dim text-platinum",
};

export default function OrdersList({ orders, onChange }) {
  const [filter, setFilter] = useState("new");
  const [busyId, setBusyId] = useState(null);

  const counts = { all: orders.length };
  for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  async function setStatus(order, status) {
    setBusyId(order.id);
    try {
      await updateOrderStatus(order.id, status);
      onChange();
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(order) {
    if (
      !confirm(
        `Cancel the order from ${order.customer_name || "this customer"}?\n\nThe shoes are NOT added back to Stockroom automatically — add them back there if they're returning to the shelf.`
      )
    )
      return;
    await setStatus(order, "cancelled");
  }

  async function handleDelete(order) {
    if (!confirm(`Delete this order from ${order.customer_name || "customer"}? This can't be undone.`))
      return;
    await deleteOrder(order.id);
    onChange();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`eyebrow pb-1 border-b transition-colors ${
              filter === t.value
                ? "border-noir text-noir"
                : "border-transparent text-silver-dim hover:text-noir"
            }`}
          >
            {t.label} ({counts[t.value] || 0})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-silver-dim text-sm">
          {orders.length === 0 ? "No orders yet." : "No orders in this tab."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((order) => {
            const next = NEXT_STEP[order.status];
            const busy = busyId === order.id;
            return (
              <div key={order.id} className="border border-line/30 p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-display text-lg">{order.customer_name || "—"}</p>
                      <span className={`eyebrow text-[10px] px-2 py-1 ${BADGE[order.status] || ""}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      <a href={`tel:${order.phone}`} className="underline">
                        {order.phone}
                      </a>
                    </p>
                    <p className="text-xs text-silver-dim mt-0.5">
                      {order.fulfillment === "delivery"
                        ? `Delivery — ${order.address}`
                        : "Pickup — KOURA"}
                    </p>
                    <p className="text-xs text-silver-dim mt-0.5">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(order)} aria-label="Delete order">
                    <Trash2 size={16} className="text-silver-dim hover:text-red-700" />
                  </button>
                </div>

                <ul className="text-sm mb-3">
                  {(order.items || []).map((item, i) => {
                    const variant = [item.size && `Size ${item.size}`, item.color]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <li key={i} className="flex justify-between">
                        <span>
                          {item.name}
                          {variant ? ` (${variant})` : ""} × {item.quantity}
                        </span>
                        <span>
                          {STORE.currency}
                          {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex items-center justify-between border-t border-line/20 pt-3">
                  <div className="text-sm">
                    <span className="font-display">
                      {STORE.currency}
                      {Number(order.subtotal).toFixed(2)}
                    </span>
                    <span className="text-silver-dim">
                      {" "}
                      · Cash on {order.fulfillment === "delivery" ? "delivery" : "pickup"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(order.status === "new" || order.status === "confirmed") && (
                      <button
                        disabled={busy}
                        onClick={() => handleCancel(order)}
                        className="border border-line/40 px-4 py-2 eyebrow hover:border-noir disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                    {next && (
                      <button
                        disabled={busy}
                        onClick={() => setStatus(order, next.status)}
                        className="bg-noir text-platinum px-4 py-2 eyebrow hover:bg-brass hover:text-noir transition-colors disabled:opacity-50"
                      >
                        {next.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
