const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_01.06.26.json', 'utf-8'));

const columns = data[1];
console.log("Columns:");
columns.forEach((c, idx) => {
  console.log(`Index ${idx}: ${c ? c.toString().replace(/\r\n/g, ' ').replace(/\s+/g, ' ') : 'null'}`);
});

console.log("\nGuests on June 1st:");
for (let i = 2; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0 || row[0] === null || typeof row[0] === 'string' && row[0].includes("TOTAL")) {
    continue;
  }
  const srNo = row[0];
  const invNo = row[1];
  const roomNo = row[2];
  const guestName = row[3];
  const bookingMode = row[4];
  
  // Room Payments
  const roomCash = row[9] || 0;
  const roomUpi = row[10] || 0;
  const roomCard = row[11] || 0;
  const roomPending = row[12] || 0;
  const roomTreebo = row[13] || 0;
  
  // Food
  const foodBillNo = row[14];
  const foodCash = row[15] || 0;
  const foodUpi = row[16] || 0;
  const foodCard = row[17] || 0;
  const foodTreeboComple = row[18] || 0;
  const foodPending = row[19] || 0;
  const foodTreeboCl = row[20] || 0;
  const foodDisha = row[21] || 0;
  
  console.log(`\nGuest #${srNo}: ${guestName} | Room: ${roomNo} | Mode: ${bookingMode} (Invoice: ${invNo || 'N/A'})`);
  console.log(`  Room Payments: Cash=${roomCash}, UPI=${roomUpi}, Card=${roomCard}, Pending=${roomPending}, Treebo=${roomTreebo}`);
  console.log(`  Food Payments: BillNo=${foodBillNo || 'N/A'}, Cash=${foodCash}, UPI=${foodUpi}, Card=${foodCard}, TreeboComple=${foodTreeboComple}, Pending=${foodPending}, TreeboCL=${foodTreeboCl}, Disha=${foodDisha}`);
}
