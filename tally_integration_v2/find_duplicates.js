const fs = require('fs');
const xml = fs.readFileSync('Final_Tally_Import_1_to_10_July.xml', 'utf8');

const numbers = [];
let match;
const regex = /<VOUCHERTYPENAME>([^<]+)<\/VOUCHERTYPENAME>\s*<VOUCHERNUMBER>([^<]+)<\/VOUCHERNUMBER>/g;
while ((match = regex.exec(xml)) !== null) {
    numbers.push(`${match[1]} | ${match[2]}`);
}

const counts = {};
for (const n of numbers) {
    counts[n] = (counts[n] || 0) + 1;
}

let hasDups = false;
console.log('Duplicates:');
for (const [n, c] of Object.entries(counts)) {
    if (c > 1) {
        console.log(`${n} -> ${c} times`);
        hasDups = true;
    }
}

if (!hasDups) console.log('No duplicate voucher numbers found.');
