import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {

  // ✅ Read from localStorage — survives refresh
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const token       = localStorage.getItem("token");

  // ❌ Not logged in at all
  if (!currentUser || !token) {
    return <Navigate to="/" replace />;
  }

  // ❌ Check token expiry (JWT has exp field)
  try {
    const payload    = JSON.parse(atob(token.split(".")[1]));
    const expireTime = payload.exp * 1000; // convert to ms
    if (Date.now() > expireTime) {
      // Token expired — clear and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      return <Navigate to="/" replace />;
    }
  } catch {
    // Invalid token — clear and redirect
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    return <Navigate to="/" replace />;
  }

  // ❌ Role mismatch — user trying to access admin/support page
  if (role && currentUser.role !== role) {
    // Redirect to their correct page, not login
    if (currentUser.role === "admin")        return <Navigate to="/admin"     replace />;
    if (currentUser.role === "support")      return <Navigate to="/support"   replace />;
    if (currentUser.role === "user")         return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // ✅ Allowed
  return children;
}