const fs = require('fs');
const http = require('http');

const TALLY_URL = "http://localhost:9000";

const knownBills = {
  "16151": [
    { name: "Aloo Parantha", qty: 2, rate: 57.14, amt: 114.28 },
    { name: "Poha", qty: 1, rate: 66.67, amt: 66.67 },
    { name: "TEA", qty: 1, rate: 38.10, amt: 38.10 }
  ],
  "16152": [
    { name: "Coffee", qty: 2, rate: 57.14, amt: 114.28 }
  ],
  "16139": [
    { name: "Dental Kit", qty: 1, rate: 28.57, amt: 28.57 },
    { name: "Mineral Water", qty: 1, rate: 28.57, amt: 28.57 }
  ],
  "16128": [
    { name: "Masala Omelette", qty: 1, rate: 74.04, amt: 74.04 },
    { name: "Mineral Water", qty: 2, rate: 28.57, amt: 57.14 },
    { name: "TEA", qty: 2, rate: 38.10, amt: 76.20 }
  ],
  "16132": [
    { name: "Mineral Water", qty: 2, rate: 28.57, amt: 57.14 }
  ],
  "16134": [
    { name: "Bread Toast", qty: 1, rate: 47.62, amt: 47.62 },
    { name: "Mix Parantha", qty: 5, rate: 57.60, amt: 288.00 },
    { name: "TEA", qty: 5, rate: 38.10, amt: 190.50 }
  ],
  "16138": [
    { name: "VEG. NOODLES", qty: 1, rate: 104.76, amt: 104.76 }
  ],
  "16159": [
    { name: "LIMCA 250ML", qty: 1, rate: 23.81, amt: 23.81 },
    { name: "Milk", qty: 1, rate: 50.00, amt: 50.00 },
    { name: "Mineral Water", qty: 2, rate: 28.57, amt: 57.14 },
    { name: "Mix Parantha", qty: 4, rate: 57.60, amt: 230.40 },
    { name: "Mix Sauce Pasta", qty: 1, rate: 98.73, amt: 98.73 },
    { name: "TEA", qty: 3, rate: 38.10, amt: 114.30 },
    { name: "Veg Sandwich", qty: 1, rate: 85.71, amt: 85.71 }
  ],
  "16166": [
    { name: "Milk", qty: 1, rate: 50.00, amt: 50.00 },
    { name: "TEA", qty: 3, rate: 38.10, amt: 114.30 }
  ],
  "16137": [
    { name: "Aloo Parantha", qty: 1, rate: 57.14, amt: 57.14 },
    { name: "Delux Thali", qty: 1, rate: 238.10, amt: 238.10 },
    { name: "TEA", qty: 1, rate: 38.10, amt: 38.10 }
  ],
  "16147": [
    { name: "Aloo Parantha", qty: 2, rate: 57.14, amt: 114.28 },
    { name: "TEA", qty: 1, rate: 38.10, amt: 38.10 }
  ],
  "16165": [
    { name: "Curd Per Bowl", qty: 1, rate: 38.10, amt: 38.10 },
    { name: "Mix Parantha", qty: 1, rate: 57.60, amt: 57.60 },
    { name: "Poha", qty: 1, rate: 66.67, amt: 66.67 }
  ],
  "16160": [
    { name: "Mineral Water", qty: 1, rate: 28.57, amt: 28.57 },
    { name: "PAPAD FRY", qty: 1, rate: 33.33, amt: 33.33 }
  ],
  "16164": [
    { name: "Masala Omelette", qty: 1, rate: 74.04, amt: 74.04 },
    { name: "TEA", qty: 1, rate: 38.10, amt: 38.10 }
  ],
  "16156": [
    { name: "Cold Coffee", qty: 1, rate: 114.29, amt: 57.15, discount: 50 },
    { name: "Lemon Water", qty: 2, rate: 38.10, amt: 38.10, discount: 50 },
    { name: "Omlette Plain/bread", qty: 1, rate: 65.81, amt: 32.91, discount: 50 },
    { name: "TEA", qty: 1, rate: 38.10, amt: 19.05, discount: 50 }
  ],
  "16154": [
    { name: "Coca Cola 250ml", qty: 1, rate: 23.81, amt: 23.81 },
    { name: "Egg Fried Rice", qty: 1, rate: 190.48, amt: 95.24, discount: 50 },
    { name: "Lemon Water", qty: 4, rate: 38.10, amt: 76.20, discount: 50 }
  ],
  "16153": [
    { name: "Coffee", qty: 1, rate: 57.14, amt: 28.57, discount: 50 }
  ],
  "16157": [
    { name: "Lemon Water", qty: 3, rate: 38.10, amt: 57.15, discount: 50 }
  ],
  "16155": [
    { name: "Staff Tea", qty: 4, rate: 14.29, amt: 57.16 }
  ]
};

const staysToImport = [
  { invoiceNo: "11980", guest: "KAILASH", date: "20260609", amount: 3600.00, rooms: ["Room 02", "Room 07"] },
  { invoiceNo: "11982", guest: "TARUN SHARMA", date: "20260609", amount: 1500.00, rooms: ["Room 02"] },
  { invoiceNo: "180962826-000275", guest: "SHASHANK GAUR", date: "20260609", amount: 3422.82, rooms: ["Room 04"] },
  { invoiceNo: "180962826-000279", guest: "ARJUN PARSHAD", date: "20260610", amount: 1859.91, rooms: ["Room 07"] },
  { invoiceNo: "11985", guest: "PARVEEN", date: "20260610", amount: 1200.00, rooms: ["Room 20"] },
  { invoiceNo: "180962826-000278", guest: "KUNAL", date: "20260610", amount: 1899.03, rooms: ["Room 04"] },
  { invoiceNo: "11986", guest: "ABDUL DOUD KHAN", date: "20260610", amount: 7500.00, rooms: ["Room 05"] }
];

const foodBillsToImport = [
  { billNo: "16151", guest: "KAILASH", date: "20260609", total: 230.00, rooms: ["Room 02", "Room 07"] },
  { billNo: "16152", guest: "KAILASH", date: "20260609", total: 120.00, rooms: ["Room 02", "Room 07"] },
  { billNo: "16137", guest: "SHASHANK GAUR", date: "20260608", total: 350.00, rooms: ["Room 04"] },
  { billNo: "16139", guest: "KUNAL", date: "20260608", total: 60.00, rooms: ["Room 04"] },
  { billNo: "16160", guest: "ARJUN PARSHAD", date: "20260609", total: 65.00, rooms: ["Room 07"] },
  { billNo: "16128", guest: "ABDUL DOUD KHAN", date: "20260607", total: 218.00, rooms: ["Room 05"] },
  { billNo: "16132", guest: "ABDUL DOUD KHAN", date: "20260608", total: 60.00, rooms: ["Room 05"] },
  { billNo: "16134", guest: "ABDUL DOUD KHAN", date: "20260608", total: 552.00, rooms: ["Room 05"] },
  { billNo: "16138", guest: "ABDUL DOUD KHAN", date: "20260608", total: 110.00, rooms: ["Room 05"] },
  { billNo: "16159", guest: "ABDUL DOUD KHAN", date: "20260609", total: 693.00, rooms: ["Room 05"] },
  { billNo: "16166", guest: "ABDUL DOUD KHAN", date: "20260609", total: 173.00, rooms: ["Room 05"] },
  { billNo: "16156", guest: "MD SIR", date: "20260609", total: 155.00, rooms: [] },
  { billNo: "16154", guest: "BHARAT SIR", date: "20260609", total: 205.00, rooms: [] },
  { billNo: "16153", guest: "SWATI MAAM", date: "20260609", total: 30.00, rooms: [] },
  { billNo: "16157", guest: "SHREEYA", date: "20260609", total: 60.00, rooms: [] },
  { billNo: "16155", guest: "A&A SATAFF", date: "20260609", total: 60.00, rooms: [] }
];


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

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


async function run() {
  const directors = ["MD SIR", "BHARAT SIR", "SWATI MAAM", "SHREEYA", "A&A SATAFF", "Md Sir Staff"];

  // Step 1: Create Cost Categories & Cost Centres if they don't exist
  const setupXmls = [
    // Categories
    `<COSTCATEGORY NAME="Complementary Items" ACTION="Create"><NAME>Complementary Items</NAME><ALLOCATEREVENUE>Yes</ALLOCATEREVENUE></COSTCATEGORY>`,
    `<COSTCATEGORY NAME="Rooms" ACTION="Create"><NAME>Rooms</NAME><ALLOCATEREVENUE>Yes</ALLOCATEREVENUE></COSTCATEGORY>`,
    `<COSTCATEGORY NAME="Walk-in Guest" ACTION="Create"><NAME>Walk-in Guest</NAME><ALLOCATEREVENUE>Yes</ALLOCATEREVENUE></COSTCATEGORY>`,
    // Cost centres under Complementary Items
    `<COSTCENTRE NAME="Brush" ACTION="Create"><NAME>Brush</NAME><CATEGORY>Complementary Items</CATEGORY></COSTCENTRE>`,
    // Cost centres under Rooms
    `<COSTCENTRE NAME="Room 02" ACTION="Create"><NAME>Room 02</NAME><CATEGORY>Rooms</CATEGORY></COSTCENTRE>`,
    `<COSTCENTRE NAME="Room 04" ACTION="Create"><NAME>Room 04</NAME><CATEGORY>Rooms</CATEGORY></COSTCENTRE>`,
    `<COSTCENTRE NAME="Room 05" ACTION="Create"><NAME>Room 05</NAME><CATEGORY>Rooms</CATEGORY></COSTCENTRE>`,
    `<COSTCENTRE NAME="Room 06" ACTION="Create"><NAME>Room 06</NAME><CATEGORY>Rooms</CATEGORY></COSTCENTRE>`,
    `<COSTCENTRE NAME="Room 07" ACTION="Create"><NAME>Room 07</NAME><CATEGORY>Rooms</CATEGORY></COSTCENTRE>`,
    `<COSTCENTRE NAME="Room 20" ACTION="Create"><NAME>Room 20</NAME><CATEGORY>Rooms</CATEGORY></COSTCENTRE>`,
    // Cost centres under Walk-in Guest
    `<COSTCENTRE NAME="Directors" ACTION="Create"><NAME>Directors</NAME><CATEGORY>Walk-in Guest</CATEGORY></COSTCENTRE>`
  ];

  console.log("\nConfiguring Tally Cost Categories & Cost Centres...");
  for (const xmlPayload of setupXmls) {
    const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    ${xmlPayload}
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
    try {
      await postTallyXml(xml);
    } catch (e) {
      console.warn("  Setup payload warning:", e.message);
    }
  }

  const guestNames = new Set();
  
  // Find guest names to create ledgers for
  staysToImport.forEach(s => {
    if (!directors.includes(s.guest)) {
      guestNames.add(s.guest);
    }
  });
  
  foodBillsToImport.forEach(fb => {
    if (!directors.includes(fb.guest)) {
      guestNames.add(fb.guest);
    }
  });
  
  console.log(`\nCreating ${guestNames.size} Guest Ledgers under Sundry Debtors in Tally...`);
  for (const gName of guestNames) {
    const escaped = escapeXml(gName);
    const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <LEDGER NAME="${escaped}" ACTION="Create">
                        <NAME>${escaped}</NAME>
                        <PARENT>Sundry Debtors</PARENT>
                        <ISBILLWISEON>Yes</ISBILLWISEON>
                        <STATENAME>Haryana</STATENAME>
                        <COUNTRYNAME>India</COUNTRYNAME>
                    </LEDGER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
    
    try {
      const res = await postTallyXml(xml);
      if (res.includes("<CREATED>1</CREATED>")) {
        console.log(`  SUCCESS: Guest ledger '${gName}' created.`);
      } else if (res.includes("already exists") || res.includes("Name already exists")) {
        console.log(`  EXISTS: Guest ledger '${gName}' already exists.`);
      } else {
        console.log(`  WARNING: Guest ledger '${gName}' response: ${res.trim()}`);
      }
    } catch (err) {
      console.error(`  ERROR creating guest ledger '${gName}': ${err.message}`);
    }
  }

  console.log("\nPosting Room Stay Sales Vouchers...");
  for (const s of staysToImport) {
    const partyLedger = s.guest;
    const revenueLedger = "Sale 5% Haryana B2C"; // Always B2C Sales
    
    let invNo = s.invoiceNo;
    
    const taxable = parseFloat((s.amount / 1.05).toFixed(2));
    const cgst = parseFloat((taxable * 0.025).toFixed(2));
    const sgst = cgst;
    const diff = parseFloat((s.amount - (taxable + cgst + sgst)).toFixed(2));
    const adjustedTaxable = parseFloat((taxable + diff).toFixed(2));
    
    const escapedParty = escapeXml(partyLedger);
    const escapedRevenue = escapeXml(revenueLedger);
    
    let roomsAllocXml = "";
    if (s.rooms && s.rooms.length > 0) {
      const splitTaxable = parseFloat((adjustedTaxable / s.rooms.length).toFixed(2));
      let runningSum = 0;
      
      const allocs = s.rooms.map((room, idx) => {
        let amt = splitTaxable;
        if (idx === s.rooms.length - 1) {
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
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>Hotel Sky 5 2026-27</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Sales" ACTION="Create">
                        <DATE>${s.date}</DATE>
                        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(invNo)}</VOUCHERNUMBER>
                        <PARTYLEDGERNAME>${escapedParty}</PARTYLEDGERNAME>
                        <PLACEOFSUPPLY>Haryana</PLACEOFSUPPLY>
                        <EFFECTIVEDATE>${s.date}</EFFECTIVEDATE>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapedParty}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${s.amount.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                        <ALLINVENTORYENTRIES.LIST>
                            <STOCKITEMNAME>Room No:-</STOCKITEMNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <RATE>${adjustedTaxable.toFixed(2)}</RATE>
                            <AMOUNT>${adjustedTaxable.toFixed(2)}</AMOUNT>
                            <ACTUALQTY>1</ACTUALQTY>
                            <BILLEDQTY>1</BILLEDQTY>
                            <ACCOUNTINGALLOCATIONS.LIST>
                                <LEDGERNAME>${escapedRevenue}</LEDGERNAME>
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
        console.log(`  SUCCESS: Room Stay ${invNo} (${s.guest}) posted with date ${s.date} and amount ${s.amount}.`);
      } else {
        console.log(`  FAILED: Room Stay ${invNo} (${s.guest}) error: ${res.trim()}`);
      }
      await sleep(200);
    } catch (err) {
      console.error(`  ERROR posting room stay ${invNo}: ${err.message}`);
    }
  }

  console.log("\nPosting Food Sales Vouchers...");
  for (const fb of foodBillsToImport) {
    const primaryBillNo = fb.billNo;
    const items = knownBills[primaryBillNo];
    
    if (!items) {
      console.error(`  ERROR: Bill items not found for bill ${primaryBillNo}`);
      continue;
    }
    
    const partyLedger = fb.guest;
    const revenueLedger = "Sale 5% Haryana B2C"; // Always B2C Sales
    
    const cgst = parseFloat(((fb.total / 1.05) * 0.025).toFixed(2));
    const sgst = cgst;
    
    const itemsTaxableSum = items.reduce((sum, i) => sum + i.amt, 0);
    const expectedTotal = itemsTaxableSum + cgst + sgst;
    const roundOff = parseFloat((fb.total - expectedTotal).toFixed(2));
    
    let itemXml = "";
    let ledgerEntriesXml = "";
    items.forEach(i => {
      const discountXml = i.discount ? `<DISCOUNT>${i.discount}</DISCOUNT>` : "";
      const escapedItemName = escapeXml(i.name);
      
      let costCentreXml = "";
      if (fb.rooms && fb.rooms.length > 0) {
        const splitAmt = parseFloat((i.amt / fb.rooms.length).toFixed(2));
        let runningSum = 0;
        
        const allocs = fb.rooms.map((room, idx) => {
          let amt = splitAmt;
          if (idx === fb.rooms.length - 1) {
            amt = parseFloat((i.amt - runningSum).toFixed(2));
          } else {
            runningSum += amt;
          }
          return `
                                    <COSTCENTREALLOCATIONS.LIST>
                                        <NAME>${escapeXml(room)}</NAME>
                                        <AMOUNT>${amt.toFixed(2)}</AMOUNT>
                                    </COSTCENTREALLOCATIONS.LIST>`;
        }).join('');
        
        costCentreXml = `
                                <CATEGORYALLOCATIONS.LIST>
                                    <CATEGORY>Rooms</CATEGORY>
                                    ${allocs}
                                </CATEGORYALLOCATIONS.LIST>`;
      } else if (fb.guest && fb.guest.match(/MD Sir|Bharat Sir|Swati Ma'am|Swati Maam|Shreeya|A&A Sataff|A&A Staff/i)) {
        costCentreXml = `
                                <CATEGORYALLOCATIONS.LIST>
                                    <CATEGORY>Walk-in Guest</CATEGORY>
                                    <COSTCENTREALLOCATIONS.LIST>
                                        <NAME>Directors</NAME>
                                        <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                                    </COSTCENTREALLOCATIONS.LIST>
                                </CATEGORYALLOCATIONS.LIST>`;
      }
      
      const isComplementaryItem = i.name.toLowerCase().includes("dental kit") || 
                                  i.name.toLowerCase().includes("soap") || 
                                  i.name.toLowerCase().includes("brush");
      
      if (isComplementaryItem) {
        ledgerEntriesXml += `
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(revenueLedger)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                            <CATEGORYALLOCATIONS.LIST>
                                <CATEGORY>Complementary Items</CATEGORY>
                                <COSTCENTREALLOCATIONS.LIST>
                                    <NAME>Brush</NAME>
                                    <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                                </COSTCENTREALLOCATIONS.LIST>
                            </CATEGORYALLOCATIONS.LIST>
                        </LEDGERENTRIES.LIST>`;
      } else {
        itemXml += `
                        <ALLINVENTORYENTRIES.LIST>
                            <STOCKITEMNAME>${escapedItemName}</STOCKITEMNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <RATE>${i.rate.toFixed(2)}</RATE>
                            <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                            <ACTUALQTY>${i.qty}</ACTUALQTY>
                            <BILLEDQTY>${i.qty}</BILLEDQTY>
                            ${discountXml}
                            <ACCOUNTINGALLOCATIONS.LIST>
                                <LEDGERNAME>${escapeXml(revenueLedger)}</LEDGERNAME>
                                <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                                ${costCentreXml}
                            </ACCOUNTINGALLOCATIONS.LIST>
                        </ALLINVENTORYENTRIES.LIST>`;
      }
    });
    
    let roundOffXml = "";
    if (roundOff !== 0) {
      roundOffXml = `
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>ROUND OFF</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${roundOff.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>`;
    }
    
    const escapedParty = escapeXml(partyLedger);
    const billNoFormatted = `POS-${primaryBillNo}`;
    
    const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>Hotel Sky 5 2026-27</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Sales" ACTION="Create">
                        <DATE>${fb.date}</DATE>
                        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${billNoFormatted}</VOUCHERNUMBER>
                        <PARTYLEDGERNAME>${escapedParty}</PARTYLEDGERNAME>
                        <PLACEOFSUPPLY>Haryana</PLACEOFSUPPLY>
                        <EFFECTIVEDATE>${fb.date}</EFFECTIVEDATE>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapedParty}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${fb.total.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                        ${itemXml}
                        ${ledgerEntriesXml}
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
                        ${roundOffXml}
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
    
    try {
      const res = await postTallyXml(xml);
      if (res.includes("<CREATED>1</CREATED>")) {
        console.log(`  SUCCESS: Food Bill ${billNoFormatted} (${partyLedger}) posted with date ${fb.date} and amount ${fb.total}.`);
      } else {
        console.log(`  FAILED: Food Bill ${billNoFormatted} (${partyLedger}) error: ${res.trim()}`);
      }
      await sleep(200);
    } catch (err) {
      console.error(`  ERROR posting food bill ${billNoFormatted}: ${err.message}`);
    }
  }
  
  console.log("\nSales Vouchers Import Completed!");
}

run();
