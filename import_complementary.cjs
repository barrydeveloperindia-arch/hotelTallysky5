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

async function createLedger(name, parent, isCostCentreOn = false, gstApplicable = "Not Applicable") {
  const costCentresXml = isCostCentreOn ? "<ISCOSTCENTRESON>Yes</ISCOSTCENTRESON>" : "<ISCOSTCENTRESON>No</ISCOSTCENTRESON>";
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
                    <LEDGER NAME="${name}" ACTION="Create">
                        <NAME>${name}</NAME>
                        <PARENT>${parent}</PARENT>
                        <GSTAPPLICABLE>${gstApplicable}</GSTAPPLICABLE>
                        ${costCentresXml}
                    </LEDGER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>
`;

  try {
    const res = await postTallyXml(xml);
    if (res.includes("<CREATED>1</CREATED>") || res.includes("<ALTERED>1</ALTERED>") || res.includes("Combined Name")) {
      console.log(`SUCCESS: Ledger '${name}' created/verified.`);
    } else {
      console.log(`LEDGER CREATION RESPONSE for '${name}':`, res.trim());
    }
  } catch (err) {
    console.error(`ERROR creating ledger '${name}':`, err.message);
  }
}

const salesJournals = [
  {
    billNo: "POS-16147",
    date: "20260609",
    guest: "SHASHANK GAUR",
    amount: 152.00,
    roundOff: -0.38,
    items: [
      { name: "Aloo Parantha", qty: 2, rate: 57.14, amt: 114.28 },
      { name: "TEA", qty: 1, rate: 38.10, amt: 38.10 }
    ]
  },
  {
    billNo: "POS-16165",
    date: "20260610",
    guest: "KUNAL",
    amount: 162.00,
    roundOff: -0.37,
    items: [
      { name: "Curd Bowl", qty: 1, rate: 38.10, amt: 38.10 },
      { name: "Mix Parantha", qty: 1, rate: 57.60, amt: 57.60 },
      { name: "Poha", qty: 1, rate: 66.67, amt: 66.67 }
    ]
  },
  {
    billNo: "POS-16164",
    date: "20260610",
    guest: "ARJUN PARSHAD",
    amount: 112.00,
    roundOff: -0.14,
    items: [
      { name: "Masala Omelette", qty: 1, rate: 74.04, amt: 74.04 },
      { name: "TEA", qty: 1, rate: 38.10, amt: 38.10 }
    ]
  }
];

const clearingJournals = [
  {
    billNo: "POS-16147-CL",
    date: "20260609",
    guest: "SHASHANK GAUR",
    amount: 152.00,
    room: "Room 04"
  },
  {
    billNo: "POS-16165-CL",
    date: "20260610",
    guest: "KUNAL",
    amount: 162.00,
    room: "Room 04"
  },
  {
    billNo: "POS-16164-CL",
    date: "20260610",
    guest: "ARJUN PARSHAD",
    amount: 112.00,
    room: "Room 07"
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
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>ROUND OFF</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${sj.roundOff.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>`;
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
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>${sj.guest}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${sj.amount.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>FOC Food Consumption</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${focTaxableAmt.toFixed(2)}</AMOUNT>
                            ${inventoryXml}
                        </LEDGERENTRIES.LIST>
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
                        <LEDGERENTRIES.LIST>
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
                        </LEDGERENTRIES.LIST>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>${cj.guest}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${cj.amount.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
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
  await createLedger("FOC Food Consumption", "Direct Incomes", false, "Not Applicable");
  await createLedger("Complementary Food Expense", "Indirect Expenses", true, "Not Applicable");
  await sleep(500);

  console.log("\n=== STEP 2: Posting Sales Journals ===");
  for (const sj of salesJournals) {
    await postSalesJournal(sj);
    await sleep(200);
  }

  console.log("\n=== STEP 3: Posting Clearing Journals ===");
  for (const cj of clearingJournals) {
    await postClearingJournal(cj);
    await sleep(200);
  }

  console.log("\n=== Complementary Import Process Finished! ===");
}

run();
