const xlsx = require('xlsx');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

try {
  const wb = xlsx.readFile(XLSX_PATH);
  const sheet = wb.Sheets['09.06.26'];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Print first 3 rows to find headers
  for (let i = 0; i < 3; i++) {
    console.log(`Header Row ${i+1}:`, rows[i]);
  }
  
  // Print some interesting rows with index numbers
  console.log("\n--- Rows with food bills ---");
  for (let r = 2; r < rows.length; r++) {
    const row = rows[r] || [];
    if (row[14]) { // Column O
      console.log(`Row ${r+1}:`);
      row.forEach((val, idx) => {
        if (val !== undefined && val !== null && val.toString().trim() !== "") {
          console.log(`  Col ${idx} (${getColLetter(idx)}): ${val}`);
        }
      });
    }
  }
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
