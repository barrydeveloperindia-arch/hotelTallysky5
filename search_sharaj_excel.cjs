const xlsx = require('xlsx');
const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";
const wb = xlsx.readFile(XLSX_PATH);

const sheetName = '01.06.26';
const sheet = wb.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
rows.forEach((row, rIdx) => {
  if (row.some(val => val && val.toString().toLowerCase().includes("sharaj"))) {
    console.log(`Row ${rIdx}:`);
    row.forEach((val, cIdx) => {
      console.log(`  Col ${cIdx}: ${val} (Type: ${typeof val})`);
    });
  }
});
