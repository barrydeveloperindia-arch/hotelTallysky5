const xlsx = require('xlsx');
const path = require('path');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

try {
  const wb = xlsx.readFile(XLSX_PATH);
  let found = false;
  
  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    rows.forEach((row, rIdx) => {
      row.forEach((col, cIdx) => {
        if (col && (col.toString().toLowerCase().includes("wadhwa") || col.toString().toLowerCase().includes("wadhw") || col.toString().toLowerCase().includes("1809628"))) {
          console.log(`Found on sheet "${sheetName}", Row ${rIdx+1}, Col ${cIdx+1}: "${col}"`);
          console.log(`Full row: ${row.join(' | ')}`);
          found = true;
        }
      });
    });
  });
  
  if (!found) {
    console.log("No matching entries found in the entire Excel file.");
  }
} catch (e) {
  console.error("Error searching Excel:", e);
}
