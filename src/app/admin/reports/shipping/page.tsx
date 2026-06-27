import {
  buildShipmentRows,
  buildShippingCompanyRows,
  getReportingSnapshot,
} from "@/lib/admin/reporting";
import { ReportFiltersForm, ReportTableCard, ReportsSubnav } from "../ReportComponents";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function ShippingReportsPage(props: PageProps<"/admin/reports/shipping">) {
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
          { name: "shipment_status", label: "Shipment Status", options: snapshot.options.shipmentStatuses },
          { name: "shipping_company_id", label: "Courier", options: snapshot.options.shippingCompanies },
          { name: "city", label: "City", options: snapshot.options.cities },
          { name: "sort_order", label: "Sort", options: [{ value: "desc", label: "Descending" }, { value: "asc", label: "Ascending" }] },
        ]}
      />

      <div className={styles.reportStack}>
        <ReportTableCard title="Shipment Register" rows={buildShipmentRows(snapshot)} exportId="shipment_register" filters={snapshot.filters} />
        <ReportTableCard title="Courier Scorecard" rows={buildShippingCompanyRows(snapshot)} exportId="courier_scorecard" filters={snapshot.filters} />
      </div>
    </div>
  );
}
