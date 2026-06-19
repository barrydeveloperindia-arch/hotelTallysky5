const fs = require('fs');

const content = fs.readFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\4th_june_ocr_results.txt", 'utf-8');
const lines = content.split("\n");

console.log("Searching for lines with numbers near the invoice total:");
lines.forEach((line, idx) => {
  if (line.includes("557") || line.includes("11487") || line.includes("12061") || line.includes("11,487") || line.includes("487") || line.includes("57.70")) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
