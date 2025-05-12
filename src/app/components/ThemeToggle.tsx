'use client';

import { useTheme } from 'next-themes';
import { Button } from '@nextui-org/react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useEffect, useState } from 'react';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  /* fixed top-4 right-4 z-50 bg-content2 */
  return (
    <Button
      isIconOnly
      variant="flat"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className=""
      size="lg"
    >
      {theme === 'dark' ? (
        <FaSun className="h-5 w-5 text-yellow-500" />
      ) : (
        <FaMoon className="h-5 w-5 text-red-500" />
      )}
    </Button>
  );
};

export default ThemeToggle;
