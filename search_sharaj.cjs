const fs = require('fs');

const scratchDir = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\";
const files = fs.readdirSync(scratchDir).filter(f => f.startsWith("sheet_") && f.endsWith(".json"));

files.forEach(f => {
  const content = JSON.parse(fs.readFileSync(scratchDir + f, "utf-8"));
  content.forEach((row, idx) => {
    const rowStr = JSON.stringify(row).toUpperCase();
    if (rowStr.includes("SHARAJ") || rowStr.includes("PADDA")) {
      console.log(`File: ${f} | Row: ${idx}`);
      console.log(JSON.stringify(row, null, 2));
    }
  });
});
