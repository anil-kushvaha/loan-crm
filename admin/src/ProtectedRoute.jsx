import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === "customer") {
      return <Navigate to="/customer/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;