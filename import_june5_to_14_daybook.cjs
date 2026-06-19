const http = require('http');
const fs = require('fs');
const path = require('path');

const TALLY_URL = "http://127.0.0.1:9000";
const companyName = "Hotel Sky 5 2026-27";

function parseRoomNumbers(roomNoStr) {
  if (!roomNoStr) return [];
  return roomNoStr.toString()
    .split(/[,\/]/)
    .map(r => {
      let cleaned = r.trim().replace(/\s+/g, '');
      if (cleaned === '1.14' || cleaned === '1,14') {
        cleaned = '14';
      }
      if (cleaned === '8.14' || cleaned === '8,14') {
        cleaned = '14';
      }
      let digits = cleaned.replace(/[^0-9]/g, '');
      if (digits === '114' || digits === '814') {
        digits = '14';
      }
      return digits;
    })
    .filter(r => r.length > 0)
    .map(r => `Room ${r.padStart(2, '0')}`);
}

// Helper: Post XML to Tally Prime
function postTallyXml(xml) {
  return new Promise((resolve, reject) => {
    const req = http.request(TALLY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(xml)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(xml);
    req.end();
  });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseDateToYmd(dateStr) {
  if (!dateStr) return '';
  const cleaned = dateStr.toString().replace(/[^0-9\.]/g, '').trim();
  const parts = cleaned.split('.');
  if (parts.length !== 3) return '';
  let day = parts[0].padStart(2, '0');
  let month = parts[1].padStart(2, '0');
  let year = parts[2].trim();
  if (year.length === 2) {
    year = '20' + year;
  }
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
    const day = m1[1].padStart(2, '0');
    const monthName = m1[2];
    let year = m1[3];
    if (year.length === 2) year = '20' + year;
    const month = monthMap[monthName] || '01';
    return `${year}${month}${day}`;
  }

  const m2 = cleaned.match(/^(\d{1,2})[\-\.\/](\d{1,2})[\-\.\/](\d{2,4})$/);
  if (m2) {
    const day = m2[1].padStart(2, '0');
    const month = m2[2].padStart(2, '0');
    let year = m2[3];
    if (year.length === 2) year = '20' + year;
    return `${year}${month}${day}`;
  }
  return '';
}

// Ensure Group exists
async function createGroup(name, parent) {
  const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <GROUP NAME="${name}" ACTION="Create">
                        <NAME>${name}</NAME>
                        <PARENT>${parent}</PARENT>
                    </GROUP>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
  try {
    await postTallyXml(xml);
  } catch (e) {
    console.warn(`  Warning creating group '${name}':`, e.message);
  }
}

// Ensure Ledger exists
async function createLedger(name, parent, isCostCentreOn = false, isInventoryAffected = false, gstApplicable = "Not Applicable") {
  const costCentresXml = isCostCentreOn ? "<ISCOSTCENTRESON>Yes</ISCOSTCENTRESON>" : "<ISCOSTCENTRESON>No</ISCOSTCENTRESON>";
  const inventoryXml = isInventoryAffected ? "<ISINVENTORYAFFECTED>Yes</ISINVENTORYAFFECTED>" : "<ISINVENTORYAFFECTED>No</ISINVENTORYAFFECTED>";
  
  const escapedName = escapeXml(name);
  const escapedParent = escapeXml(parent);
  
  const createXml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <LEDGER NAME="${escapedName}" ACTION="Create">
                        <NAME>${escapedName}</NAME>
                        <PARENT>${escapedParent}</PARENT>
                        <GSTAPPLICABLE>${gstApplicable}</GSTAPPLICABLE>
                        <ISBILLWISEON>No</ISBILLWISEON>
                        <STATENAME>Haryana</STATENAME>
                        <COUNTRYNAME>India</COUNTRYNAME>
                        ${costCentresXml}
                        ${inventoryXml}
                    </LEDGER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

  try {
    const res = await postTallyXml(createXml);
    if (!res.includes("<CREATED>1</CREATED>")) {
      const alterXml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <LEDGER NAME="${escapedName}" ACTION="Alter">
                        <NAME>${escapedName}</NAME>
                        <PARENT>${escapedParent}</PARENT>
                        <GSTAPPLICABLE>${gstApplicable}</GSTAPPLICABLE>
                        <ISBILLWISEON>No</ISBILLWISEON>
                        ${costCentresXml}
                        ${inventoryXml}
                    </LEDGER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
      await postTallyXml(alterXml);
    }
  } catch (err) {
    console.error(`  ERROR setting up ledger '${name}':`, err.message);
  }
}

// Ensure Cost Centre exists
async function createCostCentre(name, category) {
  const escapedName = escapeXml(name);
  const escapedCategory = escapeXml(category);
  const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <COSTCENTRE NAME="${escapedName}" ACTION="Create">
                        <NAME>${escapedName}</NAME>
                        <CATEGORY>${escapedCategory}</CATEGORY>
                    </COSTCENTRE>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
  try {
    await postTallyXml(xml);
  } catch (e) {
    console.warn(`  Warning creating cost centre '${name}':`, e.message);
  }
}

// Ensure Stock Item exists
async function createStockItem(name) {
  const escapedName = escapeXml(name);
  const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <STOCKITEM NAME="${escapedName}" ACTION="Create">
                        <NAME>${escapedName}</NAME>
                        <BASEUNITS>NOS</BASEUNITS>
                    </STOCKITEM>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
  try {
    await postTallyXml(xml);
  } catch (e) {
    console.warn(`  Warning creating stock item '${name}':`, e.message);
  }
}

async function run() {
  console.log("=== STEP 1: Ensuring Core Masters ===");
  await createGroup("Hotel Guests - Direct", "Sundry Debtors");
  await createLedger("FOC Food Consumption", "Direct Incomes", false, true);
  await createLedger("Complementary Food Expense", "Indirect Expenses", true, false);
  await createLedger("Sale 5% Haryana B2C", "Sales Accounts", true, true, "Applicable");
  await createLedger("SALES B2B 5% HARYANA", "Sales Accounts", true, true, "Applicable");
  await createLedger("Output Cgst 2.5%", "Duties & Taxes", false, false);
  await createLedger("Output Sgst 2.5%", "Duties & Taxes", false, false);
  await createLedger("ROUND OFF", "Indirect Expenses", false, false);
  // await createLedger("CONSUMER", "Bank Accounts", false, false);
  // await createLedger("Treebo Paid", "Bank Accounts", false, false);
  await createStockItem("Food Charges");
  await createLedger("TREEBO HOTELS", "Sundry Debtors", false, false);
  
  // Load mappings and skip list
  const reconciliation = JSON.parse(fs.readFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\matching_reconciliation.json", "utf-8"));
  const existingVchList = JSON.parse(fs.readFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\existing_vouchers_list.json", "utf-8"));
  const skipList = new Set(existingVchList.map(v => v.num.trim().toUpperCase()));
  
  // Load all raw OCR blocks into a search cache
  const ocrFiles = [
    '5th_june_ocr_results.txt',
    '6th_june_ocr_results.txt',
    '7th_june_ocr_results.txt',
    '8th_june_ocr_results.txt',
    '9th_June_ocr_results.txt',
    '10th_June_ocr_results.txt',
    '11th_June_ocr_results.txt',
    '12th_June_ocr_results.txt',
    '13th_June_ocr_results.txt',
    '14th_June_ocr_results.txt'
  ];
  const ocrBlocks = [];
  ocrFiles.forEach(file => {
    const filePath = `C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\${file}`;
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    const parts = content.split("================================================================================");
    let currentFile = "";
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.startsWith("FILE:")) {
        currentFile = trimmed.replace("FILE:", "").trim();
      } else if (currentFile && trimmed.length > 0) {
        ocrBlocks.push({
          ocrFile: file,
          imageFile: currentFile,
          text: trimmed
        });
        currentFile = null;
      }
    });
  });
  
  console.log(`\nLoaded ${reconciliation.stays.length} stays and ${reconciliation.food.length} food bills from mappings.`);
  console.log(`Loaded ${skipList.size} existing vouchers from skip list.`);
  console.log(`Loaded ${ocrBlocks.length} OCR scan blocks.`);

  // 1. Gather all rooms and guests to ensure they exist
  const roomCostCentres = new Set();
  const guestLedgers = new Set();

  reconciliation.stays.forEach(s => {
    if (!s.matched || !s.bill) return; // Skip if no physical copy
    const db = s.daybook;
    if (db.roomNo) {
      parseRoomNumbers(db.roomNo).forEach(room => {
        roomCostCentres.add(room);
      });
    }
    if (db.guestName) {
      const cleanedGuest = db.guestName.toString().trim().toUpperCase().replace(/^\.*?\s+/, '').replace(/\s+/g, ' ');
      if (cleanedGuest) guestLedgers.add(cleanedGuest);
    }
  });

  reconciliation.food.forEach(f => {
    if (!f.matched || !f.bill) return; // Skip if no physical copy
    const db = f.daybook;
    if (db.roomNo) {
      parseRoomNumbers(db.roomNo).forEach(room => {
        roomCostCentres.add(room);
      });
    }
    if (db.guestName) {
      const cleanedGuest = db.guestName.toString().trim().toUpperCase().replace(/^\.*?\s+/, '').replace(/\s+/g, ' ');
      if (cleanedGuest) guestLedgers.add(cleanedGuest);
    }
  });

  console.log(`\nEnsuring ${roomCostCentres.size} Room Cost Centres...`);
  for (const room of roomCostCentres) {
    await createCostCentre(room, "Rooms");
    await sleep(20);
  }

  console.log(`Ensuring ${guestLedgers.size} Guest Ledgers...`);
  for (const guest of guestLedgers) {
    await createLedger(guest, "Hotel Guests - Direct", false, false);
    await sleep(20);
  }

  console.log("\n=== STEP 2: Posting Stays ===");
  for (const s of reconciliation.stays) {
    const db = s.daybook;
    const bill = s.bill;
    
    if (!s.matched || !s.bill) {
      console.log(`  SKIPPED (No Physical Copy): Stay invoice ${db.invoiceNo} (${db.guestName})`);
      continue;
    }
    
    // Revenue recognition is on checkout! Skip if CONTINUE or empty
    if (!db.checkOut || db.checkOut.toUpperCase().includes("CONTINUE")) {
      console.log(`  SKIPPED: Stay invoice ${db.invoiceNo} (${db.guestName}) checkOut is CONTINUE.`);
      continue;
    }

    // Dynamic Override of Date and Amount from Tax Invoice (bill) only
    let ymdDate = parseDateToYmd(db.checkOut);
    let dateOverridden = false;
    if (bill && bill.date && bill.date.trim()) {
      const parsedBillDate = parseBillDateToYmd(bill.date);
      if (parsedBillDate) {
        ymdDate = parsedBillDate;
        dateOverridden = true;
      }
    }

    if (!ymdDate) {
      console.warn(`  Warning: Invalid checkout date '${db.checkOut}' for guest ${db.guestName}.`);
      continue;
    }

    // Determine invoice number
    let vchNo = (bill && bill.invoiceNo) ? bill.invoiceNo.trim() : db.invoiceNo.toString().trim();
    if (!vchNo) {
      vchNo = `DB-INV-${ymdDate}-${s.rowIdx}`;
    }

    // Treebo standard invoice matching
    if (db.bookingMode.toUpperCase() === "TREEBO" && vchNo.length < 10) {
      if (bill && bill.invoiceNo && bill.invoiceNo.startsWith("180962826-")) {
        vchNo = bill.invoiceNo;
      } else {
        vchNo = `180962826-${vchNo.padStart(6, '0')}`;
      }
    }

    if (skipList.has(vchNo.toUpperCase())) {
      console.log(`  SKIPPED (Duplicate): Stay invoice ${vchNo} (${db.guestName}) already in Tally.`);
      continue;
    }

    const guestName = db.guestName ? db.guestName.toString().trim().toUpperCase().replace(/^\.*?\s+/, '').replace(/\s+/g, ' ') : '';
    
    let totalAmount = db.cash + db.upi + db.card + db.pending + db.treeboPaid;
    let amountOverridden = false;
    if (bill && bill.total > 0) {
      totalAmount = bill.total;
      amountOverridden = true;
    }

    if (totalAmount <= 0) continue;

    if (dateOverridden || amountOverridden) {
      console.log(`  [OVERRIDE] Invoice ${vchNo} (${guestName}):`);
      if (dateOverridden) console.log(`    Date overridden from Bill: ${ymdDate} (Daybook: ${db.checkOut})`);
      if (amountOverridden) console.log(`    Amount overridden from Bill: ${totalAmount} (Daybook: ${db.cash + db.upi + db.card + db.pending + db.treeboPaid})`);
    }

    // Classify Party and Revenue ledgers based on booking mode and OCR
    let partyLedgerName = guestName;
    let revenueLedger = "Sale 5% Haryana B2C";

    if (db.bookingMode && db.bookingMode.toUpperCase() === "TREEBO") {
      let bestBlock = null;
      if (s.matched && bill) {
        bestBlock = ocrBlocks.find(b => b.imageFile === bill.fileName);
      } else if (guestName) {
        const firstName = guestName.split(' ')[0];
        if (firstName.length >= 3) {
          bestBlock = ocrBlocks.find(b => {
            const txtUpper = b.text.toUpperCase();
            const matchesName = txtUpper.includes(firstName);
            if (!matchesName) return false;
            if (db.roomNo) {
              const roomClean = db.roomNo.toString().replace(/[^0-9]/g, '');
              if (roomClean && (txtUpper.includes(`ROOM ${roomClean}`) || txtUpper.includes(`ROOMNO. ${roomClean}`) || txtUpper.includes(`ROOM NO : ${roomClean}`) || txtUpper.includes(`ROOM NO: ${roomClean}`))) {
                return true;
              }
            }
            return true;
          });
        }
      }

      let isTreeboB2B = false;
      if (bestBlock) {
        const textUpper = bestBlock.text.toUpperCase();
        if (textUpper.includes("HOSPITALITY") || textUpper.includes("VENTURES") || textUpper.includes("HOSPNAHTY") || textUpper.includes("RUPTUB") || textUpper.includes("06AAHCR31J7RIZV") || textUpper.includes("06AAHCR31J7R1ZV")) {
          isTreeboB2B = true;
        }
      }

      if (isTreeboB2B) {
        partyLedgerName = "TREEBO HOTELS";
        revenueLedger = "SALES B2B 5% HARYANA";
      } else {
        partyLedgerName = guestName;
        revenueLedger = "Sale 5% Haryana B2C";
      }
    } else {
      const isB2B = guestName.includes("ENGLABS") || guestName.includes("COMPANY") || guestName.includes("PVT") || guestName.includes("LTD") || guestName.includes("CORPORATE");
      partyLedgerName = guestName;
      revenueLedger = isB2B ? "SALES B2B 5% HARYANA" : "Sale 5% Haryana B2C";
    }

    // Back-calculate taxes (Haryana POS always: 2.5% CGST + 2.5% SGST)
    let cgst, sgst, adjustedTaxable;
    if (s.matched && bill && (bill.cgst > 0 || bill.sgst > 0)) {
      cgst = bill.cgst;
      sgst = bill.sgst;
      adjustedTaxable = parseFloat((totalAmount - cgst - sgst).toFixed(2));
    } else {
      const taxable = parseFloat((totalAmount / 1.05).toFixed(2));
      cgst = parseFloat((taxable * 0.025).toFixed(2));
      sgst = cgst;
      const diff = parseFloat((totalAmount - (taxable + cgst + sgst)).toFixed(2));
      adjustedTaxable = parseFloat((taxable + diff).toFixed(2));
    }

    // Split rooms allocation
    let roomsAllocXml = "";
    const rooms = parseRoomNumbers(db.roomNo);

    if (rooms.length > 0) {
      const splitTaxable = parseFloat((adjustedTaxable / rooms.length).toFixed(2));
      let runningSum = 0;
      
      const allocs = rooms.map((room, idx) => {
        let amt = splitTaxable;
        if (idx === rooms.length - 1) {
          amt = parseFloat((adjustedTaxable - runningSum).toFixed(2));
        } else {
          runningSum += amt;
        }
        return `
                                    <COSTCENTREALLOCATIONS.LIST>
                                        <NAME>${escapeXml(room)}</NAME>
                                        <AMOUNT>${amt.toFixed(2)}</AMOUNT>
                                    </COSTCENTREALLOCATIONS.LIST>`;
      }).join('');
      
      roomsAllocXml = `
                                <CATEGORYALLOCATIONS.LIST>
                                    <CATEGORY>Rooms</CATEGORY>
                                    ${allocs}
                                </CATEGORYALLOCATIONS.LIST>`;
    }

    const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Sales" ACTION="Create">
                        <DATE>${ymdDate}</DATE>
                        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(vchNo)}</VOUCHERNUMBER>
                        <PARTYLEDGERNAME>${escapeXml(partyLedgerName)}</PARTYLEDGERNAME>
                        <PLACEOFSUPPLY>Haryana</PLACEOFSUPPLY>
                        <EFFECTIVEDATE>${ymdDate}</EFFECTIVEDATE>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(partyLedgerName)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${totalAmount.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                        <ALLINVENTORYENTRIES.LIST>
                            <STOCKITEMNAME>Room No:-</STOCKITEMNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <RATE>${adjustedTaxable.toFixed(2)}</RATE>
                            <AMOUNT>${adjustedTaxable.toFixed(2)}</AMOUNT>
                            <ACTUALQTY>1</ACTUALQTY>
                            <BILLEDQTY>1</BILLEDQTY>
                            <ACCOUNTINGALLOCATIONS.LIST>
                                <LEDGERNAME>${escapeXml(revenueLedger)}</LEDGERNAME>
                                <AMOUNT>${adjustedTaxable.toFixed(2)}</AMOUNT>
                                ${roomsAllocXml}
                            </ACCOUNTINGALLOCATIONS.LIST>
                        </ALLINVENTORYENTRIES.LIST>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>Output Cgst 2.5%</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${cgst.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>Output Sgst 2.5%</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${sgst.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

    try {
      const res = await postTallyXml(xml);
      if (res.includes("<CREATED>1</CREATED>")) {
        console.log(`  SUCCESS: Stay Invoice ${vchNo} (${partyLedgerName}) posted. Amt: ${totalAmount}`);
      } else {
        console.log(`  FAILED stay invoice ${vchNo}:`, res.trim());
      }
      await sleep(100);
    } catch (e) {
      console.error(`  ERROR stay invoice ${vchNo}:`, e.message);
    }
  }

  console.log("\n=== STEP 3: Posting Stay Clearing JVs ===");
  for (const s of reconciliation.stays) {
    const db = s.daybook;
    const bill = s.bill;
    
    if (!s.matched || !s.bill) continue;
    
    if (!db.checkOut || db.checkOut.toUpperCase().includes("CONTINUE")) continue;
    
    // Dynamic Override of Date and Amount from Tax Invoice (bill) only
    let ymdDate = parseDateToYmd(db.checkOut);
    if (bill && bill.date && bill.date.trim()) {
      const parsedBillDate = parseBillDateToYmd(bill.date);
      if (parsedBillDate) {
        ymdDate = parsedBillDate;
      }
    }

    if (!ymdDate) continue;

    let vchNo = (bill && bill.invoiceNo) ? bill.invoiceNo.trim() : db.invoiceNo.toString().trim();
    if (!vchNo) vchNo = `DB-INV-${ymdDate}-${s.rowIdx}`;

    // Treebo standard invoice matching
    if (db.bookingMode.toUpperCase() === "TREEBO" && vchNo.length < 10) {
      if (bill && bill.invoiceNo && bill.invoiceNo.startsWith("180962826-")) {
        vchNo = bill.invoiceNo;
      } else {
        vchNo = `180962826-${vchNo.padStart(6, '0')}`;
      }
    }

    const payVchNo = `PAY-${vchNo}`;
    if (skipList.has(payVchNo.toUpperCase())) {
      console.log(`  SKIPPED (Duplicate): Payment JV ${payVchNo} already in Tally.`);
      continue;
    }

    const guestName = db.guestName ? db.guestName.toString().trim().toUpperCase().replace(/^\.*?\s+/, '').replace(/\s+/g, ' ') : '';
    
    // Classify Party ledger based on booking mode and OCR
    let partyLedgerName = guestName;
    if (db.bookingMode && db.bookingMode.toUpperCase() === "TREEBO") {
      let bestBlock = null;
      if (s.matched && bill) {
        bestBlock = ocrBlocks.find(b => b.imageFile === bill.fileName);
      } else if (guestName) {
        const firstName = guestName.split(' ')[0];
        if (firstName.length >= 3) {
          bestBlock = ocrBlocks.find(b => {
            const txtUpper = b.text.toUpperCase();
            const matchesName = txtUpper.includes(firstName);
            if (!matchesName) return false;
            if (db.roomNo) {
              const roomClean = db.roomNo.toString().replace(/[^0-9]/g, '');
              if (roomClean && (txtUpper.includes(`ROOM ${roomClean}`) || txtUpper.includes(`ROOMNO. ${roomClean}`) || txtUpper.includes(`ROOM NO : ${roomClean}`) || txtUpper.includes(`ROOM NO: ${roomClean}`))) {
                return true;
              }
            }
            return true;
          });
        }
      }

      let isTreeboB2B = false;
      if (bestBlock) {
        const textUpper = bestBlock.text.toUpperCase();
        if (textUpper.includes("HOSPITALITY") || textUpper.includes("VENTURES") || textUpper.includes("HOSPNAHTY") || textUpper.includes("RUPTUB") || textUpper.includes("06AAHCR31J7RIZV") || textUpper.includes("06AAHCR31J7R1ZV")) {
          isTreeboB2B = true;
        }
      }

      if (isTreeboB2B) {
        partyLedgerName = "TREEBO HOTELS";
      }
    }

    const originalPaymentTotal = db.cash + db.upi + db.card + db.treeboPaid; // Pending does not trigger payment
    if (originalPaymentTotal <= 0) continue;

    let totalAmount = originalPaymentTotal;
    let cashAmt = db.cash;
    let upiAmt = db.upi;
    let cardAmt = db.card;
    let treeboAmt = db.treeboPaid;

    if (bill && bill.total > 0) {
      totalAmount = bill.total;
      const scale = bill.total / originalPaymentTotal;
      let roundedCash = parseFloat((db.cash * scale).toFixed(2));
      let roundedUpi = parseFloat((db.upi * scale).toFixed(2));
      let roundedCard = parseFloat((db.card * scale).toFixed(2));
      let roundedTreebo = parseFloat((db.treeboPaid * scale).toFixed(2));
      
      const sum = roundedCash + roundedUpi + roundedCard + roundedTreebo;
      const diff = parseFloat((bill.total - sum).toFixed(2));
      if (diff !== 0) {
        if (roundedCash > 0) roundedCash = parseFloat((roundedCash + diff).toFixed(2));
        else if (roundedUpi > 0) roundedUpi = parseFloat((roundedUpi + diff).toFixed(2));
        else if (roundedCard > 0) roundedCard = parseFloat((roundedCard + diff).toFixed(2));
        else if (roundedTreebo > 0) roundedTreebo = parseFloat((roundedTreebo + diff).toFixed(2));
      }
      cashAmt = roundedCash;
      upiAmt = roundedUpi;
      cardAmt = roundedCard;
      treeboAmt = roundedTreebo;
    }

    const finalPaymentTotal = cashAmt + upiAmt + cardAmt + treeboAmt;
    if (finalPaymentTotal <= 0) continue;

    const phone = (bill && bill.phone) ? bill.phone.trim() : "";

    let ledgerEntriesXml = "";
    let payModeDesc = [];

    if (cashAmt > 0) {
      ledgerEntriesXml += `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Cash</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${cashAmt.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;
      payModeDesc.push("Cash");
    }

    const onlineAmt = upiAmt + cardAmt;
    if (onlineAmt > 0) {
      ledgerEntriesXml += `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>CONSUMER</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${onlineAmt.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;
      payModeDesc.push(upiAmt > 0 ? "UPI" : "Card");
    }

    if (treeboAmt > 0) {
      ledgerEntriesXml += `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Treebo Paid</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${treeboAmt.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;
      payModeDesc.push("Treebo Paid");
    }

    ledgerEntriesXml += `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(partyLedgerName)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${finalPaymentTotal.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;

    const narration = `Paid ${payModeDesc.join(" + ")}` + (phone ? ` - Contact: ${phone}` : "");
    const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Journal" ACTION="Create">
                        <DATE>${ymdDate}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(payVchNo)}</VOUCHERNUMBER>
                        <REFERENCE>${escapeXml(payVchNo)}</REFERENCE>
                        <EFFECTIVEDATE>${ymdDate}</EFFECTIVEDATE>
                        <NARRATION>${escapeXml(narration)}</NARRATION>
                        ${ledgerEntriesXml}
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

    try {
      const res = await postTallyXml(xml);
      if (res.includes("<CREATED>1</CREATED>")) {
        console.log(`  SUCCESS: Payment JV ${payVchNo} (${partyLedgerName}) posted. Amt: ${finalPaymentTotal}`);
      } else {
        console.log(`  FAILED clearing JV ${payVchNo}:`, res.trim());
      }
      await sleep(100);
    } catch (e) {
      console.error(`  ERROR clearing JV ${payVchNo}:`, e.message);
    }
  }

  console.log("\n=== STEP 4: Posting Food Bills (Sales & Journal Clearing) ===");
  for (const f of reconciliation.food) {
    const db = f.daybook;
    const bill = f.bill;
    
    if (!f.matched || !f.bill) {
      console.log(`  SKIPPED (No Physical Copy): Food bill ${db.billNo} (${db.guestName})`);
      continue;
    }
    
    const ymdDate = parseDateToYmd(db.sheetDate);
    if (!ymdDate) continue;

    const guestName = db.guestName ? db.guestName.toString().trim().toUpperCase().replace(/^\.*?\s+/, '').replace(/\s+/g, ' ') : '';
    const phone = (bill && bill.phone) ? bill.phone.trim() : "";

    const isB2B = guestName.includes("ENGLABS") || guestName.includes("COMPANY") || guestName.includes("PVT") || guestName.includes("LTD") || guestName.includes("CORPORATE");
    const revenueLedger = isB2B ? "SALES B2B 5% HARYANA" : "Sale 5% Haryana B2C";

    // Split rooms allocation
    let roomCostCentreXml = "";
    if (db.roomNo) {
      const rooms = parseRoomNumbers(db.roomNo);
        
      if (rooms.length > 0) {
        const splitAmt = parseFloat((db.total / rooms.length).toFixed(2));
        let runningSum = 0;
        const allocs = rooms.map((room, idx) => {
          let amt = splitAmt;
          if (idx === rooms.length - 1) {
            amt = parseFloat((db.total - runningSum).toFixed(2));
          } else {
            runningSum += amt;
          }
          return `
                                      <COSTCENTREALLOCATIONS.LIST>
                                          <NAME>${escapeXml(room)}</NAME>
                                          <AMOUNT>${amt.toFixed(2)}</AMOUNT>
                                      </COSTCENTREALLOCATIONS.LIST>`;
        }).join('');
        
        roomCostCentreXml = `
                                  <CATEGORYALLOCATIONS.LIST>
                                      <CATEGORY>Rooms</CATEGORY>
                                      ${allocs}
                                  </CATEGORYALLOCATIONS.LIST>`;
      }
    }

    if (!roomCostCentreXml) {
      // Default to Directors / Walk-in Cost Centre if no room matches
      roomCostCentreXml = `
                                  <CATEGORYALLOCATIONS.LIST>
                                      <CATEGORY>Walk-in Guest</CATEGORY>
                                      <COSTCENTREALLOCATIONS.LIST>
                                          <NAME>Directors</NAME>
                                          <AMOUNT>${db.total.toFixed(2)}</AMOUNT>
                                      </COSTCENTREALLOCATIONS.LIST>
                                  </CATEGORYALLOCATIONS.LIST>`;
    }

    const isComplementary = db.treeboComp > 0 || (bill && bill.roomNo && bill.roomNo.toString().toUpperCase().includes("CL"));
    
    if (isComplementary) {
      // Complementary food JV rules: Rounded basic subtotal, ignore GST
      const basicAmt = Math.round(db.total / 1.05); // Rounded basic amount
      const sjBillNo = `POS-${db.billNo}`;
      const clBillNo = `${sjBillNo}-CL`;

      if (skipList.has(sjBillNo.toUpperCase())) {
        console.log(`  SKIPPED (Duplicate): Complementary JV ${sjBillNo} already in Tally.`);
        continue;
      }

      // JV 1: Consumption / Stock Out
      const sjXml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Journal" ACTION="Create">
                        <DATE>${ymdDate}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(sjBillNo)}</VOUCHERNUMBER>
                        <REFERENCE>${escapeXml(sjBillNo)}</REFERENCE>
                        <EFFECTIVEDATE>${ymdDate}</EFFECTIVEDATE>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(guestName)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${basicAmt.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>FOC Food Consumption</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${basicAmt.toFixed(2)}</AMOUNT>
                            <INVENTORYALLOCATIONS.LIST>
                                <STOCKITEMNAME>Food Charges</STOCKITEMNAME>
                                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                <RATE>${basicAmt.toFixed(2)}</RATE>
                                <AMOUNT>${basicAmt.toFixed(2)}</AMOUNT>
                                <ACTUALQTY>1</ACTUALQTY>
                                <BILLEDQTY>1</BILLEDQTY>
                            </INVENTORYALLOCATIONS.LIST>
                        </ALLLEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

      // JV 2: Clearing Expense
      const clXml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Journal" ACTION="Create">
                        <DATE>${ymdDate}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(clBillNo)}</VOUCHERNUMBER>
                        <REFERENCE>${escapeXml(clBillNo)}</REFERENCE>
                        <EFFECTIVEDATE>${ymdDate}</EFFECTIVEDATE>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Complementary Food Expense</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${basicAmt.toFixed(2)}</AMOUNT>
                            ${roomCostCentreXml.replace(db.total.toFixed(2), basicAmt.toFixed(2))}
                        </ALLLEDGERENTRIES.LIST>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(guestName)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${basicAmt.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

      try {
        const res1 = await postTallyXml(sjXml);
        const res2 = await postTallyXml(clXml);
        if (res1.includes("<CREATED>1</CREATED>")) {
          console.log(`  SUCCESS: Complementary Food JV ${sjBillNo} (${guestName}) posted. Amt: ${basicAmt}`);
        } else {
          console.log(`  FAILED FOC consumption ${sjBillNo}:`, res1.trim());
        }
        await sleep(100);
      } catch (e) {
        console.error(`  ERROR FOC JV ${sjBillNo}:`, e.message);
      }
    } else {
      // Paid food bill: post as Sales Invoice & clearing Payment JV
      const vchNo = `POS-${db.billNo}`;
      if (skipList.has(vchNo.toUpperCase())) {
        console.log(`  SKIPPED (Duplicate): Paid food bill ${vchNo} already in Tally.`);
        continue;
      }

      // Back-calculate taxes
      const taxable = parseFloat((db.total / 1.05).toFixed(2));
      const cgst = parseFloat((taxable * 0.025).toFixed(2));
      const sgst = cgst;
      const diff = parseFloat((db.total - (taxable + cgst + sgst)).toFixed(2));
      const adjustedTaxable = parseFloat((taxable + diff).toFixed(2));

      const salesXml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Sales" ACTION="Create">
                        <DATE>${ymdDate}</DATE>
                        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(vchNo)}</VOUCHERNUMBER>
                        <PARTYLEDGERNAME>${escapeXml(guestName)}</PARTYLEDGERNAME>
                        <PLACEOFSUPPLY>Haryana</PLACEOFSUPPLY>
                        <EFFECTIVEDATE>${ymdDate}</EFFECTIVEDATE>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(guestName)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${db.total.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                        <ALLINVENTORYENTRIES.LIST>
                            <STOCKITEMNAME>Food Charges</STOCKITEMNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <RATE>${adjustedTaxable.toFixed(2)}</RATE>
                            <AMOUNT>${adjustedTaxable.toFixed(2)}</AMOUNT>
                            <ACTUALQTY>1</ACTUALQTY>
                            <BILLEDQTY>1</BILLEDQTY>
                            <ACCOUNTINGALLOCATIONS.LIST>
                                <LEDGERNAME>${escapeXml(revenueLedger)}</LEDGERNAME>
                                <AMOUNT>${adjustedTaxable.toFixed(2)}</AMOUNT>
                                ${roomCostCentreXml.replace(db.total.toFixed(2), adjustedTaxable.toFixed(2))}
                            </ACCOUNTINGALLOCATIONS.LIST>
                        </ALLINVENTORYENTRIES.LIST>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>Output Cgst 2.5%</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${cgst.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>Output Sgst 2.5%</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${sgst.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

      // Payment JV to clear the balance
      const payVchNo = `PAY-POS-${db.billNo}`;
      const onlineAmt = db.upi + db.card + db.treeboCL + db.disha;
      const totalPayment = db.cash + onlineAmt;
      let ledgerEntriesXml = "";
      let payModeDesc = [];

      if (db.cash > 0) {
        ledgerEntriesXml += `
                          <ALLLEDGERENTRIES.LIST>
                              <LEDGERNAME>Cash</LEDGERNAME>
                              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                              <AMOUNT>-${db.cash.toFixed(2)}</AMOUNT>
                          </ALLLEDGERENTRIES.LIST>`;
        payModeDesc.push("Cash");
      }

      if (onlineAmt > 0) {
        ledgerEntriesXml += `
                          <ALLLEDGERENTRIES.LIST>
                              <LEDGERNAME>CONSUMER</LEDGERNAME>
                              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                              <AMOUNT>-${onlineAmt.toFixed(2)}</AMOUNT>
                          </ALLLEDGERENTRIES.LIST>`;
        payModeDesc.push("CONSUMER");
      }

      ledgerEntriesXml += `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(guestName)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${totalPayment.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;

      const narration = `Paid Food Bill ${payModeDesc.join(" + ")}` + (phone ? ` - Contact: ${phone}` : "");
      const payXml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Journal" ACTION="Create">
                        <DATE>${ymdDate}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(payVchNo)}</VOUCHERNUMBER>
                        <REFERENCE>${escapeXml(payVchNo)}</REFERENCE>
                        <EFFECTIVEDATE>${ymdDate}</EFFECTIVEDATE>
                        <NARRATION>${escapeXml(narration)}</NARRATION>
                        ${ledgerEntriesXml}
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

      try {
        const res1 = await postTallyXml(salesXml);
        if (res1.includes("<CREATED>1</CREATED>")) {
          console.log(`  SUCCESS: Paid Food Sales Bill ${vchNo} (${guestName}) posted. Amt: ${db.total}`);
          
          if (totalPayment > 0) {
            const res2 = await postTallyXml(payXml);
            if (res2.includes("<CREATED>1</CREATED>")) {
              console.log(`  SUCCESS: Payment JV ${payVchNo} posted. Amt: ${totalPayment}`);
            } else {
              console.log(`  FAILED food payment ${payVchNo}:`, res2.trim());
            }
          } else {
            console.log(`  INFO: Food bill ${vchNo} (${guestName}) is unpaid (Directors/Walk-in). Skipping payment JV.`);
          }
        } else {
          console.log(`  FAILED food sales ${vchNo}:`, res1.trim());
        }
        await sleep(100);
      } catch (e) {
        console.error(`  ERROR food sales ${vchNo}:`, e.message);
      }
    }
  }

  console.log("\n=== Import Process Completed! ===");
}

run().catch(err => console.error("Unhandled run error:", err));
