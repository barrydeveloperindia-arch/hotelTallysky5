const fs = require('fs');

// Read tally.imp (it's UTF-16LE, Node can read it as 'utf16le')
const logContent = fs.readFileSync('D:\\TallyPrime\\tally.imp', 'utf16le');

// Split by lines
const lines = logContent.split('\n');

// Find the last "Importing Data through SOAP Request"
let lastImportIndex = 0;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('Importing Data through SOAP Request')) {
        lastImportIndex = i;
        break;
    }
}

console.log("Analyzing import starting from line: " + lastImportIndex);

let exceptions = [];
for (let i = lastImportIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('ERROR: Voucher:') || line.includes('does not exist') || line.includes('Voucher Number')) {
        // Look at the previous line for the actual error message
        const prevLine = i > 0 ? lines[i-1].trim() : '';
        exceptions.push({ error: prevLine, voucher: line });
    }
}

console.log(`Found ${exceptions.length} exceptions in the last import:`);
for (let i = 0; i < Math.min(20, exceptions.length); i++) {
    console.log(exceptions[i].error);
    console.log(exceptions[i].voucher);
}
if (exceptions.length > 20) {
    console.log(`... and ${exceptions.length - 20} more.`);
}
