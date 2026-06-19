/**
 * Tally Prime Voucher Deletion Utility
 * 
 * Usage:
 *   node delete_voucher.cjs <VoucherNumber> <VoucherType> <DateYYYYMMDD>
 * 
 * Example:
 *   node delete_voucher.cjs 180962826-000299 Sales 20260613
 *   node delete_voucher.cjs PAY-180962826-000299 Journal 20260613
 */

const http = require('http');

const TALLY_URL = "http://localhost:9000";
const companyName = "Hotel Sky 5 2026-27";

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log("Error: Missing arguments.");
  console.log("Usage: node delete_voucher.cjs <VoucherNumber> <VoucherType> <DateYYYYMMDD>");
  process.exit(1);
}

const [vchNo, vchType, date] = args;

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
  console.log(`Attempting to delete voucher:`);
  console.log(`  Voucher Number: ${vchNo}`);
  console.log(`  Voucher Type:   ${vchType}`);
  console.log(`  Voucher Date:   ${date}`);
  console.log(`  Company Name:   ${companyName}\n`);

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
                    <VOUCHER DATE="${date}" TAGNAME="Voucher Number" TAGVALUE="${vchNo}" VCHTYPE="${vchType}" ACTION="Delete">
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

  try {
    const res = await postTallyXml(xml);
    if (res.includes("<DELETED>1</DELETED>")) {
      console.log(`SUCCESS: Voucher ${vchNo} deleted successfully.`);
    } else {
      console.log(`FAILED to delete voucher.`);
      console.log(`Response from Tally:\n`, res.trim());
    }
  } catch (err) {
    console.error(`ERROR communicating with Tally:`, err.message);
  }
}

run();
