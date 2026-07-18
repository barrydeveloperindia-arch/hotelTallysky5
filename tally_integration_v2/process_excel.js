const xlsx = require('xlsx');
const fs = require('fs');

const EXCEL_PATH = 'C:/Users/Administrator/OneDrive/MANGEMENT FILE/Documents/Antigravity/Hotel/Sales Bills/july/1JULY TO 10 JLUY/Daily Sale Repot june-26 pdf file/NEW DAYBOOK-2026.xlsx';
const OUTPUT_PATH = 'C:/Users/Administrator/OneDrive/MANGEMENT FILE/Documents/Antigravity/Hotel/tally_integration_v2/excel_data.json';

function normalizeName(name) {
    if (!name) return "";
    return name.toString().trim().toUpperCase().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
}

function processExcel() {
    console.log("Reading Excel file...");
    const workbook = xlsx.readFile(EXCEL_PATH);
    const julySheets = workbook.SheetNames.filter(name => name.includes('.07.26'));
    
    // Structure: { guestName: { roomNo, payments: { cash, upi, card, pending, treeboPaid }, checkIn, checkOut } }
    // Since names might duplicate over months, we will key by Guest Name + Check-In Date
    const guests = {};
    const treeboInvoices = {}; // invoice no -> guest data

    julySheets.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, {header: 1});
        
        // Find headers
        let headerRowIdx = -1;
        for(let i=0; i<Math.min(10, rows.length); i++) {
            if(rows[i] && rows[i].includes('GUEST NAME') && rows[i].includes('ROOM NO.')) {
                headerRowIdx = i;
                break;
            }
        }
        
        if (headerRowIdx === -1) return;
        
        const headers = rows[headerRowIdx];
        const getIdx = (name) => headers.findIndex(h => typeof h === 'string' && h.includes(name));
        
        const idxInvoice = getIdx('INVOICE NO.');
        const idxRoom = getIdx('ROOM NO.');
        const idxGuest = getIdx('GUEST NAME');
        const idxCheckIn = getIdx('CHECK IN DATE');
        const idxCheckOut = getIdx('CHECK OUT DATE');
        
        const idxCash = getIdx('ROOM CASH PAYMENT');
        const idxUpi = getIdx('ROOM \r\nUPI PAYMENT') === -1 ? getIdx('ROOM \nUPI PAYMENT') : getIdx('ROOM \r\nUPI PAYMENT'); // handle newlines
        // Better way to find payment cols:
        const findCol = (str) => headers.findIndex(h => typeof h === 'string' && h.replace(/[\r\n\s]+/g, '').includes(str.replace(/\s+/g, '')));
        
        const pCash = findCol('ROOMCASHPAYMENT');
        const pUpi = findCol('ROOMUPIPAYMENT');
        const pCard = findCol('ROOMCARDPAYMENT');
        const pPending = findCol('ROOMPENDINGPAYMENT');
        const pTreebo = findCol('ROOMTREEBOPAID');
        
        const fCash = findCol('FOODBILLCASH');
        const fUpi = findCol('FOODBILLUPI');
        const fCard = findCol('FOODBILLCARD');
        const fPending = findCol('FOODBILLPENDING');
        const fTreebo = findCol('TREEBOCLFOOD');

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[idxGuest]) continue;
            
            const guestName = normalizeName(row[idxGuest]);
            const checkIn = row[idxCheckIn];
            const key = guestName + "_" + checkIn;
            
            if (!guests[key]) {
                guests[key] = {
                    guestName: guestName,
                    roomNo: row[idxRoom],
                    invoiceNo: row[idxInvoice],
                    checkIn: checkIn,
                    checkOut: row[idxCheckOut],
                    roomPayments: { cash: 0, upi: 0, card: 0, pending: 0, treebo: 0 },
                    foodPayments: { cash: 0, upi: 0, card: 0, pending: 0, treebo: 0 },
                    days: []
                };
            }
            
            const parseAmt = (val) => {
                if (!val) return 0;
                if (typeof val === 'number') return val;
                // sometimes amounts are "13763/.805"
                const parts = val.toString().split(/[/\.]/);
                let sum = 0;
                for (let p of parts) {
                    const num = parseFloat(p.replace(/[^0-9\.]/g, ''));
                    if (!isNaN(num)) sum += num;
                }
                return sum;
            };

            guests[key].roomPayments.cash += parseAmt(row[pCash]);
            guests[key].roomPayments.upi += parseAmt(row[pUpi]);
            guests[key].roomPayments.card += parseAmt(row[pCard]);
            guests[key].roomPayments.pending += parseAmt(row[pPending]);
            guests[key].roomPayments.treebo += parseAmt(row[pTreebo]);

            guests[key].foodPayments.cash += parseAmt(row[fCash]);
            guests[key].foodPayments.upi += parseAmt(row[fUpi]);
            guests[key].foodPayments.card += parseAmt(row[fCard]);
            guests[key].foodPayments.pending += parseAmt(row[fPending]);
            guests[key].foodPayments.treebo += parseAmt(row[fTreebo]);
            
            guests[key].days.push(sheetName);
            
            if (row[idxCheckOut] && row[idxCheckOut].toString().toUpperCase() !== 'CONTINUE') {
                guests[key].checkOut = row[idxCheckOut];
            }
            
            if (row[idxInvoice]) {
                treeboInvoices[row[idxInvoice].toString().trim()] = key;
            }
        }
    });
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ guests, treeboInvoices }, null, 2));
    console.log(`Saved Excel data for ${Object.keys(guests).length} guests to ${OUTPUT_PATH}`);
}

processExcel();
