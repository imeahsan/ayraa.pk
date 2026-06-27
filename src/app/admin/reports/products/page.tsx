import {
  buildCategorySalesRows,
  buildInventoryRows,
  buildTopProductRows,
  getReportingSnapshot,
} from "@/lib/admin/reporting";
import { ReportFiltersForm, ReportTableCard, ReportsSubnav } from "../ReportComponents";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function ProductReportsPage(props: PageProps<"/admin/reports/products">) {
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
          { name: "category_id", label: "Category", options: snapshot.options.categories },
          { name: "city", label: "City", options: snapshot.options.cities },
          { name: "group_by", label: "Group By", options: snapshot.options.groupBy },
          { name: "sort_order", label: "Sort", options: [{ value: "desc", label: "Descending" }, { value: "asc", label: "Ascending" }] },
        ]}
      />

      <div className={styles.reportStack}>
        <ReportTableCard title="Product Performance" rows={buildTopProductRows(snapshot)} exportId="top_products" filters={snapshot.filters} />
        <ReportTableCard title="Category Merchandising" rows={buildCategorySalesRows(snapshot)} exportId="category_sales" filters={snapshot.filters} />
        <ReportTableCard title="Inventory Health" rows={buildInventoryRows(snapshot)} exportId="inventory_health" filters={snapshot.filters} />
      </div>
    </div>
  );
}
