// abTestingSuiteReports.js
// Utility for exporting A/B test reports as CSV or PDF
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');

function exportReportCSV(data, fields) {
  const parser = new Parser({ fields });
  return parser.parse(data);
}

function exportReportPDF(data, fields, filePath) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(18).text('A/B Test Report', { align: 'center' });
  doc.moveDown();
  fields.forEach(f => doc.fontSize(12).text(f, { continued: true }).text(' | ', { continued: true }));
  doc.moveDown();
  data.forEach(row => {
    fields.forEach(f => doc.fontSize(10).text(row[f] || '', { continued: true }).text(' | ', { continued: true }));
    doc.moveDown();
  });
  doc.end();
}

module.exports = { exportReportCSV, exportReportPDF };