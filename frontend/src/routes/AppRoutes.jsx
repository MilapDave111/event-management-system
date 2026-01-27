import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "../view/pages/AuthPage";
import VerifyEmail from "../view/pages/VerifyEmail";
import Home from "../view/pages/Home";
import ProtectedRoute from "../controller/auth/ProtectedRoute";



function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
  path="/"
  element={
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  }
/>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
