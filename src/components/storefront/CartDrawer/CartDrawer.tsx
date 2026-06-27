"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Button } from "../Button/Button";
import { cartToAnalyticsItems, trackEcommerceEvent, trackEvent } from "@/lib/analytics";
import styles from "./CartDrawer.module.css";

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setCartOpen, updateQuantity, removeItem } = useCart();
  const FREE_SHIPPING_THRESHOLD = 5000;
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - cart.subtotal;
  const isFreeShipping = amountToFreeShipping <= 0;

  // Disable page scrolling when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  useEffect(() => {
    if (!isCartOpen || cart.items.length === 0) return;
    trackEvent("free_shipping_progress", {
      cart_value: cart.subtotal,
      threshold: FREE_SHIPPING_THRESHOLD,
      amount_remaining: Math.max(0, amountToFreeShipping),
      free_shipping_unlocked: isFreeShipping,
      currency: "PKR",
    });
  }, [amountToFreeShipping, cart.items.length, cart.subtotal, isCartOpen, isFreeShipping]);

  if (!isCartOpen) return null;

  const formatPKR = (amount: number) => {
    return Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={styles.overlay} onClick={() => setCartOpen(false)}>
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Shopping Bag ({cart.items.length})</h2>
          <button
            className={styles.closeBtn}
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          >
            &times;
          </button>
        </div>

        {/* Free Shipping Progress */}
        {cart.items.length > 0 && (
          <div className={styles.progressContainer}>
            {isFreeShipping ? (
              <p className={styles.progressText}>
                Congratulations! You have unlocked <strong>Free Shipping</strong>.
              </p>
            ) : (
              <p className={styles.progressText}>
                You are only <strong>{formatPKR(amountToFreeShipping)}</strong> away
                from <strong>Free Shipping</strong>!
              </p>
            )}
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(100, (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className={styles.itemList}>
          {cart.items.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p>Your shopping bag is empty.</p>
              <Button
                variant="primary"
                onClick={() => setCartOpen(false)}
                className="mt-2"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className={styles.itemContainer}>
              {cart.items.map((item) => {
                const itemImage =
                  item.product.images?.find((img) => img.is_primary) ||
                  item.product.images?.[0];
                const itemKey = `${item.product_id}-${item.variant_id}`;

                return (
                  <div key={itemKey} className={styles.item}>
                    <div className={styles.itemImageWrapper}>
                      {itemImage ? (
                        <Image
                          src={itemImage.url}
                          alt={itemImage.alt_text || item.product.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high" />
                      )}
                    </div>

                    <div className={styles.itemDetails}>
                      <div className={styles.itemHeader}>
                        <h3 className={styles.itemTitle}>
                          <Link
                            href={`/product/${item.product.slug}`}
                            onClick={() => setCartOpen(false)}
                            className={styles.itemTitleLink}
                          >
                            {item.product.name}
                          </Link>
                        </h3>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeItem(item.product_id, item.variant_id)}
                          aria-label="Remove item"
                        >
                          Remove
                        </button>
                      </div>

                      {(() => {
                        const displayColor = item.variant?.color && item.variant.color !== "Standard"
                          ? item.variant.color
                          : (item.product.color && item.product.color !== "Standard" ? item.product.color : null);
                        const displaySize = item.variant?.size && !["Standard", "One Size", "OS"].includes(item.variant.size)
                          ? item.variant.size
                          : null;
                        return (
                          <>
                            {displayColor && (
                              <span className={styles.itemMeta}>
                                Color: {displayColor}
                              </span>
                            )}
                            {displaySize && (
                              <span className={styles.itemMeta}>
                                Size: {displaySize}
                              </span>
                            )}
                          </>
                        );
                      })()}

                      <div className={styles.itemControls}>
                        <div className={styles.quantitySelector}>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product_id,
                                item.variant_id,
                                item.quantity - 1
                              )
                            }
                            disabled={item.quantity <= 1}
                            className={styles.quantityBtn}
                          >
                            -
                          </button>
                          <span className={styles.quantityValue}>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product_id,
                                item.variant_id,
                                item.quantity + 1
                              )
                            }
                            disabled={
                              item.variant
                                ? item.quantity >= item.variant.stock_quantity
                                : false
                            }
                            className={styles.quantityBtn}
                          >
                            +
                          </button>
                        </div>
                        <span className={styles.itemPrice}>
                          {formatPKR(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {cart.items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.footerRow}>
              <span>Subtotal</span>
              <span className={styles.footerVal}>{formatPKR(cart.subtotal)}</span>
            </div>
            <div className={styles.footerRow}>
              <span>Shipping</span>
              <span className={styles.footerVal}>
                {cart.shipping === 0 ? "FREE" : formatPKR(cart.shipping)}
              </span>
            </div>
            <hr className={styles.divider} />
            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalVal}>{formatPKR(cart.total)}</span>
            </div>
            <p className={styles.footerMuted}>Taxes and shipping calculated at checkout.</p>
            <Link
              href="/checkout"
              onClick={() => {
                trackEcommerceEvent("begin_checkout", {
                  value: cart.total,
                  items: cartToAnalyticsItems(cart),
                });
                setCartOpen(false);
              }}
              style={{ width: "100%", display: "block" }}
            >
              <Button variant="luxury" fullWidth size="lg">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
