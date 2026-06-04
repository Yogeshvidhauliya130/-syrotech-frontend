import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const BASE_URL = "https://api.syrotech.com";

export default function Feedback() {
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get("ticket");
  const token = searchParams.get("token");

  const [ticket, setTicket]       = useState(null);
  const [selected, setSelected]   = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (!ticketId) { setError("Invalid feedback link."); setLoading(false); return; }
   fetch(`${BASE_URL}/api/feedback/${ticketId}?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        if (data.feedbackRating) { setSubmitted(true); setSelected(data.feedbackRating); }
        setTicket(data);
        setLoading(false);
      })
      .catch(() => { setError("Something went wrong."); setLoading(false); });
  }, [ticketId]);

  const handleSubmit = () => {
    if (!selected) { alert("Please select a star rating."); return; }
    
    setSaving(true);
    fetch(`${BASE_URL}/api/feedback/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackRating: selected, token }),
    })
      .then(r => r.json())
      .then(() => { setSubmitted(true); setSaving(false); })
      .catch(() => { alert("Failed to save. Please try again."); setSaving(false); });
  };

  if (loading) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <img src="/logo.png" alt="Syrotech" style={{ width: 60, height: 60, objectFit: "contain" }} />
        </div>
        <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center" }}>Loading...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <img src="/logo.png" alt="Syrotech" style={{ width: 60, height: 60, objectFit: "contain" }} />
        </div>
        <p style={{ color: "#ef4444", fontSize: 14, textAlign: "center" }}>{error}</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <img src="/logo.png" alt="Syrotech" style={{ width: 60, height: 60, objectFit: "contain" }} />
        </div>
        <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🎉</div>
        <h2 style={styles.title}>Thank You!</h2>
        <p style={styles.sub}>Your feedback has been recorded.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, margin: "16px 0" }}>
          {[1,2,3,4,5].map(star => (
            <span key={star} style={{ fontSize: 32, color: star <= selected ? "#f59e0b" : "#d1d5db" }}>★</span>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center" }}>
          You rated us <strong>{selected}/5</strong> stars
        </p>
        <div style={styles.footer}>
          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 }}>
            Syrotech Networks · support@syrotech.com
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logo}>
          <img src="/logo.png" alt="Syrotech" style={{ width: 60, height: 60, objectFit: "contain" }} />
        </div>

        {/* Brand */}
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", textAlign: "center", margin: "0 0 4px" }}>
          Syrotech Networks
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", margin: "0 0 20px" }}>
          Support Feedback
        </p>

        {/* Ticket Info */}
        <div style={styles.ticketBox}>
          <div style={styles.ticketRow}>
            <span style={styles.ticketLabel}>Customer</span>
            <span style={styles.ticketValue}>{ticket?.customer || "—"}</span>
          </div>
          <div style={styles.ticketRow}>
            <span style={styles.ticketLabel}>Product</span>
            <span style={styles.ticketValue}>{ticket?.category || "—"}</span>
          </div>
          <div style={styles.ticketRow}>
            <span style={styles.ticketLabel}>Ticket No</span>
            <span style={styles.ticketValue}>#{ticket?.ticketNumber || "—"}</span>
          </div>
        </div>

        {/* Question */}
        <h2 style={styles.question}>How was your experience?</h2>
        <p style={styles.sub}>Tap a star to rate our support</p>

        {/* Stars */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "20px 0" }}>
          {[1,2,3,4,5].map(star => (
            <span
              key={star}
              onClick={() => setSelected(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              style={{
                fontSize: 44,
                cursor: "pointer",
                color: star <= (hovered || selected) ? "#f59e0b" : "#d1d5db",
                transition: "color 0.15s, transform 0.15s",
                transform: star <= (hovered || selected) ? "scale(1.2)" : "scale(1)",
                display: "inline-block",
                userSelect: "none",
              }}
            >★</span>
          ))}
        </div>

        {/* Star Label */}
        {(hovered || selected) > 0 && (
          <p style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>
            {["","😞 Poor","😐 Fair","🙂 Good","😊 Very Good","🤩 Excellent!"][(hovered || selected)]}
          </p>
        )}


       

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selected || saving}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 12,
            border: "none",
            background: selected ? "linear-gradient(135deg, #ff5a00, #c94500)" : "#e5e7eb",
            color: selected ? "white" : "#9ca3af",
            fontSize: 15,
            fontWeight: 700,
            cursor: selected ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            marginTop: 8,
            transition: "all 0.2s",
          }}
        >
          {saving ? "⏳ Saving..." : "Submit Feedback"}
        </button>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 }}>
            Syrotech Networks · support@syrotech.com · www.syrotech.com
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f4f8 0%, #e8f0fe 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "DM Sans, sans-serif",
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: "32px 28px",
    maxWidth: 420,
    width: "100%",
    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
    border: "1px solid #e5e7eb",
  },
  logo: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#1a1a1a",
    textAlign: "center",
    margin: "0 0 8px",
  },
  question: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1a1a1a",
    textAlign: "center",
    margin: "20px 0 4px",
  },
  sub: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    margin: 0,
  },
  ticketBox: {
    background: "#f9fafb",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 8,
  },
  ticketRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ticketLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  ticketValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTop: "1px solid #f3f4f6",
  },
};