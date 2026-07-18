const fs = require('fs');
let content = fs.readFileSync('generate_tally_xml.js', 'utf8');

// Replace the FOC inventory allocations logic
const oldFocLogic = `      let basicAmt = 0;
      let inventoryAllocationsXml = '';
      
      for (const item of sale.items) {
          if (item.name.toLowerCase().includes('discount')) continue; // Skip discounts in FOC
          basicAmt += Number(item.amount);
          inventoryAllocationsXml += \`
                      <INVENTORYALLOCATIONS.LIST>
                          <STOCKITEMNAME>\${escapeXml(item.name)}</STOCKITEMNAME>
                          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                          <RATE>\${item.rate}/Nos</RATE>
                          <AMOUNT>\${item.amount}</AMOUNT>
                          <ACTUALQTY> 1 Nos</ACTUALQTY>
                          <BILLEDQTY> 1 Nos</BILLEDQTY>
                      </INVENTORYALLOCATIONS.LIST>\`;
      }`;

const newFocLogic = `      let basicAmt = 0;
      let inventoryAllocationsXml = '';
      
      for (const item of sale.items) {
          if (item.name.toLowerCase().includes('discount')) continue; // Skip discounts in FOC
          basicAmt += Number(item.amount);
      }`;

content = content.replace(oldFocLogic, newFocLogic);
fs.writeFileSync('generate_tally_xml.js', content);
console.log('Fixed FOC logic by removing invalid inventory allocations from Journal voucher.');
