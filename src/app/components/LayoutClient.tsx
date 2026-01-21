"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  User, 
  LogOut, 
  Settings, 
  Zap, 
  Moon, 
  Sun,
  ChevronDown,
  Home,
  Table,
  PlusCircle,
  FileText
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import BottomNav from "./BottomNav";
import Link from "next/link";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "Readings", path: "/readings", icon: Table },
  { name: "Add Data", path: "/add", icon: PlusCircle },
  { name: "Contracts", path: "/contracts", icon: FileText },
];

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!session || isAuthPage) {
    return <main className="w-full h-full">{children}</main>;
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header / AppBar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-8 shrink-0 z-20">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden lg:block">EnergyMonitor</span>
            </div>

            {/* Desktop Top Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = (pathname || "") === item.path || (item.path !== '/' && (pathname || "").startsWith(item.path));
                
                return (
                  <Link key={item.path} href={item.path}>
                    <Button 
                      variant={isActive ? "secondary" : "ghost"} 
                      size="sm"
                      className={`gap-2 h-9 px-4 ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-none text-left">
                    <span className="text-sm font-medium">{session.user?.name || "User"}</span>
                    <span className="text-[10px] text-muted-foreground">{session.user?.email}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-16 md:pb-0">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
