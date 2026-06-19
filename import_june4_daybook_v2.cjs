const http = require('http');

const TALLY_URL = "http://127.0.0.1:9000";
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

// Master Data Definitions for June 4th Folder Import
const staysToImport = [
  { invoiceNo: "11929", guest: "MANOJ KUMAR", date: "20260604", amount: 1200.00, rooms: ["Room 04"], partyLedger: "MANOJ KUMAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11930", guest: "RAJESH KUMAR", date: "20260604", amount: 1600.00, rooms: ["Room 07"], partyLedger: "RAJESH KUMAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11931", guest: "NITESH KUMAR", date: "20260604", amount: 1000.00, rooms: ["Room 17"], partyLedger: "NITESH KUMAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11932", guest: "PARDEEP", date: "20260604", amount: 1500.00, rooms: ["Room 08"], partyLedger: "PARDEEP", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11933", guest: "PARDEEP KUMAR", date: "20260604", amount: 1200.00, rooms: ["Room 17"], partyLedger: "PARDEEP KUMAR", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "11934", guest: "VIJAY", date: "20260604", amount: 2200.00, rooms: ["Room 19", "Room 20"], partyLedger: "VIJAY", revenueLedger: "Sale 5% Haryana B2C" }
];

const foodBillsToImport = [
  // Paid food bills
  { billNo: "POS-16073", guest: "RAJESH KUMAR", date: "20260604", total: 110.00, rooms: ["Room 07"], partyLedger: "RAJESH KUMAR", items: [{ name: "Tea", qty: 2, rate: 38.10, amt: 76.20 }, { name: "Mineral Water", qty: 1, rate: 28.57, amt: 28.57 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16080", guest: "VIJAY", date: "20260604", total: 210.00, rooms: ["Room 19", "Room 20"], partyLedger: "VIJAY", items: [{ name: "Special Thali", qty: 1, rate: 200.00, amt: 200.00 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16084", guest: "NISHKANT SHARMA", date: "20260604", total: 30.00, rooms: ["Room 01"], partyLedger: "NISHKANT SHARMA", items: [{ name: "Mineral Water", qty: 1, rate: 28.57, amt: 28.57 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16083", guest: "INDER SINGH", date: "20260604", total: 580.00, rooms: ["Room 17"], partyLedger: "INDER SINGH", items: [{ name: "Curd Bowl", qty: 2, rate: 38.10, amt: 76.20 }, { name: "Mix Vegetable", qty: 1, rate: 190.48, amt: 190.48 }, { name: "Tawa Butter Roti", qty: 12, rate: 23.81, amt: 285.72 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16070", guest: "VARUN", date: "20260604", total: 40.00, rooms: ["Room 06"], partyLedger: "VARUN", items: [{ name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }], revenueLedger: "Sale 5% Haryana B2C" },
  
  // Unpaid Walk-in / Directors food bills (no payment JVs will be created for these)
  { billNo: "POS-16077", guest: "MD SIR", date: "20260604", total: 20.00, rooms: [], partyLedger: "MD SIR", items: [{ name: "Tea", qty: 1, rate: 38.10, amt: 19.05, discount: 50 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16076", guest: "ENGLABS", date: "20260604", total: 40.00, rooms: [], partyLedger: "ENGLABS INDIA PVT LTD", items: [{ name: "Lemon Water", qty: 2, rate: 38.10, amt: 38.10, discount: 50 }], revenueLedger: "SALES B2B 5% HARYANA", isB2B: true },
  { billNo: "POS-16075", guest: "SWATI", date: "20260604", total: 80.00, rooms: [], partyLedger: "SWATI", items: [{ name: "Lemon Water", qty: 4, rate: 38.10, amt: 76.20, discount: 50 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16078", guest: "SHREEYA", date: "20260604", total: 63.00, rooms: [], partyLedger: "SHREEYA", items: [{ name: "Tawa Butter Roti", qty: 5, rate: 23.81, amt: 59.52, discount: 50 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16074", guest: "VIJAY SIR", date: "20260604", total: 60.00, rooms: [], partyLedger: "VIJAY SIR", items: [{ name: "Tea", qty: 3, rate: 38.10, amt: 57.15, discount: 50 }], revenueLedger: "Sale 5% Haryana B2C" },
  { billNo: "POS-16069", guest: "A&A STAFF", date: "20260604", total: 75.00, rooms: [], partyLedger: "A&A STAFF", items: [{ name: "Staff Lemon", qty: 1, rate: 14.29, amt: 14.29 }, { name: "Staff Tea", qty: 4, rate: 14.29, amt: 57.16 }], revenueLedger: "Sale 5% Haryana B2C" }
];

const paymentJVs = [
  { vchNo: "PAY-11929", date: "20260604", guest: "MANOJ KUMAR", debits: [{ ledger: "Cash", amt: 1200.00 }], credit: 1200.00, narration: "Paid Cash - Contact: 9014" },
  { vchNo: "PAY-11930", date: "20260604", guest: "RAJESH KUMAR", debits: [{ ledger: "CONSUMER", amt: 1710.00 }], credit: 1710.00, narration: "Paid Online - Contact: 9458942438" },
  { vchNo: "PAY-11931", date: "20260604", guest: "NITESH KUMAR", debits: [{ ledger: "CONSUMER", amt: 1000.00 }], credit: 1000.00, narration: "Paid Online - Contact: 9996380774" },
  { vchNo: "PAY-11932", date: "20260604", guest: "PARDEEP", debits: [{ ledger: "Cash", amt: 1500.00 }], credit: 1500.00, narration: "Paid Cash - Contact: 9010" },
  { vchNo: "PAY-11933", date: "20260604", guest: "PARDEEP KUMAR", debits: [{ ledger: "CONSUMER", amt: 1200.00 }], credit: 1200.00, narration: "Paid Online - Contact: 9015" },
  { vchNo: "PAY-11934", date: "20260604", guest: "VIJAY", debits: [{ ledger: "CONSUMER", amt: 2410.00 }], credit: 2410.00, narration: "Paid Online - Contact: 9011" }
];

const complementaryBills = [
  { billNo: "POS-16023", guest: "VARUN", date: "20260602", amount: 267.00, room: "Room 06", items: [{ name: "Mix Vegetable", qty: 1, rate: 190.48, amt: 190.48 }, { name: "Tawa Roti", qty: 4, rate: 19.05, amt: 76.20 }] },
  { billNo: "POS-16030", guest: "VARUN", date: "20260602", amount: 124.00, room: "Room 06", items: [{ name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }, { name: "Veg. Sandwich", qty: 1, rate: 85.71, amt: 85.71 }] },
  { billNo: "POS-16052", guest: "VARUN", date: "20260603", amount: 74.00, room: "Room 02", items: [{ name: "Masala Omelette", qty: 1, rate: 74.04, amt: 74.04 }] }
];

async function postSalesJournal(sj) {
  const cgst = parseFloat(((sj.total / 1.05) * 0.025).toFixed(2));
  const sgst = cgst;
  const itemsTaxableSum = sj.items.reduce((sum, i) => sum + i.amt, 0);
  const expectedTotal = itemsTaxableSum + cgst + sgst;
  const roundOff = parseFloat((sj.total - expectedTotal).toFixed(2));
  
  let itemXml = "";
  sj.items.forEach(i => {
    const discountXml = i.discount ? `<DISCOUNT>${i.discount}</DISCOUNT>` : "";
    const escapedItemName = escapeXml(i.name);
    
    let costCentreXml = "";
    if (sj.rooms && sj.rooms.length > 0) {
      const splitAmt = parseFloat((i.amt / sj.rooms.length).toFixed(2));
      let runningSum = 0;
      
      const allocs = sj.rooms.map((room, idx) => {
        let amt = splitAmt;
        if (idx === sj.rooms.length - 1) {
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
                                 <LEDGERNAME>${escapeXml(sj.revenueLedger)}</LEDGERNAME>
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

  const escapedParty = escapeXml(sj.partyLedger);
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
                        <DATE>${sj.date}</DATE>
                        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(sj.billNo)}</VOUCHERNUMBER>
                        <PARTYLEDGERNAME>${escapedParty}</PARTYLEDGERNAME>
                        <PLACEOFSUPPLY>Haryana</PLACEOFSUPPLY>
                        <EFFECTIVEDATE>${sj.date}</EFFECTIVEDATE>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapedParty}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${sj.total.toFixed(2)}</AMOUNT>
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
      console.log(`  SUCCESS: Food bill ${sj.billNo} (${sj.guest}) posted.`);
    } else {
      console.log(`  FAILED: Food bill ${sj.billNo} error: ${res.trim()}`);
    }
  } catch (err) {
    console.error(`  ERROR posting food bill ${sj.billNo}: ${err.message}`);
  }
}

async function postFocJVs(foc) {
  const roundedBasic = Math.round(foc.amount);
  const itemsSum = foc.items.reduce((sum, i) => sum + i.amt, 0);
  const roundOff = parseFloat((roundedBasic - itemsSum).toFixed(2));
  
  let inventoryAllocXml = "";
  foc.items.forEach(i => {
    inventoryAllocXml += `
                            <INVENTORYALLOCATIONS.LIST>
                                <STOCKITEMNAME>${escapeXml(i.name)}</STOCKITEMNAME>
                                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                <RATE>${i.rate.toFixed(2)}/NOS</RATE>
                                <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                                <ACTUALQTY> ${i.qty} NOS</ACTUALQTY>
                                <BILLEDQTY> ${i.qty} NOS</BILLEDQTY>
                            </INVENTORYALLOCATIONS.LIST>`;
  });
  
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
  
  // JV 1: Consumption
  const xml1 = `
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
                        <VOUCHERNUMBER>${escapeXml(foc.billNo)}</VOUCHERNUMBER>
                        <EFFECTIVEDATE>${foc.date}</EFFECTIVEDATE>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapedGuest}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${roundedBasic.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>FOC Food Consumption</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${itemsSum.toFixed(2)}</AMOUNT>
                            ${inventoryAllocXml}
                        </ALLLEDGERENTRIES.LIST>
                        ${roundOffXml}
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

  // JV 2: Clearing
  const xml2 = `
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
                        <VOUCHERNUMBER>${escapeXml(foc.billNo + "-CL")}</VOUCHERNUMBER>
                        <EFFECTIVEDATE>${foc.date}</EFFECTIVEDATE>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Complementary Food Expense</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${roundedBasic.toFixed(2)}</AMOUNT>
                            <CATEGORYALLOCATIONS.LIST>
                                <CATEGORY>Rooms</CATEGORY>
                                <COSTCENTREALLOCATIONS.LIST>
                                    <NAME>${escapeXml(foc.room)}</NAME>
                                    <AMOUNT>-${roundedBasic.toFixed(2)}</AMOUNT>
                                </COSTCENTREALLOCATIONS.LIST>
                            </CATEGORYALLOCATIONS.LIST>
                        </ALLLEDGERENTRIES.LIST>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapedGuest}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${roundedBasic.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

  try {
    const res1 = await postTallyXml(xml1);
    const res2 = await postTallyXml(xml2);
    if (res1.includes("<CREATED>1</CREATED>") && res2.includes("<CREATED>1</CREATED>")) {
      console.log(`  SUCCESS: FOC JVs for ${foc.billNo} (${foc.guest}) posted.`);
    } else {
      console.log(`  FAILED: FOC JVs for ${foc.billNo} - JV1: ${res1.trim()} | JV2: ${res2.trim()}`);
    }
  } catch (err) {
    console.error(`  ERROR posting FOC JVs for ${foc.billNo}: ${err.message}`);
  }
}

async function postPaymentJV(pay) {
  let debitXml = "";
  pay.debits.forEach(d => {
    debitXml += `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(d.ledger)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${d.amt.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;
  });
  
  const escapedGuest = escapeXml(pay.guest);
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
                        <DATE>${pay.date}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(pay.vchNo)}</VOUCHERNUMBER>
                        <EFFECTIVEDATE>${pay.date}</EFFECTIVEDATE>
                        <NARRATION>${escapeXml(pay.narration)}</NARRATION>
                        ${debitXml}
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapedGuest}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${pay.credit.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

  try {
    const res = await postTallyXml(xml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`  SUCCESS: Payment JV ${pay.vchNo} (${pay.guest}) posted.`);
    } else {
      console.log(`  FAILED: Payment JV ${pay.vchNo} error: ${res.trim()}`);
    }
  } catch (err) {
    console.error(`  ERROR posting payment JV ${pay.vchNo}: ${err.message}`);
  }
}

async function run() {
  console.log("\n=== STEP 1: Creating Parent Groups ===");
  await createLedger("Hotel Guests - Direct", "Sundry Debtors");
  await createLedger("Hotel Guests - Treebo", "Sundry Debtors");
  console.log("  Direct and Treebo guest groups ensured.");

  console.log("\n=== STEP 2: Creating Guest Ledgers ===");
  const guestLedgers = [
    { name: "MANOJ KUMAR", parent: "Hotel Guests - Direct" },
    { name: "RAJESH KUMAR", parent: "Hotel Guests - Direct" },
    { name: "NITESH KUMAR", parent: "Hotel Guests - Direct" },
    { name: "PARDEEP", parent: "Hotel Guests - Direct" },
    { name: "PARDEEP KUMAR", parent: "Hotel Guests - Direct" },
    { name: "VIJAY", parent: "Hotel Guests - Direct" },
    { name: "NISHKANT SHARMA", parent: "Hotel Guests - Direct" },
    { name: "VARUN", parent: "Hotel Guests - Direct" },
    { name: "INDER SINGH", parent: "Hotel Guests - Direct" },
    { name: "MD SIR", parent: "Hotel Guests - Direct" },
    { name: "ENGLABS INDIA PVT LTD", parent: "Hotel Guests - Treebo" },
    { name: "SWATI", parent: "Customer" },
    { name: "SHREEYA", parent: "Customer" },
    { name: "VIJAY SIR", parent: "Customer" },
    { name: "A&A STAFF", parent: "Customer" }
  ];
  
  for (const gl of guestLedgers) {
    await createLedger(gl.name, gl.parent, false, false);
    await sleep(50);
  }
  console.log(`  Set up ${guestLedgers.length} guest ledgers.`);

  console.log("\n=== STEP 3: Ensuring Cost Categories & Cost Centres ===");
  const rooms = ["Room 04", "Room 07", "Room 17", "Room 08", "Room 19", "Room 20", "Room 01", "Room 06", "Room 02"];
  for (const room of rooms) {
    await createCostCentre(room, "Rooms");
  }
  await createCostCentre("Directors", "Walk-in Guest");
  console.log("  Cost categories and centres ensured.");

  console.log("\n=== STEP 4: Creating/Ensuring Stock Items ===");
  const stockItems = [
    "Tea", "Mineral Water", "Special Thali", "Curd Bowl", "Mix Vegetable", "Tawa Butter Roti",
    "Lemon Water", "Tawa Roti", "Veg. Sandwich", "Masala Omelette", "Staff Lemon", "Staff Tea"
  ];
  for (const item of stockItems) {
    await createStockItem(item);
    await sleep(50);
  }
  console.log(`  Set up ${stockItems.length} stock items.`);

  console.log("\n=== STEP 5: Posting Room Stay Sales Invoices (SKIPPED - Already created) ===");
  /*
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
        console.log(`  SUCCESS: Stay Invoice ${s.invoiceNo} (${s.guest}) posted.`);
      } else {
        console.log(`  FAILED: Stay Invoice ${s.invoiceNo} error: ${res.trim()}`);
      }
      await sleep(100);
    } catch (err) {
      console.error(`  ERROR posting stay invoice ${s.invoiceNo}: ${err.message}`);
    }
  }
  */

  console.log("\n=== STEP 6: Posting Food Sales Invoices (SKIPPED - Already created) ===");
  /*
  for (const fb of foodBillsToImport) {
    await postSalesJournal(fb);
    await sleep(100);
  }
  */

  console.log("\n=== STEP 7: Posting Payment Receipt JVs (SKIPPED - Already created) ===");
  /*
  for (const pay of paymentJVs) {
    await postPaymentJV(pay);
    await sleep(100);
  }
  */

  console.log("\n=== STEP 8: Posting Complementary JVs ===");
  for (const foc of complementaryBills) {
    await postFocJVs(foc);
    await sleep(100);
  }

  console.log("\n=== June 4th Folder Import Completed! ===");
}

run().catch(console.error);
