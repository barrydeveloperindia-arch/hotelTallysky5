const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const XLSX_PATH = "C:\\Users\\Administrator\\OneDrive\\MANGEMENT FILE\\MANAGEMENT OLD FILE\\NEW DAYBOOK-2026.xlsx";

// Helper to extract room numbers from a cell value
function extractRoomNumbers(roomField) {
  if (!roomField) return [];
  // Clean and split by common delimiters: comma, slash, dot, ampersand, tilde, backtick, space
  let cleaned = roomField.toString().replace(/[&~,\/\\.+\s\-`]+/g, ',');
  return cleaned.split(',')
    .map(r => r.trim())
    .filter(r => r !== '' && !isNaN(r))
    .map(r => parseInt(r).toString()); // Normalize "02" to "2"
}

// Helper to extract room numbers from text (remarks / particulars) for expenses
function extractRoomFromText(text) {
  if (!text) return null;
  // Match patterns like: "Room 5", "Room No 5", "Room No. 5", "R-5", "R5" (case insensitive)
  const roomRegex = /(?:room\s*(?:no\.?)?\s*|r\s*-?\s*)(\d+)/i;
  const match = text.match(roomRegex);
  if (match) {
    return parseInt(match[1]).toString();
  }
  return null;
}

function parseDayBook() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error("Excel file not found at: " + XLSX_PATH);
    return { error: "Excel file not found" };
  }

  const workbook = xlsx.readFile(XLSX_PATH);
  const dataByRoom = {};
  const dailySummary = {};
  
  // Track all unique rooms we find
  const allRooms = new Set();

  workbook.SheetNames.forEach(sheetName => {
    // Check if sheet name is in format dd.MM.yy (e.g. 01.04.26)
    if (!/^\d{2}\.\d{2}\.\d{2}$/.test(sheetName)) {
      return; // Skip non-date sheets
    }

    // Parse date
    const [day, month, year] = sheetName.split('.');
    const dateStr = `20${year}-${month}-${day}`; // Normalize to YYYY-MM-DD
    const monthName = new Date(parseInt(`20${year}`), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let inRoomSection = false;
    let inExpenseSection = false;
    let inPurchaseSection = false;
    let inReceiptSection = false;
    let inContraSection = false;

    // Daily totals to aggregate
    let dailyRoomSales = [];
    let dailyFoodSales = [];
    let dailyExpenses = [];
    let dailyPurchases = [];
    let dailyReceipts = [];
    let dailyContras = [];

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      const cols = row.map(c => (c !== undefined && c !== null) ? c.toString().trim() : "");

      // Pad array to size 45 to avoid undefined index errors
      while (cols.length < 45) {
        cols.push("");
      }

      // --- ROOM SALES SECTION ---
      if (cols[1] === "INVOICE NO.") {
        inRoomSection = true;
        continue;
      }
      if (inRoomSection) {
        if (cols[0] === "TOTAL" || cols[1] === "TOTAL" || (cols[1] === "" && cols[3] === "")) {
          inRoomSection = false;
        } else {
          const roomField = cols[2];
          const rooms = extractRoomNumbers(roomField);
          const guestName = cols[3];
          const bookingMode = cols[4];
          const cash = parseFloat(cols[9]) || 0;
          const upi = parseFloat(cols[10]) || 0;
          const card = parseFloat(cols[11]) || 0;
          const treebo = parseFloat(cols[13]) || 0;
          const total = cash + upi + card + treebo;

          if (rooms.length > 0 && total > 0) {
            const splitTotal = total / rooms.length;
            const splitCash = cash / rooms.length;
            const splitUPI = upi / rooms.length;
            const splitCard = card / rooms.length;
            const splitTreebo = treebo / rooms.length;

            rooms.forEach(room => {
              allRooms.add(room);
              dailyRoomSales.push({
                room,
                guestName,
                bookingMode,
                cash: splitCash,
                upi: splitUPI,
                card: splitCard,
                treebo: splitTreebo,
                total: splitTotal,
                row: r + 1
              });
            });
          }
        }
      }

      // --- FOOD SALES SECTION (Cols 15-24) ---
      if (cols[14] !== "" && cols[14] !== "FOOD BILL NO" && cols[14] !== "TOTAL" && r > 1) {
        const billNo = cols[14];
        const roomField = cols[2]; // Read from main Room No column
        const rooms = extractRoomNumbers(roomField);
        const guestName = cols[3]; // Guest name is in Column D (index 3)
        const cash = parseFloat(cols[15]) || 0;
        const upi = parseFloat(cols[16]) || 0;
        const card = parseFloat(cols[17]) || 0;
        const treeboComp = parseFloat(cols[18]) || 0;
        const pending = parseFloat(cols[19]) || 0;
        const treeboCL = parseFloat(cols[20]) || 0;
        const disha = parseFloat(cols[21]) || 0;
        const total = cash + upi + card + treeboComp + pending + treeboCL + disha;

        if (total > 0) {
          // If no room is specified, treat as "Walk-in"
          const targetRooms = rooms.length > 0 ? rooms : ["Walk-in"];
          const splitTotal = total / targetRooms.length;
          const splitCash = cash / targetRooms.length;
          const splitUPI = upi / targetRooms.length;
          const splitCard = card / targetRooms.length;
          const splitTreeboComp = treeboComp / targetRooms.length;
          const splitPending = pending / targetRooms.length;
          const splitTreeboCL = treeboCL / targetRooms.length;
          const splitDisha = disha / targetRooms.length;

          targetRooms.forEach(room => {
            allRooms.add(room);
            dailyFoodSales.push({
              room,
              billNo,
              guestName,
              cash: splitCash,
              upi: splitUPI,
              card: splitCard,
              treeboComp: splitTreeboComp,
              pending: splitPending,
              treeboCL: splitTreeboCL,
              disha: splitDisha,
              total: splitTotal,
              row: r + 1
            });
          });
        }
      }

      // --- EXPENSES SECTION ---
      if (cols[24] === "VCH TYPE" && cols[27] === "PARTICULARS") {
        inExpenseSection = true;
        continue;
      }
      if (inExpenseSection) {
        if (cols[24] === "TOTAL" || cols[23] === "TOTAL" || (cols[24] === "" && cols[25] === "")) {
          inExpenseSection = false;
        } else {
          const vchNo = cols[25];
          const paidTo = cols[26];
          const particulars = cols[27];
          const total = parseFloat(cols[32]) || 0;
          const remarks = cols[36] || "";

          // Attribute to room if room number found in remarks or particulars
          const room = extractRoomFromText(remarks) || extractRoomFromText(particulars) || extractRoomFromText(paidTo);
          if (room) {
            allRooms.add(room);
          }

          dailyExpenses.push({
            vchNo,
            paidTo,
            particulars,
            total,
            remarks,
            room,
            row: r + 1
          });
        }
      }

      // --- PURCHASES SECTION ---
      if (cols[24] === "VCH TYPE" && cols[28] === "PARTICULARS" && cols[27] === "PARTY NAME") {
        inPurchaseSection = true;
        continue;
      }
      if (inPurchaseSection) {
        if (cols[24] === "TOTAL" || cols[23] === "TOTAL" || (cols[24] === "" && cols[25] === "")) {
          inPurchaseSection = false;
        } else {
          const vchNo = cols[25];
          const partyName = cols[27];
          const particulars = cols[28];
          const total = parseFloat(cols[33]) || 0;
          const remarks = cols[41] || "";

          const room = extractRoomFromText(remarks) || extractRoomFromText(particulars) || extractRoomFromText(partyName);
          if (room) {
            allRooms.add(room);
          }

          dailyPurchases.push({
            vchNo,
            partyName,
            particulars,
            total,
            remarks,
            room,
            row: r + 1
          });
        }
      }

      // --- RECEIPTS SECTION ---
      if (cols[24] === "VCH TYPE" && cols[27] === "RECEIVED FROM") {
        inReceiptSection = true;
        continue;
      }
      if (inReceiptSection) {
        if (cols[24] === "TOTAL" || cols[23] === "TOTAL" || (cols[24] === "" && cols[25] === "")) {
          inReceiptSection = false;
        } else {
          const vchNo = cols[25];
          const receivedFrom = cols[27];
          const particulars = cols[28];
          const total = parseFloat(cols[33]) || 0;
          const remarks = cols[35] || "";

          dailyReceipts.push({
            vchNo,
            receivedFrom,
            particulars,
            total,
            remarks,
            row: r + 1
          });
        }
      }

      // --- CONTRA SECTION ---
      if (cols[24] === "VCH TYPE" && cols[27] === "PAID FROM") {
        inContraSection = true;
        continue;
      }
      if (inContraSection) {
        if (cols[24] === "TOTAL" || cols[23] === "TOTAL" || (cols[24] === "" && cols[25] === "")) {
          inContraSection = false;
        } else {
          const vchNo = cols[25];
          const paidFrom = cols[27];
          const paidTo = cols[28];
          const total = parseFloat(cols[31]) || 0;
          const remarks = cols[32] || "";

          dailyContras.push({
            vchNo,
            paidFrom,
            paidTo,
            total,
            remarks,
            row: r + 1
          });
        }
      }
    }

    // Allocate parsed data to rooms for this day
    dailyRoomSales.forEach(sale => {
      initRoomData(dataByRoom, sale.room, monthName);
      dataByRoom[sale.room].months[monthName].roomSales.push({
        date: dateStr,
        sheetName,
        ...sale
      });
      dataByRoom[sale.room].months[monthName].totalRoomSales += sale.total;
    });

    dailyFoodSales.forEach(sale => {
      initRoomData(dataByRoom, sale.room, monthName);
      dataByRoom[sale.room].months[monthName].foodSales.push({
        date: dateStr,
        sheetName,
        ...sale
      });
      dataByRoom[sale.room].months[monthName].totalFoodSales += sale.total;
    });

    // Attribute expenses to rooms
    dailyExpenses.forEach(exp => {
      if (exp.room) {
        initRoomData(dataByRoom, exp.room, monthName);
        dataByRoom[exp.room].months[monthName].expenses.push({
          date: dateStr,
          sheetName,
          type: "Expense",
          ...exp
        });
        dataByRoom[exp.room].months[monthName].totalExpenses += exp.total;
      }
    });

    dailyPurchases.forEach(pur => {
      if (pur.room) {
        initRoomData(dataByRoom, pur.room, monthName);
        dataByRoom[pur.room].months[monthName].expenses.push({
          date: dateStr,
          sheetName,
          type: "Purchase",
          ...pur
        });
        dataByRoom[pur.room].months[monthName].totalExpenses += pur.total;
      }
    });

    // Daily summary
    dailySummary[dateStr] = {
      sheetName,
      monthName,
      roomSalesCount: dailyRoomSales.length,
      foodSalesCount: dailyFoodSales.length,
      expensesCount: dailyExpenses.length,
      purchasesCount: dailyPurchases.length,
      receiptsCount: dailyReceipts.length,
      contrasCount: dailyContras.length,
      roomSalesTotal: dailyRoomSales.reduce((a, b) => a + b.total, 0),
      foodSalesTotal: dailyFoodSales.reduce((sum, item) => sum + (item.total - item.treeboComp - item.treeboCL), 0),
      expensesTotal: dailyExpenses.reduce((a, b) => a + b.total, 0),
      purchasesTotal: dailyPurchases.reduce((a, b) => a + b.total, 0),
      receiptsTotal: dailyReceipts.reduce((a, b) => a + b.total, 0),
      contrasTotal: dailyContras.reduce((a, b) => a + b.total, 0)
    };
  });

  return {
    rooms: Array.from(allRooms).sort((a, b) => parseInt(a) - parseInt(b)),
    roomData: dataByRoom,
    dailySummary
  };
}

function initRoomData(dataByRoom, room, monthName) {
  if (!dataByRoom[room]) {
    dataByRoom[room] = {
      room,
      months: {}
    };
  }
  if (!dataByRoom[room].months[monthName]) {
    dataByRoom[room].months[monthName] = {
      monthName,
      totalRoomSales: 0,
      totalFoodSales: 0,
      totalExpenses: 0,
      roomSales: [],
      foodSales: [],
      expenses: []
    };
  }
}

module.exports = { parseDayBook };
