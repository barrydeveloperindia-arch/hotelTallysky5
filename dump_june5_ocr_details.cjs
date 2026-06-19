const fs = require('fs');

const ocrFilePath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\5th_june_ocr_results.txt";
if (!fs.existsSync(ocrFilePath)) {
  console.log("OCR file does not exist.");
  process.exit(1);
}

const content = fs.readFileSync(ocrFilePath, 'utf-8');
const parts = content.split("================================================================================");

let currentFile = "";
const blocks = [];

parts.forEach(part => {
  const trimmed = part.trim();
  if (trimmed.startsWith("FILE:")) {
    currentFile = trimmed.replace("FILE:", "").trim();
  } else if (currentFile && trimmed.length > 0) {
    blocks.push({ file: currentFile, text: trimmed });
    currentFile = null;
  }
});

let outputStr = `=== DETAILED ANALYSIS OF 5TH JUNE OCR FILES (${blocks.length} files) ===\n`;

function logLine(str) {
  outputStr += str + "\n";
}

blocks.forEach((b, idx) => {
  logLine(`--------------------------------------------------------------------------------`);
  logLine(`File [${idx + 1}]: ${b.file}`);
  
  const text = b.text;
  
  // Find potential guest name
  let guest = "";
  const nameMatch = text.match(/(?:Guest Name|Guest|Name|BILL TO)\s*[:\.]*\s*([A-Za-z\s\.\,\_\-]+)/i);
  if (nameMatch) {
    guest = nameMatch[1].split('\n')[0].trim();
  }
  
  // Find potential dates
  const dates = [];
  const dateRegex = /\b\d{1,2}[\-\.\/\s]+[A-Za-z0-9]{3,4}[\-\.\/\s]+\d{2,4}\b/g;
  let m;
  while ((m = dateRegex.exec(text)) !== null) {
    dates.push(m[0]);
  }
  
  // Find potential room number
  let room = "";
  const roomMatch = text.match(/Room(?:\s*No)?\s*[:\.\-]*\s*([0-9A-Za-z\/\s\,]+)/i);
  if (roomMatch) {
    room = roomMatch[1].split('\n')[0].trim();
  }
  
  // Find potential invoice/bill number
  let billNo = "";
  const billMatch = text.match(/(?:Bill No|Invoice No|Invoice|Bill|INVOICE\s*NO)\s*[:\.\-]*\s*([A-Za-z0-9\-\/\\_\.\,]+)/i);
  if (billMatch) {
    billNo = billMatch[1].split('\n')[0].trim();
  }

  // Look for Treebo IDs
  const treeboIdMatch = text.match(/ROOM BOOKING\s*i?O?\s*[:\.\-]*\s*([A-Za-z0-9\-]+)/i) || text.match(/Booking\s*ID\s*[:\-]*\s*([0-9]+)/i);
  let treeboId = "";
  if (treeboIdMatch) {
    treeboId = treeboIdMatch[1].trim();
  }

  // Print all numbers that could be amounts
  const amounts = [];
  const lines = text.split('\n');
  lines.forEach(l => {
    if (l.includes("Total") || l.includes("Net") || l.includes("Receivable") || l.includes("Amount") || l.includes("Rent") || l.includes("Taxes")) {
      const numMatch = l.match(/(\d[\d\s\.,]{2,}\.\d{2})/);
      if (numMatch) {
        amounts.push(`${l.trim()} -> ${numMatch[1]}`);
      } else {
        const simpleNumMatch = l.match(/(\d[\d\s\,]{2,})/);
        if (simpleNumMatch) {
          amounts.push(`${l.trim()} -> ${simpleNumMatch[1]}`);
        }
      }
    }
  });

  logLine(`  Guest Name : ${guest}`);
  logLine(`  Bill/Inv No: ${billNo}`);
  logLine(`  Treebo ID  : ${treeboId}`);
  logLine(`  Room No    : ${room}`);
  logLine(`  Dates Found: ${dates.join(', ')}`);
  logLine(`  Amounts Found:`);
  amounts.slice(0, 10).forEach(a => logLine(`    ${a}`));
  
  // Print first 5 lines for context
  logLine(`  First 10 lines of text:`);
  lines.slice(0, 10).forEach(l => logLine(`    > ${l}`));
});

fs.writeFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\june5_details_dump_utf8.txt", outputStr, "utf-8");
console.log("Analysis written to C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\june5_details_dump_utf8.txt");

