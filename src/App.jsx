import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import SupportDashboard from "./pages/SupportDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import HR from "./pages/hr";
import HrAdmin from "./pages/hrAdmin";
import ProtectedRoute from "./components/ProtectedRoute";
import LockinSupport from "./pages/lockinsupport";
import Feedback from "./pages/Feedback";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/dashboard" element={
          <ProtectedRoute role="user"><Dashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><Admin /></ProtectedRoute>
        } />
        <Route path="/support" element={
          <ProtectedRoute role="support"><SupportDashboard /></ProtectedRoute>
        } />
        <Route path="/lockinsupport" element={
  <ProtectedRoute role="support"><LockinSupport /></ProtectedRoute>
} />
        <Route path="/customer" element={
          <ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>
        } />
        <Route path="/hr" element={
          <ProtectedRoute role="hr"><HR /></ProtectedRoute>
        } />
        <Route path="/hrAdmin" element={
          <ProtectedRoute role="hradmin"><HrAdmin /></ProtectedRoute>
        } />
        <Route path="/lockinsupport" element={
          <ProtectedRoute role="support"><LockinSupport /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;