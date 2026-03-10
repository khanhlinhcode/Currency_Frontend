import { useContext } from "react";
import {
  Banknote,
  Camera,
  CircleHelp,
  Globe2,
  History,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const commonLinks = [
  { to: "/", label: "Nhận diện", icon: Camera, end: true },
];

const protectedLinks = [
  { to: "/history", label: "Lịch sử kiểm định", icon: History },
  { to: "/dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
  { to: "/model-info", label: "Thông tin mô hình", icon: CircleHelp },
];

const adminLinks = [
  { to: "/users", label: "Quản lý người dùng", icon: UsersRound },
];

export default function Sidebar({ mobileNavOpen, onNavigate }) {
  const { token, role } = useContext(AuthContext);

  const navigation = [
    ...commonLinks,
    ...(token ? protectedLinks : []),
    ...(token && role === "admin" ? adminLinks : []),
  ];

  return (
    <aside className={`sidebar ${mobileNavOpen ? "is-open" : ""}`}>
      <div className="sidebar__brand">
        <span className="sidebar__brand-icon">
          <Banknote size={20} />
        </span>
        <div>
          <p className="sidebar__brand-title">Banknote AI</p>
          <p className="sidebar__brand-subtitle">Verification Suite</p>
        </div>
      </div>

      <div className="sidebar__meta">
        <span>
          <Globe2 size={14} />
          86+ quốc gia
        </span>
        <span>
          <ShieldCheck size={14} />
          Tối ưu phát hiện giả mạo
        </span>
      </div>

      <nav className="sidebar__nav">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "is-active" : ""}`
              }
              onClick={onNavigate}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
