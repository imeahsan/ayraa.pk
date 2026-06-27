import {
  buildReturnCaseRows,
  buildReturnProductRows,
  getReportingSnapshot,
} from "@/lib/admin/reporting";
import { ReportFiltersForm, ReportTableCard, ReportsSubnav } from "../ReportComponents";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function ReturnReportsPage(props: PageProps<"/admin/reports/returns">) {
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
          { name: "return_status", label: "Case Status", options: snapshot.options.returnStatuses },
          { name: "request_type", label: "Request Type", options: snapshot.options.requestTypes },
          { name: "city", label: "City", options: snapshot.options.cities },
          { name: "sort_order", label: "Sort", options: [{ value: "desc", label: "Descending" }, { value: "asc", label: "Ascending" }] },
        ]}
      />

      <div className={styles.reportStack}>
        <ReportTableCard title="Return Case Register" rows={buildReturnCaseRows(snapshot)} exportId="return_case_register" filters={snapshot.filters} />
        <ReportTableCard title="Returned Products" rows={buildReturnProductRows(snapshot)} exportId="returned_products" filters={snapshot.filters} />
      </div>
    </div>
  );
}
