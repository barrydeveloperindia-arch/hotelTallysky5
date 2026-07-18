const fs = require('fs');
const filepath = 'generate_tally_xml.js';
let content = fs.readFileSync(filepath, 'utf8');

const oldVoucherStart = "const discountItem = sale.items.find(i => i.name.toLowerCase().includes('discount'));";
const oldVoucherEnd = "const diff = Math.round((Number(sale.total) - (Number(itemsSum) + Number(sale.sgst || 0) + Number(sale.cgst || 0))) * 100) / 100;";

const oldBlock = content.substring(content.indexOf(oldVoucherStart), content.indexOf(oldVoucherEnd));

const newBlock = `const discountItem = sale.items.find(i => i.name.toLowerCase().includes('discount'));
      let discountXml = '';
      if (discountItem) {
          itemsSum -= Math.abs(discountItem.amount);
          discountXml = \`
                  <ALLLEDGERENTRIES.LIST>
                      <LEDGERNAME>Discount Allowed</LEDGERNAME>
                      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                      <AMOUNT>-\${Math.abs(discountItem.amount)}</AMOUNT>
                      <CATEGORYALLOCATIONS.LIST>
                          <CATEGORY>Rooms</CATEGORY>
                          <COSTCENTREALLOCATIONS.LIST>
                              <NAME>\${escapeXml(roomCostCentre)}</NAME>
                              <AMOUNT>-\${Math.abs(discountItem.amount)}</AMOUNT>
                          </COSTCENTREALLOCATIONS.LIST>
                      </CATEGORYALLOCATIONS.LIST>
                  </ALLLEDGERENTRIES.LIST>\`;
      }

      // Calculate Round Off using the calculated itemsSum instead of sale.basicAmount (which is undefined for food)
      `;

content = content.replace(oldBlock, newBlock);

// Now we must ALSO inject discountXml right after the gst/cgst ledgers!
// Let's find where roundOffXml is injected:
//                  ${roundOffXml}
//              </VOUCHER>

content = content.replace('${roundOffXml}\n              </VOUCHER>', '${roundOffXml}\n${discountXml}\n              </VOUCHER>');

fs.writeFileSync(filepath, content);
console.log('Fixed buildFoodSaleVoucher discount logic.');
