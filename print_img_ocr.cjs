const fs = require('fs');
const path = require('path');

const content = fs.readFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\4th_june_ocr_results.txt", 'utf-8');
const blocks = content.split("================================================================================");

const targets = [
  "WhatsApp Image 2026-06-18 at 10.28.02 AM.jpeg",
  "WhatsApp Image 2026-06-18 at 10.39.39 AM.jpeg",
  "WhatsApp Image 2026-06-18 at 10.39.59 AM.jpeg"
];

targets.forEach(target => {
  console.log(`\n================================================================================`);
  console.log(`FILE CONTENT FOR: ${target}`);
  console.log(`================================================================================`);
  
  const block = blocks.find(b => b.includes(target));
  if (block) {
    console.log(block.trim());
  } else {
    console.log("Not found in OCR results!");
  }
});
