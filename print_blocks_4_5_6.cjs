const fs = require('fs');

const content = fs.readFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\4th_june_ocr_results.txt", 'utf-8');
const blocks = content.split("================================================================================");

for (let i = 8; i <= 15; i++) {
  if (blocks[i]) {
    console.log(`\n=== BLOCK ${i} ===`);
    console.log(blocks[i].trim());
  }
}
