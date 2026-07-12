"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types";
import { useToast } from "@/context/ToastContext";
import styles from "./admin.module.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [navSearchTerm, setNavSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [navSearchTerm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirectTo=" + encodeURIComponent(pathname));
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const userProfile = data as UserProfile;
      if (!userProfile || userProfile.role !== "admin") {
        router.push("/");
        return;
      }

      setProfile(userProfile);
      setLoading(false);
    };

    checkAdmin();
  }, [router, pathname, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully.");
    router.push("/");
    router.refresh();
  };

  const navGroups = useMemo(() => [
    {
      title: "Store Overview",
      links: [
        { name: "Dashboard", href: "/admin", icon: "Dash" },
        { name: "Reports", href: "/admin/reports", icon: "Data" },
      ],
    },
    {
      title: "Operations",
      links: [
        { name: "POS Terminal", href: "/admin/pos", icon: "POS" },
        { name: "Orders List", href: "/admin/orders", icon: "Ord" },
        { name: "Shipping Manager", href: "/admin/shipping", icon: "Ship" },
        { name: "Returns Manager", href: "/admin/returns", icon: "Ret" },
      ],
    },
    {
      title: "Catalog & Promos",
      links: [
        { name: "Products", href: "/admin/products", icon: "Prod" },
        { name: "Collections", href: "/admin/categories", icon: "Col" },
        { name: "Sales Manager", href: "/admin/sales", icon: "Sale" },
        { name: "Promo Codes", href: "/admin/promos", icon: "Promo" },
      ],
    },
    {
      title: "Customers & Reviews",
      links: [
        { name: "Customers List", href: "/admin/customers", icon: "Cust" },
        { name: "Email Marketing", href: "/admin/email-marketing", icon: "Mail" },
        { name: "Product Q&A", href: "/admin/qa", icon: "Q&A" },
        { name: "Product Reviews", href: "/admin/reviews", icon: "Rev" },
      ],
    },
    {
      title: "Storefront & System",
      links: [
        { name: "Homepage Editor", href: "/admin/homepage", icon: "Home" },
        { name: "Settings", href: "/admin/settings", icon: "Set" },
      ],
    },
  ], []);

  const flatLinks = navGroups.flatMap((g) => g.links);
  const activeLink =
    flatLinks.find((link) => {
      if (link.href === "/admin") {
        return pathname === "/admin";
      }
      return pathname === link.href || pathname.startsWith(`${link.href}/`);
    }) || flatLinks[0];

  const filteredGroups = useMemo(() => {
    if (!navSearchTerm.trim()) return navGroups;
    return navGroups
      .map((group) => {
        const links = group.links.filter((link) =>
          link.name.toLowerCase().includes(navSearchTerm.toLowerCase())
        );
        return { ...group, links };
      })
      .filter((group) => group.links.length > 0);
  }, [navGroups, navSearchTerm]);

  const filteredLinks = useMemo(() => {
    return filteredGroups.flatMap((g) => g.links);
  }, [filteredGroups]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredLinks.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredLinks.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredLinks.length) % filteredLinks.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetLink = filteredLinks[highlightedIndex];
      if (targetLink) {
        router.push(targetLink.href);
        searchInputRef.current?.blur();
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p className="font-body text-sm text-admin-text-sub">Loading Ayra Admin Panel...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogoSection} style={{ paddingBottom: "12px" }}>
          <Link href="/" className={styles.sidebarLogo}>
            AYRAA
          </Link>
          <span className={styles.sidebarSubtitle}>Admin Panel</span>
        </div>

        {/* Search Navigation Field */}
        <div style={{ padding: "0 24px 16px 24px" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search shortcuts..."
              value={navSearchTerm}
              onChange={(e) => setNavSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              style={{
                width: "100%",
                padding: "6px 45px 6px 10px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
                color: "#fff",
                fontSize: "11px",
                transition: "border-color 0.2s",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--admin-card-border, #d4af37)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.08)"}
            />
            {navSearchTerm ? (
              <button
                onClick={() => setNavSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.4)",
                  fontSize: "12px",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                &times;
              </button>
            ) : (
              <kbd
                style={{
                  position: "absolute",
                  right: "8px",
                  pointerEvents: "none",
                  fontSize: "9px",
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  color: "rgba(255, 255, 255, 0.4)",
                  fontFamily: "var(--font-body)",
                  border: "1px solid rgba(255, 255, 255, 0.12)"
                }}
              >
                Ctrl+K
              </kbd>
            )}
          </div>
        </div>

        <nav className={styles.sidebarNav} style={{ overflowY: "auto", paddingBottom: "20px" }}>
          {filteredGroups.length === 0 ? (
            <p style={{ fontSize: "11px", color: "var(--admin-text-sub)", opacity: 0.5, textAlign: "center", padding: "20px 0" }}>
              No shortcuts found
            </p>
          ) : (
            (() => {
              let linkCounter = 0;
              return filteredGroups.map((group) => (
                <div key={group.title} style={{ marginBottom: "16px" }}>
                  <h4 style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--admin-text-sub)",
                    opacity: 0.5,
                    margin: "0 0 8px 12px",
                    fontWeight: 600
                  }}>
                    {group.title}
                  </h4>
                  <div style={{ display: "grid", gap: "2px" }}>
                    {group.links.map((link) => {
                      const currentFlatIndex = linkCounter++;
                      const isHighlighted = currentFlatIndex === highlightedIndex;
                      const isActive = link.href === "/admin"
                        ? pathname === "/admin"
                        : pathname === link.href || pathname.startsWith(`${link.href}/`);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""} ${isHighlighted ? styles.sidebarLinkHighlighted : ""}`}
                        >
                          <span className={styles.sidebarIconText}>{link.icon}</span>
                          <span>{link.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ));
            })()
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.profileSection}>
            <div className={styles.profileAvatar}>
              {profile?.full_name?.charAt(0) || "A"}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{profile?.full_name || "Admin User"}</div>
              <div className={styles.profileRole}>Store Manager</div>
            </div>
          </div>
          <button onClick={handleSignOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </aside>

      <div className={styles.mainPane}>
        <header className={styles.topbar}>
          <h2 className={styles.topbarTitle}>{activeLink.name}</h2>
          <div className={styles.topbarActions}>
            <Link
              href="/"
              className={styles.topbarButton}
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              View Storefront
            </Link>
          </div>
        </header>

        <div className={styles.contentContainer}>
          <div className={styles.innerContent}>{children}</div>
        </div>
      </div>
    </div>
  );
}
