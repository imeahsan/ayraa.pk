"use client";

import React, { useEffect, useState } from "react";
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
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p className="font-body text-sm text-admin-text-sub">Loading Ayra Admin Panel...</p>
      </div>
    );
  }

  const navLinks = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Products", href: "/admin/products", icon: "📦" },
    { name: "Sales Manager", href: "/admin/sales", icon: "🔥" },
    { name: "Orders", href: "/admin/orders", icon: "🛒" },
    { name: "Categories", href: "/admin/categories", icon: "🗂️" },
    { name: "Product Q&A", href: "/admin/qa", icon: "❓" },
    { name: "Product Reviews", href: "/admin/reviews", icon: "⭐" },
    { name: "Customers", href: "/admin/customers", icon: "👥" },
    { name: "Promo Codes", href: "/admin/promos", icon: "🎫" },
    { name: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogoSection}>
          <Link href="/" className={styles.sidebarLogo}>
            AYRAA
          </Link>
          <span className={styles.sidebarSubtitle}>Admin Panel</span>
        </div>

        <nav className={styles.sidebarNav}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.sidebarLink} ${
                  isActive ? styles.sidebarLinkActive : ""
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            );
          })}
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

      {/* Main Content Pane */}
      <div className={styles.mainPane}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <h2 className={styles.topbarTitle}>
            {navLinks.find((l) => l.href === pathname)?.name || "Admin"}
          </h2>
          <div className={styles.topbarActions}>
            <Link href="/" className={styles.topbarButton} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              🏪 View Storefront
            </Link>
          </div>
        </header>

        {/* Dynamic page content */}
        <div className={styles.contentContainer}>
          <div className={styles.innerContent}>{children}</div>
        </div>
      </div>
    </div>
  );
}
