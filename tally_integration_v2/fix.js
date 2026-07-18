const fs = require('fs');

let code = fs.readFileSync('generate_tally_xml.js', 'utf8');

// Fix Round Off in buildRoomSaleVoucher
code = code.replace(
    /<AMOUNT>\$\{diff > 0 \? diff\.toFixed\(2\) : \(-diff\)\.toFixed\(2\)\}<\/AMOUNT>/g,
    '<AMOUNT>${diff.toFixed(2)}</AMOUNT>'
);

fs.writeFileSync('generate_tally_xml.js', code);
