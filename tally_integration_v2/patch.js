const fs = require('fs');

let code = fs.readFileSync('generate_tally_xml.js', 'utf8');

// 1. Fix BillNo vs InvoiceNo in all functions
code = code.replace(/sale\.billNo/g, "(sale.billNo || sale.invoiceNo || 'UNKNOWN')");

// 2. Fix CL Vouchers (FOC1 and FOC2) to not use INVENTORYENTRIES
const clVouchersOld = `function buildCLVouchers(sale) {
    const guestLedger = sale.guestName || 'Walk-In Customer';
    const roomCostCentre = sale.isWalkIn ? 'Walk-in Guest' : \`Room \${sale.roomNo}\`;
    
    // Voucher 1: FOC Food Consumption
    let itemsXml = '';
    for (const item of sale.items) {
        itemsXml += \`
        <INVENTORYENTRIES.LIST>
            <STOCKITEMNAME>\${escapeXml(item.name)}</STOCKITEMNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <RATE>\${item.rate}/Nos</RATE>
            <AMOUNT>\${item.amount}</AMOUNT>
            <ACTUALQTY> 1 Nos</ACTUALQTY>
            <BILLEDQTY> 1 Nos</BILLEDQTY>
            <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>FOC Food Consumption</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>\${item.amount}</AMOUNT>
                <CATEGORYALLOCATIONS.LIST>
                    <CATEGORY>Expenses</CATEGORY>
                    <COSTCENTREALLOCATIONS.LIST>
                        <NAME>Kitchen Expenses</NAME>
                        <AMOUNT>\${item.amount}</AMOUNT>
                    </COSTCENTREALLOCATIONS.LIST>
                </CATEGORYALLOCATIONS.LIST>
            </ACCOUNTINGALLOCATIONS.LIST>
        </INVENTORYENTRIES.LIST>\`;
    }

    const voucher1 = \`
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER REMOTEID="HotelSky5-FOC1-\${escapeXml((sale.billNo || sale.invoiceNo || 'UNKNOWN'))}" VCHTYPE="Journal" ACTION="Create" OBJVIEW="Accounting Voucher View">
                <GUID>HotelSky5-FOC1-\${escapeXml((sale.billNo || sale.invoiceNo || 'UNKNOWN'))}</GUID>
                <DATE>\${escapeXml(sale.date)}</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <VOUCHERNUMBER>FOC1-\${escapeXml((sale.billNo || sale.invoiceNo || 'UNKNOWN'))}</VOUCHERNUMBER>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>\${escapeXml(guestLedger)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                    <AMOUNT>-\${sale.basicAmount}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                \${itemsXml}
            </VOUCHER>
        </TALLYMESSAGE>\`;`;

const clVouchersNew = `function buildCLVouchers(sale) {
    const guestLedger = sale.guestName || 'Walk-In Customer';
    const roomCostCentre = sale.isWalkIn ? 'Walk-in Guest' : \`Room \${sale.roomNo}\`;
    
    // Instead of Inventory, we just use pure accounting to balance the FOC Journal
    const voucher1 = \`
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER REMOTEID="HotelSky5-FOC1-\${escapeXml((sale.billNo || sale.invoiceNo || 'UNKNOWN'))}" VCHTYPE="Journal" ACTION="Create" OBJVIEW="Accounting Voucher View">
                <DATE>\${escapeXml(sale.date)}</DATE>
                <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                <VOUCHERNUMBER>FOC1-\${escapeXml((sale.billNo || sale.invoiceNo || 'UNKNOWN'))}</VOUCHERNUMBER>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>\${escapeXml(guestLedger)}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                    <AMOUNT>-\${sale.basicAmount}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>FOC Food Consumption</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${sale.basicAmount}</AMOUNT>
                    <CATEGORYALLOCATIONS.LIST>
                        <CATEGORY>Expenses</CATEGORY>
                        <COSTCENTREALLOCATIONS.LIST>
                            <NAME>Kitchen Expenses</NAME>
                            <AMOUNT>\${sale.basicAmount}</AMOUNT>
                        </COSTCENTREALLOCATIONS.LIST>
                    </CATEGORYALLOCATIONS.LIST>
                </ALLLEDGERENTRIES.LIST>
            </VOUCHER>
        </TALLYMESSAGE>\`;`;

code = code.replace(clVouchersOld, clVouchersNew);

// 3. Remove all <GUID> tags inside VOUCHER entirely because they break ACTION="Create" upserts!
code = code.replace(/<GUID>.*?<\/GUID>\n\s*/g, '');

// 4. Add Round Off logic for buildRoomSaleVoucher
const roomSaleOld = `                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Output Cgst 2.5%</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${sale.cgst}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
            </VOUCHER>`;
const roomSaleNew = `                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Output Cgst 2.5%</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${sale.cgst}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                \${(() => {
                    const diff = Math.round((Number(total) - (Number(basic) + Number(sale.sgst) + Number(sale.cgst))) * 100) / 100;
                    if (Math.abs(diff) > 0.001) {
                        return \`
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Round Off</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>\${diff > 0 ? 'No' : 'Yes'}</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${diff > 0 ? diff.toFixed(2) : (-diff).toFixed(2)}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>\`;
                    }
                    return '';
                })()}
            </VOUCHER>`;
code = code.replace(roomSaleOld, roomSaleNew);

// 5. Add Round Off logic for buildFoodSaleVoucher
const foodSaleOld = `                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Output Cgst 2.5%</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${sale.cgst}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
            </VOUCHER>`;
const foodSaleNew = `                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Output Cgst 2.5%</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${sale.cgst}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                \${(() => {
                    // For food sales, total credit is basicAmount + sgst + cgst
                    const basic = sale.basicAmount || 0;
                    const diff = Math.round((Number(sale.total) - (Number(basic) + Number(sale.sgst) + Number(sale.cgst))) * 100) / 100;
                    if (Math.abs(diff) > 0.001) {
                        return \`
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>Round Off</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>\${diff > 0 ? 'No' : 'Yes'}</ISDEEMEDPOSITIVE>
                    <AMOUNT>\${diff > 0 ? diff.toFixed(2) : (-diff).toFixed(2)}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>\`;
                    }
                    return '';
                })()}
            </VOUCHER>`;
code = code.replace(foodSaleOld, foodSaleNew);

fs.writeFileSync('generate_tally_xml.js', code);
