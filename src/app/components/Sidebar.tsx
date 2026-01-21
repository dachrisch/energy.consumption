"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
  HomeIcon,
  PlusCircleIcon,
  DocumentTextIcon,
  TableIcon,
  ChartIcon,
  ViewIcon
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
            const isActive = (pathname || "") === item.path || (item.path !== '/' && (pathname || "").startsWith(item.path));

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

      {/* Mobile Dropdown Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        >
          <div 
            className="fixed inset-y-0 left-0 w-64 bg-card border-r shadow-xl p-6 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-2">
              <PlusCircleIcon className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">EnergyMonitor</span>
            </div>
            
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = (pathname || "") === item.path || (item.path !== '/' && (pathname || "").startsWith(item.path));

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-primary text-primary-foreground font-semibold" 
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
