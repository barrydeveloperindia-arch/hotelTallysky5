const http = require('http');

const TALLY_URL = "http://127.0.0.1:9000";
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

async function run() {
  console.log("=== Posting Stay Invoice 180962826-000243 (Varun) ===");

  const invoiceNo = "180962826-000243";
  const date = "20260604"; // 4th June as specified by the user
  const guest = "VARUN";
  const partyLedger = "TREEBO HOTELS"; // B2B stay
  const revenueLedger = "SALES B2B 5% HARYANA";
  const amount = 23421.45;
  const basic = 22306.05;
  const cgst = 557.70;
  const sgst = 557.70;
  const rooms = ["Room 02", "Room 03", "Room 06"];

  // Cost Centre Allocation Xml
  let roomsAllocXml = "";
  const splitBasic = parseFloat((basic / rooms.length).toFixed(2));
  let runningSum = 0;
  
  const allocs = rooms.map((room, idx) => {
    let amt = splitBasic;
    if (idx === rooms.length - 1) {
      amt = parseFloat((basic - runningSum).toFixed(2));
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

  const escapedParty = escapeXml(partyLedger);
  const escapedRevenue = escapeXml(revenueLedger);

  const stayXml = `
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
                        <DATE>${date}</DATE>
                        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(invoiceNo)}</VOUCHERNUMBER>
                        <PARTYLEDGERNAME>${escapedParty}</PARTYLEDGERNAME>
                        <PLACEOFSUPPLY>Haryana</PLACEOFSUPPLY>
                        <EFFECTIVEDATE>${date}</EFFECTIVEDATE>
                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapedParty}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                        <ALLINVENTORYENTRIES.LIST>
                            <STOCKITEMNAME>Room No:-</STOCKITEMNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <RATE>${basic.toFixed(2)}</RATE>
                            <AMOUNT>${basic.toFixed(2)}</AMOUNT>
                            <ACTUALQTY>1</ACTUALQTY>
                            <BILLEDQTY>1</BILLEDQTY>
                            <ACCOUNTINGALLOCATIONS.LIST>
                                <LEDGERNAME>${escapedRevenue}</LEDGERNAME>
                                <AMOUNT>${basic.toFixed(2)}</AMOUNT>
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
    const res = await postTallyXml(stayXml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`SUCCESS: Stay Invoice ${invoiceNo} posted.`);
    } else {
      console.log(`FAILED: Stay Invoice ${invoiceNo} error: ${res.trim()}`);
      return;
    }
  } catch (err) {
    console.error("Error posting stay invoice:", err.message);
    return;
  }

  console.log("\n=== Posting Payment JV PAY-180962826-000243 ===");
  const payVchNo = "PAY-180962826-000243";
  const payXml = `
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
                        <DATE>${date}</DATE>
                        <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${payVchNo}</VOUCHERNUMBER>
                        <REFERENCE>${payVchNo}</REFERENCE>
                        <EFFECTIVEDATE>${date}</EFFECTIVEDATE>
                        <NARRATION>Paid Online - Treebo Paid</NARRATION>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Treebo Paid</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapedParty}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>${amount.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

  try {
    const res = await postTallyXml(payXml);
    if (res.includes("<CREATED>1</CREATED>")) {
      console.log(`SUCCESS: Payment JV ${payVchNo} posted.`);
    } else {
      console.log(`FAILED: Payment JV ${payVchNo} error: ${res.trim()}`);
    }
  } catch (err) {
    console.error("Error posting payment JV:", err.message);
  }
}

run();
