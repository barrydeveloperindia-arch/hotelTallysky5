const fs = require('fs');

const ocrFilePath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\5th_june_ocr_results.txt";
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

console.log(`=== PARSED KEY FIELDS FROM 5TH JUNE OCR (${blocks.length} files) ===`);

blocks.forEach((b, idx) => {
  console.log(`\nFile [${idx + 1}]: ${b.file}`);
  const lines = b.text.split('\n');
  let printLines = [];
  lines.forEach(l => {
    const upper = l.toUpperCase();
    if (
      upper.includes("INVOICE") || 
      upper.includes("BILL") || 
      upper.includes("GUEST") || 
      upper.includes("NAME") || 
      upper.includes("DATE") || 
      upper.includes("ROOM") || 
      upper.includes("TOTAL") || 
      upper.includes("TAXABLE") || 
      upper.includes("CGST") || 
      upper.includes("SGST") || 
      upper.includes("NET") || 
      upper.includes("PAYMENT") ||
      upper.includes("TREEBO") ||
      upper.includes("HOSPITALITY")
    ) {
      printLines.push(l.trim());
    }
  });
  
  // Print top matching lines
  printLines.slice(0, 15).forEach(l => console.log(`  ${l}`));
  if (printLines.length > 15) {
    console.log(`  ... (${printLines.length - 15} more matches)`);
  }
});
