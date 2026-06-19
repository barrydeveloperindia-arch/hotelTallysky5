const fs = require('fs');
const path = require('path');

const files = [
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\5th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\6th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\7th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\8th_june_ocr_results.txt"
];

const billNos = ["16046", "16047", "16058", "16064", "16069", "16072", "16082", "16088", "16097", "16102"];

billNos.forEach(billNo => {
  let found = false;
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    const blocks = content.split("================================================================================");
    blocks.forEach(block => {
      if (block.includes(`pos-${billNo}`) || block.includes(`POS-${billNo}`) || (block.includes(billNo) && block.includes("Receivable"))) {
        console.log(`\nMatched Food Bill ${billNo} in ${path.basename(filePath)}:`);
        const lines = block.trim().split("\n");
        const netLine = lines.find(l => l.includes("Receivable") || l.includes("Total Rs") || l.includes("Total Bill"));
        console.log(`  File: ${filePath}`);
        console.log(`  Summary: ${lines.slice(0, 8).join(" | ")}`);
        console.log(`  Net line: ${netLine || "Not found"}`);
        // Log the whole block if short
        if (block.length < 1000) {
          console.log(block.trim());
        } else {
          console.log(lines.slice(lines.length - 15).join("\n"));
        }
        found = true;
      }
    });
  });
  if (!found) {
    console.log(`Food Bill ${billNo} not found in OCR.`);
  }
});
