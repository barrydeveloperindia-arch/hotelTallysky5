const fs = require('fs');
const content = fs.readFileSync('tally_imp_copy.txt', 'utf16le');
const lines = content.split('\n');
console.log(`Total lines: ${lines.length}`);
for (let i = Math.max(0, lines.length - 200); i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('Voucher') || line.includes('VOUCHER') || line.includes('Error') || line.includes('Exception')) {
        console.log(`[${i}] ${line}`);
    }
}
