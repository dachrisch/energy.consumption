"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
  HomeIcon,
  PlusCircleIcon,
  DocumentTextIcon,
  TableIcon,
  ChartIcon
} from "./icons";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: HomeIcon,
  },
  {
    name: "Readings",
    path: "/readings",
    icon: TableIcon,
  },
  {
    name: "Charts",
    path: "/charts",
    icon: ChartIcon,
  },
  {
    name: "Add Data",
    path: "/add",
    icon: PlusCircleIcon,
  },
  {
    name: "Contracts",
    path: "/contracts",
    icon: DocumentTextIcon,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Log when props change
  useEffect(() => {
    console.log('[Sidebar] isOpen prop changed to:', isOpen);
  }, [isOpen]);

  // Close sidebar when route changes (mobile)
  // Must be called before any conditional returns (Rules of Hooks)
  useEffect(() => {
    if (session && pathname !== "/login" && pathname !== "/register") {
      onClose();
    }
  }, [pathname, onClose, session]);

  // Don't show sidebar on login/register pages or when not authenticated
  if (!session || pathname === "/login" || pathname === "/register") {
    return null;
  }

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose(); // Close dropdown after navigation
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar sidebar-desktop">
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`sidebar-nav-item ${isActive ? "sidebar-nav-item-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="sidebar-nav-icon" />
                <span className="sidebar-nav-text">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="mobile-menu-backdrop"
            onClick={onClose}
            aria-hidden="true"
          />
          <nav className="mobile-menu-dropdown">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`mobile-menu-item ${isActive ? "mobile-menu-item-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </>
      )}
    </>
  );
}
