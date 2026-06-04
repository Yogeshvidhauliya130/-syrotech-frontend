// ===================== CreateTicket.jsx =====================
import { useState } from "react";

export default function CreateTicket() {
  const [form, setForm] = useState({});

  return (
    <div>
      <h2>Create Ticket</h2>
      <input placeholder="Category" />
      <input placeholder="Item No" />
      <input placeholder="Serial No" />
      <input placeholder="MAC Address" />
      <input placeholder="Customer Name" />
      <input placeholder="Contact" />
      <button>Create Ticket</button>
    </div>
  );
}
