const fs = require('fs');
const path = require('path');

// A very simple XML parser to extract names from tally_masters.xml
function extractTallyMasters(xmlPath) {
    const xmlContent = fs.readFileSync(xmlPath, 'utf8');
    const ledgers = new Set();
    const validLedgers = new Set();
    const items = new Set();

    // Regex to extract ledger blocks
    const ledgerRegex = /<LEDGER NAME="([^"]+)"[^>]*>([\s\S]*?)<\/LEDGER>/gi;
    let match;
    while ((match = ledgerRegex.exec(xmlContent)) !== null) {
        const name = match[1].toLowerCase();
        const block = match[2];
        ledgers.add(name);
        
        const hasEmptyState = block.includes('<STATE/>');
        const hasEmptyCountry = block.includes('<COUNTRY/>');
        const hasEmptyGST = block.includes('<LEDGSTREGDETAILS.LIST>      </LEDGSTREGDETAILS.LIST>') || block.includes('<LEDGSTREGDETAILS.LIST/>');
        
        if (!hasEmptyState && !hasEmptyCountry && !hasEmptyGST) {
            validLedgers.add(name);
        }
    }

    // Simple regex to extract stock item names
    const itemRegex = /<STOCKITEM NAME="([^"]+)"/g;
    while ((match = itemRegex.exec(xmlContent)) !== null) {
        items.add(match[1].toLowerCase());
    }

    return { ledgers, validLedgers, items };
}

function auditData(salesData, tallyMastersPath) {
    const { ledgers, validLedgers, items } = extractTallyMasters(tallyMastersPath);
    
    // Core ledgers that must exist
    const coreLedgers = [
        'sale 5% haryana b2c', 'sales b2b 5% haryana', 
        'output cgst 2.5%', 'output sgst 2.5%', 'round off',
        'cash', 'consumer', 'treebo paid', 'walk-in customer',
        'foc food consumption', 'complementary food expense'
    ];

    const missingCore = coreLedgers.filter(l => !ledgers.has(l));
    if (missingCore.length > 0) {
        throw new Error(`CRITICAL AUDIT FAILURE: Missing core ledgers in Tally: ${missingCore.join(', ')}`);
    }

    const missingGuests = new Set();
    const missingItems = new Set();

    for (const sale of salesData) {
        // 1. Check Guest Name
        if (sale.guestName) {
            const guestLower = sale.guestName.toLowerCase().trim();
            // Allow Walk-In Customer fallback
            if (guestLower !== 'walk-in customer' && !validLedgers.has(guestLower)) {
                missingGuests.add(sale.guestName.trim());
            }
        } else if ((sale.type === 'food' && sale.isWalkIn) || sale.isCL) {
            // Handled automatically via 'Walk-In Customer' ledger
        } else {
             throw new Error(`CRITICAL AUDIT FAILURE: Bill ${sale.billNo} has no Guest Name!`);
        }

        // 2. Check Items (Food Bills)
        if (sale.type === 'food' && sale.items) {
            for (const item of sale.items) {
                const itemName = item.name.toLowerCase().trim();
                // Special check for discounts which aren't items
                if (!itemName.includes('discount') && !items.has(itemName)) {
                    missingItems.add(item.name.trim());
                }
            }
        }
    }

    if (missingItems.size > 0) {
        console.warn(`WARNING: Missing Stock Items in Tally Masters File: ${Array.from(missingItems).join(', ')}`);
    }

    // Return the missing guests so they can be dynamically created in the XML payload
    return {
        missingGuests: Array.from(missingGuests)
    };
}

module.exports = { auditData };
