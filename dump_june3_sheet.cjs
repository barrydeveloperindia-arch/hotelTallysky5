const xlsx = require('xlsx');
const fs = require('fs');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";
const sheetName = '03.06.26 '; // Note the trailing space

try {
  const wb = xlsx.readFile(XLSX_PATH);
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    console.error(`Sheet '${sheetName}' not found in workbook!`);
    process.exit(1);
  }
  
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const outputFilePath = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_03.06.26.json';
  fs.writeFileSync(outputFilePath, JSON.stringify(rows, null, 2));
  console.log(`Successfully saved sheet '${sheetName}' to '${outputFilePath}'. Total rows: ${rows.length}`);
} catch (e) {
  console.error("Error:", e.message);
}
