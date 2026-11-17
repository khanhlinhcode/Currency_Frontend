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
import { DEMO_ONLY } from "../demoMode";

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

const demoGroups = [
  { label: "Khám phá", items: [commonLinks[0], protectedLinks[0], protectedLinks[1]] },
  { label: "Mô hình", items: [protectedLinks[2], adminLinks[0], adminLinks[1]] },
  { label: "Vận hành", items: [...adminLinks.slice(2, 5), { ...adminLinks[5], label: "Phân quyền" }] },
];

function NavigationItems({ items, onNavigate }) {
  return items.map((item) => {
    const Icon = item.icon;
    return <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `sidebar__link ${isActive ? "is-active" : ""}`} onClick={onNavigate}>
      <Icon size={18} aria-hidden="true" />
      <span>{item.label}</span>
    </NavLink>;
  });
}

export default function Sidebar({ mobileNavOpen, onNavigate }) {
  const { token, role } = useContext(AuthContext);

  const navigation = [
    ...commonLinks,
    ...(token ? protectedLinks : []),
    ...(token && role === "admin" ? adminLinks : []),
  ];

  return (
    <aside className={`sidebar ${mobileNavOpen ? "is-open" : ""}`} aria-label="Điều hướng chính">
      <div className="sidebar__brand">
        <span className="sidebar__brand-icon">
          <Banknote size={21} aria-hidden="true" />
        </span>
        <div>
          <p className="sidebar__brand-title">Banknote AI</p>
          <p className="sidebar__brand-subtitle">Currency intelligence</p>
        </div>
      </div>

      <div className="sidebar__meta">
        <span><Globe2 size={15} aria-hidden="true" />3 quốc gia</span>
        <span><Layers3 size={15} aria-hidden="true" />25 lớp phân loại</span>
      </div>

      <nav className="sidebar__nav">
        {DEMO_ONLY ? demoGroups.map((group) => <div className="sidebar__group" key={group.label}>
          <p className="sidebar__group-label">{group.label}</p>
          <NavigationItems items={group.items} onNavigate={onNavigate} />
        </div>) : <NavigationItems items={navigation} onNavigate={onNavigate} />}
      </nav>
      {DEMO_ONLY && <div className="sidebar__footer"><span className="sidebar__live-dot" />Bản demo công khai<span>Chế độ chỉ xem báo cáo</span></div>}
    </aside>
  );
}
