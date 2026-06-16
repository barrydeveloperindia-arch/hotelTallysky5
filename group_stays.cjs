const xlsx = require('xlsx');
const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";
const wb = xlsx.readFile(XLSX_PATH);
const sheets = ['07.06.26', '08.06.26', '09.06.26', '10.06.26'];

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
        
        const invoiceNo = cols[1];
        const rooms = parseRoomCostCentres(cols[2]);
        
        rawStays.push({
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
          treebo
        });
      }
    }
  }
});

// Grouping logic
// We group by guest name and room cost centres
const groups = {};
rawStays.forEach(s => {
  const key = `${s.guest}|${s.rooms.join(',')}`;
  if (!groups[key]) {
    groups[key] = [];
  }
  groups[key].push(s);
});

console.log("=== GROUPED STAYS ===");
Object.keys(groups).forEach(key => {
  const list = groups[key];
  // Find invoice number
  let invoiceNo = "";
  let invoiceDate = "";
  let invoiceDateStr = "";
  for (const s of list) {
    if (s.invoiceNo && s.invoiceNo !== "CONTINUE") {
      invoiceNo = s.invoiceNo;
      invoiceDate = s.date;
      invoiceDateStr = s.dateStr;
    }
  }
  
  // Sum amounts (ignoring pending unless it is a check-out stay and there is no other payment, or wait:
  // how do we sum stay rent?)
  // Let's sum cash, upi, card, treebo across all days.
  let cash = 0, upi = 0, card = 0, treebo = 0;
  list.forEach(s => {
    cash += s.cash;
    upi += s.upi;
    card += s.card;
    treebo += s.treebo;
  });
  
  // If total payment is 0, check if there's pending amount on the last day of the stay
  let pending = 0;
  const lastDay = list[list.length - 1];
  if (cash + upi + card + treebo === 0) {
    pending = lastDay.pending;
  }
  
  const totalAmount = cash + upi + card + treebo + pending;
  
  if (totalAmount > 0) {
    console.log(`Key: ${key}`);
    console.log(`  Resolved Invoice: ${invoiceNo || "NONE"} on Date: ${invoiceDateStr || "NONE"}`);
    console.log(`  Payments - Cash: ${cash}, UPI: ${upi}, Card: ${card}, Treebo: ${treebo}, Pending: ${pending}`);
    console.log(`  Total Stay Amount: ${totalAmount}`);
  }
});
