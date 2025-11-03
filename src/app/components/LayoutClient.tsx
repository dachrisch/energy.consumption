"use client";

import { useState, useEffect, useCallback } from "react";
import AppBar from './AppBar';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import BottomNav from './BottomNav';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    console.log('[LayoutClient] Toggle sidebar, current state:', isSidebarOpen);
    setIsSidebarOpen(prev => {
      console.log('[LayoutClient] Setting sidebar to:', !prev);
      return !prev;
    });
  }, [isSidebarOpen]);

  const closeSidebar = useCallback(() => {
    console.log('[LayoutClient] Closing sidebar');
    setIsSidebarOpen(false);
  }, []);

  useEffect(() => {
    console.log('[LayoutClient] Sidebar state changed to:', isSidebarOpen);
  }, [isSidebarOpen]);

  return (
    <>
      <AppBar onMenuClick={toggleSidebar} />
      <div className="app-content-wrapper">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <MainContent>{children}</MainContent>
      </div>
      <BottomNav />
    </>
  );
}
