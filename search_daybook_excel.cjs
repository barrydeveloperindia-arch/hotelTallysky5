const xlsx = require('xlsx');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

try {
  const wb = xlsx.readFile(XLSX_PATH);
  const searchTerms = ["TARUN", "APRAJITA", "VIKAS", "VIVEK", "SABANAZ", "ANKIT", "LARISSA", "ENGLABS", "HARPREET", "JOHNEY", "VIPIN"];
  
  wb.SheetNames.forEach(sheetName => {
    if (!/^\d{2}\.\d{2}\.\d{2}$/.test(sheetName)) return; // Only process date sheets
    
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    rows.forEach((row, rIdx) => {
      row.forEach((val, cIdx) => {
        if (val) {
          const str = val.toString().toUpperCase();
          searchTerms.forEach(term => {
            if (str.includes(term)) {
              console.log(`Found [${term}] in Sheet [${sheetName}], Row ${rIdx + 1}, Col ${cIdx}: "${val}"`);
            }
          });
        }
      });
    });
  });
  
} catch (e) {
  console.error(e);
}
