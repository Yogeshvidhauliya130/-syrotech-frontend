import { useEffect, useState } from "react";
import "./Dashboard.css";

const BASE_URL = "http://localhost:3001";

export default function UserDashboard({ userEmail }) {
  const [tickets, setTickets] = useState([]);

  const fetchTickets = () => {
    fetch(`${BASE_URL}/tickets`)
      .then(r => r.json())
      .then(data => {
        const myTickets = data.filter(t => t.raisedBy === userEmail);
        setTickets(myTickets);
      })
      .catch(err => console.error("Failed to load tickets:", err));
  };

  useEffect(() => {
    fetchTickets();
    const id = setInterval(fetchTickets, 10000);
    return () => clearInterval(id);
  }, [userEmail]);

  const markCompleted = (id) => {
    fetch(`${BASE_URL}/tickets/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "resolved" }),
    })
      .then(r => r.json())
      .then(() => fetchTickets())
      .catch(err => console.error("Failed to update ticket:", err));
  };

  return (
    <div className="dashboard-container">
      <div className="form-card" style={{ width: "600px" }}>
        <h2>Your Tickets</h2>
        {tickets.length === 0 && <p>No tickets found.</p>}

        {tickets.map(t => (
          <div key={t.id} className="ticket-card">
            <p><strong>Product:</strong>      {t.category}</p>
            <p><strong>Description:</strong>  {t.description}</p>
            <p><strong>Status:</strong>       {t.status}</p>

            {t.status !== "resolved" && (
              <button
                onClick={() => markCompleted(t.id)}
                style={{
                  marginTop:    "8px",
                  background:   "#ff5a00",
                  color:        "#fff",
                  padding:      "6px 12px",
                  border:       "none",
                  borderRadius: "6px",
                  cursor:       "pointer"
                }}
              >
                Mark as Completed
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}