"use client";

import React, { useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import styles from "./WishlistLoginModal.module.css";

interface WishlistLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export const WishlistLoginModal: React.FC<WishlistLoginModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.hint}>Wishlist requires sign in</div>
        <p className={styles.copy}>
          Sign in to save items, revisit them later, and keep your wishlist synced across devices.
        </p>
        <LoginForm redirectTo={null} onSuccess={onClose} onClose={onClose} />
      </div>
    </div>
  );
};
