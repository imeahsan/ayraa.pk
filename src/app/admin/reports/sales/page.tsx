import {
  buildCategorySalesRows,
  buildCityPerformanceRows,
  buildPromoRows,
  buildSalesByPeriodRows,
  getReportingSnapshot,
} from "@/lib/admin/reporting";
import { ReportFiltersForm, ReportTableCard, ReportsSubnav } from "../ReportComponents";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function SalesReportsPage(props: PageProps<"/admin/reports/sales">) {
  const searchParams = await props.searchParams;
  const snapshot = await getReportingSnapshot(searchParams);

  return (
    <div className={styles.pageLayout}>
      <ReportsSubnav />
      <ReportFiltersForm
        filters={snapshot.filters}
        fields={[
          { name: "date_from", label: "Date From", type: "date" },
          { name: "date_to", label: "Date To", type: "date" },
          { name: "status", label: "Order Status", options: snapshot.options.statuses },
          { name: "city", label: "City", options: snapshot.options.cities },
          { name: "category_id", label: "Category", options: snapshot.options.categories },
          { name: "promo_code", label: "Promo", options: snapshot.options.promoCodes },
          { name: "group_by", label: "Group By", options: snapshot.options.groupBy },
          { name: "sort_order", label: "Sort", options: [{ value: "desc", label: "Descending" }, { value: "asc", label: "Ascending" }] },
        ]}
      />

      <div className={styles.reportStack}>
        <ReportTableCard title="Sales by Period" rows={buildSalesByPeriodRows(snapshot)} exportId="sales_by_period" filters={snapshot.filters} />
        <ReportTableCard title="Category Sales" rows={buildCategorySalesRows(snapshot)} exportId="category_sales" filters={snapshot.filters} />
        <ReportTableCard title="City Sales" rows={buildCityPerformanceRows(snapshot)} exportId="city_performance" filters={snapshot.filters} />
        <ReportTableCard title="Promo Performance" rows={buildPromoRows(snapshot)} exportId="promo_performance" filters={snapshot.filters} />
      </div>
    </div>
  );
}
