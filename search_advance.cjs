const xlsx = require('xlsx');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

try {
  const wb = xlsx.readFile(XLSX_PATH);
  wb.SheetNames.forEach(sheetName => {
    if (!/^\d{2}\.\d{2}\.\d{2}$/.test(sheetName)) return;
    
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    rows.forEach((row, rIdx) => {
      row.forEach((val, cIdx) => {
        if (val && val.toString().toUpperCase().includes("ADVANCE")) {
          console.log(`Sheet: ${sheetName} | Row: ${rIdx+1} | Col: ${cIdx} | Value: "${val}" | Row:`, row);
        }
      });
    });
  });
} catch (e) {
  console.error(e);
}
