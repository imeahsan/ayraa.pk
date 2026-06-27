"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
import { Button } from "@/components/storefront/Button/Button";
import { ProductCard } from "@/components/storefront/ProductCard/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import { productToAnalyticsItem, trackEcommerceEvent } from "@/lib/analytics";
import styles from "./wishlist.module.css";

export default function WishlistPage() {
  const { wishlistItems, wishlistReady, isLoggedIn, openLoginModal } = useWishlist();

  const wishlistProducts = React.useMemo(
    () =>
      wishlistItems
        .map((item) => item.product)
        .filter((product): product is NonNullable<typeof product> => Boolean(product)),
    [wishlistItems]
  );

  React.useEffect(() => {
    if (!wishlistReady || !isLoggedIn) return;
    trackEcommerceEvent("view_wishlist", {
      item_list_name: "Wishlist",
      items: wishlistProducts.map((product, index) =>
        productToAnalyticsItem(product, { listName: "Wishlist", index })
      ),
    });
  }, [isLoggedIn, wishlistProducts, wishlistReady]);

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.container}>
          <Breadcrumb items={[{ label: "Wishlist", url: "/wishlist" }]} />

          <div className={styles.hero}>
            <span className={styles.kicker}>Saved for later</span>
            <h1 className={styles.title}>Your Wishlist</h1>
            <p className={styles.copy}>
              Keep track of lawn, pret, and festive pieces you want to come back to.
            </p>
          </div>

          {!wishlistReady ? (
            <p className={styles.stateText}>Loading your wishlist...</p>
          ) : !isLoggedIn ? (
            <div className={styles.emptyState}>
              <p className={styles.stateText}>Sign in to view and manage your wishlist.</p>
              <div className={styles.actions}>
                <Button variant="luxury" size="lg" onClick={openLoginModal}>
                  Sign In
                </Button>
                <Link href="/collections">
                  <Button variant="outline" size="lg">
                    Browse Collections
                  </Button>
                </Link>
              </div>
            </div>
          ) : wishlistProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.stateText}>You have not saved any items yet.</p>
              <Link href="/collections">
                <Button variant="luxury" size="lg">
                  Browse Collections
                </Button>
              </Link>
            </div>
          ) : (
            <section className={styles.gridSection}>
              <div className={styles.grid}>
                {wishlistProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} listName="Wishlist" index={index} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
