import { useAuth } from "../../context/AuthContext";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function Admin() {
  const { session, loading } = useAuth();

  if (loading) {
    return <p className="text-center py-24 text-silver-dim text-sm">Loading…</p>;
  }

  return session ? <AdminDashboard /> : <AdminLogin />;
}
