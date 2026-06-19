const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";
const sheetsToRead = ['05.06.26', '06.06.26', '07.06.26', '08.06.26'];

try {
  const wb = xlsx.readFile(XLSX_PATH);
  
  sheetsToRead.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) {
      console.log(`Sheet ${sheetName} not found!`);
      return;
    }
    
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const outputFilePath = `C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_${sheetName}.json`;
    fs.writeFileSync(outputFilePath, JSON.stringify(rows, null, 2));
    console.log(`Saved ${sheetName} to ${outputFilePath} (rows: ${rows.length})`);
  });
  
} catch (e) {
  console.error("Error dumping sheets:", e);
}
