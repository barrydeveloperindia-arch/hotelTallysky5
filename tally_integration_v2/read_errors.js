const fs = require('fs');
const content = fs.readFileSync('D:\\TallyPrime\\Tally.imp', 'utf16le');
const lines = content.split('\n');
for (const line of lines) {
    if (line.toLowerCase().includes('failed') || line.toLowerCase().includes('error') || line.toLowerCase().includes('exception') || line.toLowerCase().includes('mismatch')) {
        console.log(line);
    }
}
