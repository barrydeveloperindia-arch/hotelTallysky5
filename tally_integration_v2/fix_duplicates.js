const fs = require('fs');
let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

// We will inject a global tracking mechanism at the top of generateXML
const topInjection = `
    const usedVoucherNumbers = new Set();
    function getUniqueVoucherNumber(base) {
        let vch = base;
        let suffix = 1;
        while (usedVoucherNumbers.has(vch)) {
            vch = base + '-' + suffix;
            suffix++;
        }
        usedVoucherNumbers.add(vch);
        return vch;
    }
`;

content = content.replace('// 1. Create missing ledgers', topInjection + '\n    // 1. Create missing ledgers');

// Now replace <VOUCHERNUMBER>${escapeXml(billRef)}</VOUCHERNUMBER> with getUniqueVoucherNumber
content = content.replace(/<VOUCHERNUMBER>\$\{escapeXml\(billRef\)\}<\/VOUCHERNUMBER>/g, '<VOUCHERNUMBER>${getUniqueVoucherNumber(escapeXml(billRef))}</VOUCHERNUMBER>');

// Now replace Payment Journal voucher numbers
content = content.replace(/<VOUCHERNUMBER>PAY-\$\{escapeXml\(billRef\)\}<\/VOUCHERNUMBER>/g, '<VOUCHERNUMBER>${getUniqueVoucherNumber("PAY-" + escapeXml(pay.mode).replace(/\\s+/g, "") + "-" + escapeXml(billRef))}</VOUCHERNUMBER>');

fs.writeFileSync('generate_tally_xml.js', content);
console.log('Fixed duplicate voucher numbers.');
