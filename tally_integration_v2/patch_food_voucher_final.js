const fs = require('fs');

let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

// 1. Find buildFoodSaleVoucher
const start = content.indexOf('function buildFoodSaleVoucher(sale) {');
const end = content.indexOf('function generateTallyXML', start);
let func = content.substring(start, end);

// 2. Remove the Discount Allowed block
func = func.replace(/const discountItem[\s\S]*?\}\n/, '');

// 3. Ensure we don't subtract discount from itemsSum
// Already handled by removing the block which did: itemsSum -= Math.abs(discountItem.amount);
// Wait, the items loop says: if (item.name.toLowerCase().includes('discount')) continue;
// This means the discount item is completely ignored, and the total itemsSum is exactly the sum of Food items.
// Thus, diff = sale.total - (itemsSum + taxes) will result in a huge negative number for massive discounts.
// That is exactly what we want for ROUND OFF!

// 4. Move CATEGORYALLOCATIONS.LIST INSIDE INVENTORYALLOCATIONS.LIST
// Currently the items loop looks like this:
/*
        itemsSum += Number(item.amount);
        inventoryAllocationsXml += `
                    <INVENTORYALLOCATIONS.LIST>
                        <STOCKITEMNAME>\${escapeXml(item.name)}</STOCKITEMNAME>
                        ...
                        <BILLEDQTY> 1 Nos</BILLEDQTY>
                    </INVENTORYALLOCATIONS.LIST>`;
*/

func = func.replace(
    /(\<BILLEDQTY\>.*?<\/BILLEDQTY\>)/g,
    `$1
                        \${generateRoomCostCentresXml('Rooms', item.amount, roomCostCentres)}
                        <CATEGORYALLOCATIONS.LIST>
                            <CATEGORY>Expenses</CATEGORY>
                            <COSTCENTREALLOCATIONS.LIST>
                                <NAME>Kitchen Expenses</NAME>
                                <AMOUNT>\${item.amount}</AMOUNT>
                            </COSTCENTREALLOCATIONS.LIST>
                        </CATEGORYALLOCATIONS.LIST>`
);

// 5. Remove the global CATEGORYALLOCATIONS.LIST that was attached to the Sales Ledger
// Look for where generateRoomCostCentresXml is called on itemsSum
func = func.replace(
    /\$\{generateRoomCostCentresXml\('Rooms', itemsSum, roomCostCentres\)\}/g,
    ''
);

func = func.replace(
    /\<CATEGORYALLOCATIONS\.LIST\>[\s\S]*?\<CATEGORY\>Expenses\<\/CATEGORY\>[\s\S]*?\<\/CATEGORYALLOCATIONS\.LIST\>/g,
    ''
);

content = content.substring(0, start) + func + content.substring(end);
fs.writeFileSync('generate_tally_xml.js', content);
console.log('Food Vouchers patched to place Categories inside Inventory Allocations and remove Discount ledger.');
