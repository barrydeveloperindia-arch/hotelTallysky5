const fs = require('fs');
let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

const missingFunctions = `
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe).replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function formatDateForTally(dateStr) {
    if (!dateStr) return '20260701';
    const parts = dateStr.split(' ');
    if (parts.length > 0) {
        const dParts = parts[0].split('-');
        if (dParts.length === 3) {
            let year = dParts[0];
            if (year === '24') year = '2024'; // Handle 2-digit years if present
            if (year === '2024') year = '2026';
            if (year === '2025') year = '2027'; // Align with financial year
            return \`\${year}\${dParts[1]}\${dParts[2]}\`;
        }
    }
    return '20260701';
}

function getSalesLedger(hasGst, isEnglabs) {
    if (isEnglabs) return 'Sales A/c  B2B ENGLABS';
    return hasGst ? 'Sales A/c B2B' : 'Sales A/c B2C';
}
`;

content = content.replace("const { escapeXml, formatDateForTally, getSalesLedger } = require('./utils.js');", missingFunctions);
fs.writeFileSync('generate_tally_xml.js', content);
console.log('Restored helper functions');
