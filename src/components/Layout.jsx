import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { DEMO_ONLY } from "../demoMode";

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const isLoginRoute = location.pathname === "/login";

  const closeMobileNav = () => {
    if (!mobileNavOpen) return;
    setMobileNavOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  useEffect(() => {
    if (!mobileNavOpen || isLoginRoute || !sidebarRef.current) return undefined;
    const sidebar = sidebarRef.current;
    const focusable = [...sidebar.querySelectorAll("a, button:not([disabled])")];
    focusable[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileNavOpen(false);
        menuButtonRef.current?.focus();
      }
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isLoginRoute, mobileNavOpen]);

  useEffect(() => {
    const mobileViewport = window.matchMedia("(max-width: 920px)");
    const closeOnDesktop = () => {
      if (!mobileViewport.matches) setMobileNavOpen(false);
    };
    mobileViewport.addEventListener("change", closeOnDesktop);
    return () => mobileViewport.removeEventListener("change", closeOnDesktop);
  }, []);

  if (isLoginRoute) {
    return <div className="auth-layout">{children}</div>;
  }

  return (
    <div className={`app-shell ${DEMO_ONLY ? "demo-shell" : ""}`}>
      {DEMO_ONLY && <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>}
      <button
        type="button"
        className={`app-shell__overlay ${mobileNavOpen ? "is-visible" : ""}`}
        onClick={closeMobileNav}
        aria-label="Đóng điều hướng"
        tabIndex={mobileNavOpen ? 0 : -1}
      />

      <Sidebar mobileNavOpen={mobileNavOpen} onNavigate={closeMobileNav} sidebarRef={sidebarRef} />

      <div className="app-shell__main">
        <Navbar onToggleSidebar={() => setMobileNavOpen((prev) => !prev)} menuButtonRef={menuButtonRef} mobileNavOpen={mobileNavOpen} />
        <main className="app-content" id="main-content" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
