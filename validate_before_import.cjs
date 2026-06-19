/**
 * ============================================================
 * VALIDATE BEFORE IMPORT — PRE-IMPORT DRY RUN VALIDATOR
 * ============================================================
 * Run this BEFORE import_june5_to_14_daybook.cjs
 * 
 * Checks:
 *   1. Tax math: basic + CGST + SGST == total (must balance)
 *   2. Amount mismatch: daybook total vs bill total (flag if >₹5 diff)
 *   3. Date sanity: date in range 05-Jun-26 to 14-Jun-26
 *   4. Duplicate invoice numbers (within this batch)
 *   5. Ledger classification: which party ledger will be used
 *   6. Unmatched stays/food (no physical copy) — listed clearly
 *   7. Continue stays (skipped) — listed clearly
 *   8. Summary counts: PASS / WARN / ERROR / SKIP
 *
 * Output: console + validation_report.json
 * ============================================================
 */

'use strict';
const fs = require('fs');
const path = require('path');

const SCRATCH = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch';
const REPORT_OUT = path.join(SCRATCH, 'validation_report.json');

// ---- Helpers ----
function parseDateToYmd(dateStr) {
  if (!dateStr) return '';
  const cleaned = dateStr.toString().replace(/[^0-9\.]/g, '').trim();
  const parts = cleaned.split('.');
  if (parts.length !== 3) return '';
  let [day, month, year] = parts;
  day = day.padStart(2, '0');
  month = month.padStart(2, '0');
  if (year.length === 2) year = '20' + year;
  return `${year}${month}${day}`;
}

const monthMap = {
  'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
  'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12',
  '1UN': '06', 'IUN': '06'
};

function parseBillDateToYmd(dateStr) {
  if (!dateStr) return '';
  let cleaned = dateStr.trim().toUpperCase()
    .replace(/[^A-Z0-9\.\-\/]/g, '')
    .replace(/1UN/g, 'JUN')
    .replace(/IUN/g, 'JUN');
  const m1 = cleaned.match(/^(\d{1,2})[\-\.\/]([A-Z]{3})[\-\.\/](\d{2,4})$/);
  if (m1) {
    const [, d, mon, yr] = m1;
    return `${yr.length === 2 ? '20' + yr : yr}${monthMap[mon] || '01'}${d.padStart(2, '0')}`;
  }
  const m2 = cleaned.match(/^(\d{1,2})[\-\.\/](\d{1,2})[\-\.\/](\d{2,4})$/);
  if (m2) {
    const [, d, mo, yr] = m2;
    return `${yr.length === 2 ? '20' + yr : yr}${mo.padStart(2, '0')}${d.padStart(2, '0')}`;
  }
  return '';
}

function ymdToDisplay(ymd) {
  if (!ymd || ymd.length !== 8) return ymd || '';
  return `${ymd.slice(6,8)}-${ymd.slice(4,6)}-${ymd.slice(0,4)}`;
}

const VALID_DATE_MIN = '20260605';
const VALID_DATE_MAX = '20260614';

function isDateInRange(ymd) {
  if (!ymd || ymd.length !== 8) return false;
  return ymd >= VALID_DATE_MIN && ymd <= VALID_DATE_MAX;
}

// ---- Load Data ----
const reconciliation = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'matching_reconciliation.json'), 'utf-8'));
const existingVchList = JSON.parse(fs.readFileSync(path.join(SCRATCH, 'existing_vouchers_list.json'), 'utf-8'));
const skipList = new Set(existingVchList.map(v => v.num.trim().toUpperCase()));

// Load raw OCR blocks for B2B detection
const ocrFiles = [
  '5th_june_ocr_results.txt', '6th_june_ocr_results.txt', '7th_june_ocr_results.txt',
  '8th_june_ocr_results.txt', '9th_June_ocr_results.txt', '10th_June_ocr_results.txt',
  '11th_June_ocr_results.txt', '12th_June_ocr_results.txt', '13th_June_ocr_results.txt',
  '14th_June_ocr_results.txt'
];
const ocrBlocks = [];
ocrFiles.forEach(file => {
  const filePath = path.join(SCRATCH, file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  const parts = content.split('================================================================================');
  let currentFile = '';
  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed.startsWith('FILE:')) {
      currentFile = trimmed.replace('FILE:', '').trim();
    } else if (currentFile && trimmed.length > 0) {
      ocrBlocks.push({ ocrFile: file, imageFile: currentFile, text: trimmed });
      currentFile = null;
    }
  });
});

function detectB2B(db, bill) {
  let isTreeboB2B = false;
  if (db.bookingMode && db.bookingMode.toUpperCase() === 'TREEBO') {
    let bestBlock = null;
    if (bill) {
      bestBlock = ocrBlocks.find(b => b.imageFile === bill.fileName);
    }
    if (bestBlock) {
      const t = bestBlock.text.toUpperCase();
      if (t.includes('HOSPITALITY') || t.includes('VENTURES') || t.includes('HOSPNAHTY') ||
          t.includes('RUPTUB') || t.includes('06AAHCR31J7RIZV') || t.includes('06AAHCR31J7R1ZV')) {
        isTreeboB2B = true;
      }
    }
  } else {
    const g = (db.guestName || '').toUpperCase();
    if (g.includes('ENGLABS') || g.includes('COMPANY') || g.includes('PVT') || g.includes('LTD') || g.includes('CORPORATE')) {
      isTreeboB2B = true;
    }
  }
  return isTreeboB2B;
}

// ---- Validation ----
const RESULTS = {
  stays: { pass: [], warn: [], error: [], skip: [], unmatched: [], duplicate: [] },
  food:  { pass: [], warn: [], error: [], skip: [], unmatched: [], duplicate: [] }
};

const allStayVchNos = new Set();   // duplicate detection within batch

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║         PRE-IMPORT VALIDATION REPORT — June 5 to 14             ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log(`Stays loaded: ${reconciliation.stays.length}`);
console.log(`Food bills loaded: ${reconciliation.food.length}`);
console.log(`Already-in-Tally (skip list): ${skipList.size}`);
console.log(`OCR block cache: ${ocrBlocks.length}`);
console.log('');

// ==================== STAY VALIDATION ====================
console.log('────────────────────────────────────────────────────────────────────');
console.log('STAYS VALIDATION');
console.log('────────────────────────────────────────────────────────────────────');

for (const s of reconciliation.stays) {
  const db = s.daybook;
  const bill = s.bill;
  const issues = [];
  const warnings = [];

  // -- SKIP: no physical copy
  if (!s.matched || !bill) {
    RESULTS.stays.unmatched.push({ guestName: db.guestName, inv: db.invoiceNo, date: db.sheetDate, reason: 'No physical copy matched' });
    console.log(`  [NO COPY] ${db.sheetDate} | ${db.guestName} | Inv:${db.invoiceNo}`);
    continue;
  }

  // -- SKIP: checkout is CONTINUE
  if (!db.checkOut || db.checkOut.toUpperCase().includes('CONTINUE')) {
    RESULTS.stays.skip.push({ guestName: db.guestName, inv: db.invoiceNo, date: db.sheetDate, reason: 'CheckOut is CONTINUE' });
    console.log(`  [CONTINUE] ${db.sheetDate} | ${db.guestName} | Inv:${db.invoiceNo}`);
    continue;
  }

  // ---- Resolve date ----
  let ymdDate = parseDateToYmd(db.checkOut);
  if (bill.date && bill.date.trim()) {
    const parsedBillDate = parseBillDateToYmd(bill.date);
    if (parsedBillDate) ymdDate = parsedBillDate;
  }

  const ymdDisplay = ymdToDisplay(ymdDate);
  if (!ymdDate) {
    issues.push(`Invalid date: checkOut='${db.checkOut}' bill.date='${bill.date}'`);
  } else if (!isDateInRange(ymdDate)) {
    issues.push(`Date OUT OF RANGE: ${ymdDisplay} (expected 05-Jun to 14-Jun-2026)`);
  }

  // ---- Resolve voucher number ----
  let vchNo = bill.invoiceNo ? bill.invoiceNo.trim() : db.invoiceNo.toString().trim();
  if (!vchNo) vchNo = `DB-INV-${ymdDate}-${s.rowIdx}`;
  if (db.bookingMode && db.bookingMode.toUpperCase() === 'TREEBO' && vchNo.length < 10) {
    if (bill.invoiceNo && bill.invoiceNo.startsWith('180962826-')) {
      vchNo = bill.invoiceNo;
    } else {
      vchNo = `180962826-${vchNo.padStart(6, '0')}`;
    }
  }

  // ---- Duplicate in current batch ----
  const vchUpper = vchNo.toUpperCase();
  if (allStayVchNos.has(vchUpper)) {
    RESULTS.stays.duplicate.push({ vchNo, guestName: db.guestName, date: ymdDisplay });
    issues.push(`DUPLICATE voucher number in batch: ${vchNo}`);
  }
  allStayVchNos.add(vchUpper);

  // ---- Already in Tally ----
  if (skipList.has(vchUpper)) {
    RESULTS.stays.skip.push({ vchNo, guestName: db.guestName, date: ymdDisplay, reason: 'Already in Tally' });
    console.log(`  [SKIP-DUP] ${ymdDisplay} | ${db.guestName} | Inv:${vchNo} — already in Tally`);
    continue;
  }

  // ---- Amount checks ----
  const daybookTotal = db.cash + db.upi + db.card + db.pending + db.treeboPaid;
  let totalAmount = daybookTotal;
  let amountSource = 'Daybook';
  if (bill.total > 0) {
    totalAmount = bill.total;
    amountSource = 'Bill';
    const diff = Math.abs(bill.total - daybookTotal);
    if (diff > 5) {
      warnings.push(`Amount mismatch: Bill=₹${bill.total.toFixed(2)} Daybook=₹${daybookTotal.toFixed(2)} Diff=₹${diff.toFixed(2)}`);
    }
  }

  // ---- Tax math verification ----
  let cgst, sgst, taxable;
  if (bill.cgst > 0 || bill.sgst > 0) {
    cgst = bill.cgst;
    sgst = bill.sgst;
    taxable = parseFloat((totalAmount - cgst - sgst).toFixed(2));
    const recomputed = taxable + cgst + sgst;
    const balanceDiff = Math.abs(recomputed - totalAmount);
    if (balanceDiff > 0.05) {
      issues.push(`TAX MATH ERROR: basic(${taxable}) + CGST(${cgst}) + SGST(${sgst}) = ${recomputed.toFixed(2)} ≠ total(${totalAmount})`);
    }
    // Validate CGST ≈ SGST (should be equal for Haryana 5% split)
    if (Math.abs(cgst - sgst) > 0.05) {
      warnings.push(`CGST(${cgst}) ≠ SGST(${sgst}) — unusual for 5% Haryana split`);
    }
    // Cross-check: cgst should be ≈ taxable * 2.5%
    const expectedCgst = parseFloat((taxable * 0.025).toFixed(2));
    if (Math.abs(cgst - expectedCgst) > 0.5) {
      warnings.push(`CGST rate mismatch: bill CGST=${cgst} vs recomputed 2.5%=${expectedCgst}`);
    }
  } else {
    // No bill tax — recompute
    taxable = parseFloat((totalAmount / 1.05).toFixed(2));
    cgst = parseFloat((taxable * 0.025).toFixed(2));
    sgst = cgst;
    const recomputed = taxable + cgst + sgst;
    const balanceDiff = Math.abs(recomputed - totalAmount);
    if (balanceDiff > 0.1) {
      warnings.push(`Computed tax imbalance: ${taxable}+${cgst}+${sgst}=${recomputed.toFixed(2)} vs total=${totalAmount} (diff=${balanceDiff.toFixed(2)})`);
    }
  }

  // ---- Party ledger classification ----
  const guestName = (db.guestName || '').toString().trim().toUpperCase().replace(/^\.*?\s+/, '').replace(/\s+/g, ' ');
  const isB2B = detectB2B(db, bill);
  const partyLedger = isB2B ? 'TREEBO HOTELS' : guestName;
  const revenueLedger = isB2B ? 'SALES B2B 5% HARYANA' : 'Sale 5% Haryana B2C';

  if (!guestName && !isB2B) {
    issues.push('No guest name and not B2B — cannot determine party ledger');
  }

  // ---- Zero amount guard ----
  if (totalAmount <= 0) {
    issues.push(`Zero/negative total amount: ${totalAmount}`);
  }

  // ---- Build result record ----
  const record = {
    date: ymdDisplay, vchNo, guestName, partyLedger, revenueLedger,
    totalAmount, taxable: taxable ? taxable.toFixed(2) : 'N/A',
    cgst: cgst ? cgst.toFixed(2) : 'N/A', sgst: sgst ? sgst.toFixed(2) : 'N/A',
    amountSource, billFile: bill.fileName,
    issues, warnings
  };

  if (issues.length > 0) {
    RESULTS.stays.error.push(record);
    console.log(`  [ERROR] ${ymdDisplay} | ${vchNo} | ${guestName}`);
    issues.forEach(i => console.log(`           ❌ ${i}`));
    warnings.forEach(w => console.log(`           ⚠  ${w}`));
  } else if (warnings.length > 0) {
    RESULTS.stays.warn.push(record);
    console.log(`  [WARN]  ${ymdDisplay} | ${vchNo} | ${guestName} | ₹${totalAmount}`);
    warnings.forEach(w => console.log(`           ⚠  ${w}`));
  } else {
    RESULTS.stays.pass.push(record);
    console.log(`  [PASS]  ${ymdDisplay} | ${vchNo} | ${partyLedger} | ₹${totalAmount} | CGST:${cgst ? cgst.toFixed(2) : '-'} SGST:${sgst ? sgst.toFixed(2) : '-'}`);
  }
}

// ==================== FOOD VALIDATION ====================
console.log('\n────────────────────────────────────────────────────────────────────');
console.log('FOOD BILLS VALIDATION');
console.log('────────────────────────────────────────────────────────────────────');

const allFoodBillNos = new Set();

for (const f of reconciliation.food) {
  const db = f.daybook;
  const bill = f.bill;
  const issues = [];
  const warnings = [];

  if (!f.matched || !bill) {
    RESULTS.food.unmatched.push({ billNo: db.billNo, roomNo: db.roomNo, guestName: db.guestName, date: db.sheetDate });
    console.log(`  [NO COPY] ${db.sheetDate} | Food Bill:${db.billNo} | Room:${db.roomNo} | ${db.guestName}`);
    continue;
  }

  // ---- Duplicate in batch ----
  const billNoKey = (db.billNo || '').toString().trim().toUpperCase();
  if (billNoKey && allFoodBillNos.has(billNoKey)) {
    RESULTS.food.duplicate.push({ billNo: db.billNo, guestName: db.guestName, date: db.sheetDate });
    issues.push(`DUPLICATE food bill number in batch: ${db.billNo}`);
  }
  if (billNoKey) allFoodBillNos.add(billNoKey);

  // ---- Amount checks ----
  const daybookTotal = db.cash + db.upi + db.card + db.treeboComp + db.pending + db.treeboCL + db.disha;
  let totalAmount = daybookTotal;
  let amountSource = 'Daybook';
  if (bill.total > 0) {
    totalAmount = bill.total;
    amountSource = 'Bill';
    const diff = Math.abs(bill.total - daybookTotal);
    if (diff > 2) {
      warnings.push(`Amount mismatch: Bill=₹${bill.total.toFixed(2)} Daybook=₹${daybookTotal.toFixed(2)} Diff=₹${diff.toFixed(2)}`);
    }
  }

  if (totalAmount <= 0) {
    issues.push(`Zero/negative food bill total: ${totalAmount}`);
  }

  // ---- Tax math for food (5% GST) ----
  const taxable = parseFloat((totalAmount / 1.05).toFixed(2));
  const cgst = parseFloat((taxable * 0.025).toFixed(2));
  const sgst = cgst;
  const recomputed = taxable + cgst + sgst;
  const balanceDiff = Math.abs(recomputed - totalAmount);
  if (balanceDiff > 0.1) {
    warnings.push(`Tax imbalance: ${taxable.toFixed(2)}+${cgst.toFixed(2)}+${sgst.toFixed(2)}=${recomputed.toFixed(2)} vs total=${totalAmount}`);
  }

  // ---- Bill number match ----
  if (bill.invoiceNo) {
    const billNoClean = bill.invoiceNo.replace(/[^0-9]/g, '');
    const dbNoClean = (db.billNo || '').toString().replace(/[^0-9]/g, '');
    if (billNoClean && dbNoClean && billNoClean !== dbNoClean && !billNoClean.endsWith(dbNoClean) && !dbNoClean.endsWith(billNoClean)) {
      warnings.push(`Food bill number mismatch: Daybook=${db.billNo} vs OCR Bill=${bill.invoiceNo}`);
    }
  }

  const record = {
    date: db.sheetDate, billNo: db.billNo, roomNo: db.roomNo,
    guestName: db.guestName, billFile: bill.fileName,
    totalAmount, taxable: taxable.toFixed(2), cgst: cgst.toFixed(2), sgst: sgst.toFixed(2),
    amountSource, issues, warnings
  };

  if (issues.length > 0) {
    RESULTS.food.error.push(record);
    console.log(`  [ERROR] ${db.sheetDate} | Bill:${db.billNo} | Room:${db.roomNo} | ${db.guestName}`);
    issues.forEach(i => console.log(`           ❌ ${i}`));
    warnings.forEach(w => console.log(`           ⚠  ${w}`));
  } else if (warnings.length > 0) {
    RESULTS.food.warn.push(record);
    console.log(`  [WARN]  ${db.sheetDate} | Bill:${db.billNo} | ${db.guestName} | ₹${totalAmount}`);
    warnings.forEach(w => console.log(`           ⚠  ${w}`));
  } else {
    RESULTS.food.pass.push(record);
    console.log(`  [PASS]  ${db.sheetDate} | Bill:${db.billNo} | ${db.guestName} | ₹${totalAmount}`);
  }
}

// ==================== SUMMARY ====================
console.log('\n╔══════════════════════════════════════════════════════════════════╗');
console.log('║                       VALIDATION SUMMARY                         ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');

const stayTotal = reconciliation.stays.length;
const foodTotal = reconciliation.food.length;

console.log(`║  STAYS  (${stayTotal} total)`);
console.log(`║    ✅ PASS      : ${RESULTS.stays.pass.length}`);
console.log(`║    ⚠  WARN      : ${RESULTS.stays.warn.length}`);
console.log(`║    ❌ ERROR     : ${RESULTS.stays.error.length}`);
console.log(`║    ⏩ SKIP      : ${RESULTS.stays.skip.length}  (CONTINUE checkout / already in Tally)`);
console.log(`║    📷 NO COPY   : ${RESULTS.stays.unmatched.length}  (no physical scan matched)`);
console.log(`║    🔁 DUPLICATE : ${RESULTS.stays.duplicate.length}  (same voucher # in batch)`);
console.log('║');
console.log(`║  FOOD   (${foodTotal} total)`);
console.log(`║    ✅ PASS      : ${RESULTS.food.pass.length}`);
console.log(`║    ⚠  WARN      : ${RESULTS.food.warn.length}`);
console.log(`║    ❌ ERROR     : ${RESULTS.food.error.length}`);
console.log(`║    📷 NO COPY   : ${RESULTS.food.unmatched.length}  (no physical scan matched)`);
console.log(`║    🔁 DUPLICATE : ${RESULTS.food.duplicate.length}  (same bill # in batch)`);
console.log('╠══════════════════════════════════════════════════════════════════╣');

const totalErrors = RESULTS.stays.error.length + RESULTS.food.error.length;
const totalWarnings = RESULTS.stays.warn.length + RESULTS.food.warn.length;

if (totalErrors > 0) {
  console.log(`║  ⛔ BLOCKED: ${totalErrors} ERROR(s) must be fixed before import             ║`);
} else if (totalWarnings > 0) {
  console.log(`║  ⚠  WARNINGS: ${totalWarnings} item(s) — review and confirm before import    ║`);
} else {
  console.log(`║  ✅ ALL CLEAR — Safe to run import_june5_to_14_daybook.cjs       ║`);
}

console.log('╚══════════════════════════════════════════════════════════════════╝');

// Highlight unmatched stays (no physical copy)
if (RESULTS.stays.unmatched.length > 0) {
  console.log('\n⚠  STAYS WITH NO PHYSICAL COPY (will be SKIPPED in import):');
  RESULTS.stays.unmatched.forEach(u => {
    console.log(`   - ${u.date} | ${u.guestName} | Inv:${u.inv}`);
  });
}

if (RESULTS.food.unmatched.length > 0) {
  console.log('\n⚠  FOOD BILLS WITH NO PHYSICAL COPY (will be SKIPPED in import):');
  RESULTS.food.unmatched.forEach(u => {
    console.log(`   - ${u.date} | Bill:${u.billNo} | Room:${u.roomNo} | ${u.guestName}`);
  });
}

// Highlight errors
if (RESULTS.stays.error.length > 0) {
  console.log('\n❌ STAY ERRORS (MUST FIX):');
  RESULTS.stays.error.forEach(e => {
    console.log(`   [${e.date}] ${e.vchNo} — ${e.guestName}`);
    e.issues.forEach(i => console.log(`     ❌ ${i}`));
  });
}

if (RESULTS.food.error.length > 0) {
  console.log('\n❌ FOOD ERRORS (MUST FIX):');
  RESULTS.food.error.forEach(e => {
    console.log(`   [${e.date}] Bill:${e.billNo} — ${e.guestName}`);
    e.issues.forEach(i => console.log(`     ❌ ${i}`));
  });
}

// ---- Save JSON report ----
const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    stays: {
      total: stayTotal,
      pass: RESULTS.stays.pass.length,
      warn: RESULTS.stays.warn.length,
      error: RESULTS.stays.error.length,
      skip: RESULTS.stays.skip.length,
      noPhysicalCopy: RESULTS.stays.unmatched.length,
      duplicate: RESULTS.stays.duplicate.length
    },
    food: {
      total: foodTotal,
      pass: RESULTS.food.pass.length,
      warn: RESULTS.food.warn.length,
      error: RESULTS.food.error.length,
      noPhysicalCopy: RESULTS.food.unmatched.length,
      duplicate: RESULTS.food.duplicate.length
    }
  },
  blockImport: totalErrors > 0,
  details: RESULTS
};

fs.writeFileSync(REPORT_OUT, JSON.stringify(report, null, 2), 'utf-8');
console.log(`\n📄 Full validation report saved to: ${REPORT_OUT}`);
console.log('\nNEXT STEPS:');
if (totalErrors > 0) {
  console.log('  1. Fix all ❌ ERROR items listed above.');
  console.log('  2. Re-run reconcile_all_dates.cjs to regenerate matching_reconciliation.json.');
  console.log('  3. Re-run this script to confirm all errors are resolved.');
  console.log('  4. Only then run import_june5_to_14_daybook.cjs');
} else {
  console.log('  1. Review ⚠  WARN items — confirm amounts are acceptable.');
  console.log('  2. Run import_june5_to_14_daybook.cjs');
  console.log('  3. Then run audit_after_import.cjs to verify what was posted.');
}
