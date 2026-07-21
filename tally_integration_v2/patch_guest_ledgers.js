const fs = require('fs');

let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

// Replace ISBILLWISEON>Yes with ISBILLWISEON>No
content = content.replace(/<ISBILLWISEON>Yes<\/ISBILLWISEON>/g, '<ISBILLWISEON>No</ISBILLWISEON>');

// Ensure Unregistered instead of Consumer (Tally prefers Unregistered for Unregistered/Consumer)
content = content.replace(/<GSTREGISTRATIONTYPE>Consumer<\/GSTREGISTRATIONTYPE>/g, '<GSTREGISTRATIONTYPE>Unregistered</GSTREGISTRATIONTYPE>');

// Inject COUNTRYOFRESIDENCE right after STATENAME
content = content.replace(/<STATENAME>(.*?)<\/STATENAME>/g, '<STATENAME>$1</STATENAME>\n                <COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>');

fs.writeFileSync('generate_tally_xml.js', content);
console.log('Guest ledger auto-creation logic patched successfully (ISBILLWISEON=No, Country=India, Unregistered).');
