'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Avatar, 
  Button,
  Tooltip,
  Divider
} from "@nextui-org/react";
import { 
  FaHome, 
  FaSignOutAlt, 
  FaWifi, 
  FaHistory, 
  FaUser, 
  FaMoon, 
  FaSun,
  FaTimes
} from 'react-icons/fa';
import { useTheme } from 'next-themes';

interface User {
  _id: string;
  name: string;
  complete_name: string;
  firstname: string;
  lastname: string;
  user_number: string;
  type: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check if user is logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else if (pathname !== '/login') {
      // Redirect to login if not logged in and not already on login page
      router.push('/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) return null;
  
  // Don't show sidebar on login page
  if (pathname === '/login') return null;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - only visible on mobile and medium screens */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-divider transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header with close button for mobile */}
          <div className="flex items-center justify-between p-4 border-b border-divider">
            <div className="flex items-center gap-3">
              
              <span className="font-bold text-xl">NETLINE</span>
            </div>
            <Button
              isIconOnly
              variant="light"
              className="lg:hidden"
              onClick={onClose}
            >
              <FaTimes />
            </Button>
          </div>
          
          {/* User Info */}
          {currentUser && (
            <div className="p-4 border-b border-divider">
              <div className="flex items-center gap-3">
                <Avatar
                  name={currentUser.complete_name?.charAt(0) || 'U'}
                  color="primary"
                  size="md"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{currentUser.lastname+" "+currentUser.firstname}</span>
                  <span className="text-xs text-default-500">{currentUser.type}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Items */}
          <nav className="flex-grow overflow-y-auto py-4">

          <Link 
              href="/" 
              className={`flex items-center gap-3 px-4 py-3 hover:bg-default-100 transition-colors ${pathname === '/' ? 'text-primary bg-primary/10 font-medium' : ''}`}
              onClick={onClose}
            >
              <FaHome className="text-lg" />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              href="/live-connected" 
              className={`flex items-center gap-3 px-4 py-3 hover:bg-default-100 transition-colors ${pathname === '/live-connected' ? 'text-primary bg-primary/10 font-medium' : ''}`}
              onClick={onClose}
            >
              <FaWifi className="text-lg" />
              <span>Live Connected</span>
            </Link>
            <Link 
              href="/sell-history" 
              className={`flex items-center gap-3 px-4 py-3 hover:bg-default-100 transition-colors ${pathname === '/sell-history' ? 'text-primary bg-primary/10 font-medium' : ''}`}
              onClick={onClose}
            >
              <FaHistory className="text-lg" />
              <span>Sell History</span>
            </Link>
          </nav>
          
          {/* Bottom Actions */}
          <div className="p-4 border-t border-divider">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="light"
                onPress={toggleTheme}
                startContent={theme === 'dark' ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                className="w-full justify-start"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </div>
            
            <Button
              variant="flat"
              color="danger"
              onPress={handleLogout}
              startContent={<FaSignOutAlt />}
              className="w-full justify-start"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
