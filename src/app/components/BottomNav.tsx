"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HomeIcon, PlusCircleIcon, ChartIcon, TableIcon, ViewIcon } from "./icons";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const bottomNavItems: NavItem[] = [
  {
    name: "Home",
    path: "/dashboard",
    icon: HomeIcon,
  },
  {
    name: "Insights",
    path: "/insights",
    icon: ViewIcon,
  },
  {
    name: "Add",
    path: "/add",
    icon: PlusCircleIcon,
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
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Don't show on login/register pages or when not authenticated
  if (!session || pathname === "/login" || pathname === "/register") {
    return null;
  }

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <nav className="bottom-nav">
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path;

        return (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`bottom-nav-item ${isActive ? "bottom-nav-item-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.name}
          >
            <Icon className="bottom-nav-icon" />
            <span className="bottom-nav-label">{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
