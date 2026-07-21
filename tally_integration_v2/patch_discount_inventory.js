const fs = require('fs');

let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

// 1. Find buildFoodSaleVoucher
const start = content.indexOf('function buildFoodSaleVoucher(sale) {');
const end = content.indexOf('function generateTallyXML', start);
let func = content.substring(start, end);

// 2. Inject Discount Inventory Item Logic
const discountLogic = `
    if (sale.discount && Number(sale.discount) > 0) {
        itemsSum -= Number(sale.discount);
        inventoryAllocationsXml += \`
                    <INVENTORYALLOCATIONS.LIST>
                        <STOCKITEMNAME>Discount</STOCKITEMNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <RATE>-\${sale.discount}/Nos</RATE>
                        <AMOUNT>-\${sale.discount}</AMOUNT>
                        <ACTUALQTY> 1 Nos</ACTUALQTY>
                        <BILLEDQTY> 1 Nos</BILLEDQTY>
                        \${generateRoomCostCentresXml('Rooms', -sale.discount, roomCostCentres)}
                        <CATEGORYALLOCATIONS.LIST>
                            <CATEGORY>Expenses</CATEGORY>
                            <COSTCENTREALLOCATIONS.LIST>
                                <NAME>Kitchen Expenses</NAME>
                                <AMOUNT>-\${sale.discount}</AMOUNT>
                            </COSTCENTREALLOCATIONS.LIST>
                        </CATEGORYALLOCATIONS.LIST>
                    </INVENTORYALLOCATIONS.LIST>\`;
    }
`;

// Insert it right after the items loop
func = func.replace(
    /\}\n\n    const diff \= Math\.round/,
    `}\n${discountLogic}\n    const diff = Math.round`
);

content = content.substring(0, start) + func + content.substring(end);
fs.writeFileSync('generate_tally_xml.js', content);
console.log('Food Vouchers patched to inject Discount as a negative Inventory Allocation.');
