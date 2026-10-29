import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Admin from "./pages/admin/Admin";

// Makes the admin page installable on a phone ("Add to Home Screen") with its
// own name and icon, without changing how the public shop looks when saved.
function useAdminAppIdentity(active) {
  useEffect(() => {
    if (!active) return;
    const previousTitle = document.title;
    document.title = "Moderna Admin";

    const added = [];
    const add = (tag, attrs) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
      added.push(el);
    };
    add("link", { rel: "manifest", href: "/admin.webmanifest" });
    add("link", { rel: "apple-touch-icon", href: "/admin-icon-180.png" });
    add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    add("meta", { name: "mobile-web-app-capable", content: "yes" });
    add("meta", { name: "apple-mobile-web-app-title", content: "Moderna Admin" });
    add("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" });
    add("meta", { name: "theme-color", content: "#26221e" });

    return () => {
      document.title = previousTitle;
      added.forEach((el) => el.remove());
    };
  }, [active]);
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  useAdminAppIdentity(isAdmin);

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-platinum text-noir font-body">
        <Admin />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-platinum text-noir font-body">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
