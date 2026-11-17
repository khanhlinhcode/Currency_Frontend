import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogIn, LogOut, Menu, ShieldCheck } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { DEMO_ONLY } from "../demoMode";

const titleMap = {
  "/": "Nhận diện tiền giấy",
  "/history": "Lịch sử phiên demo",
  "/dashboard": "Tổng quan hệ thống",
  "/model-info": "Thông tin mô hình",
  "/users": "Phân quyền hệ thống",
  "/mlops/runs": "Hồ sơ MLOps",
  "/mlops/compare": "So sánh model",
  "/mlops/benchmarks": "Hiệu năng hệ thống",
  "/mlops/monitoring": "Giám sát vận hành",
  "/mlops/releases": "Phát hành và thiết bị",
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
  const title = titleMap[location.pathname] || (location.pathname.startsWith("/mlops/runs/") ? "Chi tiết MLOps run" : "Banknote Recognition Suite");

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
          <p className="topbar__eyebrow">Banknote AI / Demo</p>
          <h1 className="topbar__title">{title}</h1>
        </div>
      </div>

      <div className="topbar__right">
        <div className="topbar__status">
          <ShieldCheck size={16} />
          <span>{DEMO_ONLY ? "Demo công khai" : getSessionLabel(user, token)}</span>
        </div>

        {DEMO_ONLY ? null : token ? (
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
