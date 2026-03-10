import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogIn, LogOut, Menu, ShieldCheck } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const titleMap = {
  "/": "Nhận diện tiền giấy đa quốc gia",
  "/history": "Lịch sử nhận diện và đối soát",
  "/dashboard": "Dashboard rủi ro và vận hành",
  "/model-info": "Model Info & Training Metadata",
  "/users": "Quản lý tài khoản đăng nhập hệ thống",
};

function getSessionLabel(user, token) {
  if (!token) return "Guest mode active";
  if (!user) return "Authenticated session";

  const roleText = user.role === "admin" ? "Admin" : "Analyst";
  const username = user.username ? ` • ${user.username}` : "";
  return `${roleText} session active${username}`;
}

export default function Navbar({ onToggleSidebar }) {
  const location = useLocation();
  const { token, user, logout } = useContext(AuthContext);
  const title = titleMap[location.pathname] || "Banknote Recognition Suite";

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="topbar__menu-btn"
          onClick={onToggleSidebar}
          aria-label="Mở điều hướng"
        >
          <Menu size={20} />
        </button>

        <div>
          <p className="topbar__eyebrow">Global Currency Intelligence Platform</p>
          <h1 className="topbar__title">{title}</h1>
        </div>
      </div>

      <div className="topbar__right">
        <div className="topbar__status">
          <ShieldCheck size={16} />
          <span>{getSessionLabel(user, token)}</span>
        </div>

        {token ? (
          <button type="button" className="topbar__action-btn" onClick={logout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        ) : (
          <Link to="/login" className="topbar__action-btn">
            <LogIn size={16} />
            <span>Admin Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}
