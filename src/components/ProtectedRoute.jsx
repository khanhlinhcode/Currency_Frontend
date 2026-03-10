import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, role, sessionReady } = useContext(AuthContext);

  if (!sessionReady) {
    return (
      <section className="panel empty-state">
        <p>Đang kiểm tra phiên đăng nhập...</p>
      </section>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
