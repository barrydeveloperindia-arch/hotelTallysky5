const fs = require('fs');
const content = fs.readFileSync('D:\\TallyPrime\\Tally.imp', 'utf16le');
const lines = content.split('\n');
const recent = lines.slice(-200);
console.log(recent.join('\n'));
