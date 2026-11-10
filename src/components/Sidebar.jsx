import { useContext } from "react";
import {
  Banknote,
  Camera,
  CircleHelp,
  Globe2,
  History,
  Layers3,
  LayoutDashboard,
  UsersRound,
  Activity,
  GitCompareArrows,
  ListChecks,
  Timer,
  RadioTower,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const commonLinks = [
  { to: "/", label: "Nhận diện", icon: Camera, end: true },
];

const protectedLinks = [
  { to: "/history", label: "Lịch sử nhận diện", icon: History },
  { to: "/dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
  { to: "/model-info", label: "Thông tin mô hình", icon: CircleHelp },
];

const adminLinks = [
  { to: "/mlops/runs", label: "MLOps Runs", icon: ListChecks },
  { to: "/mlops/compare", label: "So sánh model", icon: GitCompareArrows },
  { to: "/mlops/benchmarks", label: "Benchmark", icon: Timer },
  { to: "/mlops/monitoring", label: "Monitoring", icon: Activity },
  { to: "/mlops/releases", label: "Phát hành & thiết bị", icon: RadioTower },
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
          <p className="sidebar__brand-subtitle">Recognition Workspace</p>
        </div>
      </div>

      <div className="sidebar__meta">
        <span>
          <Globe2 size={14} />
          3 quốc gia
        </span>
        <span>
          <Layers3 size={14} />
          25 lớp nhận diện
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
