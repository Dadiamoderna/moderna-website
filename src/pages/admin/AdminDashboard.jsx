import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, LogOut, Search } from "lucide-react";
import { fetchProducts, deleteProduct } from "../../lib/products";
import { fetchOrders } from "../../lib/orders";
import { fetchStockTotals } from "../../lib/inventory";
import { hasInventoryLink } from "../../lib/inventoryClient";
import { useAuth } from "../../context/AuthContext";
import { STORE } from "../../config";
import ProductForm from "./ProductForm";
import OrdersList from "./OrdersList";

function productTags(p) {
  const tags = [];
  if (Number(p.discount_percent) > 0) tags.push(`-${p.discount_percent}%`);
  if (p.new_collection) tags.push("New");
  if (p.twenty_dollar) tags.push("$20");
  if (p.last_pairs) tags.push("Last pairs");
  return tags;
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function loadProducts() {
    setLoading(true);
    fetchProducts()
      .then((list) => {
        setProducts(list);
        return fetchStockTotals(list.map((p) => p.name));
      })
      .then(setStock)
      .finally(() => setLoading(false));
  }

  function loadOrders() {
    fetchOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }

  useEffect(() => {
    loadProducts();
    loadOrders();

    // Keep orders fresh without reloading: every minute, and whenever the app
    // comes back to the front on a phone.
    const refresh = () => {
      if (!document.hidden) loadOrders();
    };
    const timer = setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    await deleteProduct(product.id);
    loadProducts();
  }

  function openAdd() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  function handleSaved() {
    closeForm();
    loadProducts();
  }

  const newOrders = orders.filter((o) => o.status === "new").length;

  useEffect(() => {
    document.title = newOrders > 0 ? `(${newOrders}) Moderna Admin` : "Moderna Admin";
  }, [newOrders]);

  const needle = query.trim().toLowerCase();
  const visibleProducts = needle
    ? products.filter((p) => p.name.toLowerCase().includes(needle))
    : products;

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl">{STORE.name} Admin</h1>
          <p className="text-sm text-silver-dim mt-1">
            {products.length} products · {newOrders} new {newOrders === 1 ? "order" : "orders"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="eyebrow text-silver-dim hover:text-noir px-2 transition-colors"
          >
            View site
          </Link>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-noir text-platinum px-5 py-3 eyebrow hover:bg-brass hover:text-noir transition-colors"
          >
            <Plus size={16} /> Add product
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-2 border border-line/40 px-4 py-3 eyebrow hover:border-noir"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-line/30">
        <button
          onClick={() => setTab("products")}
          className={`eyebrow px-4 py-3 border-b-2 -mb-px ${
            tab === "products" ? "border-noir" : "border-transparent text-silver-dim"
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`eyebrow px-4 py-3 border-b-2 -mb-px flex items-center gap-2 ${
            tab === "orders" ? "border-noir" : "border-transparent text-silver-dim"
          }`}
        >
          Orders
          {newOrders > 0 && (
            <span className="bg-brass text-noir text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
              {newOrders}
            </span>
          )}
        </button>
      </div>

      {tab === "orders" ? (
        <OrdersList orders={orders} onChange={loadOrders} />
      ) : loading ? (
        <p className="text-silver-dim text-sm">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-silver-dim text-sm">
          No products yet. Click "Add product" to create your first listing.
        </p>
      ) : (
        <>
          <div className="relative max-w-xs mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="w-full border border-line/40 pl-9 pr-3 py-2 text-sm bg-transparent focus:border-noir outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left eyebrow text-silver-dim border-b border-line/30">
                  <th className="py-3 pr-4">Photo</th>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4 hidden sm:table-cell">Category</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Stock</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((p) => {
                  const linked = Object.prototype.hasOwnProperty.call(stock, p.name);
                  const qty = stock[p.name];
                  const tags = productTags(p);
                  return (
                    <tr key={p.id} className="border-b border-line/15">
                      <td className="py-3 pr-4">
                        <div className="w-12 h-14 bg-graphite overflow-hidden">
                          {p.images?.[0] && (
                            <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-medium">{p.name}</span>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tags.map((t) => (
                              <span key={t} className="eyebrow text-[9px] bg-graphite px-1.5 py-0.5">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-silver-dim hidden sm:table-cell">{p.category}</td>
                      <td className="py-3 pr-4">
                        {STORE.currency}
                        {Number(p.price).toFixed(2)}
                      </td>
                      <td className="py-3 pr-4">
                        {linked ? (
                          qty > 0 ? (
                            <span className="text-green-700">{qty} in stock</span>
                          ) : (
                            <span className="text-red-700">Sold out</span>
                          )
                        ) : (
                          <>
                            {p.in_stock ? (
                              <span className="text-green-700">In stock</span>
                            ) : (
                              <span className="text-red-700">Sold out</span>
                            )}
                            {hasInventoryLink && (
                              <span className="block text-[10px] text-silver-dim">
                                Not in Stockroom — check the name
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-3 justify-end">
                          <button onClick={() => openEdit(p)} aria-label="Edit">
                            <Pencil size={16} className="text-silver-dim hover:text-noir" />
                          </button>
                          <button onClick={() => handleDelete(p)} aria-label="Delete">
                            <Trash2 size={16} className="text-silver-dim hover:text-red-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleProducts.length === 0 && (
              <p className="text-silver-dim text-sm py-6">No products match "{query}".</p>
            )}
          </div>
        </>
      )}

      {showForm && (
        <ProductForm product={editingProduct} onClose={closeForm} onSaved={handleSaved} />
      )}
    </div>
  );
}
