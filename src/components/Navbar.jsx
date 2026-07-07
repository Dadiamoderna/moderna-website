import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { STORE, CATEGORIES } from "../config";

export default function Navbar() {
  const { count, setIsOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-noir/95 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-7xl px-5 md:px-8 h-16 flex items-center justify-between">
        <button
          className="md:hidden text-platinum"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link
          to="/"
          className="font-display text-2xl tracking-wide text-platinum select-none"
        >
          {STORE.name}
        </Link>

        <nav className="hidden md:flex items-center gap-8 eyebrow text-silver">
          {CATEGORIES.map((c) => (
            <NavLink
              key={c}
              to={`/shop?category=${encodeURIComponent(c)}`}
              className="hover:text-brass-light transition-colors"
            >
              {c}
            </NavLink>
          ))}
        </nav>

        <button
          className="relative text-platinum"
          onClick={() => setIsOpen(true)}
          aria-label="Open cart"
        >
          <ShoppingBag size={22} />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-brass text-noir text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-line px-5 py-4 flex flex-col gap-4 eyebrow text-silver">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to={`/shop?category=${encodeURIComponent(c)}`}
              onClick={() => setMenuOpen(false)}
              className="hover:text-brass-light"
            >
              {c}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
