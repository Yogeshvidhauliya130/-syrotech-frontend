import { useNavigate } from "react-router-dom";

export default function CustomerDashboard() {
  const navigate    = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f0f4f8",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "DM Sans, sans-serif"
    }}>
      <div style={{
        background: "white", borderRadius: 20, padding: "48px 40px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center", maxWidth: 480
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>👥</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#374151", marginBottom: 8 }}>
          Customer Portal
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
          Welcome, <strong>{currentUser?.name}</strong>
        </p>
        {currentUser?.companyName && (
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>
            🏢 {currentUser.companyName}
          </p>
        )}
        <div style={{
          background: "#f5f3ff", border: "1px solid #c4b5fd",
          borderRadius: 12, padding: "16px 20px", marginBottom: 28
        }}>
          <p style={{ fontSize: 13, color: "#5b21b6", fontWeight: 600 }}>
            🚧 Customer dashboard is coming soon.
          </p>
          <p style={{ fontSize: 12, color: "#7c3aed", marginTop: 6 }}>
            Your support tickets and complaint history will appear here.
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "#f3f4f6", border: "1px solid #d1d5db",
            borderRadius: 10, padding: "10px 24px",
            fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer"
          }}>
          ← Logout
        </button>
      </div>
    </div>
  );
}