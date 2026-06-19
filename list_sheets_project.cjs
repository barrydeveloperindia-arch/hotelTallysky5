const xlsx = require('xlsx');
const path = require('path');
const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

try {
  const wb = xlsx.readFile(XLSX_PATH);
  console.log('Sheet count:', wb.SheetNames.length);
  // List sheets matching June/dates
  const jSheets = wb.SheetNames.filter(s => {
    // DD.MM.YY format, e.g. 09.06.26
    return /^\d{2}\.\d{2}\.\d{2}$/.test(s) && (s.endsWith('.06.26') || s.startsWith('09') || s.startsWith('08') || s.startsWith('07') || s.startsWith('10'));
  });
  console.log('Matching Sheets:', jSheets);
} catch (e) {
  console.error('Error reading Excel file:', e);
}
