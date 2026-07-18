const fs = require('fs');
const sales = require('./final_reconciled_sales.json');

const sale = sales.find(s => s.billNo === 'POS-16494-23/24');
let itemsSum = 0;
for (const item of sale.items) {
    if (!item.name.toLowerCase().includes('discount')) {
        itemsSum += Number(item.amount);
    }
}
const diff = Math.round((Number(sale.total) - (Number(itemsSum) + Number(sale.sgst || 0) + Number(sale.cgst || 0))) * 100) / 100;
console.log(`total: ${sale.total}`);
console.log(`itemsSum: ${itemsSum}`);
console.log(`sgst: ${sale.sgst}`);
console.log(`cgst: ${sale.cgst}`);
console.log(`diff: ${diff}`);
console.log(`Math.abs(diff) > 0.001: ${Math.abs(diff) > 0.001}`);
