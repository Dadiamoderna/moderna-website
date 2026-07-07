import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../lib/products";
import ProductCard from "../components/ProductCard";
import { STORE } from "../config";

const MATERIALS = [
  "Full-Grain Leather",
  "Hand-Finished",
  "Made in Lebanon",
  "Limited Runs",
  "Considered Design",
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((data) => setFeatured(data.filter((p) => p.featured).slice(0, 6) || data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-noir text-platinum overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-24 md:py-36 grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-up">
            <p className="eyebrow text-brass-light mb-5">Women's Footwear · Koura, Lebanon</p>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] text-balance">
              Shoes built for the walk,
              <br />
              <em className="italic font-normal text-brass-light">not just the photo.</em>
            </h1>
            <p className="mt-6 text-silver max-w-md leading-relaxed">{STORE.tagline}</p>
            <Link
              to="/shop"
              className="inline-block mt-8 bg-platinum text-noir px-7 py-3 eyebrow hover:bg-brass transition-colors"
            >
              Shop the collection
            </Link>
          </div>
          <div className="aspect-[4/5] bg-graphite hidden md:block" />
        </div>

        {/* Signature marquee strip */}
        <div className="border-t border-line overflow-hidden py-4">
          <div className="flex w-max animate-marquee">
            {[...MATERIALS, ...MATERIALS, ...MATERIALS].map((m, i) => (
              <span key={i} className="eyebrow text-silver-dim px-6 whitespace-nowrap">
                {m} —
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl">New arrivals</h2>
          <Link to="/shop" className="eyebrow text-brass border-b border-brass pb-0.5">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-silver-dim text-sm">Loading…</p>
        ) : featured.length === 0 ? (
          <p className="text-silver-dim text-sm">
            No products yet — add your first one from the{" "}
            <Link to="/admin" className="underline">
              admin page
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
