"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { UserIcon, EnergyLogo } from "./icons";
import EditProfileModal from "./modals/EditProfileModal";
import Toast from "./Toast";
import { ToastMessage } from "../types";

export default function AppBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <nav className="nav-container">
      <div className="nav-inner">
        <div className="logo-container">
          <div
            className="logo-left"
            onClick={() => router.push("/dashboard")}
          >
            <EnergyLogo className="app-logo" />
          </div>
          <div className="flex flex-col">
            <h1 className="logo-text-large">Energy Consumption Monitor</h1>
            <h1 className="logo-text-small" title="Energy Consumption Monitor">
            ECM
          </h1>
            <span className="text-xs text-gray-400">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </span>
          </div>

        </div>
        <div className="menu-container" ref={menuRef}>
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="menu-button"
          >
            <UserIcon className="menu-icon" />
          </div>

          {isMenuOpen && (
            <div className="menu-dropdown">
              <div className="menu-dropdown-group">
                <div className="dropdown-user-name">
                  {session?.user?.name}
                </div>
                <div className="dropdown-user-email">
                  {session?.user?.email}
                </div>
              </div>
              <div
                onClick={() => {
                  setIsEditModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="menu-dropdown-item-edit"
              >
                Edit Profile
              </div>
              <div
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/contracts");
                }}
                className="menu-dropdown-item-edit"
              >
                Contract Data
              </div>
              <div
                onClick={handleLogout}
                className="menu-dropdown-item-logout"
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setToast({
            message: "Profile updated successfully",
            type: "success",
          });
        }}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </nav>
  );
}
