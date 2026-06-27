import {
  buildOrdersByStatusRows,
  buildRecentOrdersRows,
  getReportingSnapshot,
} from "@/lib/admin/reporting";
import { ReportFiltersForm, ReportTableCard, ReportsSubnav } from "../ReportComponents";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function OrderReportsPage(props: PageProps<"/admin/reports/orders">) {
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
          { name: "status", label: "Status", options: snapshot.options.statuses },
          { name: "city", label: "City", options: snapshot.options.cities },
          { name: "customer_type", label: "Customer", options: snapshot.options.customerTypes },
          { name: "promo_code", label: "Promo", options: snapshot.options.promoCodes },
          { name: "sort_order", label: "Sort", options: [{ value: "desc", label: "Descending" }, { value: "asc", label: "Ascending" }] },
        ]}
      />

      <div className={styles.reportStack}>
        <ReportTableCard title="Orders by Status" rows={buildOrdersByStatusRows(snapshot)} exportId="orders_by_status" filters={snapshot.filters} />
        <ReportTableCard title="Order Register" rows={buildRecentOrdersRows(snapshot)} exportId="recent_orders" filters={snapshot.filters} />
      </div>
    </div>
  );
}
