import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(to: string) {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  }

  function handleMockDataClick() {
    navigate("/settings");
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col bg-dark-900 border-r border-dark-700/50 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-700/50">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent-500/15 border border-accent-500/25 flex-shrink-0">
          <Activity className="w-5 h-5 text-accent-400" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-gray-100 leading-tight">
              Customer
            </h1>
            <p className="text-[10px] text-dark-400 font-medium uppercase tracking-wider">
              Dashboard
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={active ? "sidebar-link-active" : "sidebar-link"}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 pb-4">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-dark-400 hover:text-gray-300 hover:bg-dark-800/60 transition-colors cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Mock Mode Button */}
      <div className="px-3 pb-4">
        <button
          type="button"
          onClick={handleMockDataClick}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/30 transition-all duration-150 cursor-pointer"
          title={collapsed ? "Mock Data Mode - Click to configure integrations" : undefined}
        >
          {collapsed ? (
            <Database className="w-4 h-4 text-amber-400 flex-shrink-0 mx-auto" />
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-slow flex-shrink-0" />
              <span className="text-[11px] text-amber-400 font-medium animate-fade-in">
                Mock Data Mode
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
