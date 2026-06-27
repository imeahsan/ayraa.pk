import {
  buildCityPerformanceRows,
  buildCustomerRows,
  getReportingSnapshot,
} from "@/lib/admin/reporting";
import { ReportFiltersForm, ReportTableCard, ReportsSubnav } from "../ReportComponents";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function CustomerReportsPage(props: PageProps<"/admin/reports/customers">) {
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
          { name: "customer_type", label: "Customer Type", options: snapshot.options.customerTypes },
          { name: "city", label: "City", options: snapshot.options.cities },
          { name: "sort_order", label: "Sort", options: [{ value: "desc", label: "Descending" }, { value: "asc", label: "Ascending" }] },
        ]}
      />

      <div className={styles.reportStack}>
        <ReportTableCard title="Customer Spend" rows={buildCustomerRows(snapshot)} exportId="customer_spend" filters={snapshot.filters} />
        <ReportTableCard title="Customer Cities" rows={buildCityPerformanceRows(snapshot)} exportId="city_performance" filters={snapshot.filters} />
      </div>
    </div>
  );
}
