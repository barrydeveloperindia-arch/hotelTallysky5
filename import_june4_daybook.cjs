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

async function getExistingVoucherNumbers() {
  const queryXml = `
<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>VoucherCollection</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES>
                <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                <SVFROMDATE TYPE="Date">20260601</SVFROMDATE>
                <SVTODATE TYPE="Date">20260606</SVTODATE>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
            <TDL>
                <TDLMESSAGE>
                    <COLLECTION NAME="VoucherCollection" ISMODIFY="No">
                        <TYPE>Voucher</TYPE>
                        <FETCH>VoucherNumber</FETCH>
                    </COLLECTION>
                </TDLMESSAGE>
            </TDL>
        </DESC>
    </BODY>
</ENVELOPE>`;
  try {
    const res = await postTallyXml(queryXml);
    const voucherNumbers = new Set();
    const regex = /<VOUCHERNUMBER>([^<]+)<\/VOUCHERNUMBER>/g;
    let match;
    while ((match = regex.exec(res)) !== null) {
      voucherNumbers.add(match[1].trim());
    }
    return voucherNumbers;
  } catch (err) {
    console.error("Error fetching existing vouchers:", err.message);
    return new Set();
  }
}

// Master Data Definitions
const staysToImport = [
  { invoiceNo: "11929", guest: "MANOJ KUMAR", date: "20260604", amount: 1200.00, rooms: ["Room 04"], partyLedger: "MANOJ KUMAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11930", guest: "RAJESH KUMAR", date: "20260604", amount: 1600.00, rooms: ["Room 07"], partyLedger: "RAJESH KUMAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11931", guest: "NITESH KUMAR", date: "20260604", amount: 1000.00, rooms: ["Room 17"], partyLedger: "NITESH KUMAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11932", guest: "PARDEEP", date: "20260604", amount: 1500.00, rooms: ["Room 08"], partyLedger: "PARDEEP", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11933", guest: "PARDEEP KUMAR", date: "20260604", amount: 1200.00, rooms: ["Room 17"], partyLedger: "PARDEEP KUMAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11934", guest: "VIJAY", date: "20260604", amount: 2200.00, rooms: ["Room 19", "Room 20"], partyLedger: "VIJAY", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11937", guest: "HARSH KUMAR", date: "20260605", amount: 2000.00, rooms: ["Room 08"], partyLedger: "HARSH KUMAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11939", guest: "SHUSHIL KUMAR SHUKLA", date: "20260605", amount: 1300.00, rooms: ["Room 11"], partyLedger: "SHUSHIL KUMAR SHUKLA", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11940", guest: "INDER SINGH", date: "20260605", amount: 1200.00, rooms: ["Room 17"], partyLedger: "INDER SINGH", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11938", guest: "DILBAG SINGH", date: "20260605", amount: 3600.00, rooms: ["Room 10"], partyLedger: "DILBAG SINGH", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "180962826-000244", guest: "NISHKANT SHARMA", date: "20260605", amount: 1976.65, rooms: ["Room 01"], partyLedger: "NISHKANT SHARMA", revenueLedger: "Sale 5% Haryana B2C" }
];

const foodBillsToImport = [
  { billNo: "POS-16073", guest: "RAJESH KUMAR", date: "20260604", total: 110.00, rooms: ["Room 07"], partyLedger: "RAJESH KUMAR", items: [{ name: "Tea", qty: 2, rate: 38.10, amt: 76.20 }, { name: "Mineral Water", qty: 1, rate: 28.57, amt: 28.57 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16080", guest: "VIJAY", date: "20260604", total: 210.00, rooms: ["Room 19", "Room 20"], partyLedger: "VIJAY", items: [{ name: "Special Thali", qty: 1, rate: 200.00, amt: 200.00 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16081", guest: "SHUSHIL KUMAR SHUKLA", date: "20260604", total: 40.00, rooms: ["Room 11"], partyLedger: "SHUSHIL KUMAR SHUKLA", items: [{ name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16085", guest: "SHUSHIL KUMAR SHUKLA", date: "20260605", total: 40.00, rooms: ["Room 11"], partyLedger: "SHUSHIL KUMAR SHUKLA", items: [{ name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16084", guest: "NISHKANT SHARMA", date: "20260604", total: 30.00, rooms: ["Room 01"], partyLedger: "NISHKANT SHARMA", items: [{ name: "Mineral Water", qty: 1, rate: 28.57, amt: 28.57 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16083", guest: "INDER SINGH", date: "20260604", total: 580.00, rooms: ["Room 17"], partyLedger: "INDER SINGH", items: [{ name: "Curd Bowl", qty: 2, rate: 38.10, amt: 76.20 }, { name: "Mix Vegetable", qty: 1, rate: 190.48, amt: 190.48 }, { name: "Tawa Butter Roti", qty: 12, rate: 23.81, amt: 285.72 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16087", guest: "INDER SINGH", date: "20260605", total: 660.00, rooms: ["Room 17"], partyLedger: "INDER SINGH", items: [{ name: "Curd Bowl", qty: 2, rate: 38.10, amt: 76.20 }, { name: "Mix Vegetable", qty: 1, rate: 190.48, amt: 190.48 }, { name: "Tawa Butter Roti", qty: 12, rate: 23.81, amt: 285.72 }, { name: "Tea", qty: 2, rate: 38.10, amt: 76.20 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16070", guest: "VARUN", date: "20260604", total: 40.00, rooms: ["Room 06"], partyLedger: "VARUN", items: [{ name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16086", guest: "VARUN", date: "20260605", total: 110.00, rooms: ["Room 06"], partyLedger: "VARUN", items: [{ name: "Poha", qty: 1, rate: 66.67, amt: 66.67 }, { name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }], revenueLedger: "Sale 5% Haryana B2C" },
  
  // Unpaid walkins / directors
  { billNo: "POS-16077", guest: "MD SIR", date: "20260604", total: 20.00, rooms: [], partyLedger: "MD SIR", items: [{ name: "Tea", qty: 1, rate: 38.10, amt: 19.05, discount: 50 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16076", guest: "ENGLABS", date: "20260604", total: 40.00, rooms: [], partyLedger: "ENGLABS INDIA PVT LTD", items: [{ name: "Lemon Water", qty: 2, rate: 38.10, amt: 38.10, discount: 50 }], revenueLedger: "SALES B2B 5% HARYANA" },
  { billNo: "POS-16075", guest: "SWATI", date: "20260604", total: 80.00, rooms: [], partyLedger: "SWATI", items: [{ name: "Lemon Water", qty: 4, rate: 38.10, amt: 76.20, discount: 50 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16078", guest: "SHREEYA", date: "20260604", total: 63.00, rooms: [], partyLedger: "SHREEYA", items: [{ name: "Tawa Butter Roti", qty: 5, rate: 23.81, amt: 59.52, discount: 50 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16074", guest: "VIJAY SIR", date: "20260604", total: 60.00, rooms: [], partyLedger: "VIJAY SIR", items: [{ name: "Tea", qty: 3, rate: 38.10, amt: 57.15, discount: 50 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16069", guest: "A&A STAFF", date: "20260604", total: 75.00, rooms: [], partyLedger: "A&A STAFF", items: [{ name: "Staff Lemon", qty: 1, rate: 14.29, amt: 14.29 }, { name: "Staff Tea", qty: 4, rate: 14.29, amt: 57.16 }], revenueLedger: "Sale 5% Haryana B2C" }
];

const complementaryBills = [
  { billNo: "POS-16023", guest: "VARUN", date: "20260602", amount: 267.00, room: "Room 06", items: [{ name: "Mix Vegetable", qty: 1, rate: 190.48, amt: 190.48 }, { name: "Tawa Roti", qty: 4, rate: 19.05, amt: 76.20 }] },
  { billNo: "POS-16030", guest: "VARUN", date: "20260602", amount: 124.00, room: "Room 06", items: [{ name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }, { name: "Veg. Sandwich", qty: 1, rate: 85.71, amt: 85.71 }] },
  { billNo: "POS-16052", guest: "VARUN", date: "20260603", amount: 74.00, room: "Room 02", items: [{ name: "Masala Omelette", qty: 1, rate: 74.04, amt: 74.04 }] }
];

const paymentJVs = [
  // Stays Clearings
  { vchNo: "PAY-11929", date: "20260604", guest: "MANOJ KUMAR", debits: [{ ledger: "Cash", amt: 1200.00 }], credit: 1200.00, narration: "Paid Cash" },
  { vchNo: "PAY-11930", date: "20260604", guest: "RAJESH KUMAR", debits: [{ ledger: "CONSUMER", amt: 1600.00 }], credit: 1600.00, narration: "Paid Online - Contact: 9458942438" },
  { vchNo: "PAY-11931", date: "20260604", guest: "NITESH KUMAR", debits: [{ ledger: "CONSUMER", amt: 1000.00 }], credit: 1000.00, narration: "Paid Online - Contact: 9996380774" },
  { vchNo: "PAY-11932", date: "20260604", guest: "PARDEEP", debits: [{ ledger: "Cash", amt: 1500.00 }], credit: 1500.00, narration: "Paid Cash" },
  { vchNo: "PAY-11933", date: "20260604", guest: "PARDEEP KUMAR", debits: [{ ledger: "CONSUMER", amt: 1200.00 }], credit: 1200.00, narration: "Paid Online" },
  { vchNo: "PAY-11934", date: "20260604", guest: "VIJAY", debits: [{ ledger: "CONSUMER", amt: 2200.00 }], credit: 2200.00, narration: "Paid Online" },
  { vchNo: "PAY-11937", date: "20260605", guest: "HARSH KUMAR", debits: [{ ledger: "CONSUMER", amt: 2000.00 }], credit: 2000.00, narration: "Paid Online - Contact: 8054467919" },
  { vchNo: "PAY-11939", date: "20260605", guest: "SHUSHIL KUMAR SHUKLA", debits: [{ ledger: "CONSUMER", amt: 1300.00 }], credit: 1300.00, narration: "Paid Credit Card - Contact: 977429898" },
  { vchNo: "PAY-11940", date: "20260605", guest: "INDER SINGH", debits: [{ ledger: "CONSUMER", amt: 1200.00 }], credit: 1200.00, narration: "Paid Online - Contact: 9813382129" },
  { vchNo: "PAY-DILBAG-ADV", date: "20260603", guest: "DILBAG SINGH", debits: [{ ledger: "Cash", amt: 3600.00 }], credit: 3600.00, narration: "Paid Cash" },
  { vchNo: "PAY-180962826-000244", date: "20260605", guest: "NISHKANT SHARMA", debits: [{ ledger: "Treebo Paid", amt: 1976.65 }], credit: 1976.65, narration: "Paid Online - Contact: +912067137555" },

  // Food Clearings
  { vchNo: "PAY-16073", date: "20260604", guest: "RAJESH KUMAR", debits: [{ ledger: "CONSUMER", amt: 110.00 }], credit: 110.00, narration: "Paid Online - Contact: 9458942438" },
  { vchNo: "PAY-16080", date: "20260604", guest: "VIJAY", debits: [{ ledger: "CONSUMER", amt: 210.00 }], credit: 210.00, narration: "Paid Online" },
  { vchNo: "PAY-16081", date: "20260604", guest: "SHUSHIL KUMAR SHUKLA", debits: [{ ledger: "CONSUMER", amt: 40.00 }], credit: 40.00, narration: "Paid Credit Card - Contact: 977429898" },
  { vchNo: "PAY-16085", date: "20260605", guest: "SHUSHIL KUMAR SHUKLA", debits: [{ ledger: "CONSUMER", amt: 40.00 }], credit: 40.00, narration: "Paid Credit Card - Contact: 977429898" },
  { vchNo: "PAY-16084", date: "20260604", guest: "NISHKANT SHARMA", debits: [{ ledger: "CONSUMER", amt: 30.00 }], credit: 30.00, narration: "Paid Credit Card - Contact: +912067137555" },
  { vchNo: "PAY-16083", date: "20260604", guest: "INDER SINGH", debits: [{ ledger: "CONSUMER", amt: 580.00 }], credit: 580.00, narration: "Paid Online - Contact: 9813382129" },
  { vchNo: "PAY-16087", date: "20260605", guest: "INDER SINGH", debits: [{ ledger: "CONSUMER", amt: 660.00 }], credit: 660.00, narration: "Paid Online - Contact: 9813382129" },
  { vchNo: "PAY-16070", date: "20260604", guest: "VARUN", debits: [{ ledger: "CONSUMER", amt: 40.00 }], credit: 40.00, narration: "Paid Online" },
  { vchNo: "PAY-16086", date: "20260605", guest: "VARUN", debits: [{ ledger: "Cash", amt: 110.00 }], credit: 110.00, narration: "Paid Cash" }
];

async function run() {
  console.log("\n=== STEP 1: Creating Parent Groups ===");
  await createGroup("Hotel Guests - Direct", "Sundry Debtors");
  await createGroup("Hotel Guests - Treebo", "Sundry Debtors");
  await createGroup("Customer", "Sundry Debtors");
  console.log("  Direct, Treebo, and Customer guest groups ensured.");

  console.log("\n=== STEP 2: Creating Guest Ledgers ===");
  const guestLedgers = [
    { name: "MANOJ KUMAR", parent: "Hotel Guests - Direct" },
    { name: "RAJESH KUMAR", parent: "Hotel Guests - Direct" },
    { name: "NITESH KUMAR", parent: "Hotel Guests - Direct" },
    { name: "PARDEEP", parent: "Hotel Guests - Direct" },
    { name: "PARDEEP KUMAR", parent: "Hotel Guests - Direct" },
    { name: "VIJAY", parent: "Hotel Guests - Direct" },
    { name: "HARSH KUMAR", parent: "Hotel Guests - Direct" },
    { name: "SHUSHIL KUMAR SHUKLA", parent: "Hotel Guests - Direct" },
    { name: "INDER SINGH", parent: "Hotel Guests - Direct" },
    { name: "TREEBO HOTELS", parent: "Hotel Guests - Treebo" },
    
    // Direct food bill / director ledgers
    { name: "MD SIR", parent: "Customer" },
    { name: "ENGLABS INDIA PVT LTD", parent: "Hotel Guests - Treebo" },
    { name: "SWATI", parent: "Customer" },
    { name: "SHREEYA", parent: "Customer" },
    { name: "VIJAY SIR", parent: "Customer" },
    { name: "A&A STAFF", parent: "Customer" },
    { name: "VARUN", parent: "Hotel Guests - Treebo" }
  ];
  
  for (const gl of guestLedgers) {
    await createLedger(gl.name, gl.parent, false, false);
    await sleep(50);
  }
  console.log(`  Set up ${guestLedgers.length} guest ledgers.`);

  console.log("\n=== STEP 3: Ensuring Cost Categories & Cost Centres ===");
  const roomCostCentres = [
    "Room 01", "Room 02", "Room 04", "Room 06", "Room 07", "Room 08", "Room 11", "Room 17", "Room 19", "Room 20"
  ];
  
  // Category creations first
  const catXml1 = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF"><COSTCATEGORY NAME="Rooms" ACTION="Create"><NAME>Rooms</NAME><ALLOCATEREVENUE>Yes</ALLOCATEREVENUE></COSTCATEGORY></TALLYMESSAGE></REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
  const catXml2 = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF"><COSTCATEGORY NAME="Walk-in Guest" ACTION="Create"><NAME>Walk-in Guest</NAME><ALLOCATEREVENUE>Yes</ALLOCATEREVENUE></COSTCATEGORY></TALLYMESSAGE></REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
  await postTallyXml(catXml1);
  await postTallyXml(catXml2);
  
  // Cost centres
  for (const room of roomCostCentres) {
    await createCostCentre(room, "Rooms");
    await sleep(50);
  }
  await createCostCentre("Directors", "Walk-in Guest");
  console.log("  Cost categories and centres ensured.");

  console.log("\n=== STEP 4: Creating/Ensuring Stock Items ===");
  const stockItems = [
    "Tea", "Mineral Water", "Special Thali", "Lemon Water", "Tawa Butter Roti", "Staff Lemon", "Staff Tea", "Curd Bowl", "Mix Vegetable", "Poha", "Veg. Sandwich", "Masala Omelette", "Tawa Roti"
  ];
  for (const item of stockItems) {
    await createStockItem(item);
    await sleep(50);
  }
  console.log(`  Set up ${stockItems.length} stock items.`);

  console.log("\n=== STEP 5: Ensuring Core Income/Expense/Tax Ledgers ===");
  await createLedger("FOC Food Consumption", "Direct Incomes", false, true);
  await createLedger("Complementary Food Expense", "Indirect Expenses", true, false);
  await createLedger("Sale 5% Haryana B2C", "Sales Accounts", true, true, "Applicable");
  await createLedger("SALES B2B 5% HARYANA", "Sales Accounts", true, true, "Applicable");
  await createLedger("Output Cgst 2.5%", "Duties & Taxes", false, false);
  await createLedger("Output Sgst 2.5%", "Duties & Taxes", false, false);
  await createLedger("ROUND OFF", "Indirect Expenses", false, false);
  // await createLedger("CONSUMER", "Bank Accounts", false, false);
  // await createLedger("Treebo Paid", "Bank Accounts", false, false);
  console.log("  Core ledgers verified.");

  console.log("\n=== STEP 6: Querying Existing Vouchers in Tally ===");
  const existingVouchers = await getExistingVoucherNumbers();
  console.log(`  Found ${existingVouchers.size} existing voucher numbers in Tally.`);
  
  console.log("\n=== STEP 7: Posting Room Stay Sales Invoices ===");
  for (const s of staysToImport) {
    if (existingVouchers.has(s.invoiceNo)) {
      console.log(`  SKIPPED (Duplicate): Stay invoice ${s.invoiceNo} (${s.guest}) already exists.`);
      continue;
    }
    
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

  console.log("\n=== STEP 8: Posting Paid Food Sales Invoices ===");
  for (const fb of foodBillsToImport) {
    if (existingVouchers.has(fb.billNo)) {
      console.log(`  SKIPPED (Duplicate): Paid food bill ${fb.billNo} (${fb.guest}) already exists.`);
      continue;
    }
    
    const partyLedger = fb.partyLedger;
    const revenueLedger = fb.revenueLedger || "Sale 5% Haryana B2C";
    
    const cgst = parseFloat(((fb.total / 1.05) * 0.025).toFixed(2));
    const sgst = cgst;
    
    const itemsTaxableSum = fb.items.reduce((sum, i) => {
      let itemAmt = i.amt;
      return sum + itemAmt;
    }, 0);
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
        // Walk-in directors
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

  console.log("\n=== STEP 9: Posting Complementary Food Consumption & Clearing JVs ===");
  for (const foc of complementaryBills) {
    const sjBillNo = foc.billNo;
    const clBillNo = `${foc.billNo}-CL`;
    
    // 1. Sales Journal (Consumption)
    if (existingVouchers.has(sjBillNo)) {
      console.log(`  SKIPPED (Duplicate): Complementary Sales Journal ${sjBillNo} (${foc.guest}) already exists.`);
    } else {
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
    }

    // 2. Clearing Journal (Clearing Expense)
    if (existingVouchers.has(clBillNo)) {
      console.log(`  SKIPPED (Duplicate): Complementary Clearing Journal ${clBillNo} (${foc.guest}) already exists.`);
    } else {
      const escapedGuest = escapeXml(foc.guest);
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
  }

  console.log("\n=== STEP 10: Posting Guest Payment JVs ===");
  for (const jv of paymentJVs) {
    if (existingVouchers.has(jv.vchNo)) {
      console.log(`  SKIPPED (Duplicate): Payment JV ${jv.vchNo} (${jv.guest}) already exists.`);
      continue;
    }

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

    const escapedNarration = escapeXml(jv.narration);
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
                        <NARRATION>${escapedNarration}</NARRATION>
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
        console.log(`  SUCCESS: Payment JV ${jv.vchNo} for ${jv.guest} posted. Amt: ${jv.credit} | Narration: "${jv.narration}"`);
      } else {
        console.log(`  FAILED: Payment JV ${jv.vchNo} error: ${res.trim()}`);
      }
      await sleep(150);
    } catch (err) {
      console.error(`  ERROR posting payment JV ${jv.vchNo}: ${err.message}`);
    }
  }

  console.log("\n=== Daybook June 4th & 5th Integration Completed ===");
}

run();
