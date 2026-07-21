const fs = require('fs');
const skill_tally_auditor = require('./skill_tally_auditor.js');


function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe).replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}


function parseRooms(r) {
    if (!r) return [];
    let rStr = r.toString().trim().toUpperCase();
    if (!rStr) return [];
    
    // Ignore non-room entries
    if (rStr.includes('MD SIR') || rStr.includes('A&A') || rStr.includes('SHREEYA') || rStr.includes('ENGLABS') || rStr.includes('S& A')) {
        return [];
    }
    
    let cleaned = rStr.replace(/CL/g, '').trim();
    let parts = cleaned.split(/[^0-9]+/);
    
    let rooms = [];
    for (let part of parts) {
        if (!part) continue;
        let p = part;
        if (p === '1061') p = '106'; 
        
        if (p.length <= 2 && parseInt(p) > 0) {
            p = (parseInt(p) + 100).toString();
        }
        
        if (p) rooms.push(`Room ${p}`);
    }
    
    return rooms;
}

function generateRoomCostCentresXml(categoryName, amount, roomCostCentres, isNegative = false) {
    if (!roomCostCentres || roomCostCentres.length === 0) roomCostCentres = ['Walk-in Guest'];
    let count = roomCostCentres.length;
    let splitAmt = Math.floor((Math.abs(amount) / count) * 100) / 100;
    let remainder = Math.round((Math.abs(amount) - (splitAmt * count)) * 100) / 100;
    
    let xml = `\n${generateRoomCostCentresXml('Rooms', sale.basicAmount, roomCostCentres)}`;
    return xml;
}
function formatDateForTally(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function getSalesLedger(hasGst, isEnglabs, isFood = false, cgst = 0, sgst = 0, basic = 0) {
    let rate = 12; // default for Master/Treebo
    if (basic > 0 && (cgst > 0 || sgst > 0)) {
        const totalTax = cgst + sgst;
        const calcRate = Math.round((totalTax / basic) * 100);
        if (calcRate === 5 || calcRate === 12) {
            rate = calcRate;
        }
    }
    if (isFood) rate = 5;

    if (isFood) {
        return 'Sale 5% Haryana B2C';
    } else {
        if (isEnglabs) {
            return 'SALES B2B 5% HARYANA';
        } else {
            return rate === 12 ? 'SALE 12% Haryana B2C' : 'Sale 5% Haryana B2C';
        }
    }
}

const usedVoucherNumbers = new Set();
function getUniqueVoucherNumber(base) {
    let vch = base;
    let suffix = 1;
    while (usedVoucherNumbers.has(vch)) {
        vch = base + '-' + suffix;
        suffix++;
    }
    usedVoucherNumbers.add(vch);
    return vch;
}

function buildPaymentJournals(sale) {
      if (!sale.payments) return '';
      let envelope = '';
      const billRef = sale.billNo || sale.invoiceNo || 'UNKNOWN';
      const tDate = formatDateForTally(sale.date);
      
      const paymentsArr = [];
      const p = sale.payments;
      if (p.cash > 0) paymentsArr.push({mode: 'Cash', amount: p.cash});
      if (p.upi > 0) paymentsArr.push({mode: 'UPI', amount: p.upi});
      if (p.card > 0) paymentsArr.push({mode: 'Card', amount: p.card});
      if (p.treebo > 0) paymentsArr.push({mode: 'Treebo Paid', amount: p.treebo});
      
      for (const pay of paymentsArr) {
          // Cash/UPI/Card ledgers are determined per user requirements
          const debitLedger = pay.mode === 'Cash' ? 'CASH' 
                            : pay.mode === 'Treebo Paid' ? 'Treebo Paid'
                            : 'CONSUMER'; // UPI/Card
          
          const isCash = pay.mode === 'Cash';
          const vchType = isCash ? 'Receipt' : 'Journal';

          envelope += `
          <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER REMOTEID="HotelSky5-PAY-${escapeXml(pay.mode).replace(/\s+/g, '-')}-${escapeXml(billRef)}" VCHTYPE="${vchType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
                  <DATE>${tDate}</DATE>
                  <VOUCHERTYPENAME>${vchType}</VOUCHERTYPENAME>
                  <VOUCHERNUMBER>${getUniqueVoucherNumber("PAY-" + escapeXml(pay.mode).replace(/\s+/g, "") + "-" + escapeXml(billRef))}</VOUCHERNUMBER>
                  <PARTYLEDGERNAME>${escapeXml(sale.guestName)}</PARTYLEDGERNAME>
                  <ALLLEDGERENTRIES.LIST>
                      <LEDGERNAME>${escapeXml(debitLedger)}</LEDGERNAME>
                      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                      <AMOUNT>-${pay.amount}</AMOUNT>
                  </ALLLEDGERENTRIES.LIST>
                  <ALLLEDGERENTRIES.LIST>
                      <LEDGERNAME>${escapeXml(sale.guestName)}</LEDGERNAME>
                      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                      <AMOUNT>${pay.amount}</AMOUNT>
                  </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
          </TALLYMESSAGE>`;
      }
      return envelope;
  }

function buildRoomSaleVoucher(sale) {
    const salesLedger = getSalesLedger(!!sale.gstNo, (sale.guestName || '').toUpperCase().includes('ENGLABS'), false, sale.cgst || 0, sale.sgst || 0, sale.basicAmount || 0);
    const total = sale.total || sale.roomRentIncTaxes;
    const basic = sale.basicAmount;
    const billRef = sale.billNo || sale.invoiceNo || 'UNKNOWN';
    const tDate = formatDateForTally(sale.date);
    
    // Calculate Round Off
    const diff = Math.round((Number(total) - (Number(basic) + Number(sale.sgst || 0) + Number(sale.cgst || 0))) * 100) / 100;
    const roundOffXml = Math.abs(diff) > 0.001 ? `
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Round Off</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>${diff > 0 ? 'No' : 'Yes'}</ISDEEMEDPOSITIVE>
                    <AMOUNT>${diff.toFixed(2)}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>` : '';

    return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER REMOTEID="HotelSky5-Sales-${escapeXml(billRef)}" VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
                <DATE>${tDate}</DATE>
                <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                <VOUCHERNUMBER>${getUniqueVoucherNumber(escapeXml(billRef))}</VOUCHERNUMBER>
                <PARTYLEDGERNAME>${escapeXml(sale.guestName)}</PARTYLEDGERNAME>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>${escapeXml(sale.guestName)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                    <AMOUNT>-${total}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>${escapeXml(salesLedger)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>${basic}</AMOUNT>
                    <CATEGORYALLOCATIONS.LIST>
                        <CATEGORY>Rooms</CATEGORY>
                        <COSTCENTREALLOCATIONS.LIST>
                            <NAME>${escapeXml((sale.isWalkIn || !sale.roomNo) ? 'Walk-in Guest' : `Room ${sale.roomNo}`)}</NAME>
                            <AMOUNT>${basic}</AMOUNT>
                        </COSTCENTREALLOCATIONS.LIST>
                    </CATEGORYALLOCATIONS.LIST>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Output Sgst 2.5%</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>${sale.sgst || 0}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Output Cgst 2.5%</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>${sale.cgst || 0}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>${roundOffXml}
            </VOUCHER>
        </TALLYMESSAGE>`;
}

function buildFoodSaleVoucher(sale) {
    const guestLedger = sale.guestName || 'Walk-In Customer';
    let roomCostCentres = (sale.isWalkIn || !sale.roomNo) ? ['Walk-in Guest'] : parseRooms(sale.roomNo);
    if (roomCostCentres.length === 0) roomCostCentres = ['Walk-in Guest'];
    const billRef = sale.billNo || sale.invoiceNo || 'UNKNOWN';
    const tDate = formatDateForTally(sale.date);
    const isEnglabs = (sale.guestName || '').toUpperCase().includes('ENGLABS');
    const salesLedger = getSalesLedger(!!sale.gstNo, isEnglabs, true, sale.cgst || 0, sale.sgst || 0, sale.basicAmount || 0);
    
    let itemsSum = 0;
    let inventoryAllocationsXml = '';
    
    for (const item of sale.items) {
        if (item.name.toLowerCase().includes('discount')) continue;
        
        itemsSum += Number(item.amount);
        inventoryAllocationsXml += `
                    <INVENTORYALLOCATIONS.LIST>
                        <STOCKITEMNAME>${escapeXml(item.name)}</STOCKITEMNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <RATE>${item.rate}/Nos</RATE>
                        <AMOUNT>${item.amount}</AMOUNT>
                        <ACTUALQTY> 1 Nos</ACTUALQTY>
                        <BILLEDQTY> 1 Nos</BILLEDQTY>
                    </INVENTORYALLOCATIONS.LIST>`;
    }
    
    const discountItem = sale.items.find(i => i.name.toLowerCase().includes('discount'));
    let discountXml = '';
    if (discountItem) {
        itemsSum -= Math.abs(discountItem.amount);
        discountXml = `
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Discount Allowed</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                    <AMOUNT>-${Math.abs(discountItem.amount)}</AMOUNT>
                    ${generateRoomCostCentresXml('Rooms', discountItem.amount, roomCostCentres, true)}
                </ALLLEDGERENTRIES.LIST>`;
    }

    const diff = Math.round((Number(sale.total) - (Number(itemsSum) + Number(sale.sgst || 0) + Number(sale.cgst || 0))) * 100) / 100;
    const roundOffXml = Math.abs(diff) > 0.001 ? `
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Round Off</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>${diff > 0 ? 'No' : 'Yes'}</ISDEEMEDPOSITIVE>
                    <AMOUNT>${diff > 0 ? diff.toFixed(2) : diff.toFixed(2)}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>` : '';

    return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER REMOTEID="HotelSky5-Food-${escapeXml(billRef)}" VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
                <DATE>${tDate}</DATE>
                <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                <VOUCHERNUMBER>${getUniqueVoucherNumber(escapeXml(billRef))}</VOUCHERNUMBER>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>${escapeXml(guestLedger)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                    <AMOUNT>-${sale.total}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>${escapeXml(salesLedger)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>${itemsSum}</AMOUNT>
                    ${generateRoomCostCentresXml('Rooms', itemsSum, roomCostCentres)}
                    <CATEGORYALLOCATIONS.LIST>
                        <CATEGORY>Expenses</CATEGORY>
                        <COSTCENTREALLOCATIONS.LIST>
                            <NAME>Kitchen Expenses</NAME>
                            <AMOUNT>${itemsSum}</AMOUNT>
                        </COSTCENTREALLOCATIONS.LIST>
                    </CATEGORYALLOCATIONS.LIST>${inventoryAllocationsXml}
                </ALLLEDGERENTRIES.LIST>${discountXml}
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Output Sgst 2.5%</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>${sale.sgst || 0}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Output Cgst 2.5%</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>${sale.cgst || 0}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>${roundOffXml}
            </VOUCHER>
        </TALLYMESSAGE>`;
}
function buildCLVouchers(sale) {
    const guestLedger = sale.guestName || 'Walk-In Customer';
    let roomCostCentres = (sale.isWalkIn || !sale.roomNo) ? ['Walk-in Guest'] : parseRooms(sale.roomNo);
    if (roomCostCentres.length === 0) roomCostCentres = ['Walk-in Guest'];
    const billRef = sale.billNo || sale.invoiceNo || 'UNKNOWN';
    const tDate = formatDateForTally(sale.date);
    
    // Calculate total basic amount and build INVENTORYALLOCATIONS.LIST for Journal FOC
    let basicAmt = 0;
    let inventoryAllocationsXml = '';
    
    for (const item of sale.items) {
        if (item.name.toLowerCase().includes('discount')) continue; // Skip discounts in FOC
        basicAmt += Number(item.amount);
        inventoryAllocationsXml += `
                    <INVENTORYALLOCATIONS.LIST>
                        <STOCKITEMNAME>${escapeXml(item.name)}</STOCKITEMNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <RATE>${item.rate}/Nos</RATE>
                        <AMOUNT>${item.amount}</AMOUNT>
                        <ACTUALQTY> 1 Nos</ACTUALQTY>
                        <BILLEDQTY> 1 Nos</BILLEDQTY>
                    </INVENTORYALLOCATIONS.LIST>`;
    }
    
    basicAmt = Math.round(basicAmt * 100) / 100;

    const voucher1 = `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER REMOTEID="HotelSky5-FOC1-${escapeXml(billRef)}" VCHTYPE="Journal" ACTION="Create" OBJVIEW="Accounting Voucher View">
                <DATE>${tDate}</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <VOUCHERNUMBER>FOC1-${escapeXml(billRef)}</VOUCHERNUMBER>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>${escapeXml(guestLedger)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                    <AMOUNT>-${basicAmt}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>FOC Food Consumption</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>${basicAmt}</AMOUNT>
                    ${generateRoomCostCentresXml('Rooms', basicAmt, roomCostCentres)}${inventoryAllocationsXml}
                </ALLLEDGERENTRIES.LIST>
            </VOUCHER>
        </TALLYMESSAGE>`;

    const voucher2 = `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER REMOTEID="HotelSky5-FOC2-${escapeXml(billRef)}" VCHTYPE="Journal" ACTION="Create" OBJVIEW="Accounting Voucher View">
                <DATE>${tDate}</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <VOUCHERNUMBER>FOC2-${escapeXml(billRef)}</VOUCHERNUMBER>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Complementary Food Expense</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                    <AMOUNT>-${basicAmt}</AMOUNT>
                    <CATEGORYALLOCATIONS.LIST>
                        <CATEGORY>Rooms</CATEGORY>
                        <COSTCENTREALLOCATIONS.LIST>
                            <NAME>${escapeXml(roomCostCentre)}</NAME>
                            <AMOUNT>-${basicAmt}</AMOUNT>
                        </COSTCENTREALLOCATIONS.LIST>
                    </CATEGORYALLOCATIONS.LIST>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>${escapeXml(guestLedger)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>${basicAmt}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
            </VOUCHER>
        </TALLYMESSAGE>`;

    return voucher1 + voucher2;
}

// --- Main Execution ---
function buildNewGuestLedgers(missingGuests, b2bMapping) {
    let xml = '';
    for (const guest of missingGuests) {
        const isB2B = b2bMapping[guest] ? b2bMapping[guest].isB2B : false;
        const gstNo = b2bMapping[guest] ? b2bMapping[guest].gstNo : '';
        const stateName = b2bMapping[guest] ? b2bMapping[guest].state : 'Haryana';
        xml += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <LEDGER NAME="${escapeXml(guest)}" ACTION="Create">
                <NAME.LIST>
                    <NAME>${escapeXml(guest)}</NAME>
                </NAME.LIST>
                <PARENT>Sundry Debtors</PARENT>
                <ISBILLWISEON>Yes</ISBILLWISEON>
                <AFFECTSSTOCK>No</AFFECTSSTOCK>
                ${isB2B ? `
                <PARTYGSTIN>${escapeXml(gstNo)}</PARTYGSTIN>
                <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
                <STATENAME>${escapeXml(stateName)}</STATENAME>` : `
                <GSTREGISTRATIONTYPE>Consumer</GSTREGISTRATIONTYPE>
                <STATENAME>Haryana</STATENAME>`}
            </LEDGER>
        </TALLYMESSAGE>`;
    }
    return xml;
}

function generateXML(salesDataPath, tallyMastersPath, outputPath) {
    console.log("Loading sales data...");
    const salesData = JSON.parse(fs.readFileSync(salesDataPath, 'utf8'));
    
    console.log("Auditing against Tally Masters...");
    const { missingGuests } = skill_tally_auditor.auditData(salesData, tallyMastersPath);
    console.log(`Audit passed. Found ${missingGuests.length} missing guests to auto-create.`);

    // Build B2B mapping
    const b2bMapping = {};
    for (const sale of salesData) {
        if (sale.guestName && sale.gstNo) {
            b2bMapping[sale.guestName.trim()] = {
                isB2B: true,
                state: sale.state || 'Haryana',
                gstNo: sale.gstNo
            };
        }
    }

    let envelope = `<ENVELOPE>\n<HEADER>\n<TALLYREQUEST>Import Data</TALLYREQUEST>\n</HEADER>\n<BODY>\n<IMPORTDATA>\n<REQUESTDESC>\n<REPORTNAME>Vouchers</REPORTNAME>\n<STATICVARIABLES>\n<SVCURRENTCOMPANY>Hotel Sky 5 2026-27</SVCURRENTCOMPANY>\n</STATICVARIABLES>\n</REQUESTDESC>\n<REQUESTDATA>\n`;

    
    const usedVoucherNumbers = new Set();
    function getUniqueVoucherNumber(base) {
        let vch = base;
        let suffix = 1;
        while (usedVoucherNumbers.has(vch)) {
            vch = base + '-' + suffix;
            suffix++;
        }
        usedVoucherNumbers.add(vch);
        return vch;
    }

    // 1. Create missing ledgers
    envelope += buildNewGuestLedgers(missingGuests, b2bMapping);

    // 2. Process all sales
    for (const sale of salesData) {
        if (sale.type === 'master' || sale.type === 'treebo') {
            envelope += buildRoomSaleVoucher(sale);
            envelope += buildPaymentJournals(sale);
        } else if (sale.type === 'food') {
            if (sale.isCL) {
                envelope += buildCLVouchers(sale);
            } else {
                envelope += buildFoodSaleVoucher(sale);
            }
            envelope += buildPaymentJournals(sale);
        }
    }

    envelope += `</REQUESTDATA>\n</IMPORTDATA>\n</BODY>\n</ENVELOPE>`;
    fs.writeFileSync(outputPath, envelope);
    console.log(`Success! XML generated at ${outputPath}`);
}

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log("Usage: node generate_tally_xml.js <sales_json> <tally_masters_xml> <output_xml>");
        process.exit(1);
    }
    try {
        generateXML(args[0], args[1], args[2]);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

module.exports = { generateXML };
