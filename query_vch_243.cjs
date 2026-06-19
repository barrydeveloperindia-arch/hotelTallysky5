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

async function run() {
  const queryXml = `
<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>DetailedVouchers</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES>
                <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                <SVFROMDATE TYPE="Date">20260601</SVFROMDATE>
                <SVTODATE TYPE="Date">20260610</SVTODATE>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
            <TDL>
                <TDLMESSAGE>
                    <COLLECTION NAME="DetailedVouchers" ISMODIFY="No">
                        <TYPE>Voucher</TYPE>
                        <FETCH>Date, VoucherTypeName, VoucherNumber, PartyLedgerName, Narration, Amount, LedgerEntries, AllLedgerEntries</FETCH>
                    </COLLECTION>
                </TDLMESSAGE>
            </TDL>
        </DESC>
    </BODY>
</ENVELOPE>`;

  try {
    const res = await postTallyXml(queryXml);
    const voucherRegex = /<VOUCHER\b[^>]*>([\s\S]*?)<\/VOUCHER>/g;
    let match;
    let found = false;
    console.log("=== SEARCHING VOUCHERS IN TALLY ===");
    while ((match = voucherRegex.exec(res)) !== null) {
      const vContent = match[1];
      const num = (vContent.match(/<VOUCHERNUMBER>([^<]+)<\/VOUCHERNUMBER>/) || [])[1] || "";
      if (num.includes("243")) {
        found = true;
        const date = (vContent.match(/<DATE>([^<]+)<\/DATE>/) || [])[1] || "";
        const type = (vContent.match(/<VOUCHERTYPENAME>([^<]+)<\/VOUCHERTYPENAME>/) || [])[1] || "";
        const party = (vContent.match(/<PARTYLEDGERNAME>([^<]+)<\/PARTYLEDGERNAME>/) || [])[1] || "";
        const narration = (vContent.match(/<NARRATION>([^<]+)<\/NARRATION>/) || [])[1] || "";
        
        const entries = [];
        const entryRegex = /<(?:LEDGERENTRIES|ALLLEDGERENTRIES)\.LIST>([\s\S]*?)<\/(?:LEDGERENTRIES|ALLLEDGERENTRIES)\.LIST>/g;
        let eMatch;
        while ((eMatch = entryRegex.exec(vContent)) !== null) {
          const eContent = eMatch[1];
          const ledgerName = (eContent.match(/<LEDGERNAME>([^<]+)<\/LEDGERNAME>/) || [])[1] || "";
          const amount = (eContent.match(/<AMOUNT>([^<]+)<\/AMOUNT>/) || [])[1] || "";
          entries.push({ ledgerName, amount });
        }

        console.log(`\nDate: ${date} | Type: ${type} | No: ${num} | Party: ${party}`);
        if (narration) console.log(`  Narration: ${narration}`);
        console.log("  Entries:");
        entries.forEach(e => {
          console.log(`    - ${e.ledgerName}: ${e.amount}`);
        });
      }
    }
    if (!found) {
      console.log("No voucher matching '243' found in Tally.");
    }
  } catch (err) {
    console.error("Error executing query:", err);
  }
}

run();
