"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  const { cart, setCartOpen } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Handle scroll detection for glassmorphism styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch session user profile
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const totalItemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
        <div className={styles.container}>
          {/* Mobile menu toggle */}
          <button
            className={styles.mobileMenuToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            id="mobile-menu-toggle"
          >
            <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ""}`} />
          </button>

          {/* Branding Logo */}
          <Link href="/" className={styles.logo}>
            AYRAA
          </Link>

          {/* Desktop Navigation links */}
          <nav className={styles.nav} aria-label="Primary navigation">
            <ul className={styles.navList}>
              <li className={styles.navItem}>
                <Link
                  href="/collections"
                  className={pathname.startsWith("/collections") ? "premium-underline-active" : "premium-underline"}
                >
                  Collections
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link
                  href="/collections/ready-to-wear"
                  className={pathname === "/collections/ready-to-wear" ? "premium-underline-active" : "premium-underline"}
                >
                  Ready to Wear
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link
                  href="/about"
                  className={pathname === "/about" ? "premium-underline-active" : "premium-underline"}
                >
                  Heritage
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link
                  href="/contact"
                  className={pathname === "/contact" ? "premium-underline-active" : "premium-underline"}
                >
                  Journal
                </Link>
              </li>
            </ul>
          </nav>

          {/* Action icons */}
          <div className={styles.actions}>
            {/* Theme toggle */}
            <button
              className={styles.iconBtn}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              id="theme-toggle-btn"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {profile?.role === "admin" && (
              <Link 
                href="/admin" 
                className={styles.dashboardLink} 
                title="Admin Panel"
              >
                Dashboard
              </Link>
            )}

            {profile ? (
              <div className={styles.profileMenu}>
                <button className={styles.profileBtn} aria-label="User Profile Menu" id="user-profile-btn">
                  {profile.full_name?.split(" ")[0] || "Account"}
                </button>
                <div className={styles.profileDropdown}>
                  <div className={styles.dropdownMenu}>
                    {profile.role === "admin" && (
                      <Link href="/admin" className={styles.dropdownItem}>
                        Admin Panel
                      </Link>
                    )}
                    <Link href="/orders" className={styles.dropdownItem}>
                      My Orders
                    </Link>
                    <button onClick={handleSignOut} className={styles.dropdownItem}>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="premium-underline" 
                id="login-link"
              >
                Login
              </Link>
            )}

            {/* Bag Icon with Badge */}
            <button
              className={styles.iconBtn}
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping cart with ${totalItemCount} items`}
              id="cart-toggle-btn"
            >
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              {totalItemCount > 0 && (
                <span className={styles.cartBadge}>{totalItemCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fullscreen Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenuOverlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <nav 
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`} 
        aria-label="Mobile navigation"
      >
        <div className={styles.mobileMenuHeader}>
          <Link href="/" className={styles.logo} onClick={() => setIsMobileMenuOpen(false)}>
            AYRAA
          </Link>
          <button
            className={styles.iconBtn}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className={styles.mobileMenuList}>
          {[
            { href: "/collections", label: "Collections" },
            { href: "/collections/ready-to-wear", label: "Ready to Wear" },
            { href: "/about", label: "Heritage" },
            { href: "/contact", label: "Journal" },
          ].map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <li key={href} className={styles.mobileMenuItem}>
                <Link
                  href={href}
                  className={`${styles.mobileMenuLink} ${isActive ? styles.mobileMenuLinkActive : styles.mobileMenuLinkInactive}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          {!profile && (
            <li className={styles.mobileMenuItem}>
              <Link 
                href="/login" 
                className={`${styles.mobileMenuLink} ${styles.mobileMenuLinkInactive}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
};
