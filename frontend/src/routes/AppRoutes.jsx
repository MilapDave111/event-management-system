import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../controller/auth/ProtectedRoute";
import RoleProtectedRoute from "../controller/auth/RoleProtectedRoute";

/* PAGES */
import AuthPage from "../view/pages/AuthPage";
import CreateEvent from "../view/pages/CreateEvent";
import ManageOrganizations from "../view/pages/ManageOrganizations";
import ManageUsers from "../view/pages/ManageUsers";
import ModerateEvents from "../view/pages/super-admin/ModerateEvents";

import ManageEvents from "../view/pages/ManageEvents";
/* DASHBOARDS */
import SuperAdmin from "../view/dashboard/SuperAdmin";
import Organization from "../view/dashboard/Organization";
import UserDashboard from "../view/dashboard/UserDashboard";

/* LAYOUT */
import MainLayout from "../view/layout/MainLayout";




const AppRoutes = () => {
  return (
    <Routes>

      <Route path="/auth" element={<AuthPage />} />

      {/* CENTRALIZED EVENT MANAGEMENT ROUTE */}
      <Route 
        path="/manage-events" 
        element={
          <ProtectedRoute>
            {/* Allow both roles to access this route */}
            <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "ORG_ADMIN"]}>
              <MainLayout>
                <ManageEvents />
              </MainLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      {/* SUPER ADMIN ROUTES */}
      <Route path="/dashboard/super-admin" element={
        <ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><SuperAdmin /></MainLayout></RoleProtectedRoute></ProtectedRoute>
      } />
      <Route path="/superadmin/organizations" element={
        <ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><ManageOrganizations /></MainLayout></RoleProtectedRoute></ProtectedRoute>
      } />
      <Route path="/superadmin/users" element={
        <ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><ManageUsers /></MainLayout></RoleProtectedRoute></ProtectedRoute>
      } />
      <Route path="/superadmin/events" element={
        <ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><ModerateEvents /></MainLayout></RoleProtectedRoute></ProtectedRoute>
      } />

      {/* ORG ADMIN ROUTES */}
      <Route path="/dashboard/org-admin" element={
        <ProtectedRoute><RoleProtectedRoute allowedRoles={["ORG_ADMIN"]}><MainLayout><Organization /></MainLayout></RoleProtectedRoute></ProtectedRoute>
      } />
      <Route path="/org/create-event" element={
        <ProtectedRoute><RoleProtectedRoute allowedRoles={["ORG_ADMIN"]}><MainLayout><CreateEvent /></MainLayout></RoleProtectedRoute></ProtectedRoute>
      } />

      {/* USER ROUTES */}
      <Route path="/dashboard/user" element={
        <ProtectedRoute><RoleProtectedRoute allowedRoles={["USER"]}><MainLayout><UserDashboard /></MainLayout></RoleProtectedRoute></ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/auth" replace />} />

    </Routes>
  );
};


export default AppRoutes;

