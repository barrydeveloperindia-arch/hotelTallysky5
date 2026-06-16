const http = require('http');

const TALLY_URL = "http://localhost:9000";
const companyName = "Hotel Sky 5 2026-27";

const paymentJVs = [
  { vchNo: "PAY-11908", date: "20260601", guest: "ROBI STEPHAN SS", debits: [{ ledger: "Cash", amt: 1100.00 }], credit: 1100.00 },
  { vchNo: "PAY-11905", date: "20260601", guest: "JAGTAR", debits: [{ ledger: "CONSUMER", amt: 1500.00 }], credit: 1500.00 },
  { vchNo: "PAY-16028", date: "20260601", guest: "SHARAJ SINGH PADDA", debits: [{ ledger: "CONSUMER", amt: 60.00 }], credit: 60.00 }, // Food UPI payment
  { vchNo: "PAY-11911", date: "20260601", guest: "MAYANK SHRIVASTVA", debits: [{ ledger: "Cash", amt: 2600.00 }, { ledger: "CONSUMER", amt: 1530.00 }], credit: 4130.00 }, // Stays + Food UPI payment
  { vchNo: "PAY-11909", date: "20260601", guest: "HARDEEP SINGH", debits: [{ ledger: "CONSUMER", amt: 1700.00 }], credit: 1700.00 },
  { vchNo: "PAY-11912", date: "20260601", guest: "TARUN GOYAL", debits: [{ ledger: "CONSUMER", amt: 1100.00 }], credit: 1100.00 },
  { vchNo: "PAY-11906", date: "20260601", guest: "PARSHANT", debits: [{ ledger: "CONSUMER", amt: 2091.00 }], credit: 2091.00 }, // Stays (Card 1500) + Food (Card 591) payment
  { vchNo: "PAY-11910", date: "20260601", guest: "RAHUL PUROHIT", debits: [{ ledger: "CONSUMER", amt: 2000.00 }], credit: 2000.00 },
  { vchNo: "PAY-11913", date: "20260601", guest: "RAJEEV PARMAR", debits: [{ ledger: "CONSUMER", amt: 1200.00 }], credit: 1200.00 }
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
  console.log("\n=== Posting June 1st Guest Payment JVs ===");
  for (const jv of paymentJVs) {
    let ledgerEntriesXml = "";
    
    // Debits (By)
    jv.debits.forEach(d => {
      ledgerEntriesXml += `
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(d.ledger)}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${d.amt.toFixed(2)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>`;
    });
    
    // Credit (To)
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
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
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
        console.log(`  SUCCESS: Posted JV ${jv.vchNo} for ${jv.guest}. Amt: ${jv.credit}`);
      } else {
        console.log(`  FAILED: JV ${jv.vchNo} error: ${res.trim()}`);
      }
      await sleep(150);
    } catch (err) {
      console.error(`  ERROR posting JV ${jv.vchNo}: ${err.message}`);
    }
  }

  console.log("\nJune 1st Payment JVs Import Completed!");
}

run();
