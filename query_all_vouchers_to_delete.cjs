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
    // Parse the XML data manually or look for tag matches
    const vouchers = [];
    const voucherBlocks = data.split(/<VOUCHER\b/);
    // The first split part is the header, skip it
    for (let i = 1; i < voucherBlocks.length; i++) {
      const block = voucherBlocks[i];
      const dateMatch = block.match(/<DATE>([^<]+)<\/DATE>/);
      const vchNoMatch = block.match(/<VOUCHERNUMBER>([^<]+)<\/VOUCHERNUMBER>/);
      const vchTypeMatch = block.match(/<VOUCHERTYPENAME>([^<]+)<\/VOUCHERTYPENAME>/);
      const guidMatch = block.match(/<GUID>([^<]+)<\/GUID>/);
      
      if (vchNoMatch) {
        vouchers.push({
          date: dateMatch ? dateMatch[1].trim() : '',
          vchNo: vchNoMatch[1].trim(),
          vchType: vchTypeMatch ? vchTypeMatch[1].trim() : '',
          guid: guidMatch ? guidMatch[1].trim() : ''
        });
      }
    }
    
    console.log(`Found ${vouchers.length} vouchers in date range 2026-06-05 to 2026-06-14.`);
    console.log(JSON.stringify(vouchers, null, 2));
  });
});

req.on('error', (err) => console.error(err));
req.write(queryXml);
req.end();
