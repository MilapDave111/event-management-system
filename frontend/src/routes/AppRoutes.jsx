import { Routes, Route, Navigate } from "react-router-dom";

/* ===== AUTH & GUARDS ===== */
import ProtectedRoute from "../controller/auth/ProtectedRoute";
import RoleProtectedRoute from "../controller/auth/RoleProtectedRoute";

/* ===== AUTH PAGES ===== */
import AuthPage from "../view/pages/AuthPage";
import VerifyEmail from "../view/pages/VerifyEmail";
import Unauthorized from "../view/pages/Unauthorized";

/* ===== DASHBOARDS (VIEW/DASHBOARD) ===== */
import UserDashboard from "../view/dashboard/UserDashboard";
import SuperAdmin from "../view/dashboard/SuperAdmin";
import Organization from "../view/dashboard/Organization";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ---------- USER DASHBOARD ---------- */}
      <Route
        path="/dashboard/user"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={["USER"]}>
              <UserDashboard />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      {/* ---------- ORG ADMIN DASHBOARD ---------- */}
      <Route
        path="/dashboard/org-admin"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={["ORG_ADMIN"]}>
              <Organization />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      {/* ---------- SUPER ADMIN DASHBOARD ---------- */}
      <Route
        path="/dashboard/super-admin"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
              <SuperAdmin />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      {/* ---------- DEFAULT ---------- */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

export default AppRoutes;
