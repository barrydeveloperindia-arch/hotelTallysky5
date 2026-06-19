const fs = require('fs');
const path = require('path');

const reconciliation = JSON.parse(fs.readFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\matching_reconciliation.json", "utf-8"));
const june5FolderDir = "c:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\Documents\\Antigravity\\Hotel\\Sales Bills\\5th June";
const folderFiles = fs.readdirSync(june5FolderDir).filter(f => f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.jpg'));

console.log(`=== FILES IN "5th June" FOLDER (${folderFiles.length} files) ===`);

// Track which files are matched in reconciliation stays or food
const matchedFiles = new Set();

console.log("\n=== RECONCILIATION STAYS CHECKOUT OR SHEET ON 5TH JUNE ===");
reconciliation.stays.forEach((s, idx) => {
  const db = s.daybook;
  const isOn5th = (db.checkOut && db.checkOut.includes("05.06.26")) || (db.sheetDate && db.sheetDate.includes("05.06.26"));
  if (isOn5th) {
    console.log(`Stay Index: ${idx} | Sheet Date: ${db.sheetDate} | Guest: ${db.guestName} | Room: ${db.roomNo} | checkOut: ${db.checkOut} | InvNo: ${db.invoiceNo} | Mode: ${db.bookingMode}`);
    if (s.bill) {
      console.log(`  -> Matched Bill: ${s.bill.fileName} | Guest: ${s.bill.guestName} | Date: ${s.bill.date} | Total: ${s.bill.total}`);
      matchedFiles.add(s.bill.fileName);
    } else {
      console.log(`  -> Matched Bill: NONE`);
    }
  }
});

console.log("\n=== RECONCILIATION FOOD BILLS ON 5TH JUNE ===");
reconciliation.food.forEach((f, idx) => {
  const db = f.daybook;
  const isOn5th = (db.sheetDate && db.sheetDate.includes("05.06.26"));
  if (isOn5th) {
    console.log(`Food Index: ${idx} | Sheet Date: ${db.sheetDate} | Guest: ${db.guestName} | Room: ${db.roomNo} | BillNo: ${db.billNo} | Total: ${db.total}`);
    if (f.bill) {
      console.log(`  -> Matched Bill: ${f.bill.fileName} | Guest: ${f.bill.guestName} | Date: ${f.bill.date} | Total: ${f.bill.total}`);
      matchedFiles.add(f.bill.fileName);
    } else {
      console.log(`  -> Matched Bill: NONE`);
    }
  }
});

console.log("\n=== UNMATCHED FILES IN 5TH JUNE FOLDER ===");
let unmatchedCount = 0;
folderFiles.forEach(file => {
  if (!matchedFiles.has(file)) {
    console.log(`- ${file}`);
    unmatchedCount++;
  }
});
console.log(`Total unmatched files: ${unmatchedCount}`);
