const fs = require('fs');
let code = fs.readFileSync('generate_tally_xml.js', 'utf8');
code = code.replace(/sale\.isWalkIn \? 'Walk-in Guest' : `Room \$\{sale\.roomNo \|\| 'Unknown'\}`/g, 
    "(sale.isWalkIn || !sale.roomNo) ? 'Walk-in Guest' : `Room ${sale.roomNo}`");
fs.writeFileSync('generate_tally_xml.js', code);
