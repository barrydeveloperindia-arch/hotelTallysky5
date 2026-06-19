const http = require('http');

const TALLY_URL = "http://localhost:9000";
const companyName = "Hotel Sky 5 2026-27";

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
                <SVFROMDATE TYPE="Date">20260601</SVFROMDATE>
                <SVTODATE TYPE="Date">20260615</SVTODATE>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
            <TDL>
                <TDLMESSAGE>
                    <COLLECTION NAME="VoucherCollection" ISMODIFY="No">
                        <TYPE>Voucher</TYPE>
                        <FETCH>VoucherNumber</FETCH>
                    </COLLECTION>
                </TDLMESSAGE>
            </TDL>
        </DESC>
    </BODY>
</ENVELOPE>`;

const req = http.request(TALLY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml',
    'Content-Length': Buffer.byteLength(queryXml)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Raman stay (180962826-000299) in Tally:", data.includes('180962826-000299'));
    console.log("Raman payment (PAY-180962826-000299) in Tally:", data.includes('PAY-180962826-000299'));
    
    // Also let's print all vouchers starting with 180962826-000299 or PAY-180962826-000299 if found
    const regex = /<VOUCHERNUMBER>([^<]+)<\/VOUCHERNUMBER>/g;
    let match;
    const found = [];
    while ((match = regex.exec(data)) !== null) {
      if (match[1].includes('299')) {
        found.push(match[1].trim());
      }
    }
    console.log("Matching voucher numbers found containing '299':", found);
  });
});

req.on('error', (err) => console.error(err));
req.write(queryXml);
req.end();
