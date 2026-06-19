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

async function run() {
  const queryXml = `
<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>VoucherCollection</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES>
                <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                <SVFROMDATE TYPE="Date">20260605</SVFROMDATE>
                <SVTODATE TYPE="Date">20260614</SVTODATE>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
            <TDL>
                <TDLMESSAGE>
                    <COLLECTION NAME="VoucherCollection" ISMODIFY="No">
                        <TYPE>Voucher</TYPE>
                        <FETCH>Date, VoucherNumber, VoucherTypeName, Guid</FETCH>
                    </COLLECTION>
                </TDLMESSAGE>
            </TDL>
        </DESC>
    </BODY>
</ENVELOPE>`;

  console.log("Querying Tally Prime...");
  const data = await postTallyXml(queryXml);
  console.log("Response length from Tally:", data.length);
  
  const vouchers = [];
  const blocks = data.split(/<VOUCHER\b/i);
  console.log("Number of blocks found by split:", blocks.length);
  
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const guidMatch = block.match(/<GUID>([^<]+)<\/GUID>/i);
    const vchTypeMatch = block.match(/<VOUCHERTYPENAME>([^<]+)<\/VOUCHERTYPENAME>/i);
    const vchNoMatch = block.match(/<VOUCHERNUMBER>([^<]+)<\/VOUCHERNUMBER>/i);
    const dateMatch = block.match(/<DATE[^>]*>([^<]+)<\/DATE>/i);
    
    if (guidMatch && vchTypeMatch) {
      vouchers.push({
        guid: guidMatch[1].trim(),
        vchType: vchTypeMatch[1].trim(),
        vchNo: vchNoMatch ? vchNoMatch[1].trim() : 'Unknown',
        date: dateMatch ? dateMatch[1].trim() : 'Unknown'
      });
    }
  }
  
  console.log(`Parsed ${vouchers.length} vouchers.`);
  fs.writeFileSync("C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\vouchers_to_delete.json", JSON.stringify(vouchers, null, 2), "utf-8");
  console.log("Saved vouchers list to C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\vouchers_to_delete.json");

  if (vouchers.length === 0) {
    console.log("No vouchers to delete.");
    return;
  }
  
  console.log(`Starting deletion of ${vouchers.length} vouchers...`);
  let successCount = 0;
  for (let i = 0; i < vouchers.length; i++) {
    const v = vouchers[i];
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
                    <VOUCHER VCHTYPE="${v.vchType}" ACTION="Delete">
                        <GUID>${v.guid}</GUID>
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
        console.log(`  Failed to delete voucher ${v.vchNo} (${v.vchType}):`, res.trim());
      }
    } catch (err) {
      console.error(`  Error deleting ${v.vchNo}:`, err.message);
    }
    await new Promise(r => setTimeout(r, 10));
  }
  console.log(`\n=== Deleted ${successCount} vouchers out of ${vouchers.length} successfully. ===`);
}

run().catch(console.error);
