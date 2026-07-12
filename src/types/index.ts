/* ================================================
   Ayra E-Commerce — Type Definitions
   ================================================ */

// ---------- Database Types ----------

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  show_in_header?: boolean;
  is_coming_soon?: boolean;
  header_label?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at: string;
  children?: Category[];
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  barcode?: string | null;
  category_id: string | null;
  category?: Category;
  is_active: boolean;
  is_featured: boolean;
  is_on_sale?: boolean;
  fabric: string | null;
  color: string | null;
  includes: string | null;
  care_instructions: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  bedsheet_ar_status?: 'not_ready' | 'ready' | 'disabled';
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color?: string;
  stock_quantity: number;
  is_available: boolean;
}

// ---------- Order Types ----------

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod';

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: ShippingAddress;
  contact_phone: string;
  contact_email: string;
  city: string;
  created_at: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
  notes?: OrderNote[];
  user?: UserProfile;
  promo_code?: string | null;
  discount_amount?: number;
  shipments?: OrderShipment[];
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string | null;
  created_at: string;
}

export interface OrderNote {
  id: string;
  order_id: string;
  admin_user_id: string;
  note: string;
  created_at: string;
}

export type ShipmentDirection = 'forward' | 'reverse';
export type ShipmentStatus =
  | 'draft'
  | 'booked'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'returned'
  | 'cancelled';

export interface ShippingCompany {
  id: string;
  name: string;
  code: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  tracking_url_template?: string | null;
  default_base_rate?: number | null;
  cod_fee_type?: 'fixed' | 'percentage' | null;
  cod_fee_value?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderShipment {
  id: string;
  order_id: string;
  shipping_company_id: string | null;
  shipping_company_name: string | null;
  shipment_direction: ShipmentDirection;
  tracking_number: string | null;
  tracking_url: string | null;
  booking_reference: string | null;
  shipment_status: ShipmentStatus;
  shipping_cost: number;
  cod_amount: number;
  weight_kg: number | null;
  pieces_count: number;
  package_notes: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_city: string;
  recipient_address: string;
  recipient_postal_code: string | null;
  booked_at: string | null;
  shipped_at: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  returned_at: string | null;
  created_by: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  shipping_company?: ShippingCompany;
}

export type ReturnRequestType = 'return' | 'exchange' | 'replacement';
export type ReturnRequestStatus = 'draft' | 'requested' | 'approved' | 'rejected' | 'received' | 'inspected' | 'resolved' | 'cancelled';
export type ReturnResolutionType = 'refund' | 'exchange_order' | 'store_credit' | 'no_action';
export type ReturnConditionStatus = 'unopened' | 'unused' | 'used' | 'damaged' | 'wrong_item' | 'defective';
export type ReturnRestockAction = 'restock' | 'do_not_restock' | 'inspect_later';

export interface OrderReturnRequest {
  id: string;
  order_id: string;
  request_type: ReturnRequestType;
  status: ReturnRequestStatus;
  resolution_type: ReturnResolutionType | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  reason: string;
  condition_notes: string | null;
  admin_notes: string | null;
  refund_amount: number;
  store_credit_amount: number;
  exchange_order_id: string | null;
  reverse_courier_name: string | null;
  reverse_tracking_number: string | null;
  reverse_tracking_url: string | null;
  requested_at: string;
  approved_at: string | null;
  received_at: string | null;
  resolved_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  order?: Order;
  items?: OrderReturnItem[];
}

export interface OrderReturnItem {
  id: string;
  return_request_id: string;
  order_item_id: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  reason: string | null;
  condition_status: ReturnConditionStatus;
  restock_action: ReturnRestockAction;
  refund_amount: number;
  exchange_product_id: string | null;
  exchange_variant_id: string | null;
  exchange_quantity: number | null;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
  order_item?: OrderItem;
  exchange_product?: Product;
  exchange_variant?: ProductVariant;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// ---------- Cart Types ----------

export interface CartItem {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product: Product;
  variant?: ProductVariant;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

// ---------- Wishlist Types ----------

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

// ---------- User Types ----------

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'admin';
  created_at: string;
}

// ---------- Store Settings ----------

export interface StoreSettings {
  brand_name: string;
  brand_description: string;
  contact_email: string;
  contact_phone: string;
  shipping_flat_rate: number;
  free_shipping_threshold: number;
  meta_title_template: string;
  meta_description: string;
  logo_url: string | null;
  favicon_url: string | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_user?: string | null;
  smtp_pass?: string | null;
  email_from_address?: string | null;
  email_from_name?: string | null;
}

// ---------- Admin Dashboard Types ----------

export interface DashboardStats {
  total_revenue: number;
  revenue_change: number;
  orders_today: number;
  orders_change: number;
  total_products: number;
  active_customers: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface OrdersByStatus {
  status: OrderStatus;
  count: number;
}

export interface TopSellingProduct {
  product_id: string;
  product_name: string;
  image_url: string | null;
  units_sold: number;
  revenue: number;
}

// ---------- Pagination ----------

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ---------- Filter Types ----------

export interface ProductFilters extends PaginationParams {
  category_id?: string;
  status?: 'active' | 'draft';
  min_price?: number;
  max_price?: number;
  search?: string;
}

export interface OrderFilters extends PaginationParams {
  status?: OrderStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  city?: string;
}

export interface CustomerFilters extends PaginationParams {
  search?: string;
  city?: string;
}

// ---------- Checkout Types ----------

export interface CheckoutFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
}

// ---------- Pakistani Cities ----------

export const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
  'Mardan', 'Abbottabad', 'Muzaffarabad', 'Mirpur', 'Gilgit',
] as const;

export type PakistanCity = typeof PAKISTAN_CITIES[number];

// ---------- Utility Types ----------

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// ---------- Promo Codes ----------

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  applicable_category_ids: string[] | null;
  created_at: string;
}
