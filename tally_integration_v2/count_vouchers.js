const fs = require('fs');
const xml = fs.readFileSync('Final_Tally_Import_1_to_10_July.xml', 'utf8');
const lines = xml.split('\n');
const counts = {};
for (const line of lines) {
    if (line.includes('<VOUCHER REMOTEID=')) {
        const type = line.split('REMOTEID="')[1].split('-')[1];
        counts[type] = (counts[type] || 0) + 1;
    }
}
console.log(counts);
