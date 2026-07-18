const fs = require('fs');
let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

const oldFunc = `function getSalesLedger(hasGst, isEnglabs, isFood = false) {
    if (isEnglabs) return 'Sales A/c  B2B ENGLABS'; // Doesn't exist, but maybe they auto-create it or it falls back
    return isFood ? 'Food & Beverage Sales' : 'Room Sales';
}`;

const newFunc = `function getSalesLedger(hasGst, isEnglabs, isFood = false) {
    return isFood ? 'Food & Beverage Sales' : 'Room Sales';
}`;

content = content.replace(oldFunc, newFunc);
fs.writeFileSync('generate_tally_xml.js', content);
console.log('Removed invalid ENGLABS sales ledger');
