const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

const sheetsToRead = ['07.06.26', '08.06.26', '09.06.26', '10.06.26'];

try {
  const wb = xlsx.readFile(XLSX_PATH);
  
  sheetsToRead.forEach(sheetName => {
    console.log(`\n================================================================================`);
    console.log(`SHEET: ${sheetName}`);
    console.log(`================================================================================`);
    
    const sheet = wb.Sheets[sheetName];
    if (!sheet) {
      console.log(`Sheet ${sheetName} not found!`);
      return;
    }
    
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("--- ROOM SALES SECTION ---");
    let inRoomSection = false;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      const cols = row.map(c => (c !== undefined && c !== null) ? c.toString().trim() : "");
      
      if (cols[1] === "INVOICE NO.") {
        inRoomSection = true;
        console.log(`Row ${r+1}: Header found: ${cols.slice(0, 15).join(' | ')}`);
        continue;
      }
      if (inRoomSection) {
        if (cols[0] === "TOTAL" || cols[1] === "TOTAL" || (cols[1] === "" && cols[3] === "")) {
          inRoomSection = false;
          console.log(`Row ${r+1}: Total or End of Section found: ${cols.slice(0, 15).join(' | ')}`);
        } else {
          console.log(`Row ${r+1}: ${cols.slice(0, 15).join(' | ')}`);
        }
      }
    }
    
    console.log("\n--- FOOD SALES SECTION ---");
    // Print row values where food sales columns (column 14 is FOOD BILL NO) are populated
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      const cols = row.map(c => (c !== undefined && c !== null) ? c.toString().trim() : "");
      if (cols[14] !== undefined && cols[14] !== "" && cols[14] !== "FOOD BILL NO" && r > 1) {
        console.log(`Row ${r+1}: ${cols.slice(14, 25).join(' | ')} (Room: ${cols[2]}, Guest: ${cols[3] || cols[16]})`);
      }
    }
  });
  
} catch (e) {
  console.error("Error reading Excel data:", e);
}
