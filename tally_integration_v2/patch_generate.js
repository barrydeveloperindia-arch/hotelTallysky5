const fs = require('fs');

let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

const oldGetSalesLedger = `function getSalesLedger(hasGst, isEnglabs, isFood = false) {
    return isFood ? 'Sale 5% Haryana B2C' : 'Room Sales';
}`;
const newGetSalesLedger = `function getSalesLedger(hasGst, isEnglabs, isFood = false, cgst = 0, sgst = 0, basic = 0) {
    let rate = 12; // default for Master/Treebo
    if (basic > 0 && (cgst > 0 || sgst > 0)) {
        const totalTax = cgst + sgst;
        const calcRate = Math.round((totalTax / basic) * 100);
        if (calcRate === 5 || calcRate === 12) {
            rate = calcRate;
        }
    }
    if (isFood) rate = 5;

    if (isFood) {
        return 'Sale 5% Haryana B2C';
    } else {
        if (isEnglabs) {
            return 'SALES B2B 5% HARYANA';
        } else {
            return rate === 12 ? 'SALE 12% Haryana B2C' : 'Sale 5% Haryana B2C';
        }
    }
}`;
content = content.replace(oldGetSalesLedger, newGetSalesLedger);

// Update calls to getSalesLedger
content = content.replace(
    "const salesLedger = getSalesLedger(!!sale.gstNo, (sale.guestName || '').toUpperCase().includes('ENGLABS'), false);",
    "const salesLedger = getSalesLedger(!!sale.gstNo, (sale.guestName || '').toUpperCase().includes('ENGLABS'), false, sale.cgst || 0, sale.sgst || 0, sale.basicAmount || 0);"
);

content = content.replace(
    "const salesLedger = getSalesLedger(!!sale.gstNo, isEnglabs, true);",
    "const salesLedger = getSalesLedger(!!sale.gstNo, isEnglabs, true, sale.cgst || 0, sale.sgst || 0, sale.basicAmount || 0);"
);

// Fix buildFoodSaleVoucher cost centre split
const oldFoodVoucherCore = `            <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>\${escapeXml(salesLedger)}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>\${item.amount}</AMOUNT>
                <CATEGORYALLOCATIONS.LIST>
                    <CATEGORY>Rooms</CATEGORY>
                    <COSTCENTREALLOCATIONS.LIST>
                        <NAME>\${escapeXml(roomCostCentre)}</NAME>
                        <AMOUNT>\${item.amount}</AMOUNT>
                    </COSTCENTREALLOCATIONS.LIST>
                </CATEGORYALLOCATIONS.LIST>
            </ACCOUNTINGALLOCATIONS.LIST>`;

const newFoodVoucherCore = `            <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>\${escapeXml(salesLedger)}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>\${item.amount}</AMOUNT>
                <CATEGORYALLOCATIONS.LIST>
                    <CATEGORY>Rooms</CATEGORY>
                    <COSTCENTREALLOCATIONS.LIST>
                        <NAME>\${escapeXml(roomCostCentre)}</NAME>
                        <AMOUNT>\${item.amount}</AMOUNT>
                    </COSTCENTREALLOCATIONS.LIST>
                </CATEGORYALLOCATIONS.LIST>
                <CATEGORYALLOCATIONS.LIST>
                    <CATEGORY>Expenses</CATEGORY>
                    <COSTCENTREALLOCATIONS.LIST>
                        <NAME>Kitchen Expenses</NAME>
                        <AMOUNT>\${item.amount}</AMOUNT>
                    </COSTCENTREALLOCATIONS.LIST>
                </CATEGORYALLOCATIONS.LIST>
            </ACCOUNTINGALLOCATIONS.LIST>`;
content = content.replace(oldFoodVoucherCore, newFoodVoucherCore);

fs.writeFileSync('generate_tally_xml.js', content);
console.log('generate_tally_xml.js patched successfully');
