const fs = require('fs');
const content = fs.readFileSync('tally_imp_copy.txt', 'utf16le');
const lines = content.split('\n');

const errors = new Set();
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail') || line.toLowerCase().includes('not exist') || line.toLowerCase().includes('invalid')) {
        if (!line.startsWith('Errors') && !line.startsWith('<ERROR>0</ERROR>') && !line.startsWith('ERROR: Voucher')) {
            errors.add(line);
        }
    }
}
console.log('Other Error Messages in Tally.imp:');
for (const err of errors) {
    if (err.length < 500) {
        console.log(err);
    }
}
