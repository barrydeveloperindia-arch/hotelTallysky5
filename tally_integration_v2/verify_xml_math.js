const fs = require('fs');

const xml = fs.readFileSync('Final_Tally_Import_1_to_10_July.xml', 'utf8');

const vouchers = xml.match(/<VOUCHER [^>]+>[\s\S]*?<\/VOUCHER>/g) || [];

let mismatchCount = 0;

for (const voucher of vouchers) {
    const remoteIdMatch = voucher.match(/REMOTEID="([^"]+)"/);
    const remoteId = remoteIdMatch ? remoteIdMatch[1] : 'UNKNOWN';
    
    // Find all AMOUNT tags inside ALLLEDGERENTRIES.LIST
    let totalDebit = 0;
    let totalCredit = 0;
    
    const ledgerEntries = voucher.match(/<ALLLEDGERENTRIES\.LIST>[\s\S]*?<\/ALLLEDGERENTRIES\.LIST>/g) || [];
    for (const entry of ledgerEntries) {
        const amountMatch = entry.match(/<AMOUNT>([^<]+)<\/AMOUNT>/);
        const isDeemedMatch = entry.match(/<ISDEEMEDPOSITIVE>([^<]+)<\/ISDEEMEDPOSITIVE>/);
        if (amountMatch && isDeemedMatch) {
            const amount = parseFloat(amountMatch[1]);
            const isDebit = isDeemedMatch[1] === 'Yes';
            // In Tally XML, AMOUNT for Debit is negative, Credit is positive.
            if (isDebit) {
                totalDebit += Math.abs(amount);
            } else {
                totalCredit += Math.abs(amount);
            }
        }
    }
    
    // Also include INVENTORYENTRIES.LIST because they have ACCOUNTINGALLOCATIONS which also credit/debit!
    const inventoryEntries = voucher.match(/<INVENTORYENTRIES\.LIST>[\s\S]*?<\/INVENTORYENTRIES\.LIST>/g) || [];
    for (const entry of inventoryEntries) {
        const amountMatch = entry.match(/<AMOUNT>([^<]+)<\/AMOUNT>/);
        const isDeemedMatch = entry.match(/<ISDEEMEDPOSITIVE>([^<]+)<\/ISDEEMEDPOSITIVE>/);
        if (amountMatch && isDeemedMatch) {
            const amount = parseFloat(amountMatch[1]);
            const isDebit = isDeemedMatch[1] === 'Yes';
            if (isDebit) {
                totalDebit += Math.abs(amount);
            } else {
                totalCredit += Math.abs(amount);
            }
        }
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;
    
    if (totalDebit !== totalCredit) {
        mismatchCount++;
        console.log(`MISMATCH IN VOUCHER: ${remoteId}`);
        console.log(`  Debit: ${totalDebit}, Credit: ${totalCredit}, Diff: ${Math.round((totalDebit - totalCredit)*100)/100}`);
    }
}

console.log(`\nTotal Vouchers: ${vouchers.length}`);
console.log(`Mismatched Vouchers: ${mismatchCount}`);
