"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ayra-theme") as Theme | null;
      if (stored === "dark" || stored === "light") return stored;
    }
    return "dark";
  });

  const pathname = usePathname();

  // Apply theme class to <html>
  useEffect(() => {
    const html = document.documentElement;
    const isAdmin = pathname?.startsWith("/admin");
    const activeTheme = isAdmin ? "dark" : theme;

    html.classList.remove("theme-light", "theme-dark");
    html.classList.add(`theme-${activeTheme}`);
    
    // Only save the preferred theme, not the forced one
    localStorage.setItem("ayra-theme", theme);
  }, [theme, pathname]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
