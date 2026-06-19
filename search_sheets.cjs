const fs = require('fs');
const path = require('path');

const files = [
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_05.06.26.json",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_06.06.26.json",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_07.06.26.json",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_08.06.26.json"
];

function search(term) {
  console.log(`\n==================================================`);
  console.log(`SEARCHING SHEETS FOR: "${term}"`);
  console.log(`==================================================`);
  
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`File does not exist: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = JSON.parse(content);
    
    rows.forEach((row, rIdx) => {
      const rowStr = JSON.stringify(row);
      if (rowStr.toLowerCase().includes(term.toLowerCase())) {
        console.log(`\nMatched in sheet: ${path.basename(filePath)} -> Row ${rIdx + 1}`);
        console.log(row.join(" | "));
      }
    });
  });
}

const args = process.argv.slice(2);
if (args.length > 0) {
  search(args.join(" "));
} else {
  console.log("Usage: node search_sheets.cjs <search term>");
}
