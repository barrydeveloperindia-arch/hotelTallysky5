const xlsx = require('xlsx');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

try {
  const wb = xlsx.readFile(XLSX_PATH);
  
  const sheetsToDump = ['01.06.26', '02.06.26', '04.06.26'];
  
  sheetsToDump.forEach(sheetName => {
    console.log(`\n========================================`);
    console.log(`SHEET: ${sheetName}`);
    console.log(`========================================`);
    const sheet = wb.Sheets[sheetName];
    if (!sheet) {
      console.log("Not found!");
      return;
    }
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    rows.forEach((row, rIdx) => {
      // Print row if it has non-empty values
      const hasContent = row.some(val => val !== undefined && val !== null && val.toString().trim() !== "");
      if (hasContent) {
        // Format row to only show columns up to the last non-empty column
        let lastIdx = row.length - 1;
        while (lastIdx >= 0 && (row[lastIdx] === undefined || row[lastIdx] === null || row[lastIdx].toString().trim() === "")) {
          lastIdx--;
        }
        const filteredRow = row.slice(0, lastIdx + 1).map(val => val !== undefined && val !== null ? val : "");
        console.log(`Row ${rIdx + 1}:`, filteredRow);
      }
    });
  });
} catch (e) {
  console.error(e);
}
