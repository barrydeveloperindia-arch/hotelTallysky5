const fs = require('fs');
const file = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_04.06.26.json';

try {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  console.log("=== June 4th Daybook Headers and Rows ===");
  data.forEach((row, idx) => {
    const hasVal = row.some(v => v !== null && v !== undefined && v.toString().trim() !== "");
    if (hasVal) {
      const trimmedRow = row.map(val => {
        if (typeof val === 'string') {
          const trimmed = val.trim();
          return trimmed.length > 50 ? trimmed.substring(0, 50) + "..." : trimmed;
        }
        return val;
      });
      console.log(`Row ${idx}:`, trimmedRow.slice(0, 22));
    }
  });
} catch (e) {
  console.error("Error:", e.message);
}
