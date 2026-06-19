const fs = require('fs');

const content = fs.readFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\4th_june_ocr_results.txt", 'utf-8');
const separator = "================================================================================";
const parts = content.split(separator);

let fileMap = {};
let currentFile = null;

parts.forEach(part => {
  const trimmed = part.trim();
  if (trimmed.startsWith("FILE:")) {
    currentFile = trimmed.replace("FILE:", "").trim();
  } else if (currentFile && trimmed.length > 0) {
    if (!fileMap[currentFile]) {
      fileMap[currentFile] = [];
    }
    fileMap[currentFile].push(trimmed);
    currentFile = null; // Reset
  }
});

const targets = [
  "WhatsApp Image 2026-06-18 at 10.28.02 AM.jpeg",
  "WhatsApp Image 2026-06-18 at 10.39.39 AM.jpeg",
  "WhatsApp Image 2026-06-18 at 10.39.59 AM.jpeg"
];

targets.forEach(target => {
  console.log(`\n================================================================================`);
  console.log(`FILE: ${target}`);
  console.log(`================================================================================`);
  if (fileMap[target]) {
    console.log(fileMap[target].join("\n\n"));
  } else {
    console.log("No content found!");
  }
});
