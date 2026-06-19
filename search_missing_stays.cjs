const fs = require('fs');
const path = require('path');

const files = [
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\5th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\6th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\7th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\8th_june_ocr_results.txt"
];

const guestsToSearch = [
  "SATPAL",
  "AMIT",
  "VARINDER",
  "ANKIT",
  "PANKAJ",
  "DHARMENDER",
  "SACHIN",
  "SUNIL",
  "PRAVEEN",
  "RAJIV",
  "GURSANJH"
];

guestsToSearch.forEach(guest => {
  console.log(`\n==================================================`);
  console.log(`SEARCHING FOR GUEST: ${guest}`);
  console.log(`==================================================`);
  
  let found = false;
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    const blocks = content.split("================================================================================");
    
    blocks.forEach((block, idx) => {
      if (block.toLowerCase().includes(guest.toLowerCase())) {
        // Exclude food bills if we are looking for stay bills, but print the header
        const lines = block.trim().split("\n");
        const fileLine = lines.find(l => l.includes("FILE:"));
        const fileName = fileLine ? fileLine.replace("FILE:", "").trim() : "Unknown";
        
        console.log(`  Matched in ${path.basename(filePath)} -> ${fileName} (Block ${idx})`);
        // Print first 25 lines of block
        console.log(lines.slice(0, 25).map(l => "    " + l).join("\n"));
        console.log("  --------------------------------------");
        found = true;
      }
    });
  });
  if (!found) {
    console.log(`  No matches found for ${guest}`);
  }
});
