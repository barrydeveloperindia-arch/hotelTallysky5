const fs = require('fs');
const xml = fs.readFileSync('Final_Tally_Import_1_to_10_July.xml', 'utf8');
const vouchers = xml.match(/<VOUCHER [^>]+>[\s\S]*?<\/VOUCHER>/g) || [];

let mismatchCount = 0;
for (const voucher of vouchers) {
    const remoteIdMatch = voucher.match(/REMOTEID="([^"]+)"/);
    const remoteId = remoteIdMatch ? remoteIdMatch[1] : 'UNKNOWN';
    let voucherHasError = false;

    // Check ALLLEDGERENTRIES.LIST
    const ledgerEntries = voucher.match(/<ALLLEDGERENTRIES\.LIST>[\s\S]*?<\/ALLLEDGERENTRIES\.LIST>/g) || [];
    for (const entry of ledgerEntries) {
        const ledgerAmountMatch = entry.match(/<AMOUNT>([^<]+)<\/AMOUNT>/);
        if (!ledgerAmountMatch) continue;
        const ledgerAmount = Math.round(parseFloat(ledgerAmountMatch[1]) * 100) / 100;
        
        // Check COSTCENTREALLOCATIONS
        const ccAllocations = entry.match(/<COSTCENTREALLOCATIONS\.LIST>[\s\S]*?<\/COSTCENTREALLOCATIONS\.LIST>/g);
        if (ccAllocations) {
            let ccSum = 0;
            for (const cc of ccAllocations) {
                const ccAmountMatch = cc.match(/<AMOUNT>([^<]+)<\/AMOUNT>/);
                if (ccAmountMatch) {
                    ccSum += parseFloat(ccAmountMatch[1]);
                }
            }
            ccSum = Math.round(ccSum * 100) / 100;
            if (ccSum !== ledgerAmount) {
                console.log(`[${remoteId}] Mismatch in Cost Centre Allocation: LedgerAmount=${ledgerAmount}, CCSum=${ccSum}`);
                voucherHasError = true;
            }
        }
        
        // Check INVENTORYALLOCATIONS.LIST (nested in ALLLEDGERENTRIES for Journal)
        const invAllocations = entry.match(/<INVENTORYALLOCATIONS\.LIST>[\s\S]*?<\/INVENTORYALLOCATIONS\.LIST>/g);
        if (invAllocations) {
            let invSum = 0;
            for (const inv of invAllocations) {
                const invAmountMatch = inv.match(/<AMOUNT>([^<]+)<\/AMOUNT>/);
                if (invAmountMatch) {
                    invSum += parseFloat(invAmountMatch[1]);
                }
            }
            invSum = Math.round(invSum * 100) / 100;
            if (invSum !== ledgerAmount) {
                console.log(`[${remoteId}] Mismatch in Inventory Allocation (Journal): LedgerAmount=${ledgerAmount}, InvSum=${invSum}`);
                voucherHasError = true;
            }
        }
    }
    
    // Check INVENTORYENTRIES.LIST (for Sales)
    const invEntries = voucher.match(/<INVENTORYENTRIES\.LIST>[\s\S]*?<\/INVENTORYENTRIES\.LIST>/g) || [];
    for (const entry of invEntries) {
        const invAmountMatch = entry.match(/<AMOUNT>([^<]+)<\/AMOUNT>/);
        if (!invAmountMatch) continue;
        const invAmount = Math.round(parseFloat(invAmountMatch[1]) * 100) / 100;
        
        // Check ACCOUNTINGALLOCATIONS.LIST
        const accAllocations = entry.match(/<ACCOUNTINGALLOCATIONS\.LIST>[\s\S]*?<\/ACCOUNTINGALLOCATIONS\.LIST>/g);
        if (accAllocations) {
            let accSum = 0;
            for (const acc of accAllocations) {
                const accAmountMatch = acc.match(/<AMOUNT>([^<]+)<\/AMOUNT>/);
                if (accAmountMatch) {
                    accSum += parseFloat(accAmountMatch[1]);
                }
                
                // Inside ACCOUNTINGALLOCATIONS, there could be COSTCENTREALLOCATIONS!
                const accLedgerAmount = parseFloat(accAmountMatch[1]);
                const ccAllocations = acc.match(/<COSTCENTREALLOCATIONS\.LIST>[\s\S]*?<\/COSTCENTREALLOCATIONS\.LIST>/g);
                if (ccAllocations) {
                    let ccSum = 0;
                    for (const cc of ccAllocations) {
                        const ccAmountMatch = cc.match(/<AMOUNT>([^<]+)<\/AMOUNT>/);
                        if (ccAmountMatch) {
                            ccSum += parseFloat(ccAmountMatch[1]);
                        }
                    }
                    ccSum = Math.round(ccSum * 100) / 100;
                    if (ccSum !== Math.round(accLedgerAmount * 100)/100) {
                        console.log(`[${remoteId}] Mismatch in Cost Centre inside Accounting Allocation: AccAmount=${accLedgerAmount}, CCSum=${ccSum}`);
                        voucherHasError = true;
                    }
                }
            }
            accSum = Math.round(accSum * 100) / 100;
            if (accSum !== invAmount) {
                console.log(`[${remoteId}] Mismatch in Accounting Allocation: InvAmount=${invAmount}, AccSum=${accSum}`);
                voucherHasError = true;
            }
        }
    }
    
    if (voucherHasError) mismatchCount++;
}
console.log(`\nTotal Exceptions Found Mathematically: ${mismatchCount}`);
