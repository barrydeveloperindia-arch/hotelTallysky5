const http = require('http');
const fs = require('fs');

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

async function run() {
  const vouchersFilePath = "C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\vouchers_to_delete.json";
  if (!fs.existsSync(vouchersFilePath)) {
    console.log("Vouchers list file not found.");
    return;
  }
  
  const vouchers = JSON.parse(fs.readFileSync(vouchersFilePath, "utf-8"));
  console.log(`Loaded ${vouchers.length} vouchers to delete.`);

  if (vouchers.length === 0) {
    console.log("No vouchers to delete.");
    return;
  }

  console.log(`Starting correct deletion of ${vouchers.length} vouchers...`);
  let successCount = 0;
  
  for (let i = 0; i < vouchers.length; i++) {
    const v = vouchers[i];
    
    // Skip invalid entries or placeholders if any
    if (!v.date || v.date === 'Unknown' || !v.vchNo || v.vchNo === 'Unknown') {
      console.log(`  Skipping invalid entry: Number: ${v.vchNo} | Date: ${v.date}`);
      continue;
    }

    const escapedVchNo = escapeXml(v.vchNo);
    const escapedVchType = escapeXml(v.vchType);

    const deleteXml = `
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
                    <VOUCHER DATE="${v.date}" TAGNAME="Voucher Number" TAGVALUE="${escapedVchNo}" VCHTYPE="${escapedVchType}" ACTION="Delete">
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

    try {
      const res = await postTallyXml(deleteXml);
      if (res.includes("<DELETED>1</DELETED>")) {
        successCount++;
        if (i % 20 === 0 || i === vouchers.length - 1) {
          console.log(`  Progress: Deleted ${successCount}/${vouchers.length} vouchers.`);
        }
      } else {
        console.log(`  Failed to delete voucher ${v.vchNo} (${v.vchType}) dated ${v.date}:`, res.trim());
      }
    } catch (err) {
      console.error(`  Error deleting ${v.vchNo}:`, err.message);
    }
    // Small sleep to prevent rate limiting/blocking in Tally Prime
    await new Promise(r => setTimeout(r, 15));
  }
  
  console.log(`\n=== Correct Deletion Complete. Successfully deleted ${successCount}/${vouchers.length} vouchers. ===`);
}

run().catch(console.error);
