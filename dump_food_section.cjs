const xlsx = require('xlsx');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";
const sheetsToRead = ['07.06.26', '08.06.26', '09.06.26', '10.06.26'];

try {
  const wb = xlsx.readFile(XLSX_PATH);
  
  sheetsToRead.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return;
    
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n================ SHEET: ${sheetName} ================`);
    
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      const cols = row.map(c => (c !== undefined && c !== null) ? c.toString().trim() : "");
      
      const billNo = cols[14];
      if (billNo && billNo !== "FOOD BILL NO" && r > 1) {
        console.log(`Row ${r+1} | Bill: ${billNo} | Cols 14-20: [${cols.slice(14, 21).join('] [')}]`);
      }
    }
  });
} catch (e) {
  console.error(e);
}
