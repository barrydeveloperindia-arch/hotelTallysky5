const fs = require('fs');

const ocrText = fs.readFileSync('C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sales_bills_ocr_results.txt', 'utf8');
const entries = ocrText.split(/={80}\r?\nFILE:\s*/);

// Daybook data
const sheets = ['07.06.26', '08.06.26', '09.06.26', '10.06.26'];
const daybookRooms = [];
const daybookFood = [];

sheets.forEach(sheetName => {
  const filePath = `C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\sheet_${sheetName}.json`;
  if (!fs.existsSync(filePath)) return;
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let headerRow = null;
  let roomSalesStart = false;
  
  rows.forEach((row, idx) => {
    if (row.includes("INVOICE NO.") || row.includes("ROOM NO.")) {
      headerRow = row;
      roomSalesStart = true;
      return;
    }
    if (roomSalesStart) {
      const isTotal = row[0] === "TOTAL" || row[1] === "TOTAL" || (row[1] === "" && row[3] === "") || idx > 25;
      if (isTotal) {
        roomSalesStart = false;
      } else {
        const checkVal = row[1] || row[2] || row[3];
        if (checkVal) {
          daybookRooms.push({
            sheet: sheetName,
            rowIdx: idx + 1,
            invoiceNo: row[1] || '',
            roomNo: row[2] || '',
            guestName: row[3] || '',
            bookingMode: row[4] || '',
            checkIn: row[5] || '',
            checkOut: row[7] || '',
            cash: parseFloat(row[9]) || 0,
            upi: parseFloat(row[10]) || 0,
            card: parseFloat(row[11]) || 0,
            pending: parseFloat(row[12]) || 0,
            treebo: parseFloat(row[13]) || 0,
            foodBillNo: row[14] || ''
          });
        }
      }
    }
  });
  
  rows.forEach((row, idx) => {
    if (row[14] && row[14] !== "FOOD BILL NO" && idx > 1) {
      daybookFood.push({
        sheet: sheetName,
        rowIdx: idx + 1,
        billNo: row[14],
        roomNo: row[2],
        guestName: row[3] || row[16] || '',
        cash: parseFloat(row[17]) || 0,
        upi: parseFloat(row[18]) || 0,
        card: parseFloat(row[19]) || 0,
        treeboComp: parseFloat(row[20]) || 0,
        treeboCL: parseFloat(row[22]) || 0,
        disha: parseFloat(row[23]) || 0,
        total: parseFloat(row[24]) || 0
      });
    }
  });
});

const results = [];

entries.forEach(entry => {
  if (!entry.trim()) return;
  const parts = entry.split(/={80}\r?\n/);
  if (parts.length < 2) return;
  
  const fileName = parts[0].trim();
  const content = parts[1];
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  
  let billNo = 'N/A';
  let guestName = 'N/A';
  let roomNo = 'N/A';
  let tableNo = 'N/A';
  let date = 'N/A';
  let netAmt = 'N/A';
  let payMode = 'N/A';
  
  lines.forEach(line => {
    const billMatch = line.match(/(?:Bill\s*No|Invoice\s*No|pos\s*no|Invoice\s*No|Bin\s*No)\.?\s*[:\.-]?\s*([^\s]+)/i);
    if (billMatch && billNo === 'N/A') billNo = billMatch[1].trim();
    
    const dateMatch = line.match(/(?:Date|Invoice\s*Date|Arrival-Oate|Arrival-Date)\s*[:\.-]?\s*(\d{2}-[A-Za-z0-9]{3}-\d{2}|\d{2}-\d{2}-\d{2}|\d{2}\s+[A-Za-z0-9]{3}\s+\d{4})/i);
    if (dateMatch && date === 'N/A') date = dateMatch[1].trim();
    
    const guestMatch = line.match(/(?:Guest\s*Name|Charges\s*to|Booking\s*for)\s*[:\.-]?\s*(.+)/i);
    if (guestMatch && guestName === 'N/A') guestName = guestMatch[1].trim().replace(/^MR\s*|MR\.\s*/i, '');
    
    const roomMatch = line.match(/(?:Room\s*No)\.?\s*[:\.-]?\s*([^\s]+)/i);
    if (roomMatch && roomNo === 'N/A') roomNo = roomMatch[1].trim();
    
    const tableMatch = line.match(/(?:Table\s*No)\.?\s*[:\.-]?\s*([^\s]+)/i);
    if (tableMatch && tableNo === 'N/A') tableNo = tableMatch[1].trim();
    
    const payMatch = line.match(/(?:Payment|payment)\s*Mode\s*[:\.-]?\s*(.+)/i);
    if (payMatch && payMode === 'N/A') payMode = payMatch[1].trim();
  });
  
  if (guestName === 'N/A') {
    const walkInGuestMatch = content.match(/(?:Walk\s*In\s*Guest|Walk\s*Guest)\r?\n([^\r\n]+)/i);
    if (walkInGuestMatch) {
      guestName = walkInGuestMatch[1].trim().replace(/^MR\s*|MR\.\s*/i, '');
    }
  }
  
  if (payMode === 'N/A') {
    if (content.toLowerCase().includes('payment mode : cash') || content.toLowerCase().includes('payment mode: cash') || content.toLowerCase().includes('payment mode : cash')) {
      payMode = 'Cash';
    } else if (content.toLowerCase().includes('payment mode : room credit') || content.toLowerCase().includes('payment mode: room credit') || content.toLowerCase().includes('payment mod : room credit')) {
      payMode = 'Room Credit';
    }
  }
  
  const netRecMatch = content.match(/(?:Net\s*Receivable\s*Rs|Net\s*Receivable|Total\s*Bill\s*Amount|Net\s*Amount\s*Rs|Rent\s*\(Inc\s*Taxes\)|Total\s*Amount\s*Rs|Bill\s*Amount)\.?\s*[:\.-]?\s*([0-9\.,]+)/i);
  if (netRecMatch) {
    netAmt = netRecMatch[1].replace(/,/g, '').trim();
  }
  if (netAmt === 'N/A') {
    const rentMatch = content.match(/Rent\s*\(Inc\s*Taxes\):\r?\n?\s*([0-9\.,]+)/i);
    if (rentMatch) {
      netAmt = rentMatch[1].replace(/,/g, '').trim();
    }
  }
  if (netAmt !== 'N/A') {
    netAmt = parseFloat(netAmt).toFixed(2);
  }
  
  // Try to match with Daybook Room Sales
  let matchedRoom = null;
  let matchedFood = null;
  
  if (fileName.includes("11.58.18")) { // Abdul Dawood Khan checkout
    matchedRoom = daybookRooms.find(r => r.guestName && r.guestName.toString().toLowerCase().includes("abdul") && r.sheet === '09.06.26');
  } else if (fileName.includes("11.57.47")) { // Kailash checkout
    matchedRoom = daybookRooms.find(r => r.guestName && r.guestName.toString().toLowerCase().includes("kailash"));
  } else if (fileName.includes("11.57.11")) { // Parveen checkout
    matchedRoom = daybookRooms.find(r => r.guestName && r.guestName.toString().toLowerCase().includes("parveen"));
  } else if (fileName.includes("11.57.28")) { // Tarun Sharma checkout
    matchedRoom = daybookRooms.find(r => r.guestName && r.guestName.toString().toLowerCase().includes("tarun sharma"));
  }
  
  // Match Food Bills
  if (billNo !== 'N/A') {
    const cleanBillNo = billNo.replace(/^pos-/i, '').split('-')[0];
    matchedFood = daybookFood.find(f => f.billNo && f.billNo.toString().includes(cleanBillNo));
  }
  
  results.push({
    fileName,
    billNo,
    date,
    guestName,
    roomNo: roomNo !== 'N/A' ? roomNo : (tableNo !== 'N/A' ? `Table ${tableNo}` : 'N/A'),
    netAmt,
    payMode,
    matchedRoom: matchedRoom ? `Sheet: ${matchedRoom.sheet}, Row: ${matchedRoom.rowIdx}, Guest: ${matchedRoom.guestName}, Amt: ${matchedRoom.cash + matchedRoom.upi + matchedRoom.card + matchedRoom.treebo}` : 'N/A',
    matchedFood: matchedFood ? `Sheet: ${matchedFood.sheet}, Row: ${matchedFood.rowIdx}, Guest: ${matchedFood.guestName}, Total: ${matchedFood.total || matchedFood.treeboComp || matchedFood.treeboCL}` : 'N/A'
  });
});

console.log(JSON.stringify(results, null, 2));
fs.writeFileSync('C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\matching_reconciliation.json', JSON.stringify(results, null, 2));
