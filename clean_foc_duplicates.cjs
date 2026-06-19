const http = require('http');

const TALLY_URL = "http://127.0.0.1:9000";
const companyName = "Hotel Sky 5 2026-27";

const toDelete = [
  { no: "POS-16023", date: "20260602" },
  { no: "POS-16023-CL", date: "20260602" },
  { no: "POS-16030", date: "20260602" },
  { no: "POS-16030-CL", date: "20260602" },
  { no: "POS-16052", date: "20260603" },
  { no: "POS-16052-CL", date: "20260603" }
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

async function run() {
  console.log("=== CLEANING FOC DUPLICATES ===");
  for (const item of toDelete) {
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
                    <VOUCHER DATE="${item.date}" TAGNAME="Voucher Number" TAGVALUE="${item.no}" VCHTYPE="Journal" ACTION="Delete">
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
    
    try {
      const res = await postTallyXml(xml);
      if (res.includes("<DELETED>")) {
        // Extract count deleted
        const match = res.match(/<DELETED>(\d+)<\/DELETED>/);
        const count = match ? match[1] : "some";
        console.log(`- Deleted ${count} entries for ${item.no} on ${item.date}`);
      } else {
        console.log(`- FAILED to delete ${item.no}: ${res.trim()}`);
      }
    } catch (e) {
      console.error(`- ERROR deleting ${item.no}:`, e.message);
    }
  }
  console.log("=== CLEANING COMPLETED ===");
}

run().catch(console.error);
