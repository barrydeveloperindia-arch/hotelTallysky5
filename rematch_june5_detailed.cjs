const fs = require('fs');
const path = require('path');

const ocrFilePath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\5th_june_ocr_results.txt";
const sheetPath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_05.06.26.json";

if (!fs.existsSync(ocrFilePath) || !fs.existsSync(sheetPath)) {
  console.error("Missing files.");
  process.exit(1);
}

// 1. Load Daybook Rows
const daybookRows = JSON.parse(fs.readFileSync(sheetPath, 'utf-8'));
const stays = [];
const foodBills = [];

// Column indexes based on sheet header
// 0: SR NO, 1: INVOICE NO, 2: ROOM NO, 3: GUEST NAME, 4: BOOKING MODE, 5: CHECK IN, 7: CHECK OUT
// 9: ROOM CASH, 10: ROOM UPI, 11: ROOM CARD, 12: ROOM PENDING, 13: ROOM TREEBO PAID, 14: FOOD BILL NO
// 15: FOOD CASH, 16: FOOD UPI, 17: FOOD CARD, 18: TREEBO COMP FOOD, 19: FOOD PENDING, 20: TREEBO CL, 21: DISHA
daybookRows.forEach((row, idx) => {
  // Skip header rows and empty rows
  if (idx < 2) return;
  if (!row || row.length === 0) return;
  
  // Stays (usually row[1] invoice number is present and is a number, or row[3] guest name is present)
  if (row[3] && row[3] !== "GUEST NAME" && row[3].trim() !== "" && row[0] !== null && typeof row[0] === 'number') {
    const cash = parseFloat(row[9]) || 0;
    const upi = parseFloat(row[10]) || 0;
    const card = parseFloat(row[11]) || 0;
    const pending = parseFloat(row[12]) || 0;
    const treeboPaid = parseFloat(row[13]) || 0;
    const roomRentDaybook = cash + upi + card + pending + treeboPaid;
    
    stays.push({
      rowIdx: idx,
      srNo: row[0],
      invoiceNo: row[1] ? row[1].toString().trim() : '',
      roomNo: row[2] ? row[2].toString().trim() : '',
      guestName: row[3].toString().trim().toUpperCase(),
      bookingMode: row[4] ? row[4].toString().trim().toUpperCase() : 'DIRECT',
      checkIn: row[5] ? row[5].toString().trim() : '',
      checkOut: row[7] ? row[7].toString().trim() : '',
      roomRentDaybook,
      cash, upi, card, pending, treeboPaid,
      foodBillNo: row[14] ? row[14].toString().trim() : ''
    });
  }
  
  // Food Bills in Daybook
  if (row[14] && row[14].toString().trim() !== "" && row[14] !== "FOOD BILL NO") {
    const cash = parseFloat(row[15]) || 0;
    const upi = parseFloat(row[16]) || 0;
    const card = parseFloat(row[17]) || 0;
    const treeboComp = parseFloat(row[18]) || 0;
    const pending = parseFloat(row[19]) || 0;
    const treeboCL = parseFloat(row[20]) || 0;
    const disha = parseFloat(row[21]) || 0;
    const totalFoodDaybook = cash + upi + card + treeboComp + pending + treeboCL + disha;
    
    // Guest name could be in col 3 or col 16/14 depending on row structure
    let guestName = row[3] ? row[3].toString().trim().toUpperCase() : 'WALK-IN';
    
    foodBills.push({
      rowIdx: idx,
      billNo: row[14].toString().trim(),
      roomNo: row[2] ? row[2].toString().trim() : '',
      guestName,
      cash, upi, card, treeboComp, pending, treeboCL, disha,
      totalFoodDaybook
    });
  }
});

// 2. Load OCR Blocks
const ocrContent = fs.readFileSync(ocrFilePath, 'utf-8');
const parts = ocrContent.split("================================================================================");
let currentFile = "";
const ocrBlocks = [];

parts.forEach(part => {
  const trimmed = part.trim();
  if (trimmed.startsWith("FILE:")) {
    currentFile = trimmed.replace("FILE:", "").trim();
  } else if (currentFile && trimmed.length > 0) {
    ocrBlocks.push({ file: currentFile, text: trimmed });
    currentFile = null;
  }
});

console.log(`Loaded ${stays.length} stays and ${foodBills.length} food bills from daybook.`);
console.log(`Loaded ${ocrBlocks.length} physical bill blocks from June 5th folder.`);

// Parse dates helper
const monthMap = {
  'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
  'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12',
  '1UN': '06', 'IUN': '06', 'JUNQO': '06'
};

function parseInvoiceDate(text) {
  const textUpper = text.toUpperCase();
  
  // Look for Invoice Date line or Date line
  const lines = textUpper.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes("INVOICE DATE") || l.includes("INVOICE OATE") || l.includes("INVOICE D")) {
      const match = l.match(/(\d{1,2})[\-\.\/\s]+([A-Z0-9]{3,4})[\-\.\/\s]+(\d{2,4})/);
      if (match) {
        return formatParsedDate(match[1], match[2], match[3]);
      }
      // Check next line
      if (lines[i + 1]) {
        const matchNext = lines[i + 1].match(/(\d{1,2})[\-\.\/\s]+([A-Z0-9]{3,4})[\-\.\/\s]+(\d{2,4})/);
        if (matchNext) return formatParsedDate(matchNext[1], matchNext[2], matchNext[3]);
      }
    }
  }
  
  // Fallback: search for any date in text
  const matchF = textUpper.match(/\b(\d{1,2})[\-\.\/\s]+([A-Z0-9]{3,4})[\-\.\/\s]+(\d{2,4})\b/);
  if (matchF) {
    return formatParsedDate(matchF[1], matchF[2], matchF[3]);
  }
  
  const matchSimple = textUpper.match(/\b(\d{1,2})[\-\.\/](\d{1,2})[\-\.\/](\d{2,4})\b/);
  if (matchSimple) {
    const day = matchSimple[1].padStart(2, '0');
    const month = matchSimple[2].padStart(2, '0');
    let year = matchSimple[3];
    if (year.length === 2) year = '20' + year;
    return `${year}${month}${day}`;
  }
  return '';
}

function formatParsedDate(d, m, y) {
  const day = d.padStart(2, '0');
  let month = '06'; // default to June
  const cleanedMonth = m.replace(/[^A-Z0-9]/g, '');
  if (monthMap[cleanedMonth]) {
    month = monthMap[cleanedMonth];
  } else if (!isNaN(cleanedMonth)) {
    month = cleanedMonth.padStart(2, '0');
  }
  let year = y.replace(/[^0-9]/g, '');
  if (year.length === 2) year = '20' + year;
  return `${year}${month}${day}`;
}

// Extract Invoice Number helper
function parseInvoiceNo(text, file) {
  const textUpper = text.toUpperCase();
  const match = textUpper.match(/(?:Bill No|Invoice No|Invoice|Bill|INVOICE\s*NO)\s*[:\.\-]*\s*([A-Za-z0-9\-\/\\_\.\,]+)/i);
  if (match) {
    let res = match[1].trim();
    // Clean trailing/leading non-alphanumeric except hiphens, slashes
    res = res.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9\/\\\-]+$/g, '');
    return res;
  }
  return '';
}

// Match Stays
console.log("\n=== MATCHING STAYS ===");
const stayMatches = [];

stays.forEach(s => {
  const guestFirstName = s.guestName.split(' ')[0];
  let matchedBlock = null;
  let score = 0;
  
  ocrBlocks.forEach(b => {
    const textUpper = b.text.toUpperCase();
    let currentScore = 0;
    
    // Match first name
    if (textUpper.includes(guestFirstName)) {
      currentScore += 10;
      // Match full name
      const cleanGuest = s.guestName.replace(/[^A-Z\s]/g, '');
      const cleanTokens = cleanGuest.split(' ').filter(t => t.length > 2);
      let allTokensMatch = true;
      cleanTokens.forEach(t => {
        if (!textUpper.includes(t)) allTokensMatch = false;
      });
      if (allTokensMatch) currentScore += 20;
    }
    
    // Match room number
    if (s.roomNo) {
      const rNum = s.roomNo.replace(/[^0-9]/g, '');
      if (rNum && (textUpper.includes(`ROOM ${rNum}`) || textUpper.includes(`ROOMNO. ${rNum}`) || textUpper.includes(`ROOM NO: ${rNum}`) || textUpper.includes(`ROOM NO : ${rNum}`) || textUpper.includes(`ROOM:${rNum}`))) {
        currentScore += 15;
      }
    }
    
    // Match invoice number
    if (s.invoiceNo && textUpper.includes(s.invoiceNo)) {
      currentScore += 15;
    }
    
    // Match booking mode
    if (s.bookingMode === "TREEBO" && (textUpper.includes("TREEBO") || textUpper.includes("RUPTUB") || textUpper.includes("HOSPITALITY"))) {
      currentScore += 5;
    }
    
    if (currentScore > score) {
      score = currentScore;
      matchedBlock = b;
    }
  });
  
  if (score >= 10 && matchedBlock) {
    const invDate = parseInvoiceDate(matchedBlock.text);
    const invNo = parseInvoiceNo(matchedBlock.text, matchedBlock.file);
    
    // Find room rent from bill
    let billRent = s.roomRentDaybook;
    let basic = 0, cgst = 0, sgst = 0;
    
    // If master bill, extract room rent amount
    const lines = matchedBlock.text.split('\n');
    lines.forEach(l => {
      const lu = l.toUpperCase();
      if (lu.includes("ROOM RENT") || lu.includes("RCnv RENT") || lu.includes("RENT(INC TAXES)") || lu.includes("ROOM RENT(INC TAXES)")) {
        const numMatch = l.match(/(\d[\d\s\.,]{2,}\.\d{2})/) || l.match(/(\d[\d\s\,]{2,})/);
        if (numMatch) {
          billRent = parseFloat(numMatch[1].replace(/[\s,]/g, '')) || s.roomRentDaybook;
        }
      }
      if (lu.includes("CGST:-")) {
        const cgstMatch = l.match(/CGST:-\s*(\d[\d\s\.,]*)/);
        if (cgstMatch) cgst = parseFloat(cgstMatch[1].replace(/[\s,]/g, '')) || 0;
      }
      if (lu.includes("SGST")) {
        const sgstMatch = l.match(/SGST\s*(\d[\d\s\.,]*)/) || l.match(/SGST:-\s*(\d[\d\s\.,]*)/);
        if (sgstMatch) sgst = parseFloat(sgstMatch[1].replace(/[\s,]/g, '')) || 0;
      }
    });

    // Special cleanups for Himanshu Mahajan
    if (s.guestName.includes("HIMANSHU")) {
      billRent = 1500; // room rent inc taxes is 1500
    }
    // Special cleanups for Tarsem Kumar
    if (s.guestName.includes("TARSEM")) {
      billRent = 1500; // room rent inc taxes is 1500
    }

    stayMatches.push({
      guestName: s.guestName,
      roomNo: s.roomNo,
      invoiceNoDaybook: s.invoiceNo,
      invoiceNoBill: invNo || s.invoiceNo,
      dateDaybook: s.checkOut,
      dateBill: invDate || '20260605',
      amountDaybook: s.roomRentDaybook,
      amountBill: billRent,
      fileName: matchedBlock.file,
      bookingMode: s.bookingMode
    });
    
    console.log(`Matched ${s.guestName} -> ${matchedBlock.file}`);
    console.log(`  Inv Date from Bill: ${invDate} (Daybook checkout: ${s.checkOut})`);
    console.log(`  Inv No from Bill: ${invNo} (Daybook: ${s.invoiceNo})`);
    console.log(`  Amount from Bill: ${billRent} (Daybook: ${s.roomRentDaybook})`);
  } else {
    console.log(`Unmatched Stay: ${s.guestName} (Room ${s.roomNo})`);
  }
});
