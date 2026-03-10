import Sidebar from "../components/Sidebar";

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  );
}
