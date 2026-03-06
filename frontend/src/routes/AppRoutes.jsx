import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../controller/auth/ProtectedRoute";
import RoleProtectedRoute from "../controller/auth/RoleProtectedRoute";
import Unauthorized from "../view/pages/Unauthorized";

import PlatformGovernance from "../view/pages/super-admin/PlatformGovernance";
import PlatformSettings from "../view/pages/super-admin/PlatformSettings";
import ActivityLogs from "../view/pages/ActivityLogs";

/* PAGES */
import AuthPage from "../view/pages/AuthPage";
import CreateEvent from "../view/pages/CreateEvent";
import ManageOrganizations from "../view/pages/super-admin/ManageOrganizations";
import ManageUsers from "../view/pages/super-admin/ManageUsers";
import ModerateEvents from "../view/pages/super-admin/ModerateEvents";
import ManageEvents from "../view/pages/super-admin/ManageEvents";
import MemberRoleHub from "../view/pages/org-admin/roleAssignManagement/MemberRoleHub";
import ManagerEventHub from "../view/pages/eventManager/ManagerEventHub";
/* NEW MANAGER PAGES */
import TaskManagerHub from "../view/pages/TaskManagerHub";
import ManageStaff from "../view/pages/eventManager/ManageStaff";

/* DASHBOARDS */
import SuperAdmin from "../view/dashboard/SuperAdmin";
import Organization from "../view/dashboard/Organization";
import UserDashboard from "../view/dashboard/UserDashboard";
import EventManagerDashboard from "../view/dashboard/EventManagerDashboard";
import EventStaffDashboard from "../view/dashboard/EventStaffDashboard";
import MainLayout from "../view/layout/MainLayout";
import StaffEventHub from "../view/pages/eventStaff/StaffEventHub";
import StaffRegistrationsTab from "../view/pages/eventStaff/tabs/StaffRegistrationsTab";
import Profile from '../view/pages/profile'; 

import VerifyEmail from "../view/pages/VerifyEmail";
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth" element={<AuthPage />} />
<Route path="/unauthorized" element={<Unauthorized />} />
      {/* SUPER ADMIN ROUTES */}
      <Route path="/dashboard/super-admin" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><SuperAdmin /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/superadmin/organizations" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><ManageOrganizations /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/superadmin/users" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><ManageUsers /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/superadmin/events" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><ModerateEvents /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
      {/* --- START OF MILAP'S CODE --- */}
{/* Super Admin System Governance Routes */}
<Route path="/superadmin/governance" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><PlatformGovernance /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
<Route path="/superadmin/settings" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><PlatformSettings /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
<Route path="/admin/logs" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}><MainLayout><ActivityLogs /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
{/* --- END OF MILAP'S CODE --- */}
      {/* CENTRALIZED EVENT MANAGEMENT ROUTE */}
      <Route path="/manage-events" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "ORG_ADMIN"]}><MainLayout><ManageEvents /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />

      {/* ORG ADMIN ROUTES */}
      <Route path="/dashboard/org-admin" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["ORG_ADMIN"]}><MainLayout><Organization /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/org/create-event" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["ORG_ADMIN"]}><MainLayout><CreateEvent /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/org/manage-members" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["ORG_ADMIN"]}><MainLayout><MemberRoleHub /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />

      {/* EVENT MANAGER ROUTES (DUAL ACCESS) */}
      <Route path="/dashboard/event-manager" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["EVENT_MANAGER", "ORG_ADMIN"]}><MainLayout><EventManagerDashboard /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/manager/tasks" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["EVENT_MANAGER", "ORG_ADMIN"]}><MainLayout><TaskManagerHub /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="/manager/manage-staff" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={["EVENT_MANAGER", "ORG_ADMIN"]}><MainLayout><ManageStaff /></MainLayout></RoleProtectedRoute></ProtectedRoute>} />
<Route path="/manager/event-hub" element={
  <ProtectedRoute>
    <RoleProtectedRoute allowedRoles={["EVENT_MANAGER", "ORG_ADMIN"]}>
      <MainLayout><ManagerEventHub /></MainLayout>
    </RoleProtectedRoute>
  </ProtectedRoute>
} />
      {/* EVENT STAFF & USER ROUTES */}
    {/* EVENT STAFF & USER ROUTES */}
      <Route 
        path="/dashboard/user" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={["USER"]}>
              <MainLayout><UserDashboard /></MainLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/staff/event-hub" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={["EVENT_STAFF"]}>
              <MainLayout><StaffEventHub /></MainLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/dashboard/event-staff" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={["EVENT_STAFF"]}>
              <MainLayout><EventStaffDashboard /></MainLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />
      {/* Add this inside the <Routes> block in AppRoutes.jsx */}
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <MainLayout>
        <Profile />
      </MainLayout>
    </ProtectedRoute>
  }
/>
      <Route path="/" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

export default AppRoutes;