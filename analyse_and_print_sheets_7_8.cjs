const fs = require('fs');

const sheets = ['07.06.26', '08.06.26'];

sheets.forEach(sheetName => {
  const filePath = `C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_${sheetName}.json`;
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found!`);
    return;
  }
  
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\n================================================================================`);
  console.log(`SHEET: ${sheetName}`);
  console.log(`================================================================================`);
  
  console.log("--- ROOM SALES ---");
  let headerRow = null;
  let roomSalesStart = false;
  
  rows.forEach((row, idx) => {
    if (row.includes("INVOICE NO.") || row.includes("ROOM NO.")) {
      headerRow = row;
      roomSalesStart = true;
      console.log(`[Header] Row ${idx+1}: ${row.slice(0, 15).filter(c => c !== null && c !== '').join(' | ')}`);
      return;
    }
    
    if (roomSalesStart) {
      const isTotal = row[0] === "TOTAL" || row[1] === "TOTAL" || (row[1] === "" && row[3] === "") || idx > 25;
      if (isTotal) {
        roomSalesStart = false;
        console.log(`[End] Row ${idx+1}: ${row.slice(0, 15).filter(c => c !== null && c !== '').join(' | ')}`);
      } else {
        const checkVal = row[1] || row[2] || row[3];
        if (checkVal) {
          console.log(`Row ${idx+1}: ${row.slice(0, 15).map(c => c === null || c === undefined ? "" : c).join(' | ')}`);
        }
      }
    }
  });

  console.log("\n--- FOOD SALES ---");
  rows.forEach((row, idx) => {
    if (row[14] && row[14] !== "FOOD BILL NO" && idx > 1) {
      console.log(`Row ${idx+1}: Bill: ${row[14]} | Room: ${row[2]} | Guest: ${row[3] || row[16]} | Cash: ${row[17] || 0} | UPI: ${row[18] || 0} | Card: ${row[19] || 0} | TreeboComp: ${row[20] || 0} | TreeboCL: ${row[22] || 0} | Disha: ${row[23] || 0} | Total: ${row[24] || 0}`);
    }
  });
});
