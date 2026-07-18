const http = require('http');
const fs = require('fs');

async function fetchFromTally(xmlReq) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 9000,
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(xmlReq)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write(xmlReq);
        req.end();
    });
}

async function run() {
    try {
        console.log("Fetching Ledgers...");
        const ledgersXml = await fetchFromTally(`<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Accounts</REPORTNAME><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT><ACCOUNTTYPE>Ledgers</ACCOUNTTYPE></STATICVARIABLES></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`);
        
        console.log("Fetching Stock Items...");
        const itemsXml = await fetchFromTally(`<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Accounts</REPORTNAME><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT><ACCOUNTTYPE>Stock Items</ACCOUNTTYPE></STATICVARIABLES></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`);
        
        // Combine them into a single dummy root just for the auditor to parse using regex
        const combined = `<TALLY_MASTERS>\n${ledgersXml}\n${itemsXml}\n</TALLY_MASTERS>`;
        fs.writeFileSync('C:/Users/Administrator/OneDrive/MANGEMENT FILE/Documents/Antigravity/Hotel/tally_masters.xml', combined);
        console.log("Successfully saved tally_masters.xml");
    } catch (e) {
        console.error(e);
    }
}

run();
