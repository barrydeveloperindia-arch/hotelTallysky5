const fs = require('fs');

const data = JSON.parse(fs.readFileSync('final_reconciled_sales.json', 'utf8'));

const nameMap = {
    'Lime Soda': 'Fresh Lime Soda',
    'Veg. Sandwich': 'Veg Sandwich',
    'Chicken Biryani + Raita': 'Chicken Biryani+Raita',
    'Veg Garlic Noodles': 'Veg Garlic Noodle'
};

let updated = 0;

for (const sale of data) {
    if (sale.type === 'food' && sale.items) {
        for (const item of sale.items) {
            if (nameMap[item.name]) {
                console.log(`Updating ${item.name} -> ${nameMap[item.name]}`);
                item.name = nameMap[item.name];
                updated++;
            }
        }
    }
}

fs.writeFileSync('final_reconciled_sales.json', JSON.stringify(data, null, 2));
console.log(`Successfully updated ${updated} item names.`);
