const xlsx = require('xlsx');
const path = require('path');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";
const sheetsToRead = ['07.06.26', '08.06.26', '09.06.26', '10.06.26'];

try {
  const wb = xlsx.readFile(XLSX_PATH);
  
  sheetsToRead.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return;
    
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      const cols = row.map(c => (c !== undefined && c !== null) ? c.toString().trim() : "");
      
      const billNo = cols[14]; // Col O: FOOD BILL NO
      if (billNo && billNo !== "FOOD BILL NO" && r > 1) {
        const roomNo = cols[2] || ""; // Col C: ROOM NO
        const guestName = cols[3] || ""; // Col D: GUEST NAME
        const particulars = cols[15] || ""; // Col P: PARTICULARS
        const foodGuest = cols[16] || ""; // Col Q: GUEST NAME (FOOD)
        const amt = cols[17] || ""; // Col R: AMOUNT
        const paymentMode = cols[18] || ""; // Col S: CASH/CARD/UPI/CL etc.
        
        const isCL = (paymentMode && paymentMode.toUpperCase().includes("CL")) || 
                     (billNo && billNo.toUpperCase().includes("CL")) ||
                     (particulars && particulars.toUpperCase().includes("CL"));
        
        if (isCL || (paymentMode && (paymentMode.toUpperCase().includes("COMPLEMENTARY") || paymentMode.toUpperCase().includes("FOC")))) {
          console.log(`Sheet: ${sheetName} | Row ${r+1} | Bill: ${billNo} | Room: ${roomNo} | Daybook Guest: ${guestName} | Food Guest: ${foodGuest} | Amt: ${amt} | Payment: ${paymentMode} | Particulars: ${particulars}`);
        }
      }
    }
  });
} catch (e) {
  console.error("Error reading sheets:", e);
}
