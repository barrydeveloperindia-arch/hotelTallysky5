const fs = require('fs');
let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

const oldPaymentStart = "function buildPaymentJournals(sale) {";
const oldPaymentEnd = "return envelope;\n  }";
const fullOldPayment = content.substring(content.indexOf(oldPaymentStart), content.indexOf(oldPaymentEnd) + oldPaymentEnd.length);

const newPaymentLogic = `function buildPaymentJournals(sale) {
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

          envelope += \`
          <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER REMOTEID="HotelSky5-PAY-\${escapeXml(pay.mode).replace(/\\s+/g, '-')}-\${escapeXml(billRef)}" VCHTYPE="\${vchType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
                  <DATE>\${tDate}</DATE>
                  <VOUCHERTYPENAME>\${vchType}</VOUCHERTYPENAME>
                  <VOUCHERNUMBER>\${getUniqueVoucherNumber("PAY-" + escapeXml(pay.mode).replace(/\\s+/g, "") + "-" + escapeXml(billRef))}</VOUCHERNUMBER>
                  <PARTYLEDGERNAME>\${escapeXml(sale.guestName)}</PARTYLEDGERNAME>
                  <ALLLEDGERENTRIES.LIST>
                      <LEDGERNAME>\${escapeXml(debitLedger)}</LEDGERNAME>
                      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                      <AMOUNT>-\${pay.amount}</AMOUNT>
                  </ALLLEDGERENTRIES.LIST>
                  <ALLLEDGERENTRIES.LIST>
                      <LEDGERNAME>\${escapeXml(sale.guestName)}</LEDGERNAME>
                      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                      <AMOUNT>\${pay.amount}</AMOUNT>
                  </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
          </TALLYMESSAGE>\`;
      }
      return envelope;
  }`;

content = content.replace(fullOldPayment, newPaymentLogic);
fs.writeFileSync('generate_tally_xml.js', content);
console.log('Fixed Payment Journal vs Receipt logic.');
