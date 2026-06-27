import {
  buildCityPerformanceRows,
  buildOrdersByStatusRows,
  buildOverviewMetrics,
  buildRecentOrdersRows,
  buildSalesByPeriodRows,
  buildTopProductRows,
  getReportingSnapshot,
} from "@/lib/admin/reporting";
import { MetricsGrid, ReportFiltersForm, ReportTableCard, ReportsSubnav } from "./ReportComponents";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function ReportsOverviewPage(props: PageProps<"/admin/reports">) {
  const searchParams = await props.searchParams;
  const snapshot = await getReportingSnapshot(searchParams);

  return (
    <div className={styles.pageLayout}>
      <ReportsSubnav />
      <ReportFiltersForm
        filters={snapshot.filters}
        fields={[
          { name: "search", label: "Search" },
          { name: "date_from", label: "Date From", type: "date" },
          { name: "date_to", label: "Date To", type: "date" },
          { name: "status", label: "Order Status", options: snapshot.options.statuses },
          { name: "city", label: "City", options: snapshot.options.cities },
          { name: "category_id", label: "Category", options: snapshot.options.categories },
          { name: "promo_code", label: "Promo", options: snapshot.options.promoCodes },
          { name: "group_by", label: "Group By", options: snapshot.options.groupBy },
        ]}
      />

      <MetricsGrid metrics={buildOverviewMetrics(snapshot)} />

      <div className={styles.reportStack}>
        <ReportTableCard
          title="Sales by Period"
          rows={buildSalesByPeriodRows(snapshot)}
          exportId="sales_by_period"
          filters={snapshot.filters}
        />
        <ReportTableCard
          title="Orders by Status"
          rows={buildOrdersByStatusRows(snapshot)}
          exportId="orders_by_status"
          filters={snapshot.filters}
        />
        <ReportTableCard
          title="Top Products"
          rows={buildTopProductRows(snapshot)}
          exportId="top_products"
          filters={snapshot.filters}
        />
        <ReportTableCard
          title="City Performance"
          rows={buildCityPerformanceRows(snapshot)}
          exportId="city_performance"
          filters={snapshot.filters}
        />
        <ReportTableCard
          title="Recent Orders"
          rows={buildRecentOrdersRows(snapshot)}
          exportId="recent_orders"
          filters={snapshot.filters}
        />
      </div>
    </div>
  );
}
