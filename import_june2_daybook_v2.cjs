const http = require('http');

const TALLY_URL = "http://localhost:9000";
const companyName = "Hotel Sky 5 2026-27";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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
                        <PARENT>CONSUMBED GOODS</PARENT>
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

// Master Data definition for Import
const staysToImport = [
  // June 2nd Checkouts
  { invoiceNo: "11915", guest: "JOHNEY", date: "20260602", amount: 1500.00, rooms: ["Room 12"], partyLedger: "JOHNEY", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11914", guest: "HARPREET", date: "20260602", amount: 1500.00, rooms: ["Room 11"], partyLedger: "HARPREET", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11916", guest: "VIPIN DAHIYA", date: "20260602", amount: 1500.00, rooms: ["Room 08"], partyLedger: "VIPIN DAHIYA", revenueLedger: "Sale 5% Haryana B2C" },
  // June 3rd Checkouts
  { invoiceNo: "11918", guest: "HARDEEP SINGH", date: "20260603", amount: 2400.00, rooms: ["Room 17"], partyLedger: "HARDEEP SINGH", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11917", guest: "VIKASH", date: "20260603", amount: 1200.00, rooms: ["Room 20"], partyLedger: "VIKASH", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11923", guest: "ASHISH PANDEY", date: "20260603", amount: 2500.00, rooms: ["Room 01"], partyLedger: "ASHISH PANDEY", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11919", guest: "PRASHANT KUMAR", date: "20260603", amount: 1500.00, rooms: ["Room 10"], partyLedger: "PRASHANT KUMAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11925", guest: "MONIKA SHARMA", date: "20260603", amount: 2600.00, rooms: ["Room 05"], partyLedger: "MONIKA SHARMA", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11924", guest: "RAKESH", date: "20260603", amount: 2600.00, rooms: ["Room 14"], partyLedger: "RAKESH", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "180962826-000236", guest: "SABANAZ", date: "20260603", amount: 1797.70, rooms: ["Room 04"], partyLedger: "SABANAZ", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "180962826-000237", guest: "VIVEK", date: "20260603", amount: 2150.50, rooms: ["Room 08"], partyLedger: "VIVEK", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "180962826-000238", guest: "ANKIT SHARMA", date: "20260603", amount: 2000.00, rooms: ["Room 11"], partyLedger: "TREEBO HOTELS", revenueLedger: "SALES B2B 5% HARYANA" },
  { invoiceNo: "180962826-000239", guest: "APRAJITA PANIYA", date: "20260603", amount: 4777.52, rooms: ["Room 07"], partyLedger: "APRAJITA PANIYA", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "180962826-000240", guest: "VIKAS SHARMA", date: "20260603", amount: 1776.78, rooms: ["Room 10"], partyLedger: "VIKAS SHARMA", revenueLedger: "Sale 5% Haryana B2C" }
];

const foodBillsToImport = [
  // June 2nd Food
  { billNo: "POS-16034", guest: "HARPREET", date: "20260602", total: 200.00, rooms: ["Room 11"], partyLedger: "HARPREET", items: [{ name: "Cheese Chilly", qty: 1, rate: 190.48, amt: 190.48 }] },
  { billNo: "POS-16036", guest: "VIPIN DAHIYA", date: "20260602", total: 120.00, rooms: ["Room 08"], partyLedger: "VIPIN DAHIYA", items: [{ name: "Coffee", qty: 2, rate: 57.14, amt: 114.28 }] },
  { billNo: "POS-16039", guest: "VIKASH", date: "20260602", total: 210.00, rooms: ["Room 20"], partyLedger: "VIKASH", items: [{ name: "Mineral Water", qty: 1, rate: 28.57, amt: 28.57 }, { name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }, { name: "Veg Maggies", qty: 2, rate: 66.67, amt: 133.34 }] },
  { billNo: "POS-16037", guest: "ASHISH PANDEY", date: "20260602", total: 313.00, rooms: ["Room 01"], partyLedger: "ASHISH PANDEY", items: [{ name: "Matar Paneer", qty: 1, rate: 164.54, amt: 164.54 }, { name: "Tawa Roti", qty: 7, rate: 19.05, amt: 133.35 }] },
  
  // Hardeep food bills posted June 2nd
  { billNo: "POS-16026", guest: "HARDEEP SINGH", date: "20260602", total: 40.00, rooms: ["Room 17"], partyLedger: "HARDEEP SINGH", items: [{ name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }] },
  { billNo: "POS-16033", guest: "HARDEEP SINGH", date: "20260602", total: 60.00, rooms: ["Room 17"], partyLedger: "HARDEEP SINGH", items: [{ name: "Aloo Parantha", qty: 1, rate: 57.14, amt: 57.14 }] },
  { billNo: "POS-16035", guest: "HARDEEP SINGH", date: "20260602", total: 60.00, rooms: ["Room 17"], partyLedger: "HARDEEP SINGH", items: [{ name: "Coffee", qty: 1, rate: 57.14, amt: 57.14 }] },
  { billNo: "POS-16040", guest: "HARDEEP SINGH", date: "20260602", total: 333.00, rooms: ["Room 17"], partyLedger: "HARDEEP SINGH", items: [{ name: "Milk", qty: 1, rate: 50.00, amt: 50.00 }, { name: "Mineral Water", qty: 2, rate: 28.57, amt: 57.14 }, { name: "Veg Fried Rice", qty: 1, rate: 142.86, amt: 142.86 }, { name: "Maggies", qty: 1, rate: 66.67, amt: 66.67 }] },
  
  // Vivek food bill
  { billNo: "POS-16048", guest: "VIVEK", date: "20260602", total: 53.00, rooms: ["Room 08"], partyLedger: "VIVEK", items: [{ name: "Milk", qty: 1, rate: 50.00, amt: 50.00 }] },
  
  // June 3rd Food
  { billNo: "POS-16050", guest: "VIKASH", date: "20260603", total: 30.00, rooms: ["Room 20"], partyLedger: "VIKASH", items: [{ name: "Mineral Water", qty: 1, rate: 28.57, amt: 28.57 }] },
  { billNo: "POS-16059", guest: "MONIKA SHARMA", date: "20260603", total: 290.00, rooms: ["Room 05"], partyLedger: "MONIKA SHARMA", items: [{ name: "Mineral Water", qty: 1, rate: 28.57, amt: 28.57 }, { name: "Tea", qty: 2, rate: 38.10, amt: 76.20 }, { name: "Veg. Sandwich", qty: 2, rate: 85.71, amt: 171.42 }] },
  { billNo: "POS-16060", guest: "RAKESH", date: "20260603", total: 462.00, rooms: ["Room 14"], partyLedger: "RAKESH", items: [{ name: "Coffee", qty: 1, rate: 57.14, amt: 57.14 }, { name: "Curd Bowl", qty: 1, rate: 38.10, amt: 38.10 }, { name: "Mix Parantha", qty: 2, rate: 57.60, amt: 115.20 }, { name: "Plain Omelette", qty: 2, rate: 57.60, amt: 115.20 }, { name: "Tea", qty: 3, rate: 38.10, amt: 114.30 }] },
  { billNo: "POS-16061", guest: "MONIKA SHARMA", date: "20260603", total: 120.00, rooms: ["Room 05"], partyLedger: "MONIKA SHARMA", items: [{ name: "Tea", qty: 3, rate: 38.10, amt: 114.30 }] },
  
  // Aprajita pending bills
  { billNo: "POS-16038", guest: "APRAJITA PANIYA", date: "20260602", total: 160.00, rooms: ["Room 07"], partyLedger: "APRAJITA PANIYA", items: [{ name: "Tea", qty: 4, rate: 38.10, amt: 152.40 }] },
  { billNo: "POS-16065", guest: "APRAJITA PANIYA", date: "20260603", total: 60.00, rooms: ["Room 07"], partyLedger: "APRAJITA PANIYA", items: [{ name: "Mineral Water", qty: 2, rate: 28.57, amt: 57.14 }] },
  
  // Sabanaz room-service food bill
  { billNo: "POS-16063", guest: "SABANAZ", date: "20260603", total: 479.00, rooms: ["Room 04"], partyLedger: "SABANAZ", items: [{ name: "Aloo Jeera", qty: 1, rate: 114.29, amt: 114.29 }, { name: "Matar Paneer", qty: 1, rate: 164.54, amt: 164.54 }, { name: "Plain Rice", qty: 1, rate: 82.27, amt: 82.27 }, { name: "Tawa Butter Roti", qty: 4, rate: 23.81, amt: 95.24 }] },

  // Walkins
  { billNo: "POS-16042", guest: "Bharat Sir", date: "20260602", total: 75.00, rooms: [], partyLedger: "BHARAT SIR", items: [{ name: "Lemon Water", qty: 2, rate: 38.10, amt: 76.20, discount: 50 }, { name: "Poha", qty: 1, rate: 66.67, amt: 66.67, discount: 50 }] },
  { billNo: "POS-16043", guest: "Shreeya", date: "20260602", total: 60.00, rooms: [], partyLedger: "SHREEYA", items: [{ name: "Lemon Water", qty: 3, rate: 38.10, amt: 114.30, discount: 50 }] },
  { billNo: "POS-16044", guest: "Englabs India", date: "20260602", total: 420.00, rooms: [], partyLedger: "ENGLABS INDIA PVT LTD", items: [{ name: "Special Thali", qty: 4, rate: 200.00, amt: 800.00, discount: 50 }], isB2B: true },
  { billNo: "POS-16045", guest: "A&A Staff", date: "20260602", total: 90.00, rooms: [], partyLedger: "A&A STAFF", items: [{ name: "Staff Lemon", qty: 1, rate: 14.29, amt: 14.29 }, { name: "Staff Tea", qty: 5, rate: 14.29, amt: 71.45 }] }
];

const complementaryBills = [
  // June 3rd FOC
  { billNo: "POS-16055", guest: "APRAJITA PANIYA", date: "20260603", amount: 400.00, room: "Room 07", items: [{ name: "Aloo Parantha", qty: 1, rate: 57.14, amt: 57.14 }, { name: "Bread Toast (4pcs)", qty: 1, rate: 47.62, amt: 47.62 }, { name: "Coffee", qty: 2, rate: 57.14, amt: 114.28 }, { name: "Onion Parantha", qty: 1, rate: 57.14, amt: 57.14 }, { name: "Poha", qty: 1, rate: 66.67, amt: 66.67 }, { name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }] },
  { billNo: "POS-16053", guest: "SABANAZ", date: "20260603", amount: 360.00, room: "Room 04", items: [{ name: "Aloo Parantha", qty: 2, rate: 57.14, amt: 114.28 }, { name: "Veg Sandwich", qty: 2, rate: 85.71, amt: 171.42 }, { name: "Tea", qty: 2, rate: 28.57, amt: 57.14 }] },
  { billNo: "POS-16057", guest: "ANKIT SHARMA", date: "20260603", amount: 280.00, room: "Room 11", items: [{ name: "Bowl", qty: 2, rate: 38.10, amt: 76.20 }, { name: "Parantha", qty: 2, rate: 57.14, amt: 114.28 }, { name: "Tea", qty: 2, rate: 38.10, amt: 76.20 }] },
  { billNo: "POS-16056", guest: "VIVEK", date: "20260603", amount: 330.00, room: "Room 08", items: [{ name: "Bread Toast (4pcs)", qty: 1, rate: 47.62, amt: 47.62 }, { name: "Masala Omelette", qty: 1, rate: 74.04, amt: 74.04 }, { name: "Milk", qty: 1, rate: 50.00, amt: 50.00 }, { name: "Poha", qty: 1, rate: 66.67, amt: 66.67 }, { name: "Tea", qty: 2, rate: 38.10, amt: 76.20 }] },
  { billNo: "POS-15760", guest: "SABANAZ", date: "20260603", amount: 330.00, room: "Room 04", items: [{ name: "Plain Omelette", qty: 2, rate: 76.19, amt: 152.38 }, { name: "Tea", qty: 2, rate: 38.10, amt: 76.20 }, { name: "Veg Sandwich", qty: 1, rate: 85.71, amt: 85.71 }] }
];

const paymentJVs = [
  // June 2nd Payments
  { vchNo: "PAY-11915", date: "20260602", guest: "JOHNEY", debits: [{ ledger: "Cash", amt: 1500.00 }], credit: 1500.00 },
  { vchNo: "PAY-11914", date: "20260602", guest: "HARPREET", debits: [{ ledger: "Cash", amt: 1700.00 }], credit: 1700.00 },
  { vchNo: "PAY-11916", date: "20260602", guest: "VIPIN DAHIYA", debits: [{ ledger: "CONSUMER", amt: 1620.00 }], credit: 1620.00 },
  // Walkins (June 2nd)
  { vchNo: "PAY-16042", date: "20260602", guest: "BHARAT SIR", debits: [{ ledger: "Cash", amt: 75.00 }], credit: 75.00 },
  { vchNo: "PAY-16043", date: "20260602", guest: "SHREEYA", debits: [{ ledger: "Cash", amt: 60.00 }], credit: 60.00 },
  { vchNo: "PAY-16044", date: "20260602", guest: "ENGLABS INDIA PVT LTD", debits: [{ ledger: "Cash", amt: 420.00 }], credit: 420.00 },
  { vchNo: "PAY-16045", date: "20260602", guest: "A&A STAFF", debits: [{ ledger: "Cash", amt: 90.00 }], credit: 90.00 },

  // June 3rd Payments
  { vchNo: "PAY-11918", date: "20260603", guest: "HARDEEP SINGH", debits: [{ ledger: "CONSUMER", amt: 1660.00 }], credit: 1660.00 },
  { vchNo: "PAY-11917", date: "20260603", guest: "VIKASH", debits: [{ ledger: "Cash", amt: 1435.00 }], credit: 1435.00 },
  { vchNo: "PAY-11923", date: "20260603", guest: "ASHISH PANDEY", debits: [{ ledger: "CONSUMER", amt: 2813.00 }], credit: 2813.00 },
  { vchNo: "PAY-180962826-000236", date: "20260603", guest: "SABANAZ", debits: [{ ledger: "TREEBO HOTELS", amt: 1797.70 }], credit: 1797.70 },
  { vchNo: "PAY-11919", date: "20260603", guest: "PRASHANT KUMAR", debits: [{ ledger: "CONSUMER", amt: 1300.00 }], credit: 1300.00 },
  { vchNo: "PAY-180962826-000238", date: "20260603", guest: "ANKIT SHARMA", debits: [{ ledger: "CONSUMER", amt: 469.00 }], credit: 469.00 },
  { vchNo: "PAY-180962826-000237", date: "20260603", guest: "VIVEK", debits: [{ ledger: "TREEBO HOTELS", amt: 1075.50 }, { ledger: "CONSUMER", amt: 1128.00 }], credit: 2203.50 },
  { vchNo: "PAY-11925", date: "20260603", guest: "MONIKA SHARMA", debits: [{ ledger: "CONSUMER", amt: 3010.00 }], credit: 3010.00 },
  { vchNo: "PAY-11924", date: "20260603", guest: "RAKESH", debits: [{ ledger: "CONSUMER", amt: 3062.00 }], credit: 3062.00 },
  { vchNo: "PAY-180962826-000239", date: "20260603", guest: "APRAJITA PANIYA", debits: [{ ledger: "TREEBO HOTELS", amt: 4777.52 }], credit: 4777.52 },
  { vchNo: "PAY-180962826-000240", date: "20260603", guest: "VIKAS SHARMA", debits: [{ ledger: "TREEBO HOTELS", amt: 1776.78 }], credit: 1776.78 }
];

async function run() {
  console.log("\n=== STEP 1: Creating Parent Groups ===");
  await createGroup("Hotel Guests - Direct", "Sundry Debtors");
  await createGroup("Hotel Guests - Treebo", "Sundry Debtors");
  console.log("  Direct and Treebo guest groups ensured.");

  console.log("\n=== STEP 2: Creating Guest Ledgers ===");
  const guestLedgers = [
    { name: "JOHNEY", parent: "Hotel Guests - Direct" },
    { name: "HARPREET", parent: "Hotel Guests - Direct" },
    { name: "VIPIN DAHIYA", parent: "Hotel Guests - Direct" },
    { name: "HARDEEP SINGH", parent: "Hotel Guests - Direct" },
    { name: "VIKASH", parent: "Hotel Guests - Direct" },
    { name: "ASHISH PANDEY", parent: "Hotel Guests - Direct" },
    { name: "PRASHANT KUMAR", parent: "Hotel Guests - Direct" },
    { name: "MONIKA SHARMA", parent: "Hotel Guests - Direct" },
    { name: "RAKESH", parent: "Hotel Guests - Direct" },
    { name: "SABANAZ", parent: "Hotel Guests - Direct" },
    { name: "VIVEK", parent: "Hotel Guests - Direct" },
    { name: "ANKIT SHARMA", parent: "Hotel Guests - Direct" },
    { name: "TREEBO HOTELS", parent: "Hotel Guests - Treebo" },
    { name: "BHARAT SIR", parent: "Customer" },
    { name: "SHREEYA", parent: "Customer" },
    { name: "ENGLABS INDIA PVT LTD", parent: "Hotel Guests - Treebo" },
    { name: "A&A STAFF", parent: "Customer" },
    { name: "APRAJITA PANIYA", parent: "Hotel Guests - Direct" },
    { name: "VIKAS SHARMA", parent: "Hotel Guests - Direct" }
  ];
  
  for (const gl of guestLedgers) {
    await createLedger(gl.name, gl.parent, false, false);
    await sleep(50);
  }
  console.log(`  Set up ${guestLedgers.length} guest ledgers.`);

  console.log("\n=== STEP 3: Ensuring Cost Categories & Cost Centres ===");
  const roomCostCentres = [
    "Room 01", "Room 02", "Room 04", "Room 05", "Room 06", "Room 07", "Room 08", "Room 10", "Room 11", "Room 12", "Room 14", "Room 17", "Room 20"
  ];
  
  const catXml1 = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF"><COSTCATEGORY NAME="Rooms" ACTION="Create"><NAME>Rooms</NAME><ALLOCATEREVENUE>Yes</ALLOCATEREVENUE></COSTCATEGORY></TALLYMESSAGE></REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
  const catXml2 = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF"><COSTCATEGORY NAME="Walk-in Guest" ACTION="Create"><NAME>Walk-in Guest</NAME><ALLOCATEREVENUE>Yes</ALLOCATEREVENUE></COSTCATEGORY></TALLYMESSAGE></REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
  await postTallyXml(catXml1);
  await postTallyXml(catXml2);
  
  for (const room of roomCostCentres) {
    await createCostCentre(room, "Rooms");
    await sleep(50);
  }
  await createCostCentre("Directors", "Walk-in Guest");
  console.log("  Cost categories and centres ensured.");

  console.log("\n=== STEP 4: Creating/Ensuring Stock Items ===");
  const stockItems = [
    "Aloo Parantha", "Matar Paneer", "Yellow Dal Tadka", "Egg Bhurji", 
    "Special Thali", "Coffee", "Tea", "Mineral Water", "Veg Fried Rice", 
    "Maggies", "Curd Bowl", "Plain Omelette", "Masala Omelette", "Milk", 
    "Veg Sandwich", "Cheese Chilly", "Veg. Sandwich", "Tawa Roti", "Staff Lemon", 
    "Staff Tea", "Aloo Jeera", "Plain Rice", "Tawa Butter Roti", "Bowl", "Parantha", 
    "Bread Toast (4pcs)", "Onion Parantha", "Poha"
  ];
  for (const item of stockItems) {
    await createStockItem(item);
    await sleep(50);
  }
  console.log(`  Set up ${stockItems.length} stock items.`);

  console.log("\n=== STEP 5: Ensuring Core Income/Expense Ledgers ===");
  await createLedger("FOC Food Consumption", "Direct Incomes", false, true);
  await createLedger("Complementary Food Expense", "Indirect Expenses", true, false);
  console.log("  Incomes and expenses ledgers verified.");

  console.log("\n=== STEP 6: Posting Room Stay Sales Invoices ===");
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
                <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
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
        console.log(`  SUCCESS: Stay Invoice ${s.invoiceNo} (${s.guest}) posted. Amt: ${s.amount}`);
      } else {
        console.log(`  FAILED: Stay Invoice ${s.invoiceNo} error: ${res.trim()}`);
      }
      await sleep(150);
    } catch (err) {
      console.error(`  ERROR posting stay invoice ${s.invoiceNo}: ${err.message}`);
    }
  }

  console.log("\n=== STEP 7: Posting Paid Food Sales Invoices ===");
  for (const fb of foodBillsToImport) {
    const partyLedger = fb.partyLedger;
    const revenueLedger = fb.isB2B ? "SALES B2B 5% HARYANA" : "Sale 5% Haryana B2C";
    
    const cgst = parseFloat(((fb.total / 1.05) * 0.025).toFixed(2));
    const sgst = cgst;
    
    const itemsTaxableSum = fb.items.reduce((sum, i) => sum + i.amt, 0);
    const expectedTotal = itemsTaxableSum + cgst + sgst;
    const roundOff = parseFloat((fb.total - expectedTotal).toFixed(2));
    
    let itemXml = "";
    fb.items.forEach(i => {
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
      } else {
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
                        <DATE>${fb.date}</DATE>
                        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(fb.billNo)}</VOUCHERNUMBER>
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
        console.log(`  SUCCESS: Paid food bill ${fb.billNo} (${fb.guest}) posted. Amt: ${fb.total}`);
      } else {
        console.log(`  FAILED: Paid food bill ${fb.billNo} error: ${res.trim()}`);
      }
      await sleep(150);
    } catch (err) {
      console.error(`  ERROR posting food bill ${fb.billNo}: ${err.message}`);
    }
  }

  console.log("\n=== STEP 8: Posting Complementary Food Consumption & Clearing JVs ===");
  for (const foc of complementaryBills) {
    const sjBillNo = foc.billNo;
    const clBillNo = `${foc.billNo}-CL`;
    
    // 1. Sales Journal (Consumption)
    let inventoryXml = "";
    foc.items.forEach(i => {
      inventoryXml += `
                            <INVENTORYALLOCATIONS.LIST>
                                <STOCKITEMNAME>${escapeXml(i.name)}</STOCKITEMNAME>
                                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                <RATE>${i.rate.toFixed(2)}</RATE>
                                <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                                <ACTUALQTY>${i.qty}</ACTUALQTY>
                                <BILLEDQTY>${i.qty}</BILLEDQTY>
                            </INVENTORYALLOCATIONS.LIST>`;
    });

    const focTaxableAmt = foc.items.reduce((sum, i) => sum + i.amt, 0);
    const roundOff = parseFloat((foc.amount - focTaxableAmt).toFixed(2));
    
    let roundOffXml = "";
    if (roundOff !== 0) {
      roundOffXml = `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>ROUND OFF</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${roundOff.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;
    }

    const escapedGuest = escapeXml(foc.guest);
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
                        <DATE>${foc.date}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(sjBillNo)}</VOUCHERNUMBER>
                        <REFERENCE>${escapeXml(sjBillNo)}</REFERENCE>
                        <EFFECTIVEDATE>${foc.date}</EFFECTIVEDATE>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapedGuest}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${foc.amount.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>FOC Food Consumption</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${focTaxableAmt.toFixed(2)}</AMOUNT>
                            ${inventoryXml}
                        </ALLLEDGERENTRIES.LIST>
                        ${roundOffXml}
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

    try {
      const res = await postTallyXml(sjXml);
      if (res.includes("<CREATED>1</CREATED>")) {
        console.log(`  SUCCESS: Complementary Sales Journal ${sjBillNo} (${foc.guest}) posted. Amt: ${foc.amount}`);
      } else {
        console.log(`  FAILED: Complementary Sales Journal ${sjBillNo} error: ${res.trim()}`);
      }
      await sleep(150);
    } catch (err) {
      console.error(`  ERROR posting complementary sales journal ${sjBillNo}: ${err.message}`);
    }

    // 2. Clearing Journal (Clearing Expense)
    const escapedRoom = escapeXml(foc.room);
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
                        <DATE>${foc.date}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(clBillNo)}</VOUCHERNUMBER>
                        <REFERENCE>${escapeXml(clBillNo)}</REFERENCE>
                        <EFFECTIVEDATE>${foc.date}</EFFECTIVEDATE>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Complementary Food Expense</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${foc.amount.toFixed(2)}</AMOUNT>
                            <CATEGORYALLOCATIONS.LIST>
                                <CATEGORY>Rooms</CATEGORY>
                                <COSTCENTREALLOCATIONS.LIST>
                                    <NAME>${escapedRoom}</NAME>
                                    <AMOUNT>-${foc.amount.toFixed(2)}</AMOUNT>
                                </COSTCENTREALLOCATIONS.LIST>
                            </CATEGORYALLOCATIONS.LIST>
                        </ALLLEDGERENTRIES.LIST>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapedGuest}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${foc.amount.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

    try {
      const res = await postTallyXml(clXml);
      if (res.includes("<CREATED>1</CREATED>")) {
        console.log(`  SUCCESS: Complementary Clearing Journal ${clBillNo} (${foc.guest}) posted. Amt: ${foc.amount}`);
      } else {
        console.log(`  FAILED: Complementary Clearing Journal ${clBillNo} error: ${res.trim()}`);
      }
      await sleep(150);
    } catch (err) {
      console.error(`  ERROR posting complementary clearing journal ${clBillNo}: ${err.message}`);
    }
  }

  console.log("\n=== STEP 9: Posting Guest Payment JVs ===");
  for (const jv of paymentJVs) {
    let ledgerEntriesXml = "";
    
    // Debits
    jv.debits.forEach(d => {
      ledgerEntriesXml += `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(d.ledger)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${d.amt.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;
    });
    
    // Credit
    ledgerEntriesXml += `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(jv.guest)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${jv.credit.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;

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
                        <DATE>${jv.date}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(jv.vchNo)}</VOUCHERNUMBER>
                        <REFERENCE>${escapeXml(jv.vchNo)}</REFERENCE>
                        <EFFECTIVEDATE>${jv.date}</EFFECTIVEDATE>
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
        console.log(`  SUCCESS: Payment JV ${jv.vchNo} for ${jv.guest} posted. Amt: ${jv.credit}`);
      } else {
        console.log(`  FAILED: Payment JV ${jv.vchNo} error: ${res.trim()}`);
      }
      await sleep(150);
    } catch (err) {
      console.error(`  ERROR posting payment JV ${jv.vchNo}: ${err.message}`);
    }
  }

  console.log("\n=== Daybook June 2nd/3rd Integration completed ===");
}

run();
