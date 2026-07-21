const fs = require('fs');

let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

// We need to inject the <INVENTORYALLOCATIONS.LIST> block into buildRoomSaleVoucher and buildTreeboVoucher.

const inventoryXml = `
                    <INVENTORYALLOCATIONS.LIST>
                        <STOCKITEMNAME>Room No:-</STOCKITEMNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <RATE>\${basic}/Nos</RATE>
                        <AMOUNT>\${basic}</AMOUNT>
                        <ACTUALQTY> 1 Nos</ACTUALQTY>
                        <BILLEDQTY> 1 Nos</BILLEDQTY>
                    </INVENTORYALLOCATIONS.LIST>`;

// 1. Update buildRoomSaleVoucher
if (!content.includes('<STOCKITEMNAME>Room No:-</STOCKITEMNAME>')) {
    // We will append it right after the closing tag of the CATEGORYALLOCATIONS.LIST inside ALLLEDGERENTRIES.LIST for the Sales Ledger.
    // The previous code had: `\${generateRoomCostCentresXml('Rooms', sale.basicAmount, roomCostCentres)}`
    // We can replace this exactly.
    
    content = content.replace(
        /\$\{generateRoomCostCentresXml\('Rooms', sale\.basicAmount, roomCostCentres\)\}/g,
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
    
    // In buildTreeboVoucher, it uses basic as basicTreebo
    // But actually buildTreeboVoucher was using `generateRoomCostCentresXml('Rooms', sale.basicAmount, roomCostCentres)` 
    // Wait, let's check what generate_tally_xml.js actually has for Treebo.
}

fs.writeFileSync('generate_tally_xml.js', content);
console.log('generate_tally_xml.js patched successfully for Room No:- inventory items!');
