/**
 * export_verification_csv.cjs
 * Exports two CSV files for manual verification:
 *   - stays_verification.csv
 *   - food_verification.csv
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SCRATCH = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch';
const OUT_DIR = 'C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\Documents\\Antigravity\\Hotel';

function esc(val) {
  if (val === null || val === undefined) return '';
  const s = val.toString().replace(/"/g, '""');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
}

function row(...cols) {
  return cols.map(esc).join(',');
}

function parseDateToYmd(dateStr) {
  if (!dateStr) return '';
  const cleaned = dateStr.toString().replace(/[^0-9\.]/g, '').trim();
  const parts = cleaned.split('.');
  if (parts.length !== 3) return '';
  let [day, month, year] = parts;
  day = day.padStart(2, '0'); month = month.padStart(2, '0');
  if (year.length === 2) year = '20' + year;
  return `${year}${month}${day}`;
}

const monthMap = {
  'JAN':'01','FEB':'02','MAR':'03','APR':'04','MAY':'05','JUN':'06',
  'JUL':'07','AUG':'08','SEP':'09','OCT':'10','NOV':'11','DEC':'12',
  '1UN':'06','IUN':'06'
};

function parseBillDateToYmd(dateStr) {
  if (!dateStr) return '';
  let cleaned = dateStr.trim().toUpperCase()
    .replace(/[^A-Z0-9\.\-\/]/g,'')
    .replace(/1UN/g,'JUN').replace(/IUN/g,'JUN');
  const m1 = cleaned.match(/^(\d{1,2})[\-\.\/]([A-Z]{3})[\-\.\/](\d{2,4})$/);
  if (m1) { const [,d,mon,yr]=m1; return `${yr.length===2?'20'+yr:yr}${monthMap[mon]||'01'}${d.padStart(2,'0')}`; }
  const m2 = cleaned.match(/^(\d{1,2})[\-\.\/](\d{1,2})[\-\.\/](\d{2,4})$/);
  if (m2) { const [,d,mo,yr]=m2; return `${yr.length===2?'20'+yr:yr}${mo.padStart(2,'0')}${d.padStart(2,'0')}`; }
  return '';
}

function ymdDisplay(ymd) {
  if (!ymd || ymd.length !== 8) return '';
  return `${ymd.slice(6,8)}-${ymd.slice(4,6)}-${ymd.slice(0,4)}`;
}

// Load data
const reconciliation = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'matching_reconciliation.json'), 'utf-8'));
const existingVchList = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'existing_vouchers_list.json'), 'utf-8'));
const skipList = new Set(existingVchList.map(v => v.num.trim().toUpperCase()));

// Load OCR blocks for B2B detection
const ocrFiles = [
  '5th_june_ocr_results.txt','6th_june_ocr_results.txt','7th_june_ocr_results.txt',
  '8th_june_ocr_results.txt','9th_June_ocr_results.txt','10th_June_ocr_results.txt',
  '11th_June_ocr_results.txt','12th_June_ocr_results.txt','13th_June_ocr_results.txt',
  '14th_June_ocr_results.txt'
];
const ocrBlocks = [];
ocrFiles.forEach(file => {
  const fp = path.join(SCRATCH, file);
  if (!fs.existsSync(fp)) return;
  const parts = fs.readFileSync(fp,'utf-8').split('================================================================================');
  let cur = '';
  parts.forEach(part => {
    const t = part.trim();
    if (t.startsWith('FILE:')) { cur = t.replace('FILE:','').trim(); }
    else if (cur && t.length > 0) { ocrBlocks.push({ imageFile: cur, text: t }); cur = null; }
  });
});

function detectPartyLedger(db, bill) {
  if (db.bookingMode && db.bookingMode.toUpperCase() === 'TREEBO') {
    let block = bill ? ocrBlocks.find(b => b.imageFile === bill.fileName) : null;
    if (block) {
      const t = block.text.toUpperCase();
      if (t.includes('HOSPITALITY') || t.includes('VENTURES') || t.includes('HOSPNAHTY') ||
          t.includes('RUPTUB') || t.includes('06AAHCR31J7RIZV') || t.includes('06AAHCR31J7R1ZV')) {
        return 'TREEBO HOTELS';
      }
    }
    return (db.guestName||'').toUpperCase();
  }
  const g = (db.guestName||'').toUpperCase();
  if (g.includes('ENGLABS')||g.includes('COMPANY')||g.includes('PVT')||g.includes('LTD')) return 'B2B: '+g;
  return g;
}

// ============================================================
// STAYS CSV
// ============================================================
const stayLines = [];
stayLines.push(row(
  'Sheet Date','Row#','Status','Invoice No (Daybook)','Guest Name (Daybook)',
  'Room No','Booking Mode','Check In','Check Out',
  'Daybook Cash','Daybook UPI','Daybook Card','Daybook Pending','Daybook Treebo','Daybook TOTAL',
  'OCR Bill File','OCR Invoice No','OCR Guest Name','OCR Date','OCR Basic','OCR CGST','OCR SGST','OCR Total',
  'Resolved Date','Resolved VchNo','Party Ledger','Revenue Ledger',
  'Amount Used','Amount Source','CGST Used','SGST Used','Taxable Used',
  'Already In Tally?','Issues','Warnings'
));

for (const s of reconciliation.stays) {
  const db = s.daybook;
  const bill = s.bill;
  const daybookTotal = db.cash + db.upi + db.card + db.pending + db.treeboPaid;

  if (!s.matched || !bill) {
    stayLines.push(row(
      db.sheetDate, db.rowIdx, 'NO PHYSICAL COPY',
      db.invoiceNo, db.guestName, db.roomNo, db.bookingMode, db.checkIn, db.checkOut,
      db.cash, db.upi, db.card, db.pending, db.treeboPaid, daybookTotal,
      '','','','','','','','',
      '','','','',
      '','','','','',
      '','No physical scan found — bill will be SKIPPED',''
    ));
    continue;
  }

  if (!db.checkOut || db.checkOut.toUpperCase().includes('CONTINUE')) {
    stayLines.push(row(
      db.sheetDate, db.rowIdx, 'CONTINUE',
      db.invoiceNo, db.guestName, db.roomNo, db.bookingMode, db.checkIn, db.checkOut,
      db.cash, db.upi, db.card, db.pending, db.treeboPaid, daybookTotal,
      bill.fileName, bill.invoiceNo, bill.guestName, bill.date, bill.basic, bill.cgst, bill.sgst, bill.total,
      '','','','',
      '','','','','',
      '','CheckOut is CONTINUE — will be skipped',''
    ));
    continue;
  }

  // Resolve date
  let ymdDate = parseDateToYmd(db.checkOut);
  if (bill.date && bill.date.trim()) {
    const pd = parseBillDateToYmd(bill.date);
    if (pd) ymdDate = pd;
  }
  const displayDate = ymdDisplay(ymdDate);

  // Resolve voucher number
  let vchNo = bill.invoiceNo ? bill.invoiceNo.trim() : db.invoiceNo.toString().trim();
  if (!vchNo) vchNo = `DB-INV-${ymdDate}-${s.rowIdx}`;
  if (db.bookingMode && db.bookingMode.toUpperCase() === 'TREEBO' && vchNo.length < 10) {
    if (bill.invoiceNo && bill.invoiceNo.startsWith('180962826-')) { vchNo = bill.invoiceNo; }
    else { vchNo = `180962826-${vchNo.padStart(6,'0')}`; }
  }

  const alreadyInTally = skipList.has(vchNo.toUpperCase()) ? 'YES — SKIP' : 'NO';
  const partyLedger = detectPartyLedger(db, bill);
  const revenueLedger = partyLedger === 'TREEBO HOTELS' ? 'SALES B2B 5% HARYANA' : 'Sale 5% Haryana B2C';

  // Amount
  let totalAmount = daybookTotal;
  let amountSource = 'Daybook';
  const issues = [];
  const warnings = [];

  if (bill.total > 0) {
    totalAmount = bill.total;
    amountSource = 'Bill OCR';
    const diff = Math.abs(bill.total - daybookTotal);
    if (diff > 5) warnings.push(`Amount diff ₹${diff.toFixed(2)}: Bill=${bill.total} Daybook=${daybookTotal}`);
  }

  // Tax
  let cgst, sgst, taxable;
  if (bill.cgst > 0 || bill.sgst > 0) {
    cgst = bill.cgst; sgst = bill.sgst;
    taxable = parseFloat((totalAmount - cgst - sgst).toFixed(2));
    const recomp = taxable + cgst + sgst;
    if (Math.abs(recomp - totalAmount) > 0.05) issues.push(`Tax math error: ${taxable}+${cgst}+${sgst}=${recomp.toFixed(2)} ≠ ${totalAmount}`);
    if (Math.abs(cgst - sgst) > 0.05) warnings.push(`CGST(${cgst}) ≠ SGST(${sgst})`);
  } else {
    taxable = parseFloat((totalAmount / 1.05).toFixed(2));
    cgst = parseFloat((taxable * 0.025).toFixed(2));
    sgst = cgst;
  }

  if (totalAmount <= 0) issues.push('Zero/negative total');
  if (!ymdDate) issues.push('Invalid date');
  else if (ymdDate < '20260605' || ymdDate > '20260614') issues.push(`Date out of range: ${displayDate}`);

  const status = alreadyInTally === 'YES — SKIP' ? 'SKIP (IN TALLY)'
    : issues.length > 0 ? 'ERROR'
    : warnings.length > 0 ? 'WARN'
    : 'PASS';

  stayLines.push(row(
    db.sheetDate, db.rowIdx, status,
    db.invoiceNo, db.guestName, db.roomNo, db.bookingMode, db.checkIn, db.checkOut,
    db.cash, db.upi, db.card, db.pending, db.treeboPaid, daybookTotal,
    bill.fileName, bill.invoiceNo, bill.guestName, bill.date, bill.basic||'', bill.cgst||'', bill.sgst||'', bill.total||'',
    displayDate, vchNo, partyLedger, revenueLedger,
    totalAmount, amountSource, cgst.toFixed(2), sgst.toFixed(2), taxable.toFixed(2),
    alreadyInTally,
    issues.join(' | '),
    warnings.join(' | ')
  ));
}

const stayOut = path.join(OUT_DIR, 'stays_verification.csv');
fs.writeFileSync(stayOut, '\uFEFF' + stayLines.join('\r\n'), 'utf-8');
console.log(`✅ Stays CSV written: ${stayOut} (${stayLines.length - 1} rows)`);

// ============================================================
// FOOD CSV
// ============================================================
const foodLines = [];
foodLines.push(row(
  'Sheet Date','Row#','Status',
  'Bill No (Daybook)','Guest Name (Daybook)','Room No',
  'Daybook Cash','Daybook UPI','Daybook Card','Daybook TreeboComp','Daybook Pending','Daybook TreeboCL','Daybook Disha','Daybook TOTAL',
  'OCR Bill File','OCR Invoice No','OCR Guest Name','OCR Room No','OCR Total',
  'Amount Used','Amount Source','Taxable','CGST','SGST',
  'Issues','Warnings'
));

for (const f of reconciliation.food) {
  const db = f.daybook;
  const bill = f.bill;
  const daybookTotal = db.cash + db.upi + db.card + (db.treeboComp||0) + db.pending + (db.treeboCL||0) + (db.disha||0);

  if (!f.matched || !bill) {
    foodLines.push(row(
      db.sheetDate, db.rowIdx, 'NO PHYSICAL COPY',
      db.billNo, db.guestName, db.roomNo,
      db.cash, db.upi, db.card, db.treeboComp||0, db.pending, db.treeboCL||0, db.disha||0, daybookTotal,
      '','','','','',
      '','','','','',
      'No physical scan found — will be SKIPPED',''
    ));
    continue;
  }

  const issues = [];
  const warnings = [];

  let totalAmount = daybookTotal;
  let amountSource = 'Daybook';
  if (bill.total > 0) {
    totalAmount = bill.total;
    amountSource = 'Bill OCR';
    const diff = Math.abs(bill.total - daybookTotal);
    if (diff > 2) warnings.push(`Amount diff ₹${diff.toFixed(2)}: Bill=${bill.total} Daybook=${daybookTotal}`);
  }

  if (totalAmount <= 0) issues.push('Zero/negative total');

  const taxable = parseFloat((totalAmount / 1.05).toFixed(2));
  const cgst = parseFloat((taxable * 0.025).toFixed(2));
  const sgst = cgst;

  // Bill number cross-check
  if (bill.invoiceNo) {
    const bc = bill.invoiceNo.replace(/[^0-9]/g,'');
    const dc = (db.billNo||'').toString().replace(/[^0-9]/g,'');
    if (bc && dc && bc !== dc && !bc.endsWith(dc) && !dc.endsWith(bc)) {
      warnings.push(`Bill# mismatch: Daybook=${db.billNo} OCR=${bill.invoiceNo}`);
    }
  }

  const status = issues.length > 0 ? 'ERROR' : warnings.length > 0 ? 'WARN' : 'PASS';

  foodLines.push(row(
    db.sheetDate, db.rowIdx, status,
    db.billNo, db.guestName, db.roomNo,
    db.cash, db.upi, db.card, db.treeboComp||0, db.pending, db.treeboCL||0, db.disha||0, daybookTotal,
    bill.fileName, bill.invoiceNo||'', bill.guestName||'', bill.roomNo||'', bill.total||'',
    totalAmount, amountSource, taxable.toFixed(2), cgst.toFixed(2), sgst.toFixed(2),
    issues.join(' | '),
    warnings.join(' | ')
  ));
}

const foodOut = path.join(OUT_DIR, 'food_verification.csv');
fs.writeFileSync(foodOut, '\uFEFF' + foodLines.join('\r\n'), 'utf-8');
console.log(`✅ Food CSV written: ${foodOut} (${foodLines.length - 1} rows)`);

// Summary
const stayStatuses = {};
const foodStatuses = {};
stayLines.slice(1).forEach(l => { const s = l.split(',')[2].replace(/"/g,''); stayStatuses[s] = (stayStatuses[s]||0)+1; });
foodLines.slice(1).forEach(l => { const s = l.split(',')[2].replace(/"/g,''); foodStatuses[s] = (foodStatuses[s]||0)+1; });

console.log('\n=== STAYS CSV SUMMARY ===');
Object.entries(stayStatuses).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
console.log('\n=== FOOD CSV SUMMARY ===');
Object.entries(foodStatuses).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
console.log('\nOpen these files in Excel to review:');
console.log(`  ${stayOut}`);
console.log(`  ${foodOut}`);
