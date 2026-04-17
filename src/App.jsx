// This is already perfect — no changes needed
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import SupportDashboard from "./pages/SupportDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute role="user"><Dashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><Admin /></ProtectedRoute>
        } />
        <Route path="/support" element={
          <ProtectedRoute role="support"><SupportDashboard /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;