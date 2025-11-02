"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Don't show sidebar on login/register pages or when not authenticated
  if (!session || pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <aside className="sidebar">
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
  );
}
