const fs = require('fs');
let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

const oldFunc = `function getSalesLedger(hasGst, isEnglabs) {
    if (isEnglabs) return 'Sales A/c  B2B ENGLABS';
    return hasGst ? 'Sales A/c B2B' : 'Sales A/c B2C';
}`;

const newFunc = `function getSalesLedger(hasGst, isEnglabs, isFood = false) {
    if (isEnglabs) return 'Sales A/c  B2B ENGLABS'; // Doesn't exist, but maybe they auto-create it or it falls back
    return isFood ? 'Food & Beverage Sales' : 'Room Sales';
}`;

content = content.replace(oldFunc, newFunc);
content = content.replace('getSalesLedger(!!sale.gstNo, (sale.guestName || \'\').toUpperCase().includes(\'ENGLABS\'))', 'getSalesLedger(!!sale.gstNo, (sale.guestName || \'\').toUpperCase().includes(\'ENGLABS\'), false)');
content = content.replace('getSalesLedger(!!sale.gstNo, isEnglabs)', 'getSalesLedger(!!sale.gstNo, isEnglabs, true)');

fs.writeFileSync('generate_tally_xml.js', content);
console.log('Fixed Sales Ledger mapping to use Room Sales and Food & Beverage Sales');
