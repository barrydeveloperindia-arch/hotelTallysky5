const fs = require('fs');
const path = require('path');

const content = fs.readFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\4th_june_ocr_results.txt", 'utf-8');
const blocks = content.split("================================================================================");

console.log("Searching in 4th_june_ocr_results.txt...");
blocks.forEach((block, idx) => {
  const match = ["treebo", "ruptub", "000243", "000244"].some(term => block.toLowerCase().includes(term));
  if (match) {
    const fileLine = block.trim().split("\n").find(l => l.includes("FILE:"));
    console.log(`Block ${idx} matches! File: ${fileLine ? fileLine : 'Unknown'}`);
    console.log(block.trim().split("\n").slice(0, 15).join("\n"));
    console.log("----------------------------------------");
  }
});
