const fs = require('fs');

let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

// The goal is to append <INVENTORYALLOCATIONS.LIST> to buildRoomSaleVoucher and buildTreeboVoucher AFTER the CATEGORYALLOCATIONS.LIST.
// We will do this by string replacement targeting the specific functions.

const startMaster = content.indexOf('function buildRoomSaleVoucher(sale) {');
const endMaster = content.indexOf('function buildTreeboVoucher(treebo) {');
let masterFunc = content.substring(startMaster, endMaster);

masterFunc = masterFunc.replace(
    /\$\{generateRoomCostCentresXml\('Rooms', sale\.basicAmount, roomCostCentres\)\}/,
    `\${generateRoomCostCentresXml('Rooms', sale.basicAmount, roomCostCentres)}
                    <INVENTORYALLOCATIONS.LIST>
                        <STOCKITEMNAME>Room No:-</STOCKITEMNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <RATE>\${sale.basicAmount}/Nos</RATE>
                        <AMOUNT>\${sale.basicAmount}</AMOUNT>
                        <ACTUALQTY> 1 Nos</ACTUALQTY>
                        <BILLEDQTY> 1 Nos</BILLEDQTY>
                    </INVENTORYALLOCATIONS.LIST>`
);

content = content.substring(0, startMaster) + masterFunc + content.substring(endMaster);

const startTreebo = content.indexOf('function buildTreeboVoucher(treebo) {');
const endTreebo = content.indexOf('function buildCLVouchers(sale) {');
let treeboFunc = content.substring(startTreebo, endTreebo);

treeboFunc = treeboFunc.replace(
    /\$\{generateRoomCostCentresXml\('Rooms', basicTreebo, roomCostCentres\)\}/,
    `\${generateRoomCostCentresXml('Rooms', basicTreebo, roomCostCentres)}
                    <INVENTORYALLOCATIONS.LIST>
                        <STOCKITEMNAME>Room No:-</STOCKITEMNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <RATE>\${basicTreebo}/Nos</RATE>
                        <AMOUNT>\${basicTreebo}</AMOUNT>
                        <ACTUALQTY> 1 Nos</ACTUALQTY>
                        <BILLEDQTY> 1 Nos</BILLEDQTY>
                    </INVENTORYALLOCATIONS.LIST>`
);

content = content.substring(0, startTreebo) + treeboFunc + content.substring(endTreebo);

fs.writeFileSync('generate_tally_xml.js', content);
console.log('Fixed patch applied successfully.');
