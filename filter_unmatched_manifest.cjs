const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'public', 'manifest.json');
const reconResultsPath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\reconciliation_results.txt";

if (!fs.existsSync(manifestPath)) {
  console.error("manifest.json not found!");
  process.exit(1);
}

if (!fs.existsSync(reconResultsPath)) {
  console.error("reconciliation_results.txt not found!");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const reconText = fs.readFileSync(reconResultsPath, 'utf8');

// Parse all OK images from reconciliation_results.txt
const okImages = new Set();
const lines = reconText.split('\n');

lines.forEach(line => {
  if (line.includes('[OK STAY]') || line.includes('[OK FOOD]')) {
    // Extract image file name
    // Example: [OK STAY] 05.06.26 Row 10: TUSHAR TIWARI <-> Image: WhatsApp Image 2026-06-18 at 10.59.31 AM.jpeg | Inv: 11950 | Date:  | Total: 0
    // Example: [OK FOOD] 06.06.26 Row 11: Bill 16115/. <-> Image: WhatsApp Image 2026-06-18 at 11.04.39 AM.jpeg | Total: 969
    const match = line.match(/Image:\s*([^\|]+?\.(?:jpeg|jpg|png))/i);
    if (match) {
      okImages.add(match[1].trim());
    }
  }
});

console.log(`Found ${okImages.size} already verified (OK) images:`, Array.from(okImages));

// Filter manifest: keep only images that are NOT in the OK set
const filteredManifest = manifest.filter(img => {
  const isOk = okImages.has(img.originalName);
  return !isOk;
});

console.log(`Original manifest size: ${manifest.length}. Filtered manifest size (needing audit): ${filteredManifest.length}`);

// Write back to manifest.json
fs.writeFileSync(manifestPath, JSON.stringify(filteredManifest, null, 2), 'utf-8');
console.log("Filtered manifest.json written successfully!");
