"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Product, WishlistItem } from "@/types";
import { WishlistLoginModal } from "@/components/storefront/WishlistLoginModal/WishlistLoginModal";
import { productToAnalyticsItem, trackEcommerceEvent, trackEvent } from "@/lib/analytics";

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  wishlistReady: boolean;
  isLoggedIn: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabase] = useState(() => createClient());
  const toast = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistReady, setWishlistReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const loadWishlist = useCallback(async (userId: string | null) => {
    if (!userId) {
      setWishlistItems([]);
      return;
    }

    const { data, error } = await supabase
      .from("wishlist_items")
      .select(`
        id,
        user_id,
        product_id,
        created_at,
        product:products (
          *,
          category:categories (*),
          images:product_images (*),
          variants:product_variants (*)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load wishlist:", error);
      return;
    }

    setWishlistItems((data || []) as unknown as WishlistItem[]);
  }, [supabase]);

  const refreshWishlist = useCallback(async () => {
    await loadWishlist(currentUserId);
  }, [currentUserId, loadWishlist]);

  const syncAuthState = useCallback(async (userId: string | null) => {
    setCurrentUserId(userId);
    setIsLoggedIn(Boolean(userId));
    setWishlistReady(false);

    if (!userId) {
      setWishlistItems([]);
      setWishlistReady(true);
      return;
    }

    await loadWishlist(userId);
    setWishlistReady(true);
  }, [loadWishlist]);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        await syncAuthState(user?.id ?? null);
      } catch (error) {
        console.error("Failed to initialize wishlist state:", error);
        if (active) {
          setWishlistReady(true);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      await syncAuthState(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, syncAuthState]);

  const openLoginModal = useCallback(() => {
    trackEvent("wishlist_login_prompt");
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const ensureLoggedIn = useCallback(() => {
    if (!isLoggedIn) {
      openLoginModal();
      return false;
    }
    return true;
  }, [isLoggedIn, openLoginModal]);

  const isWishlisted = useCallback((productId: string) => {
    return wishlistItems.some((item) => item.product_id === productId);
  }, [wishlistItems]);

  const toggleWishlist = useCallback(async (product: Product) => {
    if (!ensureLoggedIn() || !currentUserId) {
      return false;
    }

    const existing = wishlistItems.find((item) => item.product_id === product.id);

    if (existing) {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", currentUserId);

      if (error) {
        console.error("Failed to remove wishlist item:", error);
        toast.error("Could not remove this item from your wishlist.");
        return false;
      }

      trackEcommerceEvent("remove_from_wishlist", {
        value: product.price,
        items: [productToAnalyticsItem(product)],
      });
      toast.info("Removed from your wishlist.");
    } else {
      const { error } = await supabase.from("wishlist_items").insert({
        user_id: currentUserId,
        product_id: product.id,
      });

      if (error) {
        console.error("Failed to add wishlist item:", error);
        toast.error("Could not save this item to your wishlist.");
        return false;
      }

      trackEcommerceEvent("add_to_wishlist", {
        value: product.price,
        items: [productToAnalyticsItem(product)],
      });
      toast.success("Added to your wishlist.");
    }

    await refreshWishlist();
    return true;
  }, [currentUserId, ensureLoggedIn, refreshWishlist, supabase, toast, wishlistItems]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!ensureLoggedIn() || !currentUserId) {
      return;
    }

    const existing = wishlistItems.find((item) => item.product_id === productId);
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", currentUserId)
      .eq("product_id", productId);

    if (error) {
      console.error("Failed to remove wishlist item:", error);
      toast.error("Could not remove this item from your wishlist.");
      return;
    }

    await refreshWishlist();
    if (existing?.product) {
      trackEcommerceEvent("remove_from_wishlist", {
        value: existing.product.price,
        items: [productToAnalyticsItem(existing.product)],
      });
    } else {
      trackEvent("remove_from_wishlist", { item_id: productId });
    }
    toast.info("Removed from your wishlist.");
  }, [currentUserId, ensureLoggedIn, refreshWishlist, supabase, toast, wishlistItems]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        wishlistReady,
        isLoggedIn,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        refreshWishlist,
      }}
    >
      {children}
      <WishlistLoginModal open={isLoginModalOpen} onClose={closeLoginModal} />
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
