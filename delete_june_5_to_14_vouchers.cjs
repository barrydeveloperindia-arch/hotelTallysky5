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

async function queryAllVouchers() {
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

  const data = await postTallyXml(queryXml);
  const vouchers = [];
  
  // Extract vouchers by splitting on <VOUCHER> or <VOUCHER REMOTEID=...>
  const blocks = data.split(/<VOUCHER/gi);
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
  return vouchers;
}

async function deleteVoucherByGuid(guid, vchType, vchNo) {
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
                    <VOUCHER VCHTYPE="${vchType}" ACTION="Delete">
                        <GUID>${guid}</GUID>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
  
  const res = await postTallyXml(xml);
  if (res.includes("<DELETED>1</DELETED>")) {
    console.log(`  [DELETED] Number: ${vchNo} | Type: ${vchType} | GUID: ${guid}`);
    return true;
  } else {
    console.log(`  [FAILED] Number: ${vchNo} | Type: ${vchType} | GUID: ${guid}`);
    console.log("  Tally Response:", res.trim());
    return false;
  }
}

async function run() {
  console.log("=== Querying vouchers in date range June 5th to June 14th ===");
  const vouchers = await queryAllVouchers();
  console.log(`Found ${vouchers.length} vouchers to delete.`);
  
  if (vouchers.length === 0) {
    console.log("No vouchers found to delete.");
    return;
  }
  
  console.log("\n=== Deleting vouchers ===");
  let successCount = 0;
  for (const v of vouchers) {
    const success = await deleteVoucherByGuid(v.guid, v.vchType, v.vchNo);
    if (success) successCount++;
    // Small sleep to not overwhelm Tally
    await new Promise(r => setTimeout(r, 10));
  }
  
  console.log(`\n=== Deletion complete. Successfully deleted ${successCount}/${vouchers.length} vouchers. ===`);
}

run().catch(console.error);
