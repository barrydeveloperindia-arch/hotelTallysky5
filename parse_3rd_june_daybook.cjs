const fs = require('fs');
const file = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_03.06.26.json';

try {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  console.log("=== June 3rd Daybook Headers and First 16 Rows ===");
  data.slice(0, 16).forEach((row, idx) => {
    const trimmedRow = row.map(val => {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed.length > 50 ? trimmed.substring(0, 50) + "..." : trimmed;
      }
      return val;
    });
    console.log(`Row ${idx}:`, trimmedRow);
  });
} catch (e) {
  console.error("Error:", e.message);
}
