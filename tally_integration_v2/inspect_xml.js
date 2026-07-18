const fs = require('fs');

const xml = fs.readFileSync('Final_Tally_Import_1_to_10_July.xml', 'utf8');

const salesVoucher = xml.match(/<VOUCHER REMOTEID="HotelSky5-Sales[^>]+>[\s\S]*?<\/VOUCHER>/)[0];
const foodVoucher = xml.match(/<VOUCHER REMOTEID="HotelSky5-Food[^>]+>[\s\S]*?<\/VOUCHER>/)[0];
const paymentVoucher = xml.match(/<VOUCHER REMOTEID="HotelSky5-PAY[^>]+>[\s\S]*?<\/VOUCHER>/)[0];

console.log("--- SALES ---");
console.log(salesVoucher);
console.log("--- FOOD ---");
console.log(foodVoucher);
console.log("--- PAY ---");
console.log(paymentVoucher);
