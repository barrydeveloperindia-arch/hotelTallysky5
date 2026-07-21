const fs = require('fs');

let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

// We will inject parseRooms, generateRoomCostCentresXml and replace formatRoomNo
const funcs = `
function parseRooms(r) {
    if (!r) return [];
    let rStr = r.toString().trim().toUpperCase();
    if (!rStr) return [];
    
    // Ignore non-room entries
    if (rStr.includes('MD SIR') || rStr.includes('A&A') || rStr.includes('SHREEYA') || rStr.includes('ENGLABS') || rStr.includes('S& A')) {
        return [];
    }
    
    let cleaned = rStr.replace(/CL/g, '').trim();
    let parts = cleaned.split(/[^0-9]+/);
    
    let rooms = [];
    for (let part of parts) {
        if (!part) continue;
        let p = part;
        if (p === '1061') p = '106'; 
        
        if (p.length <= 2 && parseInt(p) > 0) {
            p = (parseInt(p) + 100).toString();
        }
        
        if (p) rooms.push(\`Room \${p}\`);
    }
    
    return rooms;
}

function generateRoomCostCentresXml(categoryName, amount, roomCostCentres, isNegative = false) {
    if (!roomCostCentres || roomCostCentres.length === 0) roomCostCentres = ['Walk-in Guest'];
    let count = roomCostCentres.length;
    let splitAmt = Math.floor((Math.abs(amount) / count) * 100) / 100;
    let remainder = Math.round((Math.abs(amount) - (splitAmt * count)) * 100) / 100;
    
    let xml = \`\\n                    <CATEGORYALLOCATIONS.LIST>\\n                        <CATEGORY>\${categoryName}</CATEGORY>\`;
    for (let i = 0; i < count; i++) {
        let finalAmt = splitAmt;
        if (i === 0) finalAmt = Math.round((finalAmt + remainder) * 100) / 100;
        let amtStr = (isNegative ? -finalAmt : finalAmt).toString();
        xml += \`
                        <COSTCENTREALLOCATIONS.LIST>
                            <NAME>\${escapeXml(roomCostCentres[i])}</NAME>
                            <AMOUNT>\${amtStr}</AMOUNT>
                        </COSTCENTREALLOCATIONS.LIST>\`;
    }
    xml += \`\\n                    </CATEGORYALLOCATIONS.LIST>\`;
    return xml;
}
`;

// Remove formatRoomNo if it exists
if (content.includes('function formatRoomNo(r) {')) {
    const endFormat = content.indexOf('return rStr;\n}\n\n') + 16;
    content = content.replace(content.substring(content.indexOf('function formatRoomNo(r) {'), endFormat), '');
}

if (!content.includes('function parseRooms(r)')) {
    content = content.replace('function formatDateForTally', funcs + 'function formatDateForTally');
}

// Update buildRoomSaleVoucher
content = content.replace(
    /const roomCostCentre = [^\n]+;/,
    `let roomCostCentres = (sale.isWalkIn || !sale.roomNo) ? ['Walk-in Guest'] : parseRooms(sale.roomNo);
    if (roomCostCentres.length === 0) roomCostCentres = ['Walk-in Guest'];`
);

content = content.replace(
    /                    <CATEGORYALLOCATIONS\.LIST>[\s\S]*?<\/CATEGORYALLOCATIONS\.LIST>/,
    `\${generateRoomCostCentresXml('Rooms', sale.basicAmount, roomCostCentres)}`
);


// Update buildFoodSaleVoucher
content = content.replace(
    /const roomCostCentre = [^\n]+;/,
    `let roomCostCentres = (sale.isWalkIn || !sale.roomNo) ? ['Walk-in Guest'] : parseRooms(sale.roomNo);
    if (roomCostCentres.length === 0) roomCostCentres = ['Walk-in Guest'];`
);

content = content.replace(
    /<CATEGORYALLOCATIONS\.LIST>\s*<CATEGORY>Rooms<\/CATEGORY>\s*<COSTCENTREALLOCATIONS\.LIST>\s*<NAME>\${escapeXml\(roomCostCentre\)}<\/NAME>\s*<AMOUNT>-\${Math\.abs\(discountItem\.amount\)}<\/AMOUNT>\s*<\/COSTCENTREALLOCATIONS\.LIST>\s*<\/CATEGORYALLOCATIONS\.LIST>/,
    `\${generateRoomCostCentresXml('Rooms', discountItem.amount, roomCostCentres, true)}`
);

content = content.replace(
    /<CATEGORYALLOCATIONS\.LIST>\s*<CATEGORY>Rooms<\/CATEGORY>\s*<COSTCENTREALLOCATIONS\.LIST>\s*<NAME>\${escapeXml\(roomCostCentre\)}<\/NAME>\s*<AMOUNT>\${itemsSum}<\/AMOUNT>\s*<\/COSTCENTREALLOCATIONS\.LIST>\s*<\/CATEGORYALLOCATIONS\.LIST>/,
    `\${generateRoomCostCentresXml('Rooms', itemsSum, roomCostCentres)}`
);

// Update buildCLVouchers
content = content.replace(
    /const roomCostCentre = [^\n]+;/,
    `let roomCostCentres = (sale.isWalkIn || !sale.roomNo) ? ['Walk-in Guest'] : parseRooms(sale.roomNo);
    if (roomCostCentres.length === 0) roomCostCentres = ['Walk-in Guest'];`
);

content = content.replace(
    /<CATEGORYALLOCATIONS\.LIST>\s*<CATEGORY>Rooms<\/CATEGORY>\s*<COSTCENTREALLOCATIONS\.LIST>\s*<NAME>\${escapeXml\(roomCostCentre\)}<\/NAME>\s*<AMOUNT>\${basicAmt}<\/AMOUNT>\s*<\/COSTCENTREALLOCATIONS\.LIST>\s*<\/CATEGORYALLOCATIONS\.LIST>/,
    `\${generateRoomCostCentresXml('Rooms', basicAmt, roomCostCentres)}`
);

fs.writeFileSync('generate_tally_xml.js', content);
console.log('generate_tally_xml.js patched successfully for multiple room numbers!');
