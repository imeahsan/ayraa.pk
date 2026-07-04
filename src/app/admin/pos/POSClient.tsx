"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import { Product, Category, ProductVariant, UserProfile } from "@/types";
import { sendOrderEmailForOrder } from "@/app/actions/email";

interface CartItem {
  id: string; // variant_id
  product_id: string;
  variant_id: string;
  name: string;
  sku: string;
  size: string;
  price: number;
  quantity: number;
  stock: number;
}

interface PendingOrder {
  id: string;
  order_id: string;
  items: CartItem[];
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  shipping_address: any;
  contact_phone: string;
  contact_email: string;
  city: string;
  created_at: string;
}

const CATALOG_CACHE_KEY = "ayra_pos_catalog_cache_v2";
const CATALOG_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const DRAFT_SALE_KEY = "ayra_pos_draft_sale";
const OFFLINE_ORDERS_KEY = "ayra_pos_offline_orders";

export default function POSClient() {
  const supabase = createClient();
  const toast = useToast();

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [productBarcodes, setProductBarcodes] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [syncingCatalog, setSyncingCatalog] = useState(false);

  // Filters & UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer" | "cod">("cash");

  // Customer Section States
  const [customerType, setCustomerType] = useState<"guest" | "registered">("guest");
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [guestForm, setGuestForm] = useState({
    firstName: "In-Store",
    lastName: "Customer",
    phone: "03000000000",
    email: "pos-guest@ayraa.pk",
    city: "Karachi",
  });

  // Offline Sync Queue States
  const [offlineOrders, setOfflineOrders] = useState<PendingOrder[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [syncingOffline, setSyncingOffline] = useState(false);

  // Checkout Success Modal State
  const [completedOrder, setCompletedOrder] = useState<PendingOrder | null>(null);
  const [recordingOrder, setRecordingOrder] = useState(false);

  // Print Ref
  const receiptRef = useRef<HTMLDivElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const focusScanInput = () => {
    window.setTimeout(() => {
      scanInputRef.current?.focus();
      scanInputRef.current?.select();
    }, 0);
  };

  // Monitor network status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load Catalog & Customer profiles
  useEffect(() => {
    const initialize = async () => {
      await loadCatalog();
      await fetchCustomers();
      loadOfflineOrders();
      focusScanInput();
    };
    initialize();
  }, []);

  // Save Cart/Draft Session
  useEffect(() => {
    if (loadingCatalog) return;
    const session = {
      cart,
      discountType,
      discountValue,
      paymentMethod,
      customerType,
      selectedCustomer,
      guestForm,
    };
    localStorage.setItem(DRAFT_SALE_KEY, JSON.stringify(session));
  }, [cart, discountType, discountValue, paymentMethod, customerType, selectedCustomer, guestForm, loadingCatalog]);

  // Load Draft Session on Startup
  function loadDraftSession(availableVariants: ProductVariant[]) {
    try {
      const saved = localStorage.getItem(DRAFT_SALE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cart && Array.isArray(parsed.cart)) {
          // Verify stock levels against freshly loaded variants
          const validatedCart = parsed.cart.map((item: CartItem) => {
            const currentVariant = availableVariants.find((v) => v.id === item.variant_id);
            return {
              ...item,
              stock: currentVariant ? currentVariant.stock_quantity : item.stock,
            };
          });
          setCart(validatedCart);
        }
        if (parsed.discountType) setDiscountType(parsed.discountType);
        if (parsed.discountValue) setDiscountValue(parsed.discountValue);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.customerType) setCustomerType(parsed.customerType);
        if (parsed.selectedCustomer) setSelectedCustomer(parsed.selectedCustomer);
        if (parsed.guestForm) setGuestForm(parsed.guestForm);
      }
    } catch (e) {
      console.error("Failed to load draft POS session:", e);
    }
  }

  // Catalog Fetching with Caching
  async function loadCatalog(forceRefresh = false) {
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CATALOG_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          if (age < CATALOG_CACHE_TTL && parsed.products && parsed.categories && parsed.variants) {
            setProducts(parsed.products);
            setCategories(parsed.categories);
            setVariants(parsed.variants);
            setProductBarcodes(parsed.productBarcodes || {});
            loadDraftSession(parsed.variants);
            setLoadingCatalog(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse catalog cache:", e);
      }
    }

    setSyncingCatalog(true);
    try {
      const [productsRes, categoriesRes, variantsRes, barcodesRes] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("name", { ascending: true }),
        supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("product_variants").select("*").order("size", { ascending: true }),
        supabase.from("product_barcodes").select("product_id, barcode"),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (variantsRes.error) throw variantsRes.error;
      if (barcodesRes.error) throw barcodesRes.error;

      const prods = productsRes.data as Product[];
      const cats = categoriesRes.data as Category[];
      const vars = variantsRes.data as ProductVariant[];
      const barcodes = Object.fromEntries(
        ((barcodesRes.data || []) as { product_id: string; barcode: string }[]).map((row) => [
          row.product_id,
          row.barcode,
        ])
      );

      setProducts(prods);
      setCategories(cats);
      setVariants(vars);
      setProductBarcodes(barcodes);

      // Save to cache
      const cacheData = {
        timestamp: Date.now(),
        products: prods,
        categories: cats,
        variants: vars,
        productBarcodes: barcodes,
      };
      localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(cacheData));
      loadDraftSession(vars);
    } catch (e: any) {
      console.error("Failed to fetch fresh catalog:", e);
      toast.error(`Failed to load catalog: ${e.message}`);
    } finally {
      setLoadingCatalog(false);
      setSyncingCatalog(false);
    }
  }

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("full_name", { ascending: true });
      if (!error && data) {
        setCustomers(data as UserProfile[]);
      }
    } catch (e) {
      console.error("Failed to load customer profiles:", e);
    }
  }

  function loadOfflineOrders() {
    try {
      const saved = localStorage.getItem(OFFLINE_ORDERS_KEY);
      if (saved) {
        setOfflineOrders(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load offline sync orders:", e);
    }
  }

  function saveOfflineOrders(ordersList: PendingOrder[]) {
    setOfflineOrders(ordersList);
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(ordersList));
  }

  // Filter products based on search term & category selection
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      if (!query) return !selectedCategoryId || p.category_id === selectedCategoryId;

      const matchesSearch =
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (productBarcodes[p.id] && productBarcodes[p.id].toLowerCase().includes(query));
      const matchesCategory = !selectedCategoryId || p.category_id === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, productBarcodes, searchTerm, selectedCategoryId]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return [];
    return customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(customerSearchTerm))
    );
  }, [customers, customerSearchTerm]);

  // Cart operations
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleScanLookup = (rawCode = searchTerm) => {
    const code = rawCode.trim();
    if (!code) return;

    const normalizedCode = code.toLowerCase();
    const product = products.find((p) => {
      const barcode = productBarcodes[p.id]?.toLowerCase();
      const sku = p.sku?.toLowerCase();
      return barcode === normalizedCode || sku === normalizedCode;
    });

    if (!product) {
      toast.warning("No product found for this barcode.");
      return;
    }

    const productVariants = variants.filter((v) => v.product_id === product.id);
    const availableVariants = productVariants.filter((v) => v.is_available && v.stock_quantity > 0);

    if (availableVariants.length === 0) {
      toast.warning(`${product.name} is out of stock.`);
      return;
    }

    if (availableVariants.length === 1) {
      addToCart(product, availableVariants[0]);
      setSearchTerm("");
      focusScanInput();
      return;
    }

    setSelectedProduct(product);
    setSearchTerm("");
  };

  const addToCart = (product: Product, variant: ProductVariant) => {
    if (variant.stock_quantity <= 0) {
      toast.warning(`${product.name} (Size: ${variant.size}) is out of stock!`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.variant_id === variant.id);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= variant.stock_quantity) {
        toast.warning(`Cannot exceed available stock of ${variant.stock_quantity}.`);
        return;
      }
      setCart((prev) =>
        prev.map((item, idx) => (idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item))
      );
    } else {
      const newItem: CartItem = {
        id: variant.id,
        product_id: product.id,
        variant_id: variant.id,
        name: product.name,
        sku: product.sku || "N/A",
        size: variant.size,
        price: Number(product.price),
        quantity: 1,
        stock: variant.stock_quantity,
      };
      setCart((prev) => [...prev, newItem]);
    }
    toast.success(`Added ${product.name} (Size: ${variant.size}) to cart.`);
    setSelectedProduct(null);
    focusScanInput();
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant_id !== variantId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            toast.warning(`Cannot exceed available stock of ${item.stock}.`);
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue("0");
    setSelectedCustomer(null);
    setGuestForm({
      firstName: "In-Store",
      lastName: "Customer",
      phone: "03000000000",
      email: "pos-guest@ayraa.pk",
      city: "Karachi",
    });
  };

  // Live Math calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (discountType === "percent") {
      return Math.round((subtotal * val) / 100);
    }
    return val;
  }, [subtotal, discountType, discountValue]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Order Submission Handler
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning("Cart is empty.");
      return;
    }

    let contactPhone = "";
    let contactEmail = "";
    let contactCity = "";
    let shippingAddress: any = {};

    if (customerType === "registered") {
      if (!selectedCustomer) {
        toast.warning("Please select a customer profile.");
        return;
      }
      contactPhone = selectedCustomer.phone || "03000000000";
      contactEmail = selectedCustomer.email;
      contactCity = "Karachi";
      shippingAddress = {
        first_name: selectedCustomer.full_name?.split(" ")[0] || "Registered",
        last_name: selectedCustomer.full_name?.split(" ").slice(1).join(" ") || "Customer",
        address_line_1: "In-Store Registered Sale",
        city: "Karachi",
        state: "Sindh",
        postal_code: "00000",
        country: "Pakistan",
      };
    } else {
      if (!guestForm.firstName.trim() || !guestForm.phone.trim()) {
        toast.warning("First name and phone number are required for guest sale.");
        return;
      }
      contactPhone = guestForm.phone;
      contactEmail = guestForm.email || "pos-guest@ayraa.pk";
      contactCity = guestForm.city;
      shippingAddress = {
        first_name: guestForm.firstName,
        last_name: guestForm.lastName,
        address_line_1: "In-Store POS Sale (Physical)",
        city: guestForm.city,
        state: "Sindh",
        postal_code: "00000",
        country: "Pakistan",
      };
    }

    const orderId = `AYR-${Math.floor(100000 + Math.random() * 900000)}`;
    const pendingOrderObj: PendingOrder = {
      id: Math.random().toString(36).substring(2, 9),
      order_id: orderId,
      items: cart,
      subtotal,
      shipping_cost: 0,
      discount_amount: discountAmount,
      total,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      city: contactCity,
      created_at: new Date().toISOString(),
    };

    if (!isOnline) {
      // Queue offline
      const queue = [...offlineOrders, pendingOrderObj];
      saveOfflineOrders(queue);
      toast.success("Order queued locally (Offline mode).");
      setCompletedOrder(pendingOrderObj);
      clearCart();
      return;
    }

    setRecordingOrder(true);
    try {
      // 1. Save order to Supabase
      const { error: orderError } = await supabase.from("orders").insert({
        id: pendingOrderObj.order_id,
        user_id: selectedCustomer ? selectedCustomer.id : null,
        status: "delivered", // Immediately fulfilled
        payment_method: paymentMethod,
        subtotal: subtotal,
        shipping_cost: 0,
        total: total,
        discount_amount: discountAmount,
        shipping_address: shippingAddress,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        city: contactCity,
      });

      if (orderError) throw orderError;

      // 2. Save items
      const orderItemsPayload = cart.map((item) => ({
        order_id: pendingOrderObj.order_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);
      if (itemsError) throw itemsError;

      // 3. Decrement stock levels in database
      for (const item of cart) {
        const { data: currentVariant, error: varError } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", item.variant_id)
          .single();

        if (!varError && currentVariant) {
          const newQty = Math.max(0, currentVariant.stock_quantity - item.quantity);
          await supabase
            .from("product_variants")
            .update({ stock_quantity: newQty })
            .eq("id", item.variant_id);
        }
      }

      const emailResult = await sendOrderEmailForOrder(pendingOrderObj.order_id);
      if (!emailResult.success) {
        console.error(`POS order ${pendingOrderObj.order_id} email failed:`, emailResult.error);
        toast.warning("Order recorded, but email could not be sent.");
      }

      toast.success("Order recorded successfully!");
      setCompletedOrder(pendingOrderObj);
      clearCart();
      focusScanInput();
      // Reload catalog to sync stock quantities
      await loadCatalog(true);
    } catch (err: any) {
      console.error("POS transaction failed:", err);
      // Fallback: Queue offline for manual sync later
      const queue = [...offlineOrders, pendingOrderObj];
      saveOfflineOrders(queue);
      toast.warning(`Transaction error: ${err.message || "Saved locally in sync queue."}`);
      setCompletedOrder(pendingOrderObj);
      clearCart();
      focusScanInput();
    } finally {
      setRecordingOrder(false);
    }
  };

  // Sync Offline Queue
  const syncOfflineOrders = async () => {
    if (offlineOrders.length === 0 || syncingOffline) return;
    setSyncingOffline(true);
    toast.success(`Syncing ${offlineOrders.length} offline orders...`);

    const remainingOrders: PendingOrder[] = [];

    for (const order of offlineOrders) {
      try {
        const { error: orderError } = await supabase.from("orders").insert({
          id: order.order_id,
          status: "delivered",
          payment_method: order.payment_method,
          subtotal: order.subtotal,
          shipping_cost: 0,
          total: order.total,
          discount_amount: order.discount_amount,
          shipping_address: order.shipping_address,
          contact_phone: order.contact_phone,
          contact_email: order.contact_email,
          city: order.city,
          created_at: order.created_at,
        });

        if (orderError) throw orderError;

        const orderItemsPayload = order.items.map((item) => ({
          order_id: order.order_id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);
        if (itemsError) throw itemsError;

        // Decrement stock levels
        for (const item of order.items) {
          const { data: currentVariant } = await supabase
            .from("product_variants")
            .select("stock_quantity")
            .eq("id", item.variant_id)
            .single();

          if (currentVariant) {
            const newQty = Math.max(0, currentVariant.stock_quantity - item.quantity);
            await supabase
              .from("product_variants")
              .update({ stock_quantity: newQty })
              .eq("id", item.variant_id);
          }
        }

        const emailResult = await sendOrderEmailForOrder(order.order_id);
        if (!emailResult.success) {
          console.error(`Offline synced order ${order.order_id} email failed:`, emailResult.error);
        }
      } catch (err) {
        console.error(`Failed to sync offline order ${order.order_id}:`, err);
        remainingOrders.push(order);
      }
    }

    saveOfflineOrders(remainingOrders);
    setSyncingOffline(false);

    if (remainingOrders.length === 0) {
      toast.success("All offline orders synced successfully!");
      await loadCatalog(true);
    } else {
      toast.error(`Sync finished. ${remainingOrders.length} orders failed to sync.`);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const formatPKR = (amount: number) =>
    Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  return (
    <div className="pos-terminal-layout">
      {/* Global & Local CSS overrides specifically to implement viewports/split panes */}
      <style dangerouslySetInnerHTML={{ __html: `
        .pos-terminal-layout {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 120px);
          gap: 16px;
          color: #fff;
          font-family: inherit;
        }

        .pos-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 12px 18px;
          border-radius: 6px;
        }

        .pos-split-container {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
          flex: 1;
          min-height: 0; /* Important to enforce scroll boundaries */
        }

        .pos-panel {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .pos-panel-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #1f1f1f;
        }

        .pos-panel-scrollable {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        /* Styling custom scrollbars for POS */
        .pos-panel-scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .pos-panel-scrollable::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .pos-panel-scrollable::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .pos-panel-scrollable::-webkit-scrollbar-thumb:hover {
          background: var(--admin-card-border, #d4af37);
        }

        /* Search wrap styling */
        .pos-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
        }
        .pos-search-clear {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 16px;
          cursor: pointer;
          padding: 0;
        }
        .pos-search-clear:hover {
          color: #fff;
        }

        /* Horizontal category tabs */
        .pos-tabs-scrollable {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .pos-tabs-scrollable::-webkit-scrollbar {
          height: 3px;
        }
        .pos-tabs-scrollable::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 2px;
        }
        .pos-tab-button {
          padding: 6px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: rgba(255,255,255,0.7);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .pos-tab-button:hover {
          background: rgba(255,255,255,0.06);
          color: #fff;
        }
        .pos-tab-button-active {
          background: var(--admin-card-border, #d4af37);
          color: #111;
          border-color: var(--admin-card-border, #d4af37);
          font-weight: 600;
        }

        /* Compact grids */
        .pos-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 12px;
        }

        .pos-product-card {
          background: #222222;
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 6px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 120px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pos-product-card:hover {
          border-color: var(--admin-card-border, #d4af37);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        /* Cart details stack */
        .pos-cart-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pos-cart-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        /* Segmented forms */
        .pos-form-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          padding: 14px;
          border-radius: 6px;
          margin-bottom: 14px;
        }
        .pos-panel select {
          background-color: #222222 !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .pos-panel select option {
          background-color: #222222 !important;
          color: #ffffff !important;
        }
        .pos-form-section-title {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          color: var(--admin-card-border, #d4af37);
        }

        /* Checkout summary */
        .pos-summary-block {
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .pos-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .pos-summary-total {
          display: flex;
          justify-content: space-between;
          font-size: 15px;
          font-weight: 700;
          color: var(--admin-card-border, #d4af37);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 8px;
          margin-top: 4px;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .print-receipt, .print-receipt * {
            visibility: visible;
          }
          .print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      ` }} />

      {/* Offline sync queue banners */}
      {!isOnline && (
        <div style={{ background: "#ef4444", color: "#fff", padding: "10px 16px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
          <span><strong>Offline Mode</strong>: Transactions will be saved locally.</span>
          {offlineOrders.length > 0 && <span>{offlineOrders.length} orders pending sync</span>}
        </div>
      )}

      {isOnline && offlineOrders.length > 0 && (
        <div style={{ background: "var(--admin-card-border, #d4af37)", color: "#111", padding: "10px 16px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
          <span>You have <strong>{offlineOrders.length}</strong> offline transactions pending sync.</span>
          <button
            onClick={syncOfflineOrders}
            disabled={syncingOffline}
            style={{
              padding: "6px 14px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontWeight: 600,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            {syncingOffline ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      )}

      {/* Split viewport pane */}
      <div className="pos-split-container">
        {/* Left Side: Product Selector (Catalog) */}
        <div className="pos-panel">
          <div className="pos-panel-header">
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div className="pos-search-wrapper">
                <input
                  ref={scanInputRef}
                  type="text"
                  placeholder="Scan barcode or search name/SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onInput={(e) => setSearchTerm(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleScanLookup(e.currentTarget.value);
                    }
                  }}
                  className="font-body text-sm text-admin-text-main"
                  style={{
                    width: "100%",
                    padding: "8px 32px 8px 12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "4px",
                    color: "#fff",
                  }}
                />
                {searchTerm && (
                  <button
                    className="pos-search-clear"
                    onClick={() => {
                      setSearchTerm("");
                      focusScanInput();
                    }}
                  >
                    &times;
                  </button>
                )}
              </div>

              <button
                onClick={() => loadCatalog(true)}
                disabled={syncingCatalog}
                style={{
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {syncingCatalog ? "🔄 Syncing..." : "🔄 Sync"}
              </button>
              <button
                onClick={() => handleScanLookup()}
                disabled={!searchTerm.trim()}
                style={{
                  padding: "8px 14px",
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.35)",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "12px",
                  cursor: searchTerm.trim() ? "pointer" : "not-allowed",
                }}
              >
                Scan
              </button>
            </div>

            {/* Horizontal Category Pill Tabs */}
            <div className="pos-tabs-scrollable">
              <button
                className={`pos-tab-button ${!selectedCategoryId ? "pos-tab-button-active" : ""}`}
                onClick={() => setSelectedCategoryId("")}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`pos-tab-button ${selectedCategoryId === c.id ? "pos-tab-button-active" : ""}`}
                  onClick={() => setSelectedCategoryId(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Independent Product scrolling list */}
          <div className="pos-panel-scrollable">
            {loadingCatalog ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
                <div style={{ width: "24px", height: "24px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--admin-card-border, #d4af37)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Syncing Catalog cache...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.3)" }}>
                No products found matching filters.
              </div>
            ) : (
              <div className="pos-products-grid">
                {filteredProducts.map((product) => {
                  const productVariants = variants.filter((v) => v.product_id === product.id);
                  const totalStock = productVariants.reduce((sum, v) => sum + v.stock_quantity, 0);

                  return (
                    <div
                      key={product.id}
                      className="pos-product-card"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div>
                        <strong style={{ fontSize: "13px", display: "block", color: "#fff", lineHeight: "1.2", marginBottom: "4px" }}>
                          {product.name}
                        </strong>
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
                          {product.sku || "No SKU"}
                        </span>
                        {productBarcodes[product.id] && (
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", display: "block", marginTop: "2px" }}>
                            Barcode: {productBarcodes[product.id]}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "8px" }}>
                        <span style={{ color: "var(--admin-card-border, #d4af37)", fontWeight: 600, fontSize: "13px" }}>
                          {formatPKR(Number(product.price))}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            background: totalStock <= 0 ? "rgba(239, 68, 68, 0.15)" : totalStock <= 5 ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.04)",
                            color: totalStock <= 0 ? "#f87171" : totalStock <= 5 ? "#fbbf24" : "rgba(255,255,255,0.5)",
                          }}
                        >
                          Stock: {totalStock}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart, Customer Lookup, Checkout & Payment (Scrollable Box) */}
        <div className="pos-panel">
          <div className="pos-panel-scrollable" style={{ padding: "16px" }}>
            {/* Sales Cart Section */}
            <div className="pos-form-section">
              <div className="pos-form-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span>Sales Cart</span>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer", padding: 0 }}
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
                  Cart is empty. Tap products to add.
                </div>
              ) : (
                <div className="pos-cart-list">
                  {cart.map((item) => (
                    <div key={item.variant_id} className="pos-cart-row">
                      <div style={{ flex: 1, paddingRight: "8px" }}>
                        <strong style={{ fontSize: "12px", display: "block", color: "#fff" }}>{item.name}</strong>
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
                          Size: {item.size} | {formatPKR(item.price)}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          onClick={() => updateQuantity(item.variant_id, -1)}
                          style={{ width: "22px", height: "22px", background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: "12px", width: "16px", textAlign: "center" }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variant_id, 1)}
                          style={{ width: "22px", height: "22px", background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Lookup & Profiling */}
            <div className="pos-form-section">
              <div className="pos-form-section-title">Customer settings</div>

              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                <button
                  onClick={() => setCustomerType("guest")}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: customerType === "guest" ? "var(--admin-card-border, #d4af37)" : "none",
                    color: customerType === "guest" ? "#111" : "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Guest Checkout
                </button>
                <button
                  onClick={() => setCustomerType("registered")}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: customerType === "registered" ? "var(--admin-card-border, #d4af37)" : "none",
                    color: customerType === "registered" ? "#111" : "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Registered Account
                </button>
              </div>

              {customerType === "registered" ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Search name, phone or email..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: "rgba(0,0,0,0.15)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />

                  {filteredCustomers.length > 0 && (
                    <div style={{ maxHeight: "120px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", background: "rgba(0,0,0,0.25)" }}>
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearchTerm("");
                          }}
                          style={{
                            padding: "6px 10px",
                            cursor: "pointer",
                            fontSize: "11px",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            background: selectedCustomer?.id === c.id ? "rgba(212,175,55,0.08)" : "none",
                          }}
                        >
                          <strong style={{ display: "block" }}>{c.full_name || "Guest Customer"}</strong>
                          <span style={{ color: "rgba(255,255,255,0.4)" }}>{c.phone || "No phone"} | {c.email}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedCustomer && (
                    <div style={{ padding: "10px", borderRadius: "4px", background: "rgba(255,255,255,0.02)", borderLeft: "3px solid var(--admin-card-border, #d4af37)", fontSize: "11px" }}>
                      <strong style={{ display: "block", marginBottom: "2px", color: "var(--admin-card-border, #d4af37)" }}>Selected account:</strong>
                      <div>{selectedCustomer.full_name}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                        {selectedCustomer.phone} | {selectedCustomer.email}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "grid", gap: "8px", fontSize: "11px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>First Name</span>
                      <input
                        type="text"
                        value={guestForm.firstName}
                        onChange={(e) => setGuestForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>Last Name</span>
                      <input
                        type="text"
                        value={guestForm.lastName}
                        onChange={(e) => setGuestForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", fontSize: "12px" }}
                      />
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>Phone Number</span>
                    <input
                      type="text"
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm((prev) => ({ ...prev, phone: e.target.value }))}
                      style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>Email</span>
                    <input
                      type="email"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm((prev) => ({ ...prev, email: e.target.value }))}
                      style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>City</span>
                    <input
                      type="text"
                      value={guestForm.city}
                      onChange={(e) => setGuestForm((prev) => ({ ...prev, city: e.target.value }))}
                      style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", fontSize: "12px" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Calculations & Payment Form */}
            <div className="pos-form-section" style={{ marginBottom: 0 }}>
              <div className="pos-form-section-title">Billing & payment</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px", fontSize: "11px" }}>
                <div>
                  <span style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>Discount Method</span>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "flat" | "percent")}
                    style={{ width: "100%", padding: "6px 8px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", fontSize: "12px" }}
                  >
                    <option value="flat">PKR Cash</option>
                    <option value="percent">Percentage %</option>
                  </select>
                </div>
                <div>
                  <span style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>Value</span>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px", fontSize: "11px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>Select Payment Mode</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  style={{ width: "100%", padding: "6px 8px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#fff", fontSize: "12px" }}
                >
                  <option value="cash">Cash Payment</option>
                  <option value="card">Card Terminal</option>
                  <option value="bank_transfer">Bank Direct Transfer</option>
                  <option value="cod">Cash on Delivery (In-Store)</option>
                </select>
              </div>

              <div className="pos-summary-block">
                <div className="pos-summary-row">
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Subtotal:</span>
                  <span>{formatPKR(subtotal)}</span>
                </div>
                <div className="pos-summary-row">
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Discount applied:</span>
                  <span style={{ color: "#f87171" }}>-{formatPKR(discountAmount)}</span>
                </div>
                <div className="pos-summary-total">
                  <span>Grand Total:</span>
                  <span>{formatPKR(total)}</span>
                </div>
              </div>

              <Button
                variant="luxury"
                size="lg"
                onClick={handleCheckout}
                isLoading={recordingOrder}
                style={{ width: "100%", display: "flex", justifyContent: "center" }}
              >
                Record Sale
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Select size variants popup for product catalog selection */}
      {selectedProduct && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.65)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="pos-panel" style={{ width: "380px", background: "#1f1f1f", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", margin: 0 }}>{selectedProduct.name}</h3>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  focusScanInput();
                }}
                style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", padding: 0 }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>
                SKU: {selectedProduct.sku || "No SKU"}
                {productBarcodes[selectedProduct.id] ? ` | Barcode: ${productBarcodes[selectedProduct.id]}` : ""}
                {" | "}
                Price: {formatPKR(Number(selectedProduct.price))}
              </div>

              <strong style={{ fontSize: "12px", display: "block", marginBottom: "10px", color: "var(--admin-card-border, #d4af37)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select sizes & stock:
              </strong>

              <div style={{ display: "grid", gap: "8px", maxHeight: "200px", overflowY: "auto", marginBottom: "20px" }}>
                {variants.filter((v) => v.product_id === selectedProduct.id).map((variant) => (
                  <div
                    key={variant.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      border: "1px solid rgba(255,255,255,0.05)",
                      background: variant.stock_quantity <= 0 ? "rgba(239, 68, 68, 0.03)" : "rgba(255,255,255,0.02)",
                      borderRadius: "4px",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "12px" }}>Size {variant.size}</strong>
                      <span style={{ fontSize: "10px", color: variant.stock_quantity <= 0 ? "#f87171" : "rgba(255,255,255,0.4)", display: "block" }}>
                        Stock: {variant.stock_quantity}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      disabled={variant.stock_quantity <= 0}
                      onClick={() => addToCart(selectedProduct, variant)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProduct(null);
                  focusScanInput();
                }}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Success modal (Printed invoice / Receipt) */}
      {completedOrder && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", overflowY: "auto", padding: "40px 20px" }}>
          <div style={{ width: "380px", background: "#fff", color: "#000", padding: "24px", borderRadius: "8px", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
            
            {/* Printable Receipt Area */}
            <div ref={receiptRef} className="print-receipt" style={{ fontFamily: "monospace", fontSize: "12px", color: "#000" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: "0 0 4px", letterSpacing: "2px" }}>AYRAA</h2>
                <p style={{ margin: "0 0 2px", fontSize: "11px" }}>Physical Store Terminal</p>
                <p style={{ margin: 0, fontSize: "10px" }}>Karachi, Pakistan</p>
              </div>

              <div style={{ borderBottom: "1px dashed #000", paddingBottom: "10px", marginBottom: "10px" }}>
                <div><strong>Order ID:</strong> {completedOrder.order_id}</div>
                <div><strong>Date:</strong> {new Date(completedOrder.created_at).toLocaleString("en-PK")}</div>
                <div><strong>Customer:</strong> {completedOrder.shipping_address.first_name} {completedOrder.shipping_address.last_name}</div>
                <div><strong>Phone:</strong> {completedOrder.contact_phone}</div>
                <div><strong>Payment:</strong> {completedOrder.payment_method.toUpperCase()}</div>
              </div>

              <div style={{ borderBottom: "1px dashed #000", paddingBottom: "10px", marginBottom: "10px" }}>
                <table style={{ width: "100%", textAlign: "left", fontSize: "12px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #000" }}>
                      <th style={{ paddingBottom: "4px" }}>Item</th>
                      <th style={{ textAlign: "center", paddingBottom: "4px" }}>Qty</th>
                      <th style={{ textAlign: "right", paddingBottom: "4px" }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedOrder.items.map((item) => (
                      <tr key={item.variant_id}>
                        <td style={{ paddingTop: "6px" }}>
                          {item.name}
                          <span style={{ fontSize: "10px", display: "block", color: "#555" }}>Size: {item.size}</span>
                        </td>
                        <td style={{ textAlign: "center", paddingTop: "6px" }}>{item.quantity}</td>
                        <td style={{ textAlign: "right", paddingTop: "6px" }}>{formatPKR(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "grid", gap: "4px", textAlign: "right", marginBottom: "20px" }}>
                <div>Subtotal: {formatPKR(completedOrder.subtotal)}</div>
                {completedOrder.discount_amount > 0 && (
                  <div style={{ color: "#c00" }}>Discount: -{formatPKR(completedOrder.discount_amount)}</div>
                )}
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>Total Paid: {formatPKR(completedOrder.total)}</div>
              </div>

              <div style={{ textAlign: "center", fontSize: "10px", marginTop: "30px" }}>
                <p style={{ margin: "0 0 2px" }}>Thank you for shopping at AYRAA!</p>
                <p style={{ margin: 0 }}>Items can be exchanged within 7 days with invoice.</p>
              </div>
            </div>

            {/* Modal Control Actions */}
            <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                onClick={handlePrintReceipt}
                style={{ padding: "10px", background: "#111", color: "#fff", border: "none", borderRadius: "4px", fontWeight: 600, cursor: "pointer" }}
              >
                Print Receipt
              </button>
              <button
                onClick={() => {
                  setCompletedOrder(null);
                  focusScanInput();
                }}
                style={{ padding: "10px", background: "none", border: "1px solid #ccc", borderRadius: "4px", fontWeight: 600, cursor: "pointer" }}
              >
                Close / New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
