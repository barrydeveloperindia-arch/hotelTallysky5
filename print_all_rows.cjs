const fs = require('fs');

const sheets = ['07.06.26', '08.06.26', '09.06.26', '10.06.26'];
const outPath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\full_sheets_dump.txt";

let out = "";

sheets.forEach(sheetName => {
  const filePath = `C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_${sheetName}.json`;
  if (!fs.existsSync(filePath)) {
    out += `File ${filePath} not found!\n`;
    return;
  }
  
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  out += `\n================================================================================\n`;
  out += `SHEET: ${sheetName}\n`;
  out += `================================================================================\n`;
  
  out += "\n--- ROOM SALES ---\n";
  rows.forEach((row, idx) => {
    // Log non-empty rows
    const hasData = row.some(c => c !== null && c !== '');
    if (hasData) {
      // Print first 20 columns
      out += `Row ${idx+1}: ${row.slice(0, 20).map(c => c === null || c === undefined ? "" : c).join(' | ')}\n`;
    }
  });

  out += "\n--- FOOD SALES ---\n";
  rows.forEach((row, idx) => {
    if (row[14] && idx > 1) {
      out += `Row ${idx+1}: ${row.slice(14, 26).map(c => c === null || c === undefined ? "" : c).join(' | ')} (Room: ${row[2]}, Guest: ${row[3] || row[16]})\n`;
    }
  });
});

fs.writeFileSync(outPath, out);
console.log("Full sheets dump written to", outPath);
