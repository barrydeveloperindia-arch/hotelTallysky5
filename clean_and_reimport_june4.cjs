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

// Stays to re-import
const staysToImport = [
  { invoiceNo: "11938", guest: "DILBAG SINGH", date: "20260605", amount: 3600.00, rooms: ["Room 10"], partyLedger: "DILBAG SINGH", revenueLedger: "Sale 5% Haryana B2C" },
  { invoiceNo: "180962826-000244", guest: "NISHKANT SHARMA", date: "20260605", amount: 1976.65, rooms: ["Room 01"], partyLedger: "NISHKANT SHARMA", revenueLedger: "Sale 5% Haryana B2C" }
];

// FOC Complementary JVs to re-import with correct amounts
const complementaryBills = [
  { billNo: "POS-16023", guest: "VARUN", date: "20260602", amount: 267.00, room: "Room 06", items: [{ name: "Mix Vegetable", qty: 1, rate: 190.48, amt: 190.48 }, { name: "Tawa Roti", qty: 4, rate: 19.05, amt: 76.20 }] },
  { billNo: "POS-16030", guest: "VARUN", date: "20260602", amount: 124.00, room: "Room 06", items: [{ name: "Tea", qty: 1, rate: 38.10, amt: 38.10 }, { name: "Veg. Sandwich", qty: 1, rate: 85.71, amt: 85.71 }] },
  { billNo: "POS-16052", guest: "VARUN", date: "20260603", amount: 74.00, room: "Room 02", items: [{ name: "Masala Omelette", qty: 1, rate: 74.04, amt: 74.04 }] }
];

// Payments to re-import
const paymentJVs = [
  { vchNo: "PAY-DILBAG-ADV", date: "20260603", guest: "DILBAG SINGH", debits: [{ ledger: "Cash", amt: 3600.00 }], credit: 3600.00, narration: "Paid Cash" },
  { vchNo: "PAY-180962826-000244", date: "20260605", guest: "NISHKANT SHARMA", debits: [{ ledger: "Treebo Paid", amt: 1976.65 }], credit: 1976.65, narration: "Paid Online - Contact: +912067137555" }
];

async function run() {
  console.log("\n=== STEP 1: Deleting Short-numbered and Wrong Vouchers ===");
  await deleteVoucher("244", "Sales");
  await deleteVoucher("PAY-244", "Journal");
  
  // Deleting wrong FOC vouchers to recreate them accurately
  await deleteVoucher("POS-16023", "Journal");
  await deleteVoucher("POS-16023-CL", "Journal");
  await deleteVoucher("POS-16030", "Journal");
  await deleteVoucher("POS-16030-CL", "Journal");
  await deleteVoucher("POS-16052", "Journal");
  await deleteVoucher("POS-16052-CL", "Journal");
  
  await sleep(1000);

  console.log("\n=== STEP 2: Re-posting Corrected Stay Invoice (Full Number) ===");
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

  console.log("\n=== STEP 3: Re-posting Corrected FOC Complementary JVs (Consumption & Clearing) ===");
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

  console.log("\n=== STEP 4: Re-posting Corrected Payment JV (Full Number) ===");
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

  console.log("\n=== Correction and Re-import Completed ===");
}

run();
