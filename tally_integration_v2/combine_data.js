const fs = require('fs');

const EXCEL_DATA_PATH = 'C:/Users/Administrator/OneDrive/MANGEMENT FILE/Documents/Antigravity/Hotel/tally_integration_v2/excel_data.json';

function normalizeName(name) {
    if (!name) return "";
    return name.toString().trim().toUpperCase().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
}

function run() {
    let excelData;
    try {
        excelData = JSON.parse(fs.readFileSync(EXCEL_DATA_PATH, 'utf8'));
    } catch(e) {
        console.error("Could not load excel_data.json. Run process_excel.js first.");
        return;
    }

    const { guests, treeboInvoices } = excelData;
    const finalReport = [];

    // We will iterate through days 1 to 10
    for (let day = 1; day <= 10; day++) {
        const dateStr = `${day.toString().padStart(2, '0')}.07.26`;
        const jsonPath = `C:/Users/Administrator/OneDrive/MANGEMENT FILE/Documents/Antigravity/Hotel/tally_integration_v2/data_day_${dateStr}.json`;
        
        if (!fs.existsSync(jsonPath)) {
            console.log(`Skipping ${dateStr} - JSON not found`);
            continue;
        }

        const dayBills = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        for (let bill of dayBills) {
            let reconciledBill = { ...bill };
            const gName = normalizeName(bill.guest_name || bill.bill_to || bill.guestName);
            
            // Treebo logic: missing room and payment breakdown
            if (bill.type && bill.type.toLowerCase().includes('treebo')) {
                // Find in excel by invoice No
                const invStr = (bill.invoice_no || bill.invoiceNo || bill.bill_no || "").toString().trim();
                let guestKey = treeboInvoices[invStr];
                
                // If not found by invoice, fallback to Guest Name search
                if (!guestKey) {
                    const possibleKeys = Object.keys(guests).filter(k => k.startsWith(gName + "_"));
                    if (possibleKeys.length > 0) guestKey = possibleKeys[0];
                }
                
                if (guestKey && guests[guestKey]) {
                    const gData = guests[guestKey];
                    reconciledBill.room_no = gData.roomNo;
                    reconciledBill.payments = gData.roomPayments;
                } else {
                    reconciledBill.warning = "Could not find Treebo data in Excel daybook";
                }
            } 
            // Food Bill Logic
            else if (bill.type && bill.type.toLowerCase().includes('food')) {
                // Determine if it's direct sale (PACKING or no room)
                let isDirect = false;
                if (!bill.room_no || bill.room_no.toString().toLowerCase().includes('packing')) {
                    isDirect = true;
                }
                
                if (isDirect) {
                    // Try to find if they are actually a guest who ordered via table/name
                    const possibleKeys = Object.keys(guests).filter(k => k.startsWith(gName + "_"));
                    if (possibleKeys.length > 0) {
                        const gData = guests[possibleKeys[0]];
                        reconciledBill.payments = gData.foodPayments;
                    }
                }
            }
            
            finalReport.push(reconciledBill);
        }
    }

    const reportPath = 'C:/Users/Administrator/OneDrive/MANGEMENT FILE/Documents/Antigravity/Hotel/tally_integration_v2/final_reconciled_sales.json';
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
    console.log(`Successfully combined PDF and Excel data! Wrote ${finalReport.length} records to ${reportPath}`);
}

run();
