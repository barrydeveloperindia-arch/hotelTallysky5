const xlsx = require('xlsx');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

try {
  const wb = xlsx.readFile(XLSX_PATH);
  const juneSheets = wb.SheetNames.filter(name => name.includes('.06.26') || name.includes('.06.2026') || name.includes('june') || name.includes('June'));
  console.log("June 2026 sheets found:", juneSheets);
} catch (e) {
  console.error("Error:", e.message);
}
