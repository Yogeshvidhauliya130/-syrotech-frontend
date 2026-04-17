// ===================== Signup.jsx =====================
import { useState } from "react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <div>
      <h2>Signup</h2>
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <button>Send OTP</button>
      <input placeholder="Enter OTP" onChange={(e) => setOtp(e.target.value)} />
      <button>Verify & Register</button>
    </div>
  );
}