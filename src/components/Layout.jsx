import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLoginRoute = location.pathname === "/login";

  if (isLoginRoute) {
    return <div className="auth-layout">{children}</div>;
  }

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="app-shell">
      <div
        className={`app-shell__overlay ${mobileNavOpen ? "is-visible" : ""}`}
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      <Sidebar mobileNavOpen={mobileNavOpen} onNavigate={closeMobileNav} />

      <div className="app-shell__main">
        <Navbar onToggleSidebar={() => setMobileNavOpen((prev) => !prev)} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
