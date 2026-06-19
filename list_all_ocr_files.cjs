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

console.log("Files in 4th_june_ocr_results.txt:");
Object.keys(fileMap).forEach((fileName, idx) => {
  console.log(`\n[${idx + 1}] FILE: ${fileName}`);
  const text = fileMap[fileName].join("\n");
  console.log(`  Lines: ${text.split("\n").length}, Casing length: ${text.length}`);
  console.log(`  Preview: ${text.split("\n").slice(0, 5).join(" | ")}`);
});
