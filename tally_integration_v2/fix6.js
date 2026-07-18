const fs = require('fs');
let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

const missingFunc = `
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

content = content.replace("function buildNewGuestLedgers(missingGuests, b2bMapping) {", missingFunc + "\nfunction buildNewGuestLedgers(missingGuests, b2bMapping) {");
fs.writeFileSync('generate_tally_xml.js', content);
console.log('Restored getUniqueVoucherNumber');
