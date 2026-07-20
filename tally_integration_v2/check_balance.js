const fs = require('fs');
const xml = fs.readFileSync('Final_Tally_Import_1_to_10_July.xml', 'utf8');
const vouchers = xml.split('<VOUCHER ').slice(1);
let errorCount = 0;
for (const v of vouchers) {
    if (!v.includes('VCHTYPE="Sales"')) continue;
    
    let debit = 0;
    let credit = 0;
    
    const isDeemedPosMatches = [...v.matchAll(/<ISDEEMEDPOSITIVE>(Yes|No)<\/ISDEEMEDPOSITIVE>\s*<AMOUNT>([-0-9.]+)<\/AMOUNT>/g)];
    
    for (const match of isDeemedPosMatches) {
        const isDeemedPos = match[1];
        const amount = parseFloat(match[2]);
        
        if (isDeemedPos === 'Yes') {
            debit += Math.abs(amount);
        } else {
            credit += Math.abs(amount);
        }
    }
    
    debit = Math.round(debit * 100) / 100;
    credit = Math.round(credit * 100) / 100;
    
    if (debit !== credit) {
        const id = v.match(/VOUCHERNUMBER>([^<]+)/)[1];
        console.log(`Mismatch in ${id}: Debit=${debit}, Credit=${credit}`);
        errorCount++;
    }
}
console.log(`Done checking balances. Found ${errorCount} mismatches.`);
