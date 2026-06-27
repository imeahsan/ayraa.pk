import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Category,
  Order,
  OrderItem,
  OrderReturnItem,
  OrderReturnRequest,
  OrderShipment,
  Product,
  ProductImage,
  ProductVariant,
  PromoCode,
  ShippingCompany,
  UserProfile,
  WishlistItem,
} from "@/types";

type SearchParamsInput = Record<string, string | string[] | undefined>;

interface ProductReviewRow {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
}

interface ReportCustomerMeta {
  key: string;
  display_name: string;
  email: string;
  phone: string;
  city: string;
  is_guest: boolean;
  profile_id: string | null;
}

export interface ReportFilters {
  search: string;
  date_from: string;
  date_to: string;
  status: string;
  city: string;
  category_id: string;
  promo_code: string;
  customer_type: string;
  shipment_status: string;
  shipping_company_id: string;
  return_status: string;
  request_type: string;
  group_by: "day" | "week" | "month";
  sort_by: string;
  sort_order: "asc" | "desc";
}

export interface ReportOption {
  value: string;
  label: string;
}

export interface ReportingFilterOptions {
  statuses: ReportOption[];
  cities: ReportOption[];
  categories: ReportOption[];
  promoCodes: ReportOption[];
  customerTypes: ReportOption[];
  shipmentStatuses: ReportOption[];
  shippingCompanies: ReportOption[];
  returnStatuses: ReportOption[];
  requestTypes: ReportOption[];
  groupBy: ReportOption[];
}

export interface ReportMetric {
  label: string;
  value: string;
  hint: string;
}

export interface ReportRow {
  [key: string]: string | number | null;
}

export interface EnrichedOrderItem extends OrderItem {
  productName: string;
  categoryId: string | null;
  categoryName: string;
  variantLabel: string;
  lineRevenue: number;
}

export interface CustomerSummary extends ReportCustomerMeta {
  order_count_all: number;
  delivered_order_count_all: number;
  total_spent_all: number;
  delivered_revenue_all: number;
  first_order_at: string;
  last_order_at: string;
  filtered_order_count: number;
  filtered_delivered_order_count: number;
  filtered_total_spent: number;
  filtered_delivered_revenue: number;
}

export interface ReportingSnapshot {
  filters: ReportFilters;
  options: ReportingFilterOptions;
  allOrders: Order[];
  filteredOrders: Order[];
  filteredOrderItems: EnrichedOrderItem[];
  filteredShipments: OrderShipment[];
  filteredReturns: OrderReturnRequest[];
  filteredReturnItems: OrderReturnItem[];
  customerSummaries: CustomerSummary[];
  filteredCustomerSummaries: CustomerSummary[];
  products: Product[];
  categories: Category[];
  variants: ProductVariant[];
  promos: PromoCode[];
  shippingCompanies: ShippingCompany[];
  reviews: ProductReviewRow[];
  wishlistItems: WishlistItem[];
  productImageMap: Map<string, string | null>;
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function parseFilters(searchParams: SearchParamsInput = {}): ReportFilters {
  const groupBy = firstParam(searchParams.group_by);
  const sortOrder = firstParam(searchParams.sort_order);

  return {
    search: firstParam(searchParams.search).trim(),
    date_from: firstParam(searchParams.date_from),
    date_to: firstParam(searchParams.date_to),
    status: firstParam(searchParams.status),
    city: firstParam(searchParams.city),
    category_id: firstParam(searchParams.category_id),
    promo_code: firstParam(searchParams.promo_code),
    customer_type: firstParam(searchParams.customer_type),
    shipment_status: firstParam(searchParams.shipment_status),
    shipping_company_id: firstParam(searchParams.shipping_company_id),
    return_status: firstParam(searchParams.return_status),
    request_type: firstParam(searchParams.request_type),
    group_by: groupBy === "week" || groupBy === "month" ? groupBy : "day",
    sort_by: firstParam(searchParams.sort_by),
    sort_order: sortOrder === "asc" ? "asc" : "desc",
  };
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function normalizePhone(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

function normalizeEmail(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function startOfDay(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`);
}

function endOfDay(dateString: string): Date {
  return new Date(`${dateString}T23:59:59.999`);
}

function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dateBucket(dateString: string, groupBy: ReportFilters["group_by"]): string {
  const date = new Date(dateString);
  if (groupBy === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  if (groupBy === "week") {
    const base = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = base.getUTCDay() || 7;
    base.setUTCDate(base.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(base.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((base.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${base.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  return dateString.slice(0, 10);
}

function compareValues(a: string | number | null, b: string | number | null): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a ?? "").localeCompare(String(b ?? ""));
}

function sortRows<T extends Record<string, string | number | null>>(
  rows: T[],
  sortBy: string,
  sortOrder: "asc" | "desc",
  fallbackKey: keyof T
): T[] {
  const key = (sortBy && rows[0] && sortBy in rows[0] ? sortBy : String(fallbackKey)) as keyof T;
  return [...rows].sort((left, right) => {
    const result = compareValues(left[key], right[key]);
    return sortOrder === "asc" ? result : result * -1;
  });
}

function csvEscape(value: string | number | null): string {
  const stringValue = value == null ? "" : String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsv(rows: ReportRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  return lines.join("\n");
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=%2Fadmin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return supabase;
}

export async function getReportingSnapshot(searchParams: SearchParamsInput = {}): Promise<ReportingSnapshot> {
  const filters = parseFilters(searchParams);
  const supabase = await requireAdmin();

  const [
    ordersRes,
    orderItemsRes,
    productsRes,
    variantsRes,
    categoriesRes,
    profilesRes,
    promosRes,
    shipmentsRes,
    shippingCompaniesRes,
    returnsRes,
    returnItemsRes,
    reviewsRes,
    wishlistRes,
    productImagesRes,
  ] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*"),
    supabase.from("products").select("*"),
    supabase.from("product_variants").select("*"),
    supabase.from("categories").select("*"),
    supabase.from("profiles").select("*").eq("role", "customer"),
    supabase.from("promo_codes").select("*").order("code", { ascending: true }),
    supabase.from("order_shipments").select("*").order("created_at", { ascending: false }),
    supabase.from("shipping_companies").select("*").order("name", { ascending: true }),
    supabase.from("order_return_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("order_return_items").select("*"),
    supabase.from("product_reviews").select("*"),
    supabase.from("wishlist_items").select("*"),
    supabase.from("product_images").select("*").order("sort_order", { ascending: true }),
  ]);

  if (ordersRes.error) throw ordersRes.error;
  if (orderItemsRes.error) throw orderItemsRes.error;
  if (productsRes.error) throw productsRes.error;
  if (variantsRes.error) throw variantsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (promosRes.error) throw promosRes.error;
  if (shipmentsRes.error) throw shipmentsRes.error;
  if (shippingCompaniesRes.error) throw shippingCompaniesRes.error;
  if (returnsRes.error) throw returnsRes.error;
  if (returnItemsRes.error) throw returnItemsRes.error;
  if (reviewsRes.error) throw reviewsRes.error;
  if (productImagesRes.error) throw productImagesRes.error;

  const products = ((productsRes.data || []) as Product[]).map((product) => ({
    ...product,
    price: toNumber(product.price),
    compare_at_price: product.compare_at_price == null ? null : toNumber(product.compare_at_price),
  }));
  const categories = (categoriesRes.data || []) as Category[];
  const variants = ((variantsRes.data || []) as ProductVariant[]).map((variant) => ({
    ...variant,
    stock_quantity: Number(variant.stock_quantity || 0),
  }));
  const promos = (promosRes.data || []) as PromoCode[];
  const shippingCompanies = ((shippingCompaniesRes.data || []) as ShippingCompany[]).map((company) => ({
    ...company,
    default_base_rate: company.default_base_rate == null ? null : toNumber(company.default_base_rate),
    cod_fee_value: company.cod_fee_value == null ? null : toNumber(company.cod_fee_value),
  }));
  const reviews = ((reviewsRes.data || []) as ProductReviewRow[]).map((review) => ({
    ...review,
    rating: Number(review.rating || 0),
  }));
  const wishlistItems = wishlistRes.error ? [] : ((wishlistRes.data || []) as WishlistItem[]);
  const productImages = (productImagesRes.data || []) as ProductImage[];
  const profiles = (profilesRes.data || []) as UserProfile[];

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  const productImageMap = new Map<string, string | null>();
  for (const image of productImages) {
    const existing = productImageMap.get(image.product_id);
    if (image.is_primary || !existing) {
      productImageMap.set(image.product_id, image.url);
    }
  }

  const orderItems = ((orderItemsRes.data || []) as OrderItem[]).map((item) => {
    const product = item.product_id ? productMap.get(item.product_id) : null;
    const category = product?.category_id ? categoryMap.get(product.category_id) : null;
    const variant = item.variant_id ? variantMap.get(item.variant_id) : null;
    const quantity = Number(item.quantity || 0);
    const unitPrice = toNumber(item.unit_price);

    return {
      ...item,
      quantity,
      unit_price: unitPrice,
      product: product || undefined,
      variant: variant || undefined,
      productName: product?.name || "Archived Product",
      categoryId: product?.category_id || null,
      categoryName: category?.name || "Uncategorized",
      variantLabel: variant?.size || "Standard",
      lineRevenue: quantity * unitPrice,
    } satisfies EnrichedOrderItem;
  });

  const itemsByOrder = new Map<string, EnrichedOrderItem[]>();
  for (const item of orderItems) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const shipments = ((shipmentsRes.data || []) as OrderShipment[]).map((shipment) => ({
    ...shipment,
    shipping_cost: toNumber(shipment.shipping_cost),
    cod_amount: toNumber(shipment.cod_amount),
    weight_kg: shipment.weight_kg == null ? null : toNumber(shipment.weight_kg),
    pieces_count: Number(shipment.pieces_count || 0),
  }));
  const shipmentsByOrder = new Map<string, OrderShipment[]>();
  for (const shipment of shipments) {
    const list = shipmentsByOrder.get(shipment.order_id) || [];
    list.push(shipment);
    shipmentsByOrder.set(shipment.order_id, list);
  }

  const returnItems = ((returnItemsRes.data || []) as OrderReturnItem[]).map((item) => ({
    ...item,
    quantity: Number(item.quantity || 0),
    refund_amount: toNumber(item.refund_amount),
    exchange_quantity: item.exchange_quantity == null ? null : Number(item.exchange_quantity),
  }));
  const returnItemsByRequest = new Map<string, OrderReturnItem[]>();
  for (const item of returnItems) {
    const list = returnItemsByRequest.get(item.return_request_id) || [];
    list.push(item);
    returnItemsByRequest.set(item.return_request_id, list);
  }

  const returns = ((returnsRes.data || []) as OrderReturnRequest[]).map((request) => ({
    ...request,
    refund_amount: toNumber(request.refund_amount),
    store_credit_amount: toNumber(request.store_credit_amount),
    items: returnItemsByRequest.get(request.id) || [],
  }));
  const returnsByOrder = new Map<string, OrderReturnRequest[]>();
  for (const request of returns) {
    const list = returnsByOrder.get(request.order_id) || [];
    list.push(request);
    returnsByOrder.set(request.order_id, list);
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const profileByEmail = new Map(profiles.map((profile) => [normalizeEmail(profile.email), profile]));
  const profileByPhone = new Map(
    profiles
      .filter((profile) => profile.phone)
      .map((profile) => [normalizePhone(profile.phone), profile] as const)
  );

  const resolveCustomerMeta = (order: Order): ReportCustomerMeta => {
    const directProfile = order.user_id ? profileById.get(order.user_id) : null;
    const emailProfile = profileByEmail.get(normalizeEmail(order.contact_email));
    const phoneProfile = profileByPhone.get(normalizePhone(order.contact_phone));
    const matchedProfile = directProfile || emailProfile || phoneProfile || null;
    const isGuest = !matchedProfile;
    const key = matchedProfile
      ? `profile:${matchedProfile.id}`
      : normalizeEmail(order.contact_email)
        ? `guest-email:${normalizeEmail(order.contact_email)}`
        : normalizePhone(order.contact_phone)
          ? `guest-phone:${normalizePhone(order.contact_phone)}`
          : `guest-order:${order.id}`;

    const fullName = [
      order.shipping_address?.first_name || "",
      order.shipping_address?.last_name || "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      key,
      display_name: matchedProfile?.full_name || fullName || "Guest Customer",
      email: matchedProfile?.email || order.contact_email || "",
      phone: matchedProfile?.phone || order.contact_phone || "",
      city: order.city || order.shipping_address?.city || "",
      is_guest: isGuest,
      profile_id: matchedProfile?.id || null,
    };
  };

  const rawOrders = ((ordersRes.data || []) as Order[]).map((order) => ({
    ...order,
    subtotal: toNumber(order.subtotal),
    shipping_cost: toNumber(order.shipping_cost),
    total: toNumber(order.total),
    discount_amount: toNumber(order.discount_amount),
    items: itemsByOrder.get(order.id) || [],
    shipments: shipmentsByOrder.get(order.id) || [],
  }));

  const customerMetaByOrderId = new Map<string, ReportCustomerMeta>();
  for (const order of rawOrders) {
    customerMetaByOrderId.set(order.id, resolveCustomerMeta(order));
  }

  const summaryMap = new Map<string, CustomerSummary>();
  for (const order of [...rawOrders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())) {
    const meta = customerMetaByOrderId.get(order.id)!;
    const existing = summaryMap.get(meta.key);
    const orderTotal = toNumber(order.total);
    const delivered = order.status === "delivered";

    if (!existing) {
      summaryMap.set(meta.key, {
        ...meta,
        order_count_all: 1,
        delivered_order_count_all: delivered ? 1 : 0,
        total_spent_all: orderTotal,
        delivered_revenue_all: delivered ? orderTotal : 0,
        first_order_at: order.created_at,
        last_order_at: order.created_at,
        filtered_order_count: 0,
        filtered_delivered_order_count: 0,
        filtered_total_spent: 0,
        filtered_delivered_revenue: 0,
      });
      continue;
    }

    existing.order_count_all += 1;
    existing.delivered_order_count_all += delivered ? 1 : 0;
    existing.total_spent_all += orderTotal;
    existing.delivered_revenue_all += delivered ? orderTotal : 0;
    existing.last_order_at = order.created_at;
  }

  const orderMatches = (
    order: Order,
    ignoreDate = false
  ) => {
    const meta = customerMetaByOrderId.get(order.id)!;
    const items = itemsByOrder.get(order.id) || [];
    const orderShipments = shipmentsByOrder.get(order.id) || [];
    const orderReturns = returnsByOrder.get(order.id) || [];

    if (!ignoreDate) {
      if (filters.date_from && new Date(order.created_at) < startOfDay(filters.date_from)) {
        return false;
      }
      if (filters.date_to && new Date(order.created_at) > endOfDay(filters.date_to)) {
        return false;
      }
    }

    if (filters.search) {
      const haystack = [
        order.id,
        meta.display_name,
        meta.email,
        meta.phone,
        order.city,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(filters.search.toLowerCase())) {
        return false;
      }
    }

    if (filters.status && order.status !== filters.status) {
      return false;
    }
    if (filters.city && order.city !== filters.city) {
      return false;
    }
    if (filters.promo_code && (order.promo_code || "") !== filters.promo_code) {
      return false;
    }
    if (filters.category_id && !items.some((item) => item.categoryId === filters.category_id)) {
      return false;
    }
    if (filters.customer_type === "guest" && !meta.is_guest) {
      return false;
    }
    if (filters.customer_type === "registered" && meta.is_guest) {
      return false;
    }
    if (filters.customer_type === "new" && (summaryMap.get(meta.key)?.order_count_all || 0) !== 1) {
      return false;
    }
    if (filters.customer_type === "repeat" && (summaryMap.get(meta.key)?.order_count_all || 0) < 2) {
      return false;
    }
    if (filters.shipment_status && !orderShipments.some((shipment) => shipment.shipment_status === filters.shipment_status)) {
      return false;
    }
    if (filters.shipping_company_id && !orderShipments.some((shipment) => shipment.shipping_company_id === filters.shipping_company_id)) {
      return false;
    }
    if (filters.return_status && !orderReturns.some((request) => request.status === filters.return_status)) {
      return false;
    }
    if (filters.request_type && !orderReturns.some((request) => request.request_type === filters.request_type)) {
      return false;
    }

    return true;
  };

  const filteredOrders = rawOrders.filter((order) => orderMatches(order));
  const filteredOrderIds = new Set(filteredOrders.map((order) => order.id));
  const filteredReturnIds = new Set(
    returns
      .filter((request) => filteredOrderIds.has(request.order_id))
      .map((request) => request.id)
  );

  const filteredOrderItems = orderItems.filter((item) => filteredOrderIds.has(item.order_id));
  const filteredShipments = shipments.filter((shipment) => filteredOrderIds.has(shipment.order_id));
  const filteredReturns = returns.filter((request) => filteredOrderIds.has(request.order_id));
  const filteredReturnItems = returnItems.filter((item) => filteredReturnIds.has(item.return_request_id));

  const filteredSummaryMap = new Map<string, CustomerSummary>();
  for (const order of filteredOrders) {
    const meta = customerMetaByOrderId.get(order.id)!;
    const base = summaryMap.get(meta.key)!;
    const existing = filteredSummaryMap.get(meta.key);
    const orderTotal = toNumber(order.total);
    const delivered = order.status === "delivered";

    if (!existing) {
      filteredSummaryMap.set(meta.key, {
        ...base,
        filtered_order_count: 1,
        filtered_delivered_order_count: delivered ? 1 : 0,
        filtered_total_spent: orderTotal,
        filtered_delivered_revenue: delivered ? orderTotal : 0,
      });
      continue;
    }

    existing.filtered_order_count += 1;
    existing.filtered_delivered_order_count += delivered ? 1 : 0;
    existing.filtered_total_spent += orderTotal;
    existing.filtered_delivered_revenue += delivered ? orderTotal : 0;
  }

  const options: ReportingFilterOptions = {
    statuses: [
      { value: "", label: "All statuses" },
      ...Array.from(new Set(rawOrders.map((order) => order.status))).map((status) => ({
        value: status,
        label: status,
      })),
    ],
    cities: [
      { value: "", label: "All cities" },
      ...Array.from(new Set(rawOrders.map((order) => order.city).filter(Boolean))).sort().map((city) => ({
        value: city,
        label: city,
      })),
    ],
    categories: [
      { value: "", label: "All categories" },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    promoCodes: [
      { value: "", label: "All promo codes" },
      ...promos.map((promo) => ({ value: promo.code, label: promo.code })),
    ],
    customerTypes: [
      { value: "", label: "All customers" },
      { value: "registered", label: "Registered" },
      { value: "guest", label: "Guest" },
      { value: "new", label: "New" },
      { value: "repeat", label: "Repeat" },
    ],
    shipmentStatuses: [
      { value: "", label: "All shipment states" },
      ...Array.from(new Set(shipments.map((shipment) => shipment.shipment_status))).map((status) => ({
        value: status,
        label: status,
      })),
    ],
    shippingCompanies: [
      { value: "", label: "All couriers" },
      ...shippingCompanies.map((company) => ({ value: company.id, label: company.name })),
    ],
    returnStatuses: [
      { value: "", label: "All return states" },
      ...Array.from(new Set(returns.map((request) => request.status))).map((status) => ({
        value: status,
        label: status,
      })),
    ],
    requestTypes: [
      { value: "", label: "All request types" },
      ...Array.from(new Set(returns.map((request) => request.request_type))).map((type) => ({
        value: type,
        label: type,
      })),
    ],
    groupBy: [
      { value: "day", label: "Daily" },
      { value: "week", label: "Weekly" },
      { value: "month", label: "Monthly" },
    ],
  };

  return {
    filters,
    options,
    allOrders: rawOrders,
    filteredOrders,
    filteredOrderItems,
    filteredShipments,
    filteredReturns,
    filteredReturnItems,
    customerSummaries: Array.from(summaryMap.values()),
    filteredCustomerSummaries: Array.from(filteredSummaryMap.values()),
    products,
    categories,
    variants,
    promos,
    shippingCompanies,
    reviews,
    wishlistItems,
    productImageMap,
  };
}

export function buildOverviewMetrics(snapshot: ReportingSnapshot): ReportMetric[] {
  const orders = snapshot.filteredOrders;
  const items = snapshot.filteredOrderItems;
  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const grossSales = orders.reduce((sum, order) => sum + order.subtotal, 0);
  const discounts = orders.reduce((sum, order) => sum + toNumber(order.discount_amount), 0);
  const netSales = grossSales - discounts;
  const deliveredRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
  const unitsSold = items.reduce((sum, item) => sum + item.quantity, 0);
  const avgOrderValue = orders.length ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0;

  return [
    { label: "Gross Sales", value: formatPKR(grossSales), hint: `${orders.length} filtered orders` },
    { label: "Net Sales", value: formatPKR(netSales), hint: formatPKR(discounts) + " discounts" },
    { label: "Delivered Revenue", value: formatPKR(deliveredRevenue), hint: `${deliveredOrders.length} delivered orders` },
    { label: "Average Order Value", value: formatPKR(avgOrderValue), hint: `${unitsSold} units sold` },
    { label: "Active Customers", value: String(snapshot.filteredCustomerSummaries.length), hint: "Matched after filters" },
    { label: "Shipment Queue", value: String(snapshot.filteredShipments.length), hint: "Forward and reverse shipments" },
    { label: "Returns & Exchanges", value: String(snapshot.filteredReturns.length), hint: "All post-purchase cases" },
    { label: "Live Catalog", value: String(snapshot.products.filter((product) => product.is_active).length), hint: `${snapshot.variants.length} variants tracked` },
  ];
}

export function buildRecentOrdersRows(snapshot: ReportingSnapshot): ReportRow[] {
  return snapshot.filteredOrders.slice(0, 12).map((order) => ({
    order_id: order.id,
    customer: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`.trim(),
    city: order.city,
    status: order.status,
    promo_code: order.promo_code || "",
    total: toNumber(order.total),
    created_at: formatDate(order.created_at),
  }));
}

export function buildSalesByPeriodRows(snapshot: ReportingSnapshot): ReportRow[] {
  const grouped = new Map<string, { gross: number; discounts: number; net: number; orders: number; delivered: number }>();

  for (const order of snapshot.filteredOrders) {
    const key = dateBucket(order.created_at, snapshot.filters.group_by);
    const bucket = grouped.get(key) || { gross: 0, discounts: 0, net: 0, orders: 0, delivered: 0 };
    bucket.gross += order.subtotal;
    bucket.discounts += toNumber(order.discount_amount);
    bucket.net += order.total;
    bucket.orders += 1;
    bucket.delivered += order.status === "delivered" ? 1 : 0;
    grouped.set(key, bucket);
  }

  const rows = Array.from(grouped.entries()).map(([period, value]) => ({
    period,
    gross_sales: value.gross,
    discounts: value.discounts,
    net_sales: value.net,
    orders: value.orders,
    delivered_orders: value.delivered,
    average_order_value: value.orders ? Math.round(value.net / value.orders) : 0,
  }));

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "period");
}

export function buildOrdersByStatusRows(snapshot: ReportingSnapshot): ReportRow[] {
  const counts = new Map<string, { orders: number; revenue: number }>();

  for (const order of snapshot.filteredOrders) {
    const current = counts.get(order.status) || { orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += order.total;
    counts.set(order.status, current);
  }

  const rows = Array.from(counts.entries()).map(([status, value]) => ({
    status,
    orders: value.orders,
    revenue: value.revenue,
  }));

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "orders");
}

export function buildCityPerformanceRows(snapshot: ReportingSnapshot): ReportRow[] {
  const grouped = new Map<string, { orders: number; revenue: number; delivered: number }>();

  for (const order of snapshot.filteredOrders) {
    const current = grouped.get(order.city) || { orders: 0, revenue: 0, delivered: 0 };
    current.orders += 1;
    current.revenue += order.total;
    current.delivered += order.status === "delivered" ? 1 : 0;
    grouped.set(order.city, current);
  }

  const rows = Array.from(grouped.entries()).map(([city, value]) => ({
    city,
    orders: value.orders,
    delivered_orders: value.delivered,
    revenue: value.revenue,
    average_order_value: value.orders ? Math.round(value.revenue / value.orders) : 0,
  }));

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "revenue");
}

export function buildCategorySalesRows(snapshot: ReportingSnapshot): ReportRow[] {
  const grouped = new Map<string, { category: string; units: number; revenue: number; orders: Set<string> }>();

  for (const item of snapshot.filteredOrderItems) {
    const current = grouped.get(item.categoryId || "uncategorized") || {
      category: item.categoryName,
      units: 0,
      revenue: 0,
      orders: new Set<string>(),
    };
    current.units += item.quantity;
    current.revenue += item.lineRevenue;
    current.orders.add(item.order_id);
    grouped.set(item.categoryId || "uncategorized", current);
  }

  const rows = Array.from(grouped.values()).map((value) => ({
    category: value.category,
    units_sold: value.units,
    revenue: value.revenue,
    orders: value.orders.size,
  }));

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "revenue");
}

export function buildTopProductRows(snapshot: ReportingSnapshot): ReportRow[] {
  const reviewMap = new Map<string, { count: number; ratingTotal: number }>();
  for (const review of snapshot.reviews.filter((entry) => entry.is_approved)) {
    const current = reviewMap.get(review.product_id) || { count: 0, ratingTotal: 0 };
    current.count += 1;
    current.ratingTotal += review.rating;
    reviewMap.set(review.product_id, current);
  }

  const wishlistMap = new Map<string, number>();
  for (const item of snapshot.wishlistItems) {
    wishlistMap.set(item.product_id, (wishlistMap.get(item.product_id) || 0) + 1);
  }

  const grouped = new Map<string, { product_name: string; category: string; units: number; revenue: number }>();
  for (const item of snapshot.filteredOrderItems) {
    const current = grouped.get(item.product_id) || {
      product_name: item.productName,
      category: item.categoryName,
      units: 0,
      revenue: 0,
    };
    current.units += item.quantity;
    current.revenue += item.lineRevenue;
    grouped.set(item.product_id, current);
  }

  const rows = Array.from(grouped.entries()).map(([productId, value]) => {
    const reviewStats = reviewMap.get(productId);
    return {
      product_id: productId,
      product_name: value.product_name,
      category: value.category,
      units_sold: value.units,
      revenue: value.revenue,
      review_count: reviewStats?.count || 0,
      average_rating: reviewStats?.count ? Number((reviewStats.ratingTotal / reviewStats.count).toFixed(2)) : 0,
      wishlist_count: wishlistMap.get(productId) || 0,
    };
  });

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "revenue");
}

export function buildInventoryRows(snapshot: ReportingSnapshot): ReportRow[] {
  const salesByVariant = new Map<string, number>();
  for (const item of snapshot.filteredOrderItems) {
    if (!item.variant_id) continue;
    salesByVariant.set(item.variant_id, (salesByVariant.get(item.variant_id) || 0) + item.quantity);
  }

  const rows = snapshot.variants.map((variant) => {
    const product = snapshot.products.find((entry) => entry.id === variant.product_id);
    const category = product?.category_id ? snapshot.categories.find((entry) => entry.id === product.category_id) : null;
    return {
      sku_scope: product?.sku || product?.slug || variant.id,
      product_name: product?.name || "Archived Product",
      category: category?.name || "Uncategorized",
      size: variant.size,
      stock_quantity: Number(variant.stock_quantity || 0),
      sold_in_period: salesByVariant.get(variant.id) || 0,
      inventory_status: Number(variant.stock_quantity || 0) === 0 ? "out_of_stock" : Number(variant.stock_quantity || 0) <= 5 ? "low_stock" : "healthy",
      is_available: variant.is_available ? "yes" : "no",
    };
  });

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "stock_quantity");
}

export function buildCustomerRows(snapshot: ReportingSnapshot): ReportRow[] {
  const rows = snapshot.filteredCustomerSummaries.map((customer) => ({
    customer: customer.display_name,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    customer_type: customer.is_guest ? "guest" : customer.order_count_all > 1 ? "repeat_registered" : "registered",
    total_orders_all_time: customer.order_count_all,
    filtered_orders: customer.filtered_order_count,
    filtered_revenue: customer.filtered_total_spent,
    delivered_revenue_all_time: customer.delivered_revenue_all,
    first_order: formatDate(customer.first_order_at),
    last_order: formatDate(customer.last_order_at),
  }));

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "filtered_revenue");
}

export function buildPromoRows(snapshot: ReportingSnapshot): ReportRow[] {
  const grouped = new Map<string, { orders: number; discount: number; revenue: number }>();

  for (const order of snapshot.filteredOrders) {
    const key = order.promo_code || "No Promo";
    const current = grouped.get(key) || { orders: 0, discount: 0, revenue: 0 };
    current.orders += 1;
    current.discount += toNumber(order.discount_amount);
    current.revenue += order.total;
    grouped.set(key, current);
  }

  const rows = Array.from(grouped.entries()).map(([promo, value]) => ({
    promo_code: promo,
    orders: value.orders,
    total_discount: value.discount,
    revenue: value.revenue,
    average_discount_per_order: value.orders ? Math.round(value.discount / value.orders) : 0,
  }));

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "revenue");
}

export function buildShipmentRows(snapshot: ReportingSnapshot): ReportRow[] {
  const rows = snapshot.filteredShipments.map((shipment) => ({
    shipment_id: shipment.id,
    order_id: shipment.order_id,
    direction: shipment.shipment_direction,
    courier: shipment.shipping_company_name || "Manual",
    status: shipment.shipment_status,
    tracking_number: shipment.tracking_number || "",
    city: shipment.recipient_city,
    shipping_cost: shipment.shipping_cost,
    cod_amount: shipment.cod_amount,
    booked_at: shipment.booked_at ? formatDate(shipment.booked_at) : "",
    delivered_at: shipment.delivered_at ? formatDate(shipment.delivered_at) : "",
  }));

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "shipping_cost");
}

export function buildShippingCompanyRows(snapshot: ReportingSnapshot): ReportRow[] {
  const grouped = new Map<string, { courier: string; shipments: number; delivered: number; failed: number; returned: number; cost: number }>();

  for (const shipment of snapshot.filteredShipments) {
    const key = shipment.shipping_company_id || shipment.shipping_company_name || "manual";
    const current = grouped.get(key) || {
      courier: shipment.shipping_company_name || "Manual",
      shipments: 0,
      delivered: 0,
      failed: 0,
      returned: 0,
      cost: 0,
    };
    current.shipments += 1;
    current.delivered += shipment.shipment_status === "delivered" ? 1 : 0;
    current.failed += shipment.shipment_status === "failed_delivery" ? 1 : 0;
    current.returned += shipment.shipment_status === "returned" ? 1 : 0;
    current.cost += shipment.shipping_cost;
    grouped.set(key, current);
  }

  const rows = Array.from(grouped.values()).map((value) => ({
    courier: value.courier,
    shipments: value.shipments,
    delivered: value.delivered,
    failed_delivery: value.failed,
    returned: value.returned,
    total_shipping_cost: value.cost,
    delivery_rate: value.shipments ? Number(((value.delivered / value.shipments) * 100).toFixed(2)) : 0,
  }));

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "shipments");
}

export function buildReturnCaseRows(snapshot: ReportingSnapshot): ReportRow[] {
  const orderMap = new Map(snapshot.allOrders.map((order) => [order.id, order]));

  const rows = snapshot.filteredReturns.map((request) => {
    const order = orderMap.get(request.order_id);
    return {
      case_id: request.id,
      order_id: request.order_id,
      request_type: request.request_type,
      status: request.status,
      customer: request.customer_name,
      city: order?.city || "",
      refund_amount: request.refund_amount,
      resolution_type: request.resolution_type || "",
      requested_at: formatDate(request.requested_at || request.created_at),
      resolved_at: request.resolved_at ? formatDate(request.resolved_at) : "",
    };
  });

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "requested_at");
}

export function buildReturnProductRows(snapshot: ReportingSnapshot): ReportRow[] {
  const orderItemMap = new Map(snapshot.filteredOrderItems.map((item) => [item.id, item]));
  const grouped = new Map<string, { product_name: string; category: string; returned_units: number; refund_total: number; cases: Set<string> }>();

  for (const item of snapshot.filteredReturnItems) {
    const orderItem = orderItemMap.get(item.order_item_id);
    const key = item.product_id || item.order_item_id;
    const current = grouped.get(key) || {
      product_name: orderItem?.productName || "Archived Product",
      category: orderItem?.categoryName || "Uncategorized",
      returned_units: 0,
      refund_total: 0,
      cases: new Set<string>(),
    };
    current.returned_units += item.quantity;
    current.refund_total += item.refund_amount;
    current.cases.add(item.return_request_id);
    grouped.set(key, current);
  }

  const rows = Array.from(grouped.values()).map((value) => ({
    product_name: value.product_name,
    category: value.category,
    returned_units: value.returned_units,
    cases: value.cases.size,
    refund_total: value.refund_total,
  }));

  return sortRows(rows, snapshot.filters.sort_by, snapshot.filters.sort_order, "returned_units");
}

export function buildExportHref(report: string, filters: ReportFilters): string {
  const params = new URLSearchParams();
  params.set("report", report);

  (Object.entries(filters) as Array<[keyof ReportFilters, string]>).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return `/admin/reports/export?${params.toString()}`;
}

export function getPageFilterSummary(filters: ReportFilters): string {
  const segments: string[] = [];
  if (filters.date_from || filters.date_to) {
    segments.push(`Date: ${filters.date_from || "start"} to ${filters.date_to || "today"}`);
  }
  if (filters.status) segments.push(`Order: ${filters.status}`);
  if (filters.city) segments.push(`City: ${filters.city}`);
  if (filters.category_id) segments.push("Category filtered");
  if (filters.promo_code) segments.push(`Promo: ${filters.promo_code}`);
  if (filters.customer_type) segments.push(`Customer: ${filters.customer_type}`);
  if (filters.shipment_status) segments.push(`Shipment: ${filters.shipment_status}`);
  if (filters.return_status) segments.push(`Returns: ${filters.return_status}`);
  return segments.length ? segments.join(" | ") : "Showing all available data";
}

export function toCsv(rows: ReportRow[]): string {
  return buildCsv(rows);
}
