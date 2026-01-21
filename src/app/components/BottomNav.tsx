"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  PlusCircleIcon,
  DocumentTextIcon,
  TableIcon,
} from "./icons";

const navItems = [
  { name: "Home", path: "/dashboard", icon: HomeIcon },
  { name: "Readings", path: "/readings", icon: TableIcon },
  { name: "Add", path: "/add", icon: PlusCircleIcon },
  { name: "Contracts", path: "/contracts", icon: DocumentTextIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-50 flex items-center justify-around px-2 safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = (pathname || "") === item.path || (item.path !== '/' && (pathname || "").startsWith(item.path));

        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center justify-center flex-1 min-w-[64px] h-full gap-1 transition-colors active:scale-95 ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={item.name}
          >
            <div className={`p-1 rounded-xl transition-colors ${isActive ? "bg-primary/10" : ""}`}>
              <Icon className="h-6 w-6" />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-primary" : ""}`}>
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
