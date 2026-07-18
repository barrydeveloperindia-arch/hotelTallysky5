const fs = require('fs');
const content = fs.readFileSync('tally_imp_copy.txt', 'utf16le');
const lines = content.split('\n');

const startIndex = Math.max(0, lines.length - 5000); // Only the latest import attempts

const errors = new Set();
for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail') || line.toLowerCase().includes('not exist') || line.toLowerCase().includes('invalid')) {
        if (!line.startsWith('Errors') && !line.startsWith('<ERROR>0</ERROR>') && !line.startsWith('ERROR: Voucher')) {
            errors.add(line);
        }
    }
}
console.log('Recent Error Messages in Tally.imp (Last 5000 lines):');
for (const err of errors) {
    if (err.length < 500) {
        console.log(err);
    }
}
