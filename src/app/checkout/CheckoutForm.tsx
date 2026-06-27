"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { placeOrder } from "../actions/orders";
import { CheckoutFormData, PAKISTAN_CITIES, PromoCode } from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import { createClient } from "@/lib/supabase/client";
import {
  cartToAnalyticsItems,
  isPurchaseAlreadyTracked,
  markPurchaseTracked,
  trackEcommerceEvent,
  trackEvent,
  trackSanitizedSupabaseError,
} from "@/lib/analytics";
import styles from "./CheckoutForm.module.css";

export const CheckoutForm: React.FC = () => {
  const supabase = createClient();
  const { cart, clearCart } = useCart();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});
  const [rememberMe, setRememberMe] = useState(false);

  React.useEffect(() => {
    if (cart.items.length === 0) return;
    trackEcommerceEvent("begin_checkout", {
      value: cart.total,
      items: cartToAnalyticsItems(cart, appliedPromo?.code),
      coupon: appliedPromo?.code,
    });
    trackEcommerceEvent("add_payment_info", {
      value: cart.total,
      payment_type: "cod",
      items: cartToAnalyticsItems(cart, appliedPromo?.code),
      coupon: appliedPromo?.code,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    // 1. Load remembered details if they exist
    const saved = localStorage.getItem("ayra_checkout_remembered_details");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
        }));
        setRememberMe(true);
      } catch (err) {
        console.error("Failed to parse remembered details:", err);
      }
    }

    // 2. Load user session email if authenticated
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          setFormData((prev) => ({
            ...prev,
            email: prev.email || user.email || "",
          }));
        }
      } catch (err) {
        console.error("Failed to fetch authenticated user session:", err);
      }
    };
    getUser();
  }, [supabase]);

  const formatPKR = (amount: number) => {
    return Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CheckoutFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Promo calculations
  const getPromoDiscount = (): number => {
    if (!appliedPromo) return 0;
    
    // Check if category restriction applies
    if (appliedPromo.applicable_category_ids && appliedPromo.applicable_category_ids.length > 0) {
      const eligibleItems = cart.items.filter(
        (item) => item.product.category_id && appliedPromo.applicable_category_ids?.includes(item.product.category_id)
      );
      
      const eligibleSubtotal = eligibleItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
      
      if (appliedPromo.discount_type === "percentage") {
        return Math.floor(eligibleSubtotal * (appliedPromo.discount_value / 100));
      } else {
        return Math.min(appliedPromo.discount_value, eligibleSubtotal);
      }
    } else {
      // General discount
      if (appliedPromo.discount_type === "percentage") {
        return Math.floor(cart.subtotal * (appliedPromo.discount_value / 100));
      } else {
        return Math.min(appliedPromo.discount_value, cart.subtotal);
      }
    }
  };

  const discountAmount = getPromoDiscount();
  const finalTotal = Math.max(0, cart.subtotal - discountAmount) + cart.shipping;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    setPromoError(null);
    setIsValidatingPromo(true);
    const codeString = promoCodeInput.trim().toUpperCase();

    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", codeString)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setPromoError("Invalid promo code.");
        setAppliedPromo(null);
        trackEvent("promo_validation_failed", {
          error_category: "invalid_code",
          coupon: codeString,
        });
        return;
      }

      const promo = data as PromoCode;

      // Validate dates
      const now = new Date();
      if (promo.start_date && new Date(promo.start_date) > now) {
        setPromoError("This promo is not active yet.");
        setAppliedPromo(null);
        trackEvent("promo_validation_failed", {
          error_category: "not_started",
          coupon: codeString,
        });
        return;
      }
      if (promo.end_date && new Date(promo.end_date) < now) {
        setPromoError("This promo code has expired.");
        setAppliedPromo(null);
        trackEvent("promo_validation_failed", {
          error_category: "expired",
          coupon: codeString,
        });
        return;
      }

      // Validate category requirements
      if (promo.applicable_category_ids && promo.applicable_category_ids.length > 0) {
        const hasEligibleItems = cart.items.some(
          (item) => item.product.category_id && promo.applicable_category_ids?.includes(item.product.category_id)
        );

        if (!hasEligibleItems) {
          setPromoError("This promo is not applicable to items in your cart.");
          setAppliedPromo(null);
          trackEvent("promo_validation_failed", {
            error_category: "ineligible_cart",
            coupon: codeString,
          });
          return;
        }
      }

      setAppliedPromo(promo);
      setPromoCodeInput("");
      trackEvent("apply_promo", {
        coupon: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      });
    } catch (err) {
      console.error("Promo validation error:", err);
      trackSanitizedSupabaseError("promo_validation", err);
      trackEvent("promo_apply_error", { error_category: "validation_failed" });
      setPromoError("Failed to validate promo code.");
      setAppliedPromo(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    trackEvent("remove_promo", {
      coupon: appliedPromo?.code,
    });
    setAppliedPromo(null);
    setPromoError(null);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Valid email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address_line_1.trim())
      newErrors.address_line_1 = "Address is required";
    if (!formData.city) newErrors.city = "City selection is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.postal_code.trim()) newErrors.postal_code = "Postal code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (cart.items.length === 0) return;

    setIsLoading(true);
    trackEcommerceEvent("add_shipping_info", {
      value: finalTotal,
      shipping_tier: cart.shipping === 0 ? "free_shipping" : "flat_rate",
      items: cartToAnalyticsItems(cart, appliedPromo?.code),
      coupon: appliedPromo?.code,
    });

    const cartItemsPayload = cart.items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const result = await placeOrder(
      formData,
      cartItemsPayload,
      cart.subtotal,
      cart.shipping,
      finalTotal,
      appliedPromo?.code || null,
      discountAmount
    );

    setIsLoading(false);

    if (result.success && result.orderId) {
      if (!isPurchaseAlreadyTracked(result.orderId)) {
        trackEcommerceEvent("purchase", {
          transaction_id: result.orderId,
          value: finalTotal,
          subtotal: cart.subtotal,
          shipping: cart.shipping,
          discount: discountAmount,
          coupon: appliedPromo?.code,
          payment_type: "cod",
          items: cartToAnalyticsItems(cart, appliedPromo?.code),
        });
        markPurchaseTracked(result.orderId);
      }
      if (rememberMe) {
        const detailsToSave = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
        };
        localStorage.setItem("ayra_checkout_remembered_details", JSON.stringify(detailsToSave));
      } else {
        localStorage.removeItem("ayra_checkout_remembered_details");
      }
      setOrderId(result.orderId);
      clearCart();
      toast.success("Order placed successfully!");
    } else {
      trackEvent("order_failed", {
        error_category: result.error ? "server_error" : "unknown",
      });
      toast.error(`Order placement failed: ${result.error || "Please try again."}`);
    }
  };

  // Success view
  if (orderId) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.successTitle}>Order Placed Successfully!</h2>
        <p className={styles.successText}>
          Thank you for shopping with <strong>Ayraa</strong>. Your order has been registered under
          ID: <strong>#{orderId}</strong>.
        </p>
        <p className={styles.successTextMuted}>
          We will contact you shortly on <strong>{formData.phone}</strong> to confirm your Cash on Delivery shipping.
        </p>
        <Link href="/" className="mt-2">
          <Button variant="luxury" size="lg">
            Return to Homepage
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Left side Form inputs */}
      <div className={styles.formSection}>
        {/* Contact Info */}
        <section className={styles.inputGroup}>
          <h2 className={styles.sectionTitle}>
            Contact Information
          </h2>
          <div className={styles.grid2Col}>
            <div className={styles.fieldContainer}>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.input}
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>
            <div className={styles.fieldContainer}>
              <input
                type="tel"
                name="phone"
                placeholder="Mobile Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.input}
              />
              {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
            </div>
          </div>
        </section>

        {/* Shipping Address */}
        <section className={styles.inputGroup}>
          <h2 className={styles.sectionTitle}>
            Shipping Address
          </h2>
          <div className={styles.grid2Col}>
            <div className={styles.fieldContainer}>
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={styles.input}
              />
              {errors.first_name && <span className={styles.errorText}>{errors.first_name}</span>}
            </div>
            <div className={styles.fieldContainer}>
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={styles.input}
              />
              {errors.last_name && <span className={styles.errorText}>{errors.last_name}</span>}
            </div>
          </div>

          <div className={styles.fieldContainer}>
            <input
              type="text"
              name="address_line_1"
              placeholder="Address Line 1"
              value={formData.address_line_1}
              onChange={handleInputChange}
              className={styles.input}
            />
            {errors.address_line_1 && (
              <span className={styles.errorText}>{errors.address_line_1}</span>
            )}
          </div>

          <div className={styles.fieldContainer}>
            <input
              type="text"
              name="address_line_2"
              placeholder="Address Line 2 (Apartment, suite, unit etc. - Optional)"
              value={formData.address_line_2}
              onChange={handleInputChange}
              className={styles.input}
            />
          </div>

          <div className={styles.grid3Col}>
            <div className={styles.fieldContainer}>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="" className={styles.selectOption}>Select City</option>
                {PAKISTAN_CITIES.map((city) => (
                  <option key={city} value={city} className={styles.selectOption}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && <span className={styles.errorText}>{errors.city}</span>}
            </div>
            <div className={styles.fieldContainer}>
              <input
                type="text"
                name="state"
                placeholder="Province / State"
                value={formData.state}
                onChange={handleInputChange}
                className={styles.input}
              />
              {errors.state && <span className={styles.errorText}>{errors.state}</span>}
            </div>
            <div className={styles.fieldContainer}>
              <input
                type="text"
                name="postal_code"
                placeholder="Postal Code"
                value={formData.postal_code}
                onChange={handleInputChange}
                className={styles.input}
              />
              {errors.postal_code && (
                <span className={styles.errorText}>{errors.postal_code}</span>
              )}
            </div>
          </div>

          {/* Remember Me checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px" }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--color-gold)", cursor: "pointer" }}
            />
            <label htmlFor="rememberMe" style={{ fontSize: "13px", color: "var(--color-on-surface-sub)", cursor: "pointer", userSelect: "none" }}>
              Remember my details for next time
            </label>
          </div>
        </section>

        {/* Payment options */}
        <section className={styles.inputGroup}>
          <h2 className={styles.sectionTitle}>
            Payment Method
          </h2>
          <div className={styles.paymentCard}>
            <div className={styles.paymentInfo}>
              <span className={styles.paymentIcon}>COD</span>
              <div className={styles.paymentText}>
                <h4 className={styles.paymentTitle}>Cash on Delivery (COD)</h4>
                <p className={styles.paymentDesc}>Pay with cash upon delivery to your doorstep.</p>
              </div>
            </div>
            <div className={styles.radioCircle}>
              <div className={styles.radioDot} />
            </div>
          </div>
        </section>
      </div>

      {/* Right side Summary cards */}
      <div className={styles.sidebarSection}>
        <div className={styles.summaryBox}>
          <h3 className={styles.summaryTitle}>Your Order</h3>
          
          <div className={styles.itemsList}>
            {cart.items.map((item) => {
              const itemImage =
                item.product.images?.find((img) => img.is_primary) ||
                item.product.images?.[0];
              const itemKey = `${item.product_id}-${item.variant_id}`;

              return (
                <div key={itemKey} className={styles.itemRow}>
                  <div className={styles.itemImageWrapper}>
                    {itemImage ? (
                      <Image
                        src={itemImage.url}
                        alt={itemImage.alt_text || item.product.name}
                        fill
                        sizes="60px"
                        className={styles.itemImage}
                      />
                    ) : (
                      <div className="w-full h-full bg-bg" />
                    )}
                  </div>
                  <div className={styles.itemDetails}>
                    <h4 className={styles.itemName}>{item.product.name}</h4>
                    {(() => {
                      const displayColor = item.variant?.color && item.variant.color !== "Standard"
                        ? item.variant.color
                        : (item.product.color && item.product.color !== "Standard" ? item.product.color : null);
                      const displaySize = item.variant?.size && !["Standard", "One Size", "OS"].includes(item.variant.size)
                        ? item.variant.size
                        : null;
                      return (
                        <span className={styles.itemMeta}>
                          {[
                            displaySize ? `Size: ${displaySize}` : null,
                            displayColor ? `Color: ${displayColor}` : null,
                            `Qty: ${item.quantity}`
                          ].filter(Boolean).join(" | ")}
                        </span>
                      );
                    })()}
                    <span className={styles.itemPrice}>
                      {formatPKR(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <hr className={styles.divider} />

          {/* Promo code box */}
          <div className={styles.promoContainer}>
            {!appliedPromo ? (
              <div className={styles.promoForm}>
                <input
                  type="text"
                  placeholder="Promo Code (e.g. SUMMER20)"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className={styles.promoInput}
                  disabled={isValidatingPromo}
                  style={{ textTransform: "uppercase" }}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className={styles.promoBtn}
                  disabled={isValidatingPromo || !promoCodeInput.trim()}
                >
                  {isValidatingPromo ? "..." : "Apply"}
                </button>
              </div>
            ) : (
              <div className={styles.promoApplied}>
                <span className={styles.promoAppliedText}>
                  Promo <strong>{appliedPromo.code}</strong> applied
                </span>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className={styles.promoRemoveBtn}
                >
                  Remove
                </button>
              </div>
            )}
            {promoError && <p className={styles.promoError}>{promoError}</p>}
          </div>

          <hr className={styles.divider} />

          <div className={styles.priceBreakdown}>
            <div className={styles.priceRow}>
              <span>Subtotal</span>
              <span>{formatPKR(cart.subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className={styles.priceRow} style={{ color: "var(--color-gold)", fontWeight: "bold" }}>
                <span>Discount ({appliedPromo?.code})</span>
                <span>-{formatPKR(discountAmount)}</span>
              </div>
            )}
            <div className={styles.priceRow}>
              <span>Shipping</span>
              <span>
                {cart.shipping === 0 ? "FREE" : formatPKR(cart.shipping)}
              </span>
            </div>
            <hr className={styles.divider} />
            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalPrice}>{formatPKR(finalTotal)}</span>
            </div>
          </div>

          <div className={styles.buttonWrapper}>
            <Button
              type="submit"
              variant="luxury"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={cart.items.length === 0}
            >
              Place Order (COD) &rarr;
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
