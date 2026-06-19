const fs = require('fs');
const path = require('path');

const files = [
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\5th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\6th_june_ocr_results.txt"
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  const blocks = content.split("================================================================================");
  blocks.forEach((block, idx) => {
    if (block.toLowerCase().includes("sheela")) {
      console.log(`\n=== MATCH IN ${path.basename(filePath)} BLOCK ${idx} ===`);
      console.log(block);
    }
  });
});
