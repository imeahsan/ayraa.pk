import { NextRequest } from "next/server";
import {
  buildCategorySalesRows,
  buildCityPerformanceRows,
  buildCustomerRows,
  buildInventoryRows,
  buildOrdersByStatusRows,
  buildPromoRows,
  buildRecentOrdersRows,
  buildReturnCaseRows,
  buildReturnProductRows,
  buildSalesByPeriodRows,
  buildShipmentRows,
  buildShippingCompanyRows,
  buildTopProductRows,
  getReportingSnapshot,
  toCsv,
} from "@/lib/admin/reporting";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParamsObject = Object.fromEntries(request.nextUrl.searchParams.entries());
  const report = request.nextUrl.searchParams.get("report") || "sales_by_period";
  const snapshot = await getReportingSnapshot(searchParamsObject);

  const rowsByReport: Record<string, ReturnType<typeof buildSalesByPeriodRows>> = {
    sales_by_period: buildSalesByPeriodRows(snapshot),
    orders_by_status: buildOrdersByStatusRows(snapshot),
    top_products: buildTopProductRows(snapshot),
    city_performance: buildCityPerformanceRows(snapshot),
    recent_orders: buildRecentOrdersRows(snapshot),
    category_sales: buildCategorySalesRows(snapshot),
    inventory_health: buildInventoryRows(snapshot),
    customer_spend: buildCustomerRows(snapshot),
    promo_performance: buildPromoRows(snapshot),
    shipment_register: buildShipmentRows(snapshot),
    courier_scorecard: buildShippingCompanyRows(snapshot),
    return_case_register: buildReturnCaseRows(snapshot),
    returned_products: buildReturnProductRows(snapshot),
  };

  const rows = rowsByReport[report] || rowsByReport.sales_by_period;
  const csv = toCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report}.csv"`,
    },
  });
}
