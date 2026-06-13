"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { placeOrder } from "../actions/orders";
import { CheckoutFormData, PAKISTAN_CITIES } from "@/types";
import { Button } from "@/components/storefront/Button/Button";
import styles from "./CheckoutForm.module.css";

export const CheckoutForm: React.FC = () => {
  const { cart, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
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
      cart.total
    );

    setIsLoading(false);

    if (result.success && result.orderId) {
      setOrderId(result.orderId);
      clearCart();
    } else {
      alert(`Order placement failed: ${result.error || "Please try again."}`);
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
        </section>

        {/* Payment options */}
        <section className={styles.inputGroup}>
          <h2 className={styles.sectionTitle}>
            Payment Method
          </h2>
          <div className={styles.paymentCard}>
            <div className={styles.paymentInfo}>
              <span className={styles.paymentIcon}>🚚</span>
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
                    <span className={styles.itemMeta}>
                      Size: {item.variant?.size || "Standard"} | Qty: {item.quantity}
                    </span>
                    <span className={styles.itemPrice}>
                      {formatPKR(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <hr className={styles.divider} />

          <div className={styles.priceBreakdown}>
            <div className={styles.priceRow}>
              <span>Subtotal</span>
              <span>{formatPKR(cart.subtotal)}</span>
            </div>
            <div className={styles.priceRow}>
              <span>Shipping</span>
              <span>
                {cart.shipping === 0 ? "FREE" : formatPKR(cart.shipping)}
              </span>
            </div>
            <hr className={styles.divider} />
            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalPrice}>{formatPKR(cart.total)}</span>
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
