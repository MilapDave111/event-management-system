import { Navigate } from "react-router-dom";
import { useAuth } from "../../model/auth/auth.context";

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Force both to uppercase to prevent "event_staff" !== "EVENT_STAFF" errors
  const userRole = user?.role?.toUpperCase();
  const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());

  if (!normalizedAllowedRoles.includes(userRole)) {
    console.error(`Access Denied. User role: ${userRole}. Required: ${normalizedAllowedRoles}`);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleProtectedRoute;