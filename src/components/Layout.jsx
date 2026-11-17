import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { DEMO_ONLY } from "../demoMode";

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLoginRoute = location.pathname === "/login";

  if (isLoginRoute) {
    return <div className="auth-layout">{children}</div>;
  }

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className={`app-shell ${DEMO_ONLY ? "demo-shell" : ""}`}>
      <button
        type="button"
        className={`app-shell__overlay ${mobileNavOpen ? "is-visible" : ""}`}
        onClick={closeMobileNav}
        aria-label="Đóng điều hướng"
        tabIndex={mobileNavOpen ? 0 : -1}
      />

      <Sidebar mobileNavOpen={mobileNavOpen} onNavigate={closeMobileNav} />

      <div className="app-shell__main">
        <Navbar onToggleSidebar={() => setMobileNavOpen((prev) => !prev)} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
