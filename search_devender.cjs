const xlsx = require('xlsx');
const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

const wb = xlsx.readFile(XLSX_PATH);
const sheets = ['07.06.26', '08.06.26', '09.06.26', '10.06.26'];

sheets.forEach(sheetName => {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return;
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  rows.forEach((row, idx) => {
    const rowStr = JSON.stringify(row);
    if (rowStr.toUpperCase().includes("DEVENDER")) {
      console.log(`\nSheet: ${sheetName}, Row ${idx+1}`);
      row.forEach((val, cIdx) => {
        if (val !== undefined && val !== null && val !== "") {
          console.log(`  Col ${cIdx}: ${val}`);
        }
      });
    }
  });
});
