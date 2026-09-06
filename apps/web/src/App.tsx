import { Navigate, Route, Routes } from "react-router-dom";
import { CreateUserPage } from "./pages/CreateUserPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

export function App() {
  return (
    <div className="shell">
      <p className="wordmark">Naseemah</p>
      <p className="lede">Create a User, log in, or reset a forgotten password.</p>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-user" element={<CreateUserPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
