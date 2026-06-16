const xlsx = require('xlsx');
const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";
const wb = xlsx.readFile(XLSX_PATH);
const sheets = ['07.06.26', '08.06.26', '09.06.26', '10.06.26'];

// Split multiple room cost centers correctly and format with leading zeroes
function parseRoomCostCentres(roomStr) {
  if (!roomStr) return [];
  let cleaned = roomStr.toString().replace(/[&~,\/\\.+\s\-`]+/g, ',');
  let rooms = cleaned.split(',')
    .map(r => r.trim())
    .filter(r => r !== '' && !isNaN(r));
  return rooms.map(r => {
    let num = parseInt(r);
    if (num < 10) return `Room 0${num}`;
    return `Room ${num}`;
  });
}

const rawStays = [];

sheets.forEach(sheetName => {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return;
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const [d, m, y] = sheetName.split('.');
  const dateTally = `20${y}${m}${d}`;
  const dateFormatted = `20${y}-${m}-${d}`;
  
  let inRoomSection = false;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    const cols = row.map(c => (c !== undefined && c !== null) ? c.toString().trim() : "");
    while (cols.length < 45) cols.push("");
    
    if (cols[1] === "INVOICE NO.") {
      inRoomSection = true;
      continue;
    }
    if (inRoomSection) {
      if (cols[0] === "TOTAL" || cols[1] === "TOTAL" || (cols[1] === "" && cols[3] === "")) {
        inRoomSection = false;
      } else {
        const guestName = cols[3].toUpperCase().replace(/\s+/g, ' ').trim();
        if (!guestName) continue;
        
        const bookingMode = cols[4].toUpperCase().trim();
        const cash = parseFloat(cols[9]) || 0;
        const upi = parseFloat(cols[10]) || 0;
        const card = parseFloat(cols[11]) || 0;
        const pending = isNaN(parseFloat(cols[12])) ? 0 : parseFloat(cols[12]);
        const treebo = parseFloat(cols[13]) || 0;
        const totalAmount = cash + upi + card + pending + treebo;
        
        const invoiceNo = cols[1];
        const rooms = parseRoomCostCentres(cols[2]);
        
        rawStays.push({
          sheet: sheetName,
          date: dateTally,
          dateStr: dateFormatted,
          invoiceNo,
          rooms,
          guest: guestName,
          bookingMode,
          cash,
          upi,
          card,
          pending,
          treebo,
          amount: totalAmount
        });
      }
    }
  }
});

console.log("=== RAW STAYS WITH AMOUNT > 0 ===");
rawStays.filter(s => s.amount > 0).forEach(s => {
  console.log(`Sheet: ${s.sheet} | Guest: ${s.guest} | Room: ${s.rooms.join(',')} | Inv: ${s.invoiceNo} | Cash: ${s.cash} | UPI: ${s.upi} | Card: ${s.card} | Pending: ${s.pending} | Treebo: ${s.treebo} | Amt: ${s.amount}`);
});
