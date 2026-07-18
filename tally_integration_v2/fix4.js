const fs = require('fs');
let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

// The file is corrupted at line 1. Let's fix line 1 to 43.
// Wait, I can just replace everything before `function buildPaymentJournals(sale) {` (the second, correct one at line 44) with `const fs = require('fs');\nconst { auditData } = require('./skill_tally_auditor.js');\nconst { escapeXml, formatDateForTally, getSalesLedger } = require('./utils.js');\n\nfunction buildNewGuestLedgers(missingGuests, b2bMapping) {\n    let xml = '';\n    for (const guest of missingGuests) {\n        const isB2B = b2bMapping[guest] ? b2bMapping[guest].isB2B : false;\n        const gstNo = b2bMapping[guest] ? b2bMapping[guest].gstNo : '';\n        const stateName = b2bMapping[guest] ? b2bMapping[guest].state : 'Haryana';\n        xml += \`\n        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n            <LEDGER NAME="\${escapeXml(guest)}" ACTION="Create">\n                <NAME.LIST>\n                    <NAME>\${escapeXml(guest)}</NAME>\n                </NAME.LIST>\n                <PARENT>Sundry Debtors</PARENT>\n                <ISBILLWISEON>Yes</ISBILLWISEON>\n                <AFFECTSSTOCK>No</AFFECTSSTOCK>\n                \${isB2B ? \`\n                <PARTYGSTIN>\${escapeXml(gstNo)}</PARTYGSTIN>\n                <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>\n                <STATENAME>\${escapeXml(stateName)}</STATENAME>\` : \`\n                <GSTREGISTRATIONTYPE>Consumer</GSTREGISTRATIONTYPE>\n                <STATENAME>Haryana</STATENAME>\`}\n            </LEDGER>\n        </TALLYMESSAGE>\`;\n    }\n    return xml;\n}\n\n`;

const correctFunctionIndex = content.indexOf('function buildPaymentJournals(sale) {', 40); // Find the one at line 44
const goodPart = content.substring(correctFunctionIndex);

const correctHeader = `const fs = require('fs');
const { auditData } = require('./skill_tally_auditor.js');
const { escapeXml, formatDateForTally, getSalesLedger } = require('./utils.js');

function buildNewGuestLedgers(missingGuests, b2bMapping) {
    let xml = '';
    for (const guest of missingGuests) {
        const isB2B = b2bMapping[guest] ? b2bMapping[guest].isB2B : false;
        const gstNo = b2bMapping[guest] ? b2bMapping[guest].gstNo : '';
        const stateName = b2bMapping[guest] ? b2bMapping[guest].state : 'Haryana';
        xml += \`
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <LEDGER NAME="\${escapeXml(guest)}" ACTION="Create">
                <NAME.LIST>
                    <NAME>\${escapeXml(guest)}</NAME>
                </NAME.LIST>
                <PARENT>Sundry Debtors</PARENT>
                <ISBILLWISEON>Yes</ISBILLWISEON>
                <AFFECTSSTOCK>No</AFFECTSSTOCK>
                \${isB2B ? \`
                <PARTYGSTIN>\${escapeXml(gstNo)}</PARTYGSTIN>
                <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
                <STATENAME>\${escapeXml(stateName)}</STATENAME>\` : \`
                <GSTREGISTRATIONTYPE>Consumer</GSTREGISTRATIONTYPE>
                <STATENAME>Haryana</STATENAME>\`}
            </LEDGER>
        </TALLYMESSAGE>\`;
    }
    return xml;
}

`;

fs.writeFileSync('generate_tally_xml.js', correctHeader + goodPart);
console.log('Restored corrupted generate_tally_xml.js');
