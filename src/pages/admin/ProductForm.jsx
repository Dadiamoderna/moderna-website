import { useState } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { createProduct, updateProduct, uploadProductImage } from "../../lib/products";
import { fetchInventoryItem, sizesAndColorsFromItem } from "../../lib/inventory";
import { CATEGORIES } from "../../config";

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  category: CATEGORIES[0],
  sizes: "",
  colors: "",
  images: [],
  discount_percent: 0,
  in_stock: true,
  featured: false,
};

export default function ProductForm({ product, onClose, onSaved }) {
  const isEditing = Boolean(product);
  const [form, setForm] = useState(
    product
      ? {
          ...product,
          sizes: (product.sizes || []).join(", "),
          colors: (product.colors || []).join(", "),
        }
      : emptyProduct
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lookupStatus, setLookupStatus] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleNameBlur() {
    const name = form.name?.trim();
    if (!name) return;
    setLookupStatus("Checking Stockroom…");
    const item = await fetchInventoryItem(name);
    if (!item) {
      setLookupStatus("No matching Stockroom item found — enter sizes/colors manually.");
      return;
    }
    const { sizes, colors } = sizesAndColorsFromItem(item);
    setForm((f) => ({ ...f, sizes: sizes.join(", "), colors: colors.join(", ") }));
    setLookupStatus(`Found in Stockroom — filled in ${sizes.length} size(s), ${colors.length} color(s).`);
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const urls = await Promise.all(files.map(uploadProductImage));
      setForm((f) => ({ ...f, images: [...(f.images || []), ...urls] }));
    } catch (err) {
      setError("Image upload failed. Check your Supabase storage bucket setup.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url) {
    setForm((f) => ({ ...f, images: f.images.filter((i) => i !== url) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price) || 0,
      category: form.category,
      sizes: form.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      colors: form.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      images: form.images,
      discount_percent: Math.max(0, Math.min(100, Number(form.discount_percent) || 0)),
      in_stock: form.in_stock,
      featured: form.featured,
    };
    try {
      if (isEditing) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message || "Something went wrong saving this product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-noir/60 py-8 px-4">
      <div className="bg-platinum w-full max-w-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">{isEditing ? "Edit product" : "Add product"}</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label className="block eyebrow text-silver-dim mb-2">
              Name <span className="normal-case text-silver-dim/70">(match Stockroom's code to auto-fill sizes/colors)</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              onBlur={handleNameBlur}
              className="w-full border border-line/40 px-4 py-3 bg-transparent focus:border-noir outline-none"
            />
            {lookupStatus && <p className="text-xs text-silver-dim mt-2">{lookupStatus}</p>}
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className="block eyebrow text-silver-dim mb-2">Price ({"$"})</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                className="w-full border border-line/40 px-4 py-3 bg-transparent focus:border-noir outline-none"
              />
            </div>
            <div>
              <label className="block eyebrow text-silver-dim mb-2">Discount (%)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="0"
                value={form.discount_percent || ""}
                onChange={(e) => update("discount_percent", e.target.value)}
                className="w-full border border-line/40 px-4 py-3 bg-transparent focus:border-noir outline-none"
              />
            </div>
            <div>
              <label className="block eyebrow text-silver-dim mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full border border-line/40 px-4 py-3 bg-transparent focus:border-noir outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {Number(form.discount_percent) > 0 && Number(form.price) > 0 && (
            <p className="text-xs text-silver-dim -mt-3">
              Sale price: ${(Number(form.price) * (1 - Number(form.discount_percent) / 100)).toFixed(2)}
            </p>
          )}

          <div>
            <label className="block eyebrow text-silver-dim mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="w-full border border-line/40 px-4 py-3 bg-transparent focus:border-noir outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block eyebrow text-silver-dim mb-2">Sizes (comma-separated)</label>
              <input
                placeholder="36, 37, 38, 39"
                value={form.sizes}
                onChange={(e) => update("sizes", e.target.value)}
                className="w-full border border-line/40 px-4 py-3 bg-transparent focus:border-noir outline-none"
              />
            </div>
            <div>
              <label className="block eyebrow text-silver-dim mb-2">Colors (comma-separated)</label>
              <input
                placeholder="Black, Nude"
                value={form.colors}
                onChange={(e) => update("colors", e.target.value)}
                className="w-full border border-line/40 px-4 py-3 bg-transparent focus:border-noir outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block eyebrow text-silver-dim mb-2">Photos</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {(form.images || []).map((url) => (
                <div key={url} className="relative w-20 h-24 bg-graphite overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute top-1 right-1 bg-noir/80 text-platinum p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <label className="w-20 h-24 border border-dashed border-line/50 flex flex-col items-center justify-center cursor-pointer text-silver-dim hover:border-noir">
                <Upload size={16} />
                <span className="text-[10px] mt-1">{uploading ? "…" : "Upload"}</span>
                <input type="file" accept="image/*" multiple hidden onChange={handleFiles} />
              </label>
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.in_stock}
                onChange={(e) => update("in_stock", e.target.checked)}
              />
              In stock
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => update("featured", e.target.checked)}
              />
              Feature on homepage
            </label>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-noir text-platinum py-3 eyebrow hover:bg-brass hover:text-noir transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add product"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 border border-line/40 eyebrow hover:border-noir"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
