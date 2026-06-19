const fs = require('fs');

const content = fs.readFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\4th_june_ocr_results.txt", 'utf-8');
const blocks = content.split("================================================================================");

blocks.forEach((block, idx) => {
  if (block.includes("000243") || block.includes("Treebo Hospitality") || block.includes("Ruptub Solutions") || block.includes("9269505622025")) {
    console.log(`\n=== BLOCK ${idx} ===`);
    console.log(block.trim());
  }
});
