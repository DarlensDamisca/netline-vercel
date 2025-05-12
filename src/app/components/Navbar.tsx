'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { Navbar as NextUINavbar, NavbarBrand, NavbarContent, NavbarItem, Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import ThemeToggle from './ThemeToggle';
import { FaBars, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  complete_name: string;
  user_number: string;
  type: string;
  lastname: string;
  firstname: string;
}

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Check if user is logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  if (!mounted) {
    return null;
  }

  return (
    <NextUINavbar 
      position="sticky" 
      className="bg-background/70 dark:bg-background/70 backdrop-blur-md backdrop-saturate-150 border-b border-divider  lg:px-4 py-2"
      maxWidth="2xl"
      shouldHideOnScroll
    >
      <NavbarBrand className="gap-2">
        <Button
          isIconOnly
          variant="flat"
          aria-label="Toggle sidebar"
          className="md:flex sm:flex lg:hidden bg-primary/10 hover:bg-primary/20 transition-colors"
          onClick={onToggleSidebar}
        >
          <FaBars className="text-xl text-primary" />
        </Button>
        <Link href="/" className="font-bold text-xl dark:text-white text-black">
          NETLINE
        </Link>
      </NavbarBrand>
      
      <NavbarContent justify="end" className="gap-4">
        {/* Navigation links - visible on large screens */}
        <div className="hidden lg:flex items-center gap-4 ml-6">
          
          <Link href="/live-connected" className="text-foreground hover:text-primary transition-colors">
            Live Connected
          </Link>
          <Link href="/sell-history" className="text-foreground hover:text-primary transition-colors">
            Sell History
          </Link>
        </div>
        
        <NavbarItem>
          <ThemeToggle/>
        </NavbarItem>
        
        {currentUser && (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button 
                isIconOnly
                variant="flat"
                size="lg"
                className=""
              >
                <Avatar
                  name={currentUser.lastname?.charAt(0) || 'U'}
                  color="primary"
                  size="sm"
                />
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="User menu" 
              variant="shadow"
              classNames={{
                base: "bg-background border border-default-100",
              }}
            >
              <DropdownItem isReadOnly key="profile" className="cursor-default opacity-100">
                <div className="flex items-center gap-2 py-1">
                  <FaUser className="text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">{currentUser.lastname + " " + currentUser.firstname}</span>
                    <span className="text-xs text-default-500">{currentUser.user_number}</span>
                  </div>
                </div>
              </DropdownItem>
              
              <DropdownItem isReadOnly key="userType" className="cursor-default opacity-100">
                <div className="flex items-center gap-2 py-1">
                  <FaUser className="text-default-500" />
                  <div className="flex flex-col">
                    <span className="text-default-700">{currentUser.type}</span>
                    <span className="text-xs text-default-500">Account Type</span>
                  </div>
                </div>
              </DropdownItem>
              
              <DropdownItem 
                key="logout" 
                startContent={<FaSignOutAlt className="text-danger" />} 
                color="danger" 
                onClick={handleLogout}
                className="py-3 data-[hover=true]:bg-danger-50"
                showDivider
              >
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </NavbarContent>
    </NextUINavbar>
  );
}
