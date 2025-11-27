import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListTodo,
  Activity,
  LogOut,
  User,
} from "lucide-react";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "employee"],
    },
    {
      path: "/tester-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["tester"],
    },
    {
      path: "/projects",
      label: "Projects",
      icon: FolderKanban,
      roles: ["admin", "employee", "tester"],
    },
    {
      path: "/tasks",
      label: "My Tasks",
      icon: ListTodo,
      roles: ["employee", "tester"],
    },
    { path: "/employees", label: "Developers", icon: Users, roles: ["admin"] },
    { path: "/activity", label: "Activity", icon: Activity, roles: ["admin"] },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-indigo-600">ScrumMaster</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(
            (item) =>
              item.roles.includes(user.role) && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
          )}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user.username}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
