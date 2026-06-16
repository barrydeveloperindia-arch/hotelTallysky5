const fs = require('fs');

const file = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_02.06.26.json';
if (!fs.existsSync(file)) {
  console.log("June 2nd JSON file not found!");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

const columns = data[1];
console.log("Columns:");
columns.forEach((c, idx) => {
  console.log(`Index ${idx}: ${c ? c.toString().replace(/\r\n/g, ' ').replace(/\s+/g, ' ') : 'null'}`);
});

console.log("\nGuests on June 2nd:");
for (let i = 2; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0 || row[0] === null || typeof row[0] === 'string' && row[0].includes("TOTAL")) {
    continue;
  }
  const srNo = row[0];
  const invNo = row[invNoIdx(columns)];
  const roomNo = row[roomNoIdx(columns)];
  const guestName = row[guestNameIdx(columns)];
  const bookingMode = row[bookingModeIdx(columns)];
  
  // Stays & Payments (Indexes vary, so let's output raw row elements or dynamic indexes)
  console.log(`\nGuest #${srNo}: ${guestName} | Room: ${roomNo} | Mode: ${bookingMode} (Invoice: ${invNo || 'N/A'})`);
  console.log("  Row data:", row.map((cell, idx) => `[Col ${idx}]: ${cell}`).filter((c, idx) => row[idx] !== null && row[idx] !== ''));
}

function invNoIdx(cols) { return cols.findIndex(c => c && c.toString().includes("INVOICE")); }
function roomNoIdx(cols) { return cols.findIndex(c => c && c.toString().includes("ROOM NO")); }
function guestNameIdx(cols) { return cols.findIndex(c => c && c.toString().includes("GUEST NAME")); }
function bookingModeIdx(cols) { return cols.findIndex(c => c && c.toString().includes("BOOKING MODE")); }
