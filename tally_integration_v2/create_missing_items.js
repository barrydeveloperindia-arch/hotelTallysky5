const fs = require('fs');
const auditor = require('./skill_tally_auditor.js');

const salesData = JSON.parse(fs.readFileSync('final_reconciled_sales.json'));
let missingItems = new Set();

// Manually find all missing items
const tallyData = fs.readFileSync('../tally_masters.xml', 'utf8');
const itemsMatch = tallyData.match(/<NAME[^>]*>([^<]+)<\/NAME>/g);
const tallyItems = new Set();
if (itemsMatch) {
    itemsMatch.forEach(m => tallyItems.add(m.replace(/<[^>]+>/g, '').toLowerCase().trim()));
}

for (const bill of salesData) {
    if (bill.type === 'food' && bill.items) {
        for (const item of bill.items) {
            const name = item.name.trim();
            if (!name.toLowerCase().includes('discount') && !tallyItems.has(name.toLowerCase())) {
                missingItems.add(name);
            }
        }
    }
}

console.log(`Found ${missingItems.size} missing items.`);

if (missingItems.size > 0) {
    let xml = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC><REQUESTDATA>`;
    for (const item of missingItems) {
        xml += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <STOCKITEM NAME="${item.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" ACTION="Create">
                <NAME.LIST><NAME>${item.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</NAME></NAME.LIST>
                <BASEUNITS>Nos</BASEUNITS>
            </STOCKITEM>
        </TALLYMESSAGE>`;
    }
    xml += `</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
    fs.writeFileSync('Create_Missing_Items.xml', xml);
    console.log('Generated Create_Missing_Items.xml');
}
