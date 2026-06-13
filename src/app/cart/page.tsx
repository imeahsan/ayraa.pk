"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { Button } from "@/components/storefront/Button/Button";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
import styles from "./cart.module.css";

export default function CartPage() {
  const { cart, updateQuantity, removeItem } = useCart();

  const FREE_SHIPPING_THRESHOLD = 5000;
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - cart.subtotal;
  const isFreeShipping = amountToFreeShipping <= 0;

  const formatPKR = (amount: number) => {
    return Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />
      
      <main className="grow">
        <div className={styles.container}>
          <Breadcrumb items={[{ label: "Shopping Bag", url: "/cart" }]} />

          <h1 className={styles.pageTitle}>
            Your Shopping Bag
          </h1>

          {cart.items.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Your shopping bag is currently empty.</p>
              <Link href="/collections/ready-to-wear">
                <Button variant="luxury" size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className={styles.layout}>
              {/* Left Side: Items list */}
              <div className={styles.itemsCol}>
                {/* Shipping progress indicator */}
                <div className={styles.progressCard}>
                  {isFreeShipping ? (
                    <p className={styles.progressText}>
                      Your order qualifies for <strong>Free Shipping</strong>!
                    </p>
                  ) : (
                    <p className={styles.progressText}>
                      You are only <strong>{formatPKR(amountToFreeShipping)}</strong> away
                      from <strong>Free Shipping</strong>.
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

                {/* Items Grid */}
                <div className={styles.tableHeader}>
                  <span>Product</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-right">Total</span>
                </div>

                <div className={styles.itemsList}>
                  {cart.items.map((item) => {
                    const itemImage =
                      item.product.images?.find((img) => img.is_primary) ||
                      item.product.images?.[0];
                    const itemKey = `${item.product_id}-${item.variant_id}`;

                    return (
                      <div key={itemKey} className={styles.itemRow}>
                        {/* Image & Title Info */}
                        <div className={styles.itemProduct}>
                          <div className={styles.itemImageWrapper}>
                            {itemImage ? (
                              <Image
                                src={itemImage.url}
                                alt={itemImage.alt_text || item.product.name}
                                fill
                                sizes="100px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-surface-container" />
                            )}
                          </div>
                          <div className={styles.itemDetails}>
                            <h3 className={styles.itemTitle}>
                              <Link href={`/product/${item.product.slug}`} className={styles.itemTitleLink}>
                                {item.product.name}
                              </Link>
                            </h3>
                            {item.variant?.size && (
                              <span className={styles.itemMeta}>
                                Size: {item.variant.size}
                              </span>
                            )}
                            <button
                              type="button"
                              className={styles.removeBtn}
                              onClick={() => removeItem(item.product_id, item.variant_id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Quantity selector */}
                        <div className={styles.itemQuantity}>
                          <div className={styles.quantitySelector}>
                            <button
                              type="button"
                              className={styles.quantityBtn}
                              onClick={() =>
                                updateQuantity(
                                  item.product_id,
                                  item.variant_id,
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className={styles.quantityVal}>{item.quantity}</span>
                            <button
                              type="button"
                              className={styles.quantityBtn}
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
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Line Total price */}
                        <div className={styles.itemTotal}>
                          <span className={styles.itemTotalVal}>
                            {formatPKR(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Order Summary */}
              <div className={styles.summaryCol}>
                <div className={styles.summaryCard}>
                  <h2 className={styles.summaryTitle}>Order Summary</h2>
                  
                  <div className={styles.summaryRows}>
                    <div className={styles.summaryRow}>
                      <span>Subtotal</span>
                      <span className={styles.summaryRowVal}>{formatPKR(cart.subtotal)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Shipping</span>
                      <span className={styles.summaryRowVal}>
                        {cart.shipping === 0 ? "FREE" : formatPKR(cart.shipping)}
                      </span>
                    </div>
                    
                    <hr className={styles.divider} />
                    
                    <div className={styles.totalRow}>
                      <span>Estimated Total</span>
                      <span className={styles.totalVal}>{formatPKR(cart.total)}</span>
                    </div>
                  </div>

                  <p className={styles.summaryMuted}>
                    Taxes, shipping costs, and promotions will be calculated at checkout.
                  </p>

                  <Link href="/checkout" style={{ width: "100%", display: "block" }}>
                    <Button variant="luxury" size="lg" fullWidth>
                      Proceed to Checkout
                    </Button>
                  </Link>

                  <Link href="/collections/ready-to-wear" className={styles.shopLink}>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
