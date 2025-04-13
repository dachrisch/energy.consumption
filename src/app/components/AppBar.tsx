'use client';

import { useState, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { UserIcon, EnergyLogo } from './icons';
import EditProfileModal from './EditProfileModal';
import Toast from './Toast';

export default function AppBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <EnergyLogo className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Energy Consumption Monitor</h1>
          </div>
          <div className="relative" ref={menuRef}>
            <div
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
            >
              <UserIcon className="w-5 h-5 text-gray-500" />
            </div>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-100">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">{session?.user?.name}</div>
                  <div className="text-xs text-gray-500 truncate">{session?.user?.email}</div>
                </div>
                <div
                  onClick={() => {
                    setIsEditModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors border border-gray-100 last:border-b-0 cursor-pointer"
                >
                  Edit Profile
                </div>
                <div
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors border border-gray-100 last:border-b-0 cursor-pointer"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setToast({
            message: "Profile updated successfully",
            type: "success"
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