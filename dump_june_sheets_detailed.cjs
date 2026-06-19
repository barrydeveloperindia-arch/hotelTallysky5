const xlsx = require('xlsx');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

try {
  const wb = xlsx.readFile(XLSX_PATH);
  const sheet = wb.Sheets['02.06.26'];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Row 11 (0-indexed 10)
  const row11 = rows[10];
  console.log("Row 11 Raw Columns:");
  row11.forEach((val, idx) => {
    console.log(`  Col ${idx} (${getColLetter(idx)}): "${val !== undefined ? val : ''}"`);
  });
  
} catch (e) {
  console.error(e);
}

function getColLetter(index) {
  let temp = "";
  let letter = "";
  while (index >= 0) {
    temp = index % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}
