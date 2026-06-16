const fs = require('fs');
const http = require('http');

const TALLY_URL = "http://localhost:9000";
const companyName = "Hotel Sky 5 2026-27";

const knownBills = {
  "16028": [
    { name: "Mineral Water", qty: 2, rate: 28.57, amt: 57.14 }
  ],
  "16024": [
    { name: "Tea", qty: 3, rate: 38.10, amt: 114.30 }
  ],
  "16031": [
    { name: "Bread Toast", qty: 2, rate: 47.62, amt: 95.24 },
    { name: "Poha", qty: 2, rate: 66.67, amt: 133.34 },
    { name: "Tea", qty: 4, rate: 38.10, amt: 152.40 }
  ],
  "16022": [
    { name: "Aloo Parantha", qty: 2, rate: 58.00, amt: 116.00 },
    { name: "Poha", qty: 1, rate: 67.80, amt: 67.80 },
    { name: "TEA", qty: 1, rate: 38.10, amt: 38.10 }
  ],
  "16033": [
    { name: "Aloo Parantha", qty: 1, rate: 57.14, amt: 57.14 },
    { name: "TEA", qty: 1, rate: 38.10, amt: 38.10 }
  ],
  "16025": [
    { name: "Tawa Roti", qty: 4, rate: 19.05, amt: 76.20 },
    { name: "Yellow Dal Tadka", qty: 2, rate: 148.10, amt: 296.20 }
  ],
  "16029": [
    { name: "Poha", qty: 1, rate: 66.67, amt: 66.67 },
    { name: "Tea", qty: 1, rate: 38.10, amt: 38.10 },
    { name: "Veg Sandwich", qty: 1, rate: 85.71, amt: 85.71 }
  ],
  "16027": [
    { name: "Egg Bhurji", qty: 1, rate: 171.43, amt: 85.72, discount: 50 },
    { name: "Lemon Water", qty: 7, rate: 38.10, amt: 133.35, discount: 50 },
    { name: "Poha", qty: 1, rate: 66.67, amt: 33.34, discount: 50 },
    { name: "Special Thali", qty: 4, rate: 200.00, amt: 400.00, discount: 50 },
    { name: "Tawa Roti", qty: 2, rate: 19.05, amt: 19.05, discount: 50 }
  ],
  "16021": [
    { name: "Veg Sandwich", qty: 1, rate: 85.71, amt: 85.71 }
  ],
  "16020": [
    { name: "Special Thali", qty: 5, rate: 200.00, amt: 500.00, discount: 50 }
  ],
  "16018": [
    { name: "Aloo Gobhi Dry", qty: 1, rate: 142.86, amt: 71.43, discount: 50 },
    { name: "Lassi Sweet", qty: 3, rate: 65.81, amt: 98.72, discount: 50 },
    { name: "Lemon Water", qty: 9, rate: 38.10, amt: 171.45, discount: 50 },
    { name: "Matar Paneer", qty: 1, rate: 164.54, amt: 82.27, discount: 50 }
  ],
  "16019": [
    { name: "Aloo Parantha", qty: 1, rate: 57.14, amt: 28.57, discount: 50 },
    { name: "TEA", qty: 1, rate: 38.10, amt: 19.05, discount: 50 }
  ]
};

const staysToImport = [
  { invoiceNo: "11908", guest: "ROBI STEPHAN SS", date: "20260602", amount: 2200.00, rooms: ["Room 19"], partyLedger: "ROBI STEPHAN SS", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11905", guest: "JAGTAR", date: "20260601", amount: 1500.00, rooms: ["Room 08"], partyLedger: "JAGTAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "180962826-000231", guest: "SHARAJ SINGH PADDA", date: "20260601", amount: 1560.00, rooms: ["Room 04"], partyLedger: "TREEBO HOTELS", revenueLedger: "SALES B2B 5% HARYANA" }, // B2B Stay
  { invoiceNo: "11909", guest: "MAYANK SHRIVASTVA", date: "20260602", amount: 1800.00, rooms: ["Room 07"], partyLedger: "MAYANK SHRIVASTVA", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11911", guest: "MAYANK SHRIVASTVA", date: "20260602", amount: 1800.00, rooms: ["Room 08"], partyLedger: "MAYANK SHRIVASTVA", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11912", guest: "TARUN GOYAL", date: "20260602", amount: 1100.00, rooms: ["Room 20"], partyLedger: "TARUN GOYAL", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11906", guest: "PARSHANT", date: "20260602", amount: 1100.00, rooms: ["Room 11"], partyLedger: "PARSHANT", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11910", guest: "RAHUL PUROHIT", date: "20260602", amount: 2000.00, rooms: ["Room 10"], partyLedger: "RAHUL PUROHIT", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11913", guest: "RAJEEV PARMAR", date: "20260602", amount: 1200.00, rooms: ["Room 16"], partyLedger: "RAJEEV PARMAR", revenueLedger: "Sale 5% Haryana B2C" }
];

const foodBillsToImport = [
  { billNo: "16028", guest: "SHARAJ SINGH PADDA", date: "20260602", total: 60.00, rooms: ["Room 04"], partyLedger: "SHARAJ SINGH PADDA" }, // B2C Food for Treebo guest
  { billNo: "16024", guest: "MAYANK SHRIVASTVA", date: "20260601", total: 120.00, rooms: ["Room 08"], partyLedger: "MAYANK SHRIVASTVA" },
  { billNo: "16031", guest: "MAYANK SHRIVASTVA", date: "20260602", total: 400.00, rooms: ["Room 07"], partyLedger: "MAYANK SHRIVASTVA" },
  { billNo: "16022", guest: "VARUN", date: "20260601", total: 233.00, rooms: ["Room 02"], partyLedger: "VARUN" },
  { billNo: "16033", guest: "HARDEEP SINGH", date: "20260601", total: 100.00, rooms: ["Room 17"], partyLedger: "HARDEEP SINGH" },
  { billNo: "16025", guest: "PARSHANT", date: "20260601", total: 391.00, rooms: ["Room 11"], partyLedger: "PARSHANT" },
  { billNo: "16029", guest: "PARSHANT", date: "20260602", total: 200.00, rooms: ["Room 11"], partyLedger: "PARSHANT" },
  
  // Directors and Corporate
  { billNo: "16027", guest: "Directors", date: "20260601", total: 705.00, rooms: [], partyLedger: "BHARAT SIR" },
  { billNo: "16021", guest: "Directors", date: "20260601", total: 90.00, rooms: [], partyLedger: "A&A STAFF" },
  { billNo: "16020", guest: null, date: "20260601", total: 525.00, rooms: [], partyLedger: "ENGLABS INDIA PVT LTD" },
  { billNo: "16018", guest: "Directors", date: "20260601", total: 445.00, rooms: [], partyLedger: "MD SIR" },
  { billNo: "16019", guest: null, date: "20260601", total: 50.00, rooms: [], partyLedger: "Bright Kids School" }
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
  console.log("\n=== STEP 1: Creating Parent Groups ===");
  const groupsXml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <GROUP NAME="Hotel Guests - Direct" ACTION="Create">
                        <NAME>Hotel Guests - Direct</NAME>
                        <PARENT>Sundry Debtors</PARENT>
                    </GROUP>
                </TALLYMESSAGE>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <GROUP NAME="Hotel Guests - Treebo" ACTION="Create">
                        <NAME>Hotel Guests - Treebo</NAME>
                        <PARENT>Sundry Debtors</PARENT>
                    </GROUP>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
  
  try {
    const res = await postTallyXml(groupsXml);
    console.log("  Groups creation response:", res.trim().substring(0, 150) + "...");
  } catch (e) {
    console.warn("  Warning creating groups:", e.message);
  }

  console.log("\n=== STEP 2: Creating/Ensuring Guest Ledgers under Groups ===");
  const guestLedgerList = [
    { name: "ROBI STEPHAN SS", mode: "DIRECT" },
    { name: "JAGTAR", mode: "DIRECT" },
    { name: "SHARAJ SINGH PADDA", mode: "TREEBO" },
    { name: "MAYANK SHRIVASTVA", mode: "DIRECT" },
    { name: "HARDEEP SINGH", mode: "DIRECT" },
    { name: "TARUN GOYAL", mode: "DIRECT" },
    { name: "PARSHANT", mode: "DIRECT" },
    { name: "RAHUL PUROHIT", mode: "DIRECT" },
    { name: "RAJEEV PARMAR", mode: "DIRECT" },
    { name: "VARUN", mode: "TREEBO" },
    { name: "BHARAT SIR", mode: "DIRECTOR" },
    { name: "A&A STAFF", mode: "DIRECTOR" },
    { name: "ENGLABS INDIA PVT LTD", mode: "DIRECTOR" }
  ];

  for (const guest of guestLedgerList) {
    const parentGroup = guest.mode === "DIRECT" ? "Hotel Guests - Direct" 
                      : guest.mode === "TREEBO" ? "Hotel Guests - Treebo"
                      : "Customer";

    const escapedName = escapeXml(guest.name);
    const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <LEDGER NAME="${escapedName}" ACTION="Create">
                        <NAME>${escapedName}</NAME>
                        <PARENT>${parentGroup}</PARENT>
                        <ISBILLWISEON>No</ISBILLWISEON>
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
        console.log(`  SUCCESS: Created ledger '${guest.name}' under '${parentGroup}' (bill-wise: No).`);
      } else {
        const alterXml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <LEDGER NAME="${escapedName}" ACTION="Alter">
                        <NAME>${escapedName}</NAME>
                        <PARENT>${parentGroup}</PARENT>
                        <ISBILLWISEON>No</ISBILLWISEON>
                    </LEDGER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
        await postTallyXml(alterXml);
        console.log(`  EXISTS: Updated existing ledger '${guest.name}' parent to '${parentGroup}' (bill-wise: No).`);
      }
    } catch (e) {
      console.error(`  ERROR setting up guest ledger '${guest.name}': ${e.message}`);
    }
  }

  console.log("\n=== STEP 3: Ensuring Cost Categories & Cost Centres ===");
  const costCentres = [
    "Room 02", "Room 04", "Room 07", "Room 08", "Room 10", "Room 11", "Room 16", "Room 17", "Room 19", "Room 20"
  ];
  const costSetupXmls = [
    `<COSTCATEGORY NAME="Rooms" ACTION="Create"><NAME>Rooms</NAME><ALLOCATEREVENUE>Yes</ALLOCATEREVENUE></COSTCATEGORY>`,
    `<COSTCATEGORY NAME="Walk-in Guest" ACTION="Create"><NAME>Walk-in Guest</NAME><ALLOCATEREVENUE>Yes</ALLOCATEREVENUE></COSTCATEGORY>`,
    `<COSTCENTRE NAME="Directors" ACTION="Create"><NAME>Directors</NAME><CATEGORY>Walk-in Guest</CATEGORY></COSTCENTRE>`
  ];
  for (const c of costCentres) {
    costSetupXmls.push(`<COSTCENTRE NAME="${c}" ACTION="Create"><NAME>${c}</NAME><CATEGORY>Rooms</CATEGORY></COSTCENTRE>`);
  }

  for (const xmlPayload of costSetupXmls) {
    const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
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
      console.warn("  Cost centre setup warning:", e.message);
    }
  }
  console.log("  Cost Centres ensured.");

  console.log("\n=== STEP 4: Ensuring Stock Items Exist ===");
  const stockItems = [
    { name: "Aloo Parantha", rate: 57.14 },
    { name: "Sweet Lassi", rate: 65.81 },
    { name: "Matar Paneer", rate: 164.54 },
    { name: "Yellow Dal Tadka", rate: 148.10 },
    { name: "Egg Bhurji", rate: 171.43 },
    { name: "Special Thali", rate: 200.00 },
    { name: "Aloo Gobhi Dry", rate: 142.86 },
    { name: "Bread Toast", rate: 47.62 }
  ];

  for (const item of stockItems) {
    const escaped = escapeXml(item.name);
    const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <STOCKITEM NAME="${escaped}" ACTION="Create">
                        <NAME>${escaped}</NAME>
                        <PARENT>CONSUMBED GOODS</PARENT>
                        <BASEUNITS>NOS</BASEUNITS>
                        <STANDARDSALESPRICELIST.LIST>
                             <DATE>20260401</DATE>
                             <RATE>${item.rate}/NOS</RATE>
                        </STANDARDSALESPRICELIST.LIST>
                    </STOCKITEM>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
    try {
      await postTallyXml(xml);
    } catch (e) {
      console.warn("  Stock item setup warning:", e.message);
    }
  }
  console.log("  Stock items ensured.");

  console.log("\n=== STEP 5: Posting Room Stay Sales Vouchers ===");
  for (const s of staysToImport) {
    const taxable = parseFloat((s.amount / 1.05).toFixed(2));
    const cgst = parseFloat((taxable * 0.025).toFixed(2));
    const sgst = cgst;
    const diff = parseFloat((s.amount - (taxable + cgst + sgst)).toFixed(2));
    const adjustedTaxable = parseFloat((taxable + diff).toFixed(2));
    
    const escapedParty = escapeXml(s.partyLedger);
    const escapedRevenue = escapeXml(s.revenueLedger);
    
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
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Sales" ACTION="Create">
                        <DATE>${s.date}</DATE>
                        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(s.invoiceNo)}</VOUCHERNUMBER>
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
        console.log(`  SUCCESS: Room Stay Invoice ${s.invoiceNo} (${s.guest}) posted to '${s.partyLedger}'. Amt: ${s.amount}`);
      } else {
        console.log(`  FAILED: Room Stay Invoice ${s.invoiceNo} (${s.guest}) error: ${res.trim()}`);
      }
      await sleep(150);
    } catch (err) {
      console.error(`  ERROR posting room stay ${s.invoiceNo}: ${err.message}`);
    }
  }

  console.log("\n=== STEP 6: Posting Paid Food Sales Vouchers ===");
  for (const fb of foodBillsToImport) {
    const items = knownBills[fb.billNo];
    if (!items) {
      console.error(`  ERROR: Bill items not defined for bill ${fb.billNo}`);
      continue;
    }

    const partyLedger = fb.partyLedger;
    const revenueLedger = (partyLedger === "ENGLABS INDIA PVT LTD") ? "SALES B2B 5% HARYANA" : "Sale 5% Haryana B2C";
    
    const cgst = parseFloat(((fb.total / 1.05) * 0.025).toFixed(2));
    const sgst = cgst;
    
    const itemsTaxableSum = items.reduce((sum, i) => sum + i.amt, 0);
    const expectedTotal = itemsTaxableSum + cgst + sgst;
    const roundOff = parseFloat((fb.total - expectedTotal).toFixed(2));
    
    let itemXml = "";
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
      } else if (fb.guest === "Directors") {
        costCentreXml = `
                                <CATEGORYALLOCATIONS.LIST>
                                    <CATEGORY>Walk-in Guest</CATEGORY>
                                    <COSTCENTREALLOCATIONS.LIST>
                                        <NAME>Directors</NAME>
                                        <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                                    </COSTCENTREALLOCATIONS.LIST>
                                </CATEGORYALLOCATIONS.LIST>`;
      }

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
    const billNoFormatted = `POS-${fb.billNo}`;

    const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
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
        console.log(`  SUCCESS: Food Bill ${billNoFormatted} (${partyLedger}) posted. Amt: ${fb.total}`);
      } else {
        console.log(`  FAILED: Food Bill ${billNoFormatted} (${partyLedger}) error: ${res.trim()}`);
      }
      await sleep(150);
    } catch (err) {
      console.error(`  ERROR posting food bill ${billNoFormatted}: ${err.message}`);
    }
  }

  console.log("\nSales Vouchers Only Import Completed!");
}

run();
