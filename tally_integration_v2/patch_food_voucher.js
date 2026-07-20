const fs = require('fs');

let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

// 1. Add formatRoomNo function at the top
if (!content.includes('function formatRoomNo')) {
    const fn = `function formatRoomNo(r) {
    if (!r) return r;
    let rStr = r.toString().trim();
    if (rStr.length <= 2 && !isNaN(rStr) && parseInt(rStr) > 0) {
        return (parseInt(rStr) + 100).toString();
    }
    return rStr;
}

`;
    content = content.replace('function formatDateForTally', fn + 'function formatDateForTally');
}

// 2. Replace all instances of \`Room \${sale.roomNo}\` with \`Room \${formatRoomNo(sale.roomNo)}\`
content = content.replace(/\`Room \\\$\{sale\.roomNo\}\`/g, "\`Room ${formatRoomNo(sale.roomNo)}\`");

// 3. Rewrite buildFoodSaleVoucher
const startMarker = 'function buildFoodSaleVoucher(sale) {';
const endMarker = 'function buildCLVouchers(sale) {';
const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const oldFunc = content.substring(startIdx, endIdx);
    
    // We will completely replace buildFoodSaleVoucher
    const newFunc = `function buildFoodSaleVoucher(sale) {
    const guestLedger = sale.guestName || 'Walk-In Customer';
    const roomCostCentre = (sale.isWalkIn || !sale.roomNo) ? 'Walk-in Guest' : \`Room \${formatRoomNo(sale.roomNo)}\`;
    const billRef = sale.billNo || sale.invoiceNo || 'UNKNOWN';
    const tDate = formatDateForTally(sale.date);
    const isEnglabs = (sale.guestName || '').toUpperCase().includes('ENGLABS');
    const salesLedger = getSalesLedger(!!sale.gstNo, isEnglabs, true, sale.cgst || 0, sale.sgst || 0, sale.basicAmount || 0);
    
    let itemsSum = 0;
    let inventoryAllocationsXml = '';
    
    for (const item of sale.items) {
        if (item.name.toLowerCase().includes('discount')) continue;
        
        itemsSum += Number(item.amount);
        inventoryAllocationsXml += \`
                    <INVENTORYALLOCATIONS.LIST>
                        <STOCKITEMNAME>\${escapeXml(item.name)}</STOCKITEMNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <RATE>\${item.rate}/Nos</RATE>
                        <AMOUNT>\${item.amount}</AMOUNT>
                        <ACTUALQTY> 1 Nos</ACTUALQTY>
                        <BILLEDQTY> 1 Nos</BILLEDQTY>
                    </INVENTORYALLOCATIONS.LIST>\`;
    }
    
    const discountItem = sale.items.find(i => i.name.toLowerCase().includes('discount'));
    let discountXml = '';
    if (discountItem) {
        itemsSum -= Math.abs(discountItem.amount);
        discountXml = \`
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Discount Allowed</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                    <AMOUNT>-\${Math.abs(discountItem.amount)}</AMOUNT>
                    <CATEGORYALLOCATIONS.LIST>
                        <CATEGORY>Rooms</CATEGORY>
                        <COSTCENTREALLOCATIONS.LIST>
                            <NAME>\${escapeXml(roomCostCentre)}</NAME>
                            <AMOUNT>-\${Math.abs(discountItem.amount)}</AMOUNT>
                        </COSTCENTREALLOCATIONS.LIST>
                    </CATEGORYALLOCATIONS.LIST>
                </ALLLEDGERENTRIES.LIST>\`;
    }

    const diff = Math.round((Number(sale.total) - (Number(itemsSum) + Number(sale.sgst || 0) + Number(sale.cgst || 0))) * 100) / 100;
    const roundOffXml = Math.abs(diff) > 0.001 ? \`
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Round Off</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>\${diff > 0 ? 'No' : 'Yes'}</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${diff > 0 ? diff.toFixed(2) : diff.toFixed(2)}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>\` : '';

    return \`
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER REMOTEID="HotelSky5-Food-\${escapeXml(billRef)}" VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
                <DATE>\${tDate}</DATE>
                <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                <VOUCHERNUMBER>\${getUniqueVoucherNumber(escapeXml(billRef))}</VOUCHERNUMBER>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>\${escapeXml(guestLedger)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                    <AMOUNT>-\${sale.total}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>\${escapeXml(salesLedger)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${itemsSum}</AMOUNT>
                    <CATEGORYALLOCATIONS.LIST>
                        <CATEGORY>Rooms</CATEGORY>
                        <COSTCENTREALLOCATIONS.LIST>
                            <NAME>\${escapeXml(roomCostCentre)}</NAME>
                            <AMOUNT>\${itemsSum}</AMOUNT>
                        </COSTCENTREALLOCATIONS.LIST>
                    </CATEGORYALLOCATIONS.LIST>
                    <CATEGORYALLOCATIONS.LIST>
                        <CATEGORY>Expenses</CATEGORY>
                        <COSTCENTREALLOCATIONS.LIST>
                            <NAME>Kitchen Expenses</NAME>
                            <AMOUNT>\${itemsSum}</AMOUNT>
                        </COSTCENTREALLOCATIONS.LIST>
                    </CATEGORYALLOCATIONS.LIST>\${inventoryAllocationsXml}
                </ALLLEDGERENTRIES.LIST>\${discountXml}
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Output Sgst 2.5%</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${sale.sgst || 0}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Output Cgst 2.5%</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${sale.cgst || 0}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>\${roundOffXml}
            </VOUCHER>
        </TALLYMESSAGE>\`;
}
`;
    content = content.replace(oldFunc, newFunc);
}

fs.writeFileSync('generate_tally_xml.js', content);
console.log('generate_tally_xml.js patched successfully for room formatting and food voucher structure.');
