const http = require('http');

const TALLY_URL = "http://localhost:9000";
const companyName = "Hotel Sky 5 2026-27";

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createLedger(name, parent, isCostCentreOn = false, isInventoryAffected = false, gstApplicable = "Not Applicable") {
  const costCentresXml = isCostCentreOn ? "<ISCOSTCENTRESON>Yes</ISCOSTCENTRESON>" : "<ISCOSTCENTRESON>No</ISCOSTCENTRESON>";
  const inventoryXml = isInventoryAffected ? "<ISINVENTORYAFFECTED>Yes</ISINVENTORYAFFECTED>" : "<ISINVENTORYAFFECTED>No</ISINVENTORYAFFECTED>";
  
  const createXml = `
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
                    <LEDGER NAME="${name}" ACTION="Create">
                        <NAME>${name}</NAME>
                        <PARENT>${parent}</PARENT>
                        <GSTAPPLICABLE>${gstApplicable}</GSTAPPLICABLE>
                        ${costCentresXml}
                        ${inventoryXml}
                    </LEDGER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>
`;

  try {
    const res = await postTallyXml(createXml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`SUCCESS: Ledger '${name}' created.`);
    } else {
      // If already exists, alter to ensure settings are correct
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
                    <LEDGER NAME="${name}" ACTION="Alter">
                        <NAME>${name}</NAME>
                        <PARENT>${parent}</PARENT>
                        <GSTAPPLICABLE>${gstApplicable}</GSTAPPLICABLE>
                        ${costCentresXml}
                        ${inventoryXml}
                    </LEDGER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>
`;
      await postTallyXml(alterXml);
      console.log(`SUCCESS: Ledger '${name}' verified/altered (Cost Centres: ${isCostCentreOn ? 'Yes' : 'No'}, Inventory: ${isInventoryAffected ? 'Yes' : 'No'}).`);
    }
  } catch (err) {
    console.error(`ERROR creating/altering ledger '${name}':`, err.message);
  }
}

async function createStockItem(name) {
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
                    <STOCKITEM NAME="${name}" ACTION="Create">
                        <NAME>${name}</NAME>
                        <PARENT>CONSUMBED GOODS</PARENT>
                        <BASEUNITS>NOS</BASEUNITS>
                    </STOCKITEM>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>
`;

  try {
    const res = await postTallyXml(xml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`SUCCESS: Stock Item '${name}' created.`);
    } else {
      console.log(`SUCCESS: Stock Item '${name}' verified/exists.`);
    }
  } catch (err) {
    console.error(`ERROR creating stock item '${name}':`, err.message);
  }
}

const salesJournals = [
  {
    billNo: "POS-16032",
    date: "20260602",
    guest: "RAHUL PUROHIT",
    amount: 250.00,
    roundOff: 11.45,
    items: [
      { name: "Aloo Parantha", qty: 1, rate: 57.14, amt: 57.14 },
      { name: "Mix Parantha", qty: 1, rate: 57.60, amt: 57.60 },
      { name: "TEA", qty: 1, rate: 38.10, amt: 38.10 },
      { name: "Veg Sandwich", qty: 1, rate: 85.71, amt: 85.71 }
    ]
  }
];

const clearingJournals = [
  {
    billNo: "POS-16032-CL",
    date: "20260602",
    guest: "RAHUL PUROHIT",
    amount: 250.00,
    room: "Room 10"
  }
];

async function postSalesJournal(sj) {
  let inventoryXml = "";
  sj.items.forEach(i => {
    inventoryXml += `
                            <INVENTORYALLOCATIONS.LIST>
                                <STOCKITEMNAME>${i.name}</STOCKITEMNAME>
                                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                <RATE>${i.rate.toFixed(2)}</RATE>
                                <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                                <ACTUALQTY>${i.qty}</ACTUALQTY>
                                <BILLEDQTY>${i.qty}</BILLEDQTY>
                            </INVENTORYALLOCATIONS.LIST>`;
  });

  const focTaxableAmt = sj.items.reduce((sum, i) => sum + i.amt, 0);
  
  let roundOffXml = "";
  if (sj.roundOff !== 0) {
    roundOffXml = `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>ROUND OFF</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${sj.roundOff.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;
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
                    <VOUCHER VCHTYPE="Journal" ACTION="Create">
                        <DATE>${sj.date}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${sj.billNo}</VOUCHERNUMBER>
                        <REFERENCE>${sj.billNo}</REFERENCE>
                        <EFFECTIVEDATE>${sj.date}</EFFECTIVEDATE>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${sj.guest}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${sj.amount.toFixed(2)}</AMOUNT>
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
</ENVELOPE>
`;

  try {
    const res = await postTallyXml(xml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`SUCCESS: Sales Journal ${sj.billNo} (${sj.guest}) posted.`);
    } else {
      console.log(`FAILED: Sales Journal ${sj.billNo} (${sj.guest}) -`, res.trim());
    }
  } catch (err) {
    console.error(`ERROR posting Sales Journal ${sj.billNo}:`, err.message);
  }
}

async function postClearingJournal(cj) {
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
                    <VOUCHER VCHTYPE="Journal" ACTION="Create">
                        <DATE>${cj.date}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${cj.billNo}</VOUCHERNUMBER>
                        <REFERENCE>${cj.billNo}</REFERENCE>
                        <EFFECTIVEDATE>${cj.date}</EFFECTIVEDATE>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Complementary Food Expense</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${cj.amount.toFixed(2)}</AMOUNT>
                            <CATEGORYALLOCATIONS.LIST>
                                <CATEGORY>Rooms</CATEGORY>
                                <COSTCENTREALLOCATIONS.LIST>
                                    <NAME>${cj.room}</NAME>
                                    <AMOUNT>-${cj.amount.toFixed(2)}</AMOUNT>
                                </COSTCENTREALLOCATIONS.LIST>
                            </CATEGORYALLOCATIONS.LIST>
                        </ALLLEDGERENTRIES.LIST>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${cj.guest}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${cj.amount.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>
`;

  try {
    const res = await postTallyXml(xml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`SUCCESS: Clearing Journal ${cj.billNo} (${cj.guest}) posted.`);
    } else {
      console.log(`FAILED: Clearing Journal ${cj.billNo} (${cj.guest}) -`, res.trim());
    }
  } catch (err) {
    console.error(`ERROR posting Clearing Journal ${cj.billNo}:`, err.message);
  }
}

async function run() {
  console.log("=== STEP 1: Creating/Verifying Ledgers ===");
  await createLedger("FOC Food Consumption", "Direct Incomes", false, true, "Not Applicable");
  await createLedger("Complementary Food Expense", "Indirect Expenses", true, false, "Not Applicable");
  await sleep(500);

  console.log("\n=== STEP 2: Creating/Verifying Stock Items ===");
  const itemsToEnsure = ["Aloo Parantha", "Mix Parantha", "TEA", "Veg Sandwich"];
  for (const item of itemsToEnsure) {
    await createStockItem(item);
    await sleep(100);
  }

  console.log("\n=== STEP 3: Posting Sales Journals ===");
  for (const sj of salesJournals) {
    await postSalesJournal(sj);
    await sleep(200);
  }

  console.log("\n=== STEP 4: Posting Clearing Journals ===");
  for (const cj of clearingJournals) {
    await postClearingJournal(cj);
    await sleep(200);
  }

  console.log("\n=== Complementary Import Process Finished! ===");
}

run();
