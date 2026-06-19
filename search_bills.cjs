const xlsx = require('xlsx');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

try {
  const wb = xlsx.readFile(XLSX_PATH);
  const bills = ["16065", "16066", "16067", "16068", "16063", "16053", "16055", "16057", "16056", "15760", "16038", "16051"];
  
  wb.SheetNames.forEach(sheetName => {
    if (!/^\d{2}\.\d{2}\.\d{2}$/.test(sheetName)) return;
    
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    rows.forEach((row, rIdx) => {
      row.forEach((val, cIdx) => {
        if (val) {
          const str = val.toString();
          bills.forEach(bill => {
            if (str.includes(bill)) {
              console.log(`Sheet: ${sheetName} | Row: ${rIdx+1} | Col: ${cIdx} | Match: ${bill} | Value: "${val}" | Row:`, row);
            }
          });
        }
      });
    });
  });
} catch (e) {
  console.error(e);
}
