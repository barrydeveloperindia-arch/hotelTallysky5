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

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createLedger(name, parent, isCostCentreOn = false, isInventoryAffected = false) {
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
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <LEDGER NAME="${escapedName}" ACTION="Create">
                        <NAME>${escapedName}</NAME>
                        <PARENT>${escapedParent}</PARENT>
                        <GSTAPPLICABLE>Not Applicable</GSTAPPLICABLE>
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
                        <PARENT>${escapedParent}</PARENT>
                        <GSTAPPLICABLE>Not Applicable</GSTAPPLICABLE>
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
      console.log(`SUCCESS: Ledger '${name}' verified/altered.`);
    }
  } catch (err) {
    console.error(`ERROR creating/altering ledger '${name}':`, err.message);
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
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
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
</ENVELOPE>
`;

  try {
    const res = await postTallyXml(xml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`SUCCESS: Cost Centre '${name}' under category '${category}' created.`);
    } else {
      console.log(`SUCCESS: Cost Centre '${name}' verified/exists.`);
    }
  } catch (err) {
    console.error(`ERROR creating cost centre '${name}':`, err.message);
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
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
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

async function postStaySalesInvoice(s) {
  const taxable = parseFloat((s.amount / 1.05).toFixed(2));
  const cgst = parseFloat((taxable * 0.025).toFixed(2));
  const sgst = cgst;
  const diff = parseFloat((s.amount - (taxable + cgst + sgst)).toFixed(2));
  const adjustedTaxable = parseFloat((taxable + diff).toFixed(2));
  
  const escapedParty = escapeXml(s.guest);
  const escapedRevenue = escapeXml(s.revenueLedger);
  
  const costCentresXml = `
                                <CATEGORYALLOCATIONS.LIST>
                                    <CATEGORY>Rooms</CATEGORY>
                                    <COSTCENTREALLOCATIONS.LIST>
                                        <NAME>${escapeXml(s.room)}</NAME>
                                        <AMOUNT>${adjustedTaxable.toFixed(2)}</AMOUNT>
                                    </COSTCENTREALLOCATIONS.LIST>
                                </CATEGORYALLOCATIONS.LIST>`;

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
                                ${costCentresXml}
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
</ENVELOPE>
`;

  try {
    const res = await postTallyXml(xml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`SUCCESS: Stay Sales Invoice ${s.invoiceNo} (${s.guest}) posted.`);
    } else {
      console.log(`FAILED: Stay Sales Invoice ${s.invoiceNo} -`, res.trim());
    }
  } catch (err) {
    console.error(`ERROR posting Stay Sales Invoice ${s.invoiceNo}:`, err.message);
  }
}

async function postFoodSalesInvoice(fb) {
  const cgst = parseFloat(((fb.total / 1.05) * 0.025).toFixed(2));
  const sgst = cgst;
  
  const itemsTaxableSum = fb.items.reduce((sum, i) => {
    const discountFactor = i.discount ? (1 - i.discount / 100) : 1;
    return sum + parseFloat((i.rate * i.qty * discountFactor).toFixed(2));
  }, 0);
  
  const expectedTotal = itemsTaxableSum + cgst + sgst;
  const roundOff = parseFloat((fb.total - expectedTotal).toFixed(2));
  
  let itemXml = "";
  fb.items.forEach(i => {
    const discountXml = i.discount ? `<DISCOUNT>${i.discount}</DISCOUNT>` : "";
    const escapedItemName = escapeXml(i.name);
    const itemNetAmt = parseFloat((i.rate * i.qty * (i.discount ? (1 - i.discount / 100) : 1)).toFixed(2));
    
    const costCentreXml = `
                                <CATEGORYALLOCATIONS.LIST>
                                    <CATEGORY>${escapeXml(fb.costCategory)}</CATEGORY>
                                    <COSTCENTREALLOCATIONS.LIST>
                                        <NAME>${escapeXml(fb.costCentre)}</NAME>
                                        <AMOUNT>${itemNetAmt.toFixed(2)}</AMOUNT>
                                    </COSTCENTREALLOCATIONS.LIST>
                                </CATEGORYALLOCATIONS.LIST>`;

    itemXml += `
                        <ALLINVENTORYENTRIES.LIST>
                            <STOCKITEMNAME>${escapedItemName}</STOCKITEMNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <RATE>${i.rate.toFixed(2)}</RATE>
                            <AMOUNT>${itemNetAmt.toFixed(2)}</AMOUNT>
                            <ACTUALQTY>${i.qty}</ACTUALQTY>
                            <BILLEDQTY>${i.qty}</BILLEDQTY>
                            ${discountXml}
                            <ACCOUNTINGALLOCATIONS.LIST>
                                <LEDGERNAME>${escapeXml(fb.revenueLedger)}</LEDGERNAME>
                                <AMOUNT>${itemNetAmt.toFixed(2)}</AMOUNT>
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

  const escapedParty = escapeXml(fb.guest);
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
</ENVELOPE>
`;

  try {
    const res = await postTallyXml(xml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`SUCCESS: Food Sales Invoice ${fb.billNo} (${fb.guest}) posted.`);
    } else {
      console.log(`FAILED: Food Sales Invoice ${fb.billNo} -`, res.trim());
    }
  } catch (err) {
    console.error(`ERROR posting Food Sales Invoice ${fb.billNo}:`, err.message);
  }
}

async function postPaymentJv(jv) {
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
</ENVELOPE>
`;

  try {
    const res = await postTallyXml(xml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`SUCCESS: Payment JV ${jv.vchNo} for ${jv.guest} posted.`);
    } else {
      console.log(`FAILED: Payment JV ${jv.vchNo} -`, res.trim());
    }
  } catch (err) {
    console.error(`ERROR posting Payment JV ${jv.vchNo}:`, err.message);
  }
}

async function run() {
  console.log("=== STEP 1: Creating/Verifying Ledgers ===");
  await createLedger("TARUN GOYAL", "Hotel Guests - Direct", true, false);
  await createLedger("ENGLABS INDIA PVT LTD", "Hotel Guests - Treebo", true, false);
  await createLedger("Larissa Ma'am", "Hotel Guests - Direct", true, false);
  await createLedger("A&A STAFF", "Customer", true, false);
  await createLedger("Cash", "Cash-in-hand", false, false);
  // await createLedger("CONSUMER", "Sundry Debtors", false, false);
  await createLedger("Sale 5% Haryana B2C", "Sales Accounts", true, false);
  await createLedger("SALES B2B 5% HARYANA", "Sales Accounts", true, false);
  await createLedger("ROUND OFF", "Indirect Expenses", false, false);
  await sleep(500);

  console.log("\n=== STEP 2: Creating/Verifying Cost Centres ===");
  await createCostCentre("Room 20", "Rooms");
  await createCostCentre("Directors", "Walk-in Guest");
  await sleep(200);

  console.log("\n=== STEP 3: Creating/Verifying Stock Items ===");
  await createStockItem("Room No:-");
  await createStockItem("Lemon Water");
  await createStockItem("Tea");
  await createStockItem("Veg. Sandwich");
  await createStockItem("Staff Lemon");
  await createStockItem("Staff Tea");
  await sleep(300);

  console.log("\n=== STEP 4: Posting Stay Sales Invoice ===");
  const stay = {
    invoiceNo: "11927",
    guest: "TARUN GOYAL",
    date: "20260604",
    amount: 1100.00,
    room: "Room 20",
    revenueLedger: "Sale 5% Haryana B2C"
  };
  await postStaySalesInvoice(stay);
  await sleep(200);

  console.log("\n=== STEP 5: Posting Food Sales Invoices ===");
  const foodBills = [
    {
      billNo: "POS-16066",
      guest: "ENGLABS INDIA PVT LTD",
      date: "20260603",
      total: 20.00,
      costCategory: "Walk-in Guest",
      costCentre: "Directors",
      revenueLedger: "SALES B2B 5% HARYANA",
      items: [{ name: "Lemon Water", qty: 1, rate: 38.10, discount: 50 }]
    },
    {
      billNo: "POS-16067",
      guest: "Larissa Ma'am",
      date: "20260603",
      total: 105.00,
      costCategory: "Walk-in Guest",
      costCentre: "Directors",
      revenueLedger: "Sale 5% Haryana B2C",
      items: [
        { name: "Tea", qty: 3, rate: 38.10, discount: 50 },
        { name: "Veg. Sandwich", qty: 1, rate: 85.71, discount: 50 }
      ]
    },
    {
      billNo: "POS-16068",
      guest: "A&A STAFF",
      date: "20260603",
      total: 90.00,
      costCategory: "Walk-in Guest",
      costCentre: "Directors",
      revenueLedger: "Sale 5% Haryana B2C",
      items: [
        { name: "Staff Lemon", qty: 1, rate: 14.29 },
        { name: "Staff Tea", qty: 5, rate: 14.29 }
      ]
    }
  ];

  for (const fb of foodBills) {
    await postFoodSalesInvoice(fb);
    await sleep(200);
  }

  console.log("\n=== STEP 6: Posting Payment JV ===");
  const jv = {
    vchNo: "PAY-11927",
    date: "20260604",
    guest: "TARUN GOYAL",
    debits: [
      { ledger: "Cash", amt: 1000.00 },
      { ledger: "CONSUMER", amt: 100.00 }
    ],
    credit: 1100.00
  };
  await postPaymentJv(jv);

  console.log("\n=== Import Remaining June 3rd Vouchers Completed! ===");
}

run();
