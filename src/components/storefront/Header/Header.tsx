"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { UserProfile, Category } from "@/types";
import styles from "./Header.module.css";

// ─── Category mega-menu structure ────────────────────────────────────────────
interface NavCategory {
  label: string;
  href: string;
  sub: Array<{ label: string; href: string }>;
}

const MOCK_CATEGORIES: NavCategory[] = [
  {
    label: "Lawn Prints",
    href: "/collections/lawn-prints",
    sub: [
      { label: "3-Piece",       href: "/collections/lawn-3-piece" },
      { label: "2-Piece",       href: "/collections/lawn-2-piece" },
      { label: "Ready to Wear", href: "/collections/lawn-ready-to-wear" },
    ],
  },
  {
    label: "Garments",
    href: "/collections/garments",
    sub: [
      { label: "Intimate Wear", href: "/collections/intimate-wear" },
      { label: "Sleep Wear",    href: "/collections/sleep-wear" },
    ],
  },
  {
    label: "Bedding",
    href: "/collections/bedding",
    sub: [
      { label: "Single Bed-sheets", href: "/collections/single-bedsheets" },
      { label: "Double Bed-sheets", href: "/collections/double-bedsheets" },
    ],
  },
  {
    label: "Hijab Collection",
    href: "/collections/hijab-collection",
    sub: [
      { label: "Chiffon Hijabs", href: "/collections/chiffon-hijabs" },
      { label: "Printed Hijabs", href: "/collections/printed-hijabs" },
    ],
  },
];

import { AnnouncementTicker } from "../AnnouncementTicker/AnnouncementTicker";

export const Header: React.FC = () => {
  const { cart, setCartOpen } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [menuCategories, setMenuCategories] = useState<NavCategory[]>(MOCK_CATEGORIES);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
      document.documentElement.style.setProperty(
        "--header-height",
        scrolled ? "102px" : "118px"
      );
    };
    
    // Set initial height on mount
    document.documentElement.style.setProperty("--header-height", "118px");
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    };
    fetchUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (!error && data && data.length > 0) {
          const allCats = data as Category[];
          const parents = allCats.filter((c) => c.parent_id === null);
          const mapped = parents.map((parent) => {
            const subs = allCats.filter((c) => c.parent_id === parent.id);
            return {
              label: parent.name,
              href: `/collections/${parent.slug}`,
              sub: subs.map((sub) => ({
                label: sub.name,
                href: `/collections/${sub.slug}`,
              })),
            };
          });
          setMenuCategories(mapped);
        }
      } catch (err) {
        console.error("Failed to load navigation categories:", err);
      }
    };
    fetchCategories();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const totalItemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
        <AnnouncementTicker />
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
          <Link href="/" className={styles.logo}>AYRAA</Link>

          {/* Desktop Mega-Menu Navigation */}
          <nav className={styles.nav} aria-label="Primary navigation">
            <ul className={styles.navList}>
              {/* Collections mega-menu trigger */}
              <li className={`${styles.navItem} ${styles.megaMenuWrapper}`}>
                <Link
                  href="/collections"
                  className={pathname.startsWith("/collections") ? "premium-underline-active" : "premium-underline"}
                >
                  Collections
                </Link>

                {/* Mega-menu panel */}
                <div className={styles.megaMenu} role="region" aria-label="Collections menu">
                  <div className={styles.megaMenuInner}>
                    {menuCategories.map((cat) => (
                      <div key={cat.href} className={styles.megaCol}>
                        <Link href={cat.href} className={styles.megaParentLink}>
                          {cat.label}
                        </Link>
                        {cat.sub && cat.sub.length > 0 && (
                          <ul className={styles.megaSubList}>
                            {cat.sub.map((sub) => (
                              <li key={sub.href}>
                                <Link
                                  href={sub.href}
                                  className={`${styles.megaSubLink} ${pathname === sub.href ? styles.megaSubLinkActive : ""}`}
                                >
                                  {sub.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </li>

              <li className={styles.navItem}>
                <Link href="/about" className={pathname === "/about" ? "premium-underline-active" : "premium-underline"}>
                  Heritage
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/contact" className={pathname === "/contact" ? "premium-underline-active" : "premium-underline"}>
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
                  <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {profile?.role === "admin" && (
              <Link href="/admin" className={styles.dashboardLink} title="Admin Panel">Dashboard</Link>
            )}

            {profile ? (
              <div className={styles.profileMenu}>
                <button className={styles.profileBtn} aria-label="User Profile Menu" id="user-profile-btn">
                  {profile.full_name?.split(" ")[0] || "Account"}
                </button>
                <div className={styles.profileDropdown}>
                  <div className={styles.dropdownMenu}>
                    {profile.role === "admin" && (
                      <Link href="/admin" className={styles.dropdownItem}>Admin Panel</Link>
                    )}
                    <Link href="/orders" className={styles.dropdownItem}>My Orders</Link>
                    <button onClick={handleSignOut} className={styles.dropdownItem}>Sign Out</button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login" className="premium-underline" id="login-link">Login</Link>
            )}

            {/* Bag Icon */}
            <button
              className={styles.iconBtn}
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping cart with ${totalItemCount} items`}
              id="cart-toggle-btn"
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {totalItemCount > 0 && <span className={styles.cartBadge}>{totalItemCount}</span>}
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
          <Link href="/" className={styles.logo} onClick={() => setIsMobileMenuOpen(false)}>AYRAA</Link>
          <button className={styles.iconBtn} onClick={() => setIsMobileMenuOpen(false)} aria-label="Close navigation">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className={styles.mobileMenuList}>
          {menuCategories.map((cat) => {
            const hasSubs = cat.sub && cat.sub.length > 0;
            return (
              <li key={cat.href} className={styles.mobileMenuItem}>
                {hasSubs ? (
                  <>
                    {/* Parent row — tap to expand */}
                    <button
                      className={`${styles.mobileMenuLink} ${styles.mobileMenuLinkInactive} ${styles.mobileParentBtn}`}
                      onClick={() => setExpandedMobile(expandedMobile === cat.label ? null : cat.label)}
                      aria-expanded={expandedMobile === cat.label}
                    >
                      <span>{cat.label}</span>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={expandedMobile === cat.label ? styles.chevronOpen : styles.chevron}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Sub-categories accordion */}
                    {expandedMobile === cat.label && (
                      <ul className={styles.mobileSubList}>
                        <li>
                          <Link
                            href={cat.href}
                            className={styles.mobileSubLink}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            All {cat.label}
                          </Link>
                        </li>
                        {cat.sub.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className={`${styles.mobileSubLink} ${pathname === sub.href ? styles.mobileSubLinkActive : ""}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={cat.href}
                    className={`${styles.mobileMenuLink} ${pathname === cat.href ? styles.mobileSubLinkActive : styles.mobileMenuLinkInactive}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {cat.label}
                  </Link>
                )}
              </li>
            );
          })}

          <li className={styles.mobileMenuItem}>
            <Link href="/about" className={`${styles.mobileMenuLink} ${styles.mobileMenuLinkInactive}`} onClick={() => setIsMobileMenuOpen(false)}>Heritage</Link>
          </li>
          <li className={styles.mobileMenuItem}>
            <Link href="/contact" className={`${styles.mobileMenuLink} ${styles.mobileMenuLinkInactive}`} onClick={() => setIsMobileMenuOpen(false)}>Journal</Link>
          </li>
          {!profile && (
            <li className={styles.mobileMenuItem}>
              <Link href="/login" className={`${styles.mobileMenuLink} ${styles.mobileMenuLinkInactive}`} onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
};
