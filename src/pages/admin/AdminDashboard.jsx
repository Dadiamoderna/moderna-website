import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { fetchProducts, deleteProduct } from "../../lib/products";
import { useAuth } from "../../context/AuthContext";
import { STORE } from "../../config";
import ProductForm from "./ProductForm";

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    await deleteProduct(product.id);
    load();
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
    load();
  }

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl">{STORE.name} Admin</h1>
          <p className="text-sm text-silver-dim mt-1">{products.length} products</p>
        </div>
        <div className="flex items-center gap-3">
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

      {loading ? (
        <p className="text-silver-dim text-sm">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-silver-dim text-sm">
          No products yet. Click "Add product" to create your first listing.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left eyebrow text-silver-dim border-b border-line/30">
                <th className="py-3 pr-4">Photo</th>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Stock</th>
                <th className="py-3 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-line/15">
                  <td className="py-3 pr-4">
                    <div className="w-12 h-14 bg-graphite overflow-hidden">
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4 text-silver-dim">{p.category}</td>
                  <td className="py-3 pr-4">
                    {STORE.currency}
                    {Number(p.price).toFixed(2)}
                  </td>
                  <td className="py-3 pr-4">
                    {p.in_stock ? (
                      <span className="text-green-700">In stock</span>
                    ) : (
                      <span className="text-red-700">Sold out</span>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ProductForm product={editingProduct} onClose={closeForm} onSaved={handleSaved} />
      )}
    </div>
  );
}
