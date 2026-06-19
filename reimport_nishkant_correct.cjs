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

async function deleteVoucher(vchNo, vchType) {
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
                <TALLYMESSAGE>
                    <VOUCHER VCHTYPE="${vchType}" ACTION="Delete">
                        <VOUCHERNUMBER>${escapeXml(vchNo)}</VOUCHERNUMBER>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
  try {
    const res = await postTallyXml(xml);
    if (res.includes("<DELETED>1</DELETED>") || res.includes("<ERRORS>0</ERRORS>")) {
      console.log(`  SUCCESS: Deleted voucher ${vchNo} (${vchType})`);
    } else {
      console.log(`  INFO/FAILED: Delete result for ${vchNo} (${vchType}): ${res.trim()}`);
    }
  } catch (err) {
    console.error(`  ERROR deleting voucher ${vchNo}:`, err.message);
  }
}

// Correct Stay definition
const s = { 
  invoiceNo: "180962826-000244", 
  guest: "NISHKANT SHARMA", 
  date: "20260605", 
  amount: 1976.00, 
  rooms: ["Room 01"], 
  partyLedger: "NISHKANT SHARMA", 
  revenueLedger: "Sale 5% Haryana B2C" 
};

// Correct Food Bill definition
const fb = { 
  billNo: "POS-16084", 
  guest: "NISHKANT SHARMA", 
  date: "20260604", 
  total: 30.00, 
  rooms: ["Room 01"], 
  partyLedger: "NISHKANT SHARMA", 
  items: [{ name: "Mineral Water", qty: 1, rate: 28.57, amt: 28.57 }], 
  revenueLedger: "Sale 5% Haryana B2C" 
};

// Correct Payment JVs
const payments = [
  { vchNo: "PAY-180962826-000244", date: "20260605", guest: "NISHKANT SHARMA", debits: [{ ledger: "Treebo Paid", amt: 1976.00 }], credit: 1976.00, narration: "Paid Online - Contact: +912067137555" },
  { vchNo: "PAY-16084", date: "20260604", guest: "NISHKANT SHARMA", debits: [{ ledger: "CONSUMER", amt: 30.00 }], credit: 30.00, narration: "Paid Credit Card - Contact: +912067137555" }
];

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

async function run() {
  console.log("\n=== STEP 0: Ensuring NISHKANT SHARMA Ledger Exists ===");
  await createLedger("NISHKANT SHARMA", "Hotel Guests - Direct", false, false);
  await sleep(100);

  console.log("\n=== STEP 1: Deleting Incorrect Nishkant Sharma Vouchers ===");
  await deleteVoucher("180962826-000244", "Sales");
  await deleteVoucher("PAY-180962826-000244", "Journal");
  await deleteVoucher("POS-16084", "Sales");
  await deleteVoucher("PAY-16084", "Journal");
  
  await sleep(1000);

  console.log("\n=== STEP 2: Re-posting Corrected Stay Invoice (Guest name + B2C) ===");
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
  
  const xmlStay = `
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
    const res = await postTallyXml(xmlStay);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`  SUCCESS: Stay Invoice ${s.invoiceNo} (${s.guest}) posted as B2C. Amt: ${s.amount}`);
    } else {
      console.log(`  FAILED: Stay Invoice ${s.invoiceNo} error: ${res.trim()}`);
    }
  } catch (err) {
    console.error(`  ERROR posting stay invoice ${s.invoiceNo}: ${err.message}`);
  }

  console.log("\n=== STEP 3: Re-posting Corrected Food Bill (Guest name + B2C) ===");
  const cgstFood = parseFloat(((fb.total / 1.05) * 0.025).toFixed(2));
  const sgstFood = cgstFood;
  const itemsTaxableSum = fb.items.reduce((sum, i) => sum + i.amt, 0);
  const expectedTotal = itemsTaxableSum + cgstFood + sgstFood;
  const roundOff = parseFloat((fb.total - expectedTotal).toFixed(2));

  let itemXml = "";
  fb.items.forEach(i => {
    let costCentreXml = `
                            <CATEGORYALLOCATIONS.LIST>
                                <CATEGORY>Rooms</CATEGORY>
                                <COSTCENTREALLOCATIONS.LIST>
                                    <NAME>${escapeXml(fb.rooms[0])}</NAME>
                                    <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                                </COSTCENTREALLOCATIONS.LIST>
                            </CATEGORYALLOCATIONS.LIST>`;

    itemXml += `
                      <ALLINVENTORYENTRIES.LIST>
                          <STOCKITEMNAME>${escapeXml(i.name)}</STOCKITEMNAME>
                          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                          <RATE>${i.rate.toFixed(2)}</RATE>
                          <AMOUNT>${i.amt.toFixed(2)}</AMOUNT>
                          <ACTUALQTY>${i.qty}</ACTUALQTY>
                          <BILLEDQTY>${i.qty}</BILLEDQTY>
                          <ACCOUNTINGALLOCATIONS.LIST>
                              <LEDGERNAME>${escapeXml(fb.revenueLedger)}</LEDGERNAME>
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

  const xmlFood = `
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
                          <AMOUNT>${cgstFood.toFixed(2)}</AMOUNT>
                      </LEDGERENTRIES.LIST>
                      <LEDGERENTRIES.LIST>
                          <LEDGERNAME>Output Sgst 2.5%</LEDGERNAME>
                          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                          <AMOUNT>${sgstFood.toFixed(2)}</AMOUNT>
                      </LEDGERENTRIES.LIST>
                      ${roundOffXml}
                  </VOUCHER>
              </TALLYMESSAGE>
          </REQUESTDATA>
      </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  try {
    const res = await postTallyXml(xmlFood);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`  SUCCESS: Food Invoice ${fb.billNo} (${fb.guest}) posted as B2C. Amt: ${fb.total}`);
    } else {
      console.log(`  FAILED: Food Invoice ${fb.billNo} error: ${res.trim()}`);
    }
  } catch (err) {
    console.error(`  ERROR posting food invoice ${fb.billNo}: ${err.message}`);
  }

  console.log("\n=== STEP 4: Re-posting Corrected Payment JVs ===");
  for (const jv of payments) {
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
                            <LEDGERNAME>${escapedParty}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${jv.credit.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;

    const escapedNarration = escapeXml(jv.narration);
    const xmlPay = `
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
      const res = await postTallyXml(xmlPay);
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

  console.log("\n=== Nishkant Sharma Stay & Food Correction Completed ===");
}

run();
