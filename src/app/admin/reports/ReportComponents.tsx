import Link from "next/link";
import styles from "../admin.module.css";
import {
  ReportFilters,
  ReportMetric,
  ReportOption,
  ReportRow,
  buildExportHref,
  getPageFilterSummary,
} from "@/lib/admin/reporting";

interface FilterField {
  name: keyof ReportFilters;
  label: string;
  type?: "text" | "date";
  options?: ReportOption[];
}

export function ReportsSubnav() {
  const links = [
    { href: "/admin/reports", label: "Overview" },
    { href: "/admin/reports/sales", label: "Sales" },
    { href: "/admin/reports/orders", label: "Orders" },
    { href: "/admin/reports/products", label: "Products" },
    { href: "/admin/reports/customers", label: "Customers" },
    { href: "/admin/reports/discounts", label: "Discounts" },
    { href: "/admin/reports/shipping", label: "Shipping" },
    { href: "/admin/reports/returns", label: "Returns" },
  ];

  return (
    <div className={styles.reportSubnav}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={styles.reportSubnavLink}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function ReportFiltersForm({
  filters,
  fields,
}: {
  filters: ReportFilters;
  fields: FilterField[];
}) {
  return (
    <form className={styles.reportFilterGrid}>
      {fields.map((field) => (
        <label key={field.name} className={styles.reportFilterField}>
          <span className={styles.filterLabel}>{field.label}</span>
          {field.options ? (
            <select name={field.name} defaultValue={filters[field.name]} className={styles.filterSelect}>
              {field.options.map((option) => (
                <option key={`${field.name}-${option.value || "all"}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || "text"}
              name={field.name}
              defaultValue={filters[field.name]}
              className={styles.formInput}
            />
          )}
        </label>
      ))}

      <div className={styles.reportFilterActions}>
        <button type="submit" className={styles.reportPrimaryButton}>
          Apply Filters
        </button>
        <Link href="?" className={styles.reportSecondaryButton}>
          Reset
        </Link>
      </div>
    </form>
  );
}

export function MetricsGrid({ metrics }: { metrics: ReportMetric[] }) {
  return (
    <div className={styles.reportMetricsGrid}>
      {metrics.map((metric) => (
        <div key={metric.label} className={styles.card}>
          <div className={styles.cardMeta}>
            <span className={styles.cardLabel}>{metric.label}</span>
            <h3 className={styles.cardValue}>{metric.value}</h3>
            <span className={styles.reportMetricHint}>{metric.hint}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportTableCard({
  title,
  rows,
  exportId,
  filters,
}: {
  title: string;
  rows: ReportRow[];
  exportId: string;
  filters: ReportFilters;
}) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <div>
          <h3 className={styles.tableTitle}>{title}</h3>
          <p className={styles.reportSummaryText}>{getPageFilterSummary(filters)}</p>
        </div>
        <Link href={buildExportHref(exportId, filters)} className={styles.tableLink}>
          Export CSV
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className={styles.reportEmptyState}>No rows match the current filters.</div>
      ) : (
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header} className={styles.tableTh}>
                    {header.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${index}`} className={styles.tableTr}>
                  {headers.map((header, cellIndex) => {
                    const value = row[header];
                    const isPrimary = cellIndex === 0;
                    return (
                      <td
                        key={`${title}-${index}-${header}`}
                        className={`${styles.tableTd} ${isPrimary ? styles.tableTdHighlight : ""}`}
                      >
                        {typeof value === "number" ? value.toLocaleString("en-PK") : value || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
