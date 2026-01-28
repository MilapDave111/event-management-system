import { Navigate } from "react-router-dom";
import { useAuth } from "../../model/auth/auth.context";

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
