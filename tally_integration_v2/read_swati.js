const fs = require('fs');
const xml = fs.readFileSync('../tally_masters.xml', 'utf8');
const match = xml.match(/<LEDGER NAME="SWATI"[^>]*>([\s\S]*?)<\/LEDGER>/i);
if (match) {
    console.log(match[0]);
} else {
    console.log("Not found");
}
