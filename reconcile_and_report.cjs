const fs = require('fs');
const path = require('path');

const parsedBills = JSON.parse(fs.readFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\advanced_ocr_parsed.json", "utf-8"));

const dates = ['05.06.26', '06.06.26', '07.06.26', '08.06.26'];
const daybookStays = [];
const daybookFood = [];

const logLines = [];
function log(msg) {
  console.log(msg);
  logLines.push(msg);
}

// Load Daybook sheets
dates.forEach(dateStr => {
  const filePath = `C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_${dateStr}.json`;
  if (!fs.existsSync(filePath)) return;
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let roomSalesStart = false;
  
  rows.forEach((row, idx) => {
    if (row.includes("INVOICE NO.") || row.includes("ROOM NO.")) {
      roomSalesStart = true;
      return;
    }
    if (roomSalesStart) {
      const isTotal = row.some(cell => cell && cell.toString().includes("TOTAL")) || (row[0] === null && row[1] === null && row[2] === null);
      if (isTotal) {
        roomSalesStart = false;
      } else {
        const checkVal = row[1] || row[2] || row[3];
        if (checkVal) {
          daybookStays.push({
            sheetDate: dateStr,
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
      
      daybookFood.push({
        sheetDate: dateStr,
        rowIdx: idx + 1,
        billNo: row[14].toString().trim(),
        roomNo: row[2] ? row[2].toString().trim() : '',
        guestName: row[3] ? row[3].toString().trim() : '',
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
});

log(`Loaded ${daybookStays.length} stays and ${daybookFood.length} food bills from Daybook sheets.`);

// Reconciliation logic
const stayMatches = [];
const foodMatches = [];

daybookStays.forEach(dbStay => {
  let match = null;
  
  if (dbStay.invoiceNo && dbStay.invoiceNo.trim() !== "") {
    match = parsedBills.find(b => b.type === 'stay' && b.invoiceNo && b.invoiceNo.trim() !== "" && (
      b.invoiceNo === dbStay.invoiceNo ||
      b.invoiceNo.endsWith(dbStay.invoiceNo) ||
      dbStay.invoiceNo.endsWith(b.invoiceNo)
    ));
  }
  
  if (!match && dbStay.guestName) {
    const dbFirstName = dbStay.guestName.split(" ")[0].toLowerCase();
    if (dbFirstName.length >= 3) {
      match = parsedBills.find(b => b.type === 'stay' && b.guestName && b.guestName.trim().length >= 3 && (
        b.guestName.toLowerCase().includes(dbFirstName) ||
        (b.guestName.toLowerCase().split(/\s+/)[0].length >= 3 && dbFirstName.includes(b.guestName.toLowerCase().split(/\s+/)[0]))
      ));
    }
  }
  
  stayMatches.push({
    daybook: dbStay,
    bill: match || null
  });
});

daybookFood.forEach(dbFood => {
  let match = null;
  const dbCleanNo = dbFood.billNo.replace(/[^0-9]/g, '');
  
  if (dbCleanNo) {
    match = parsedBills.find(b => b.type === 'food' && b.invoiceNo && b.invoiceNo.replace(/[^0-9]/g, '').includes(dbCleanNo));
  }
  
  foodMatches.push({
    daybook: dbFood,
    bill: match || null
  });
});

// Print Report
log("\n================================================================================");
log("RECONCILIATION REPORT: STAYS");
log("================================================================================");

let unmatchedStaysCount = 0;
let discrepancyStaysCount = 0;

stayMatches.forEach(m => {
  const db = m.daybook;
  const b = m.bill;
  const dbTotalPay = db.cash + db.upi + db.card + db.pending + db.treeboPaid;
  
  if (!b) {
    log(`[UNMATCHED STAY] Daybook ${db.sheetDate} Row ${db.rowIdx}: ${db.guestName} | Room ${db.roomNo} | Inv ${db.invoiceNo} | Pay: ${dbTotalPay}`);
    unmatchedStaysCount++;
  } else {
    const disc = [];
    
    const dbDateClean = db.checkOut ? db.checkOut.replace(/[^0-9]/g, '') : '';
    const bDateClean = b.date ? parseDateToClean(b.date) : '';
    if (dbDateClean && bDateClean && dbDateClean !== bDateClean) {
      disc.push(`Date mismatch: Daybook checkOut ${db.checkOut} vs Bill date ${b.date}`);
    }
    
    if (db.invoiceNo && b.invoiceNo && !b.invoiceNo.includes(db.invoiceNo) && !db.invoiceNo.includes(b.invoiceNo)) {
      disc.push(`Invoice No mismatch: Daybook ${db.invoiceNo} vs Bill ${b.invoiceNo}`);
    }
    
    const dbRoomClean = db.roomNo ? db.roomNo.replace(/[^0-9]/g, '') : '';
    const bRoomClean = b.roomNo ? b.roomNo.replace(/[^0-9]/g, '') : '';
    if (dbRoomClean && bRoomClean && !bRoomClean.endsWith(dbRoomClean) && !dbRoomClean.endsWith(bRoomClean)) {
      disc.push(`Room mismatch: Daybook ${db.roomNo} vs Bill ${b.roomNo}`);
    }
    
    const billTotal = parseFloat(b.total) || 0;
    if (billTotal > 0 && Math.abs(billTotal - dbTotalPay) > 10) {
      disc.push(`Amount mismatch: Daybook Pay ${dbTotalPay} vs Bill Total ${billTotal}`);
    }
    
    if (disc.length > 0) {
      log(`[DISCREPANCY STAY] Daybook ${db.sheetDate} Row ${db.rowIdx}: ${db.guestName} <-> Bill Image ${b.fileName}`);
      disc.forEach(d => log(`  - ${d}`));
      discrepancyStaysCount++;
    } else {
      log(`[OK STAY] ${db.sheetDate} Row ${db.rowIdx}: ${db.guestName} <-> Image: ${b.fileName} | Inv: ${b.invoiceNo} | Date: ${b.date} | Total: ${b.total}`);
    }
  }
});

log(`\nStay Reconciliation Summary: Stays = ${daybookStays.length}, Unmatched = ${unmatchedStaysCount}, Discrepancies = ${discrepancyStaysCount}`);

log("\n================================================================================");
log("RECONCILIATION REPORT: FOOD BILLS");
log("================================================================================");

let unmatchedFoodCount = 0;
let discrepancyFoodCount = 0;

foodMatches.forEach(m => {
  const db = m.daybook;
  const b = m.bill;
  
  if (!b) {
    log(`[UNMATCHED FOOD] Daybook ${db.sheetDate} Row ${db.rowIdx}: Bill No ${db.billNo} | Guest ${db.guestName} | Room ${db.roomNo} | Pay: ${db.total}`);
    unmatchedFoodCount++;
  } else {
    const disc = [];
    const billTotal = parseFloat(b.total) || 0;
    if (Math.abs(billTotal - db.total) > 1) {
      disc.push(`Amount mismatch: Daybook Pay ${db.total} vs Bill Total ${billTotal}`);
    }
    if (disc.length > 0) {
      log(`[DISCREPANCY FOOD] Daybook ${db.sheetDate} Row ${db.rowIdx}: Bill ${db.billNo} <-> Bill Image ${b.fileName}`);
      disc.forEach(d => log(`  - ${d}`));
      discrepancyFoodCount++;
    } else {
      log(`[OK FOOD] ${db.sheetDate} Row ${db.rowIdx}: Bill ${db.billNo} <-> Image: ${b.fileName} | Total: ${b.total}`);
    }
  }
});

log(`\nFood Reconciliation Summary: Food Bills = ${daybookFood.length}, Unmatched = ${unmatchedFoodCount}, Discrepancies = ${discrepancyFoodCount}`);

function parseDateToClean(dateStr) {
  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  
  dateStr = dateStr.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (/^\d{8}$/.test(dateStr)) {
    return dateStr.substring(6, 8) + dateStr.substring(4, 6) + dateStr.substring(2, 4);
  }
  
  const match = dateStr.match(/^(\d{2})([a-z]{3})(\d{2,4})$/);
  if (match) {
    const d = match[1];
    const m = months[match[2]] || '00';
    let y = match[3];
    if (y.length === 4) y = y.substring(2, 4);
    return d + m + y;
  }
  
  return dateStr;
}

fs.writeFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\reconciliation_results.txt", logLines.join("\n"), "utf-8");
