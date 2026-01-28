import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import VerifyEmail from "../pages/VerifyEmail";



import AuthPage from "../pages/AuthPage";



function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
