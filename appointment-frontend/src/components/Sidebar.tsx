"use client";

import { JSX } from "react";
import {
  Home,
  Calendar,
  Settings,
  Menu,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@mui/material"; // Optional for tooltip on collapse

interface SidebarProps {
  user: { name: string; role: string };
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  getUserInitials: (name: string) => string;
  getRoleColor: (role: string) => string;
}

const Sidebar = ({
  user,
  sidebarCollapsed,
  setSidebarCollapsed,
  getUserInitials,
  getRoleColor,
}: SidebarProps) => {
  const pathname = usePathname();

  const navigationItems = [
    { id: "dashboard", title: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    { id: "appointments", title: "Appointments", path: "/appointments", icon: <Calendar size={20} /> },
    { id: "settings", title: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-white shadow-md border-r transition-all duration-300 ease-in-out
      ${sidebarCollapsed ? "w-[70px]" : "w-[260px]"}`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b">
        {!sidebarCollapsed && (
          <div className={`text-white rounded-full p-3 text-center font-bold text-xl ${getRoleColor(user.role)}`}>
            {getUserInitials(user.name)}
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-gray-600 hover:text-black transition"
          aria-label="Toggle Sidebar"
        >
          {sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation Items */}
      <ul className="mt-4 space-y-1 px-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <li key={item.id}>
              <Link
                href={item.path}
                className={`flex items-center gap-3 py-2 px-3 rounded-md transition 
                  ${isActive ? "bg-gray-200 text-black font-semibold" : "text-gray-700 hover:bg-gray-100"}`}
              >
                <Tooltip title={sidebarCollapsed ? item.title : ""} placement="right">
                  <span>{item.icon}</span>
                </Tooltip>
                {!sidebarCollapsed && <span>{item.title}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;
