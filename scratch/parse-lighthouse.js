const fs = require("fs");
const path = require("path");

const reportPath = path.resolve(__dirname, "..", "scratch", "lighthouse.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

console.log("=== LIGHTHOUSE CATEGORIES ===");
for (const catId in report.categories) {
  const cat = report.categories[catId];
  console.log(`${cat.title}: ${(cat.score * 100).toFixed(0)}`);
}

console.log("\n=== FAILED AUDITS ===");
const audits = report.audits;
const failedAudits = [];
for (const auditId in audits) {
  const audit = audits[auditId];
  if (audit.score !== null && audit.score < 0.9 && audit.score !== 1) {
    failedAudits.push({
      id: auditId,
      title: audit.title,
      score: audit.score,
      description: audit.description,
      displayValue: audit.displayValue || ""
    });
  }
}

failedAudits.sort((a, b) => a.score - b.score);
failedAudits.forEach(a => {
  console.log(`- [${a.id}] ${a.title} (Score: ${a.score}) ${a.displayValue ? ` - ${a.displayValue}` : ""}`);
  console.log(`  Description: ${a.description}`);
});
