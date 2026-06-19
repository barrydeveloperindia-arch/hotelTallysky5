const fs = require('fs');

const ocrFilePath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\1st_june_ocr_results.txt";
if (!fs.existsSync(ocrFilePath)) {
  console.log("OCR file does not exist.");
  process.exit(1);
}

const content = fs.readFileSync(ocrFilePath, 'utf-8');
const parts = content.split("================================================================================");

let currentFile = "";
const blocks = [];

parts.forEach(part => {
  const trimmed = part.trim();
  if (trimmed.startsWith("FILE:")) {
    currentFile = trimmed.replace("FILE:", "").trim();
  } else if (currentFile && trimmed.length > 0) {
    blocks.push({ file: currentFile, text: trimmed });
    currentFile = null;
  }
});

console.log("=== KEY DATE FIELDS FROM MASTER BILLS ===");

blocks.forEach(b => {
  const text = b.text;
  if (text.toUpperCase().includes("MASTER BILL") || text.toUpperCase().includes("WALK IN GUEST") || text.toUpperCase().includes("WALK 'N GUEST") || b.file.includes("10.57.56")) {
    console.log(`\n========================================`);
    console.log(`File: ${b.file}`);
    
    // Print all lines containing any date-like formats or keyword "date", "arrival", "departure", "invoice"
    const lines = text.split('\n');
    lines.forEach((l, idx) => {
      const upper = l.toUpperCase();
      if (
        upper.includes("GUEST") || 
        upper.includes("MR ") || 
        upper.includes("DATE") || 
        upper.includes("INVOICE") || 
        upper.includes("DEPARTURE") || 
        upper.includes("ARRIV") ||
        l.match(/\d{1,2}[\-\.\/\s]+[A-Za-z0-9]{3,4}[\-\.\/\s]+\d{2,4}/) ||
        l.match(/\d{2}\.\d{2}\.\d{2}/)
      ) {
        // Print the current line and the next line for context
        console.log(`  [Line ${idx}]: ${l.trim()}`);
        if (lines[idx + 1] && lines[idx + 1].trim().length > 0) {
          console.log(`    -> Next: ${lines[idx + 1].trim()}`);
        }
      }
    });
  }
});
