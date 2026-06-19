const fs = require('fs');
const path = require('path');

const dates = ['05.06.26', '06.06.26', '07.06.26', '08.06.26'];
const outputLines = [];

function log(msg) {
  console.log(msg);
  outputLines.push(msg);
}

// Map dates to their respective OCR result files
const ocrFiles = {
  '05.06.26': ["C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\5th_june_ocr_results.txt"],
  '06.06.26': ["C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\6th_june_ocr_results.txt"],
  '07.06.26': ["C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\7th_june_ocr_results.txt"],
  '08.06.26': ["C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\8th_june_ocr_results.txt"]
};

// Also search in all files because checkouts can be delayed or in other folders
const allOcrFiles = [
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\5th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\6th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\7th_june_ocr_results.txt",
  "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\8th_june_ocr_results.txt"
];

function searchOcrForTerms(terms) {
  const matchedBlocks = [];
  allOcrFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    const blocks = content.split("================================================================================");
    
    blocks.forEach(block => {
      const matchAll = terms.every(t => block.toLowerCase().includes(t.toLowerCase()));
      if (matchAll) {
        const lines = block.trim().split("\n");
        const fileLine = lines.find(l => l.includes("FILE:"));
        const fileName = fileLine ? fileLine.replace("FILE:", "").trim() : "Unknown";
        matchedBlocks.push({ fileName, originFile: path.basename(filePath), text: block.trim() });
      }
    });
  });
  return matchedBlocks;
}

dates.forEach(dateStr => {
  log(`\n================================================================================`);
  log(`ANALYZING DATE: ${dateStr}`);
  log(`================================================================================`);
  
  const sheetPath = `C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_${dateStr}.json`;
  if (!fs.existsSync(sheetPath)) {
    log(`Sheet file not found: ${sheetPath}`);
    return;
  }
  
  const rows = JSON.parse(fs.readFileSync(sheetPath, 'utf8'));
  let roomSalesStart = false;
  const stays = [];
  const foodBills = [];
  
  rows.forEach((row, idx) => {
    if (row.includes("INVOICE NO.") || row.includes("ROOM NO.")) {
      roomSalesStart = true;
      return;
    }
    if (roomSalesStart) {
      // End room sales on TOTAL row or if the row lacks Sr. No and has TOTAL
      const isTotal = row.some(cell => cell && cell.toString().includes("TOTAL")) || (row[0] === null && row[1] === null && row[2] === null);
      if (isTotal) {
        roomSalesStart = false;
      } else {
        const checkVal = row[1] || row[2] || row[3];
        if (checkVal) {
          stays.push({
            rowIdx: idx + 1,
            invoiceNo: row[1] ? row[1].toString().trim() : '',
            roomNo: row[2] ? row[2].toString().trim() : '',
            guestName: row[3] ? row[3].toString().trim() : '',
            bookingMode: row[4] ? row[4].toString().trim() : '',
            checkIn: row[5] ? row[5].toString().trim() : '',
            checkOut: row[7] ? row[7].toString().trim() : '',
            cash: parseFloat(row[9]) || 0,
            upi: parseFloat(row[10]) || 0,
            card: parseFloat(row[11]) || 0,
            pending: parseFloat(row[12]) || 0,
            treeboPaid: parseFloat(row[13]) || 0,
            foodBillNo: row[14] ? row[14].toString().trim() : ''
          });
        }
      }
    }
  });

  // Food bill parsing
  rows.forEach((row, idx) => {
    if (row[14] && row[14] !== "FOOD BILL NO" && idx > 1) {
      const cash = parseFloat(row[15]) || 0;
      const upi = parseFloat(row[16]) || 0;
      const card = parseFloat(row[17]) || 0;
      const treeboComp = parseFloat(row[18]) || 0;
      const pending = parseFloat(row[19]) || 0;
      const treeboCL = parseFloat(row[20]) || 0;
      const disha = parseFloat(row[21]) || 0;
      const total = cash + upi + card + treeboComp + pending + treeboCL + disha;
      
      // Try to determine guest name or room number from nearby rows
      const guestName = row[3] || '';
      const roomNo = row[2] || '';
      
      foodBills.push({
        rowIdx: idx + 1,
        billNo: row[14].toString().trim(),
        roomNo,
        guestName,
        cash,
        upi,
        card,
        treeboComp,
        pending,
        treeboCL,
        disha,
        total
      });
    }
  });

  log(`\n--- Stays from Daybook (${stays.length}) ---`);
  stays.forEach(s => {
    log(`Row ${s.rowIdx}: Invoice: ${s.invoiceNo} | Room: ${s.roomNo} | Guest: ${s.guestName} | Mode: ${s.bookingMode} | Checkin: ${s.checkIn} | Checkout: ${s.checkOut}`);
    log(`  Payments: Cash: ${s.cash} | UPI: ${s.upi} | Card: ${s.card} | Pending: ${s.pending} | Treebo: ${s.treeboPaid}`);
    
    // Search OCR for invoice number or guest name
    let terms = [];
    if (s.invoiceNo) {
      // If short-number like 250, 251, try just that number or the full treebo number
      terms = [s.invoiceNo];
    } else if (s.guestName) {
      // Search by first name
      terms = [s.guestName.split(" ")[0]];
    }
    
    if (terms.length > 0) {
      const matches = searchOcrForTerms(terms);
      if (matches.length > 0) {
        log(`  Matched OCR Blocks (${matches.length}):`);
        matches.forEach(m => {
          log(`    - Match in: ${m.originFile} -> ${m.fileName}`);
          // Print first 20 lines of the matched block
          const blockLines = m.text.split("\n");
          log(blockLines.slice(0, 25).map(l => "      " + l).join("\n"));
        });
      } else {
        log(`  No OCR match found for stay ${s.guestName}`);
      }
    }
  });

  log(`\n--- Food Bills from Daybook (${foodBills.length}) ---`);
  foodBills.forEach(f => {
    log(`Row ${f.rowIdx}: Bill No: ${f.billNo} | Room: ${f.roomNo} | Guest: ${f.guestName}`);
    log(`  Payments: Cash: ${f.cash} | UPI: ${f.upi} | Card: ${f.card} | Comp: ${f.treeboComp} | Pending: ${f.pending} | TreeboCL: ${f.treeboCL} | Disha: ${f.disha} | Total: ${f.total}`);
    
    // Search OCR for POS-xxxx or clean number
    const cleanNo = f.billNo.replace(/^pos-/i, '').split('/')[0].trim();
    const matches = searchOcrForTerms([`pos-${cleanNo}`]);
    if (matches.length > 0) {
      log(`  Matched Food Bill OCR:`);
      matches.forEach(m => {
        log(`    - Match in: ${m.originFile} -> ${m.fileName}`);
        const blockLines = m.text.split("\n");
        log(blockLines.slice(0, 15).map(l => "      " + l).join("\n"));
      });
    } else {
      // try just number
      const matchesNum = searchOcrForTerms([cleanNo, "Receivable"]);
      if (matchesNum.length > 0) {
        log(`  Matched Food Bill OCR (by number + Receivable):`);
        matchesNum.forEach(m => {
          log(`    - Match in: ${m.originFile} -> ${m.fileName}`);
          const blockLines = m.text.split("\n");
          log(blockLines.slice(0, 15).map(l => "      " + l).join("\n"));
        });
      } else {
        log(`  No OCR match found for food bill ${f.billNo}`);
      }
    }
  });
});

fs.writeFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\june_5_to_8_full_analysis.txt", outputLines.join("\n"), "utf-8");
log("\nAnalysis written to C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\june_5_to_8_full_analysis.txt");
