const fs = require("fs");
const path = require("path");

const reportPath = path.resolve(__dirname, "..", "scratch", "lighthouse.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

const targetAudits = [
  "uses-rel-preconnect",
  "largest-contentful-paint-element",
  "color-contrast",
  "heading-order",
  "select-name",
  "bf-cache"
];

targetAudits.forEach(auditId => {
  const audit = report.audits[auditId];
  console.log(`\n=================== DETAIL: ${auditId} ===================`);
  console.log(`Title: ${audit.title}`);
  if (audit.displayValue) console.log(`Value: ${audit.displayValue}`);
  if (audit.details) {
    if (audit.details.type === "opportunity" || audit.details.type === "table") {
      console.log("Table columns:", audit.details.headings.map(h => h.label || h.text || h.key));
      console.log("Table rows count:", audit.details.items.length);
      console.log("Table rows snippet:");
      audit.details.items.slice(0, 5).forEach(item => {
        console.log("  ", JSON.stringify(item));
      });
    } else {
      console.log("Details:", JSON.stringify(audit.details, null, 2));
    }
  } else {
    console.log("No extra details.");
  }
});
