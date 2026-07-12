const fs = require('fs');
const path = require('path');

const reportsDir = './scratch/lighthouse-reports';
const pages = ['homepage', 'collections', 'category-detail', 'product-detail'];

console.log('--- LIGHTHOUSE AUDIT SCORES EXTRACTOR ---');

pages.forEach(page => {
  const jsonPath = path.join(reportsDir, `${page}.report.json`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`Missing JSON report for page: ${page}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const categories = data.categories;

  const perf = Math.round(categories.performance.score * 100);
  const acc = Math.round(categories.accessibility.score * 100);
  const bp = Math.round(categories['best-practices'].score * 100);
  const seo = Math.round(categories.seo.score * 100);

  console.log(`\nPage: ${page}`);
  console.log(`- Performance:   ${perf}`);
  console.log(`- Accessibility: ${acc}`);
  console.log(`- Best Practices: ${bp}`);
  console.log(`- SEO:            ${seo}`);

  // Print top 3 savings/warnings or failures
  console.log('Top Recommendations:');
  const audits = data.audits;
  const opportunities = [];
  
  for (const [id, audit] of Object.entries(audits)) {
    if (audit.score !== null && audit.score < 0.9 && audit.details && audit.details.type === 'opportunity') {
      opportunities.push({
        title: audit.title,
        wastedMs: audit.numericValue || 0,
        description: audit.description
      });
    }
  }

  opportunities.sort((a, b) => b.wastedMs - a.wastedMs);
  opportunities.slice(0, 3).forEach(op => {
    console.log(`  * ${op.title} (Savings: ${Math.round(op.wastedMs)}ms)`);
  });

  const diagnostics = [];
  for (const [id, audit] of Object.entries(audits)) {
    if (audit.score !== null && audit.score < 0.9 && (!audit.details || audit.details.type !== 'opportunity')) {
      diagnostics.push({
        title: audit.title,
        score: audit.score,
        description: audit.description
      });
    }
  }
  diagnostics.slice(0, 3).forEach(diag => {
    console.log(`  * ${diag.title} (Score: ${diag.score})`);
  });
});
process.exit(0);
