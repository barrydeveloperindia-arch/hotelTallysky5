const fs = require('fs');
const path = require('path');

const files = [
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\5th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\6th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\7th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\8th_june_ocr_results.txt"
];

function search(term) {
  console.log(`\n==================================================`);
  console.log(`SEARCHING FOR: "${term}"`);
  console.log(`==================================================`);
  
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`File does not exist: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const blocks = content.split("================================================================================");
    
    blocks.forEach(block => {
      if (block.toLowerCase().includes(term.toLowerCase())) {
        const lines = block.trim().split("\n");
        const fileLine = lines.find(l => l.includes("FILE:"));
        const fileName = fileLine ? fileLine.replace("FILE:", "").trim() : "Unknown";
        console.log(`\nMatched in file: ${path.basename(filePath)} -> ${fileName}`);
        console.log(block.trim());
      }
    });
  });
}

const args = process.argv.slice(2);
if (args.length > 0) {
  search(args.join(" "));
} else {
  console.log("Usage: node search_ocr_details.cjs <search term>");
}
