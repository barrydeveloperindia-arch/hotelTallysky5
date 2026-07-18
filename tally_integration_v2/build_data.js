const fs = require('fs');
const data = [
  {
    "type": "master",
    "guestName": "MR. BHUPINDER SINGH",
    "date": "09-Jul-26",
    "billNo": "12249",
    "gstNo": "",
    "roomNo": "102",
    "cgst": 35.72,
    "sgst": 35.72,
    "roomRentIncTaxes": 1500.00,
    "basicAmount": 1428.57
  },
  {
    "type": "master",
    "guestName": "MR. PARDEEP KUMAR",
    "date": "09-Jul-26",
    "billNo": "12250",
    "gstNo": "",
    "roomNo": "117",
    "cgst": 28.57,
    "sgst": 28.57,
    "roomRentIncTaxes": 1200.00,
    "basicAmount": 1142.86
  },
  {
    "type": "master",
    "guestName": "MR. AMIT KUMAR",
    "date": "09-Jul-26",
    "billNo": "12251",
    "gstNo": "",
    "roomNo": "116",
    "cgst": 28.57,
    "sgst": 28.57,
    "roomRentIncTaxes": 1200.00,
    "basicAmount": 1142.86
  },
  {
    "type": "master",
    "guestName": "MR. HANISH KUMAR",
    "date": "10-Jul-26",
    "billNo": "12252",
    "gstNo": "",
    "roomNo": "108",
    "cgst": 40.48,
    "sgst": 40.48,
    "roomRentIncTaxes": 1700.00,
    "basicAmount": 1619.05
  },
  {
    "type": "master",
    "guestName": "MR. HARSH KUMAR",
    "date": "10-Jul-26",
    "billNo": "12253",
    "gstNo": "",
    "roomNo": "105",
    "cgst": 59.53,
    "sgst": 59.53,
    "roomRentIncTaxes": 2500.00,
    "basicAmount": 2380.95
  },
  {
    "type": "master",
    "guestName": "TASHI SONAM",
    "date": "10-Jul-26",
    "billNo": "12255",
    "gstNo": "",
    "roomNo": "117",
    "cgst": 33.34,
    "sgst": 33.34,
    "roomRentIncTaxes": 1400.00,
    "basicAmount": 1333.33
  },
  {
    "type": "master",
    "guestName": "UMANG JAIN",
    "date": "10-Jul-26",
    "billNo": "12257",
    "gstNo": "",
    "roomNo": "119",
    "cgst": 85.71,
    "sgst": 85.71,
    "roomRentIncTaxes": 3600.00,
    "basicAmount": 3428.58
  },
  {
    "type": "master",
    "guestName": "AMIT",
    "date": "10-Jul-26",
    "billNo": "12258",
    "gstNo": "",
    "roomNo": "102",
    "cgst": 38.10,
    "sgst": 38.10,
    "roomRentIncTaxes": 1600.00,
    "basicAmount": 1523.81
  },
  {
    "type": "master",
    "guestName": "MR. JASMEET SINGH",
    "date": "10-Jul-26",
    "billNo": "12259",
    "gstNo": "",
    "roomNo": "106",
    "cgst": 47.62,
    "sgst": 47.62,
    "roomRentIncTaxes": 2000.00,
    "basicAmount": 1904.76
  },
  {
    "type": "master",
    "guestName": "MR. PARAMJEET SINGH",
    "date": "10-Jul-26",
    "billNo": "12262",
    "gstNo": "",
    "roomNo": "117",
    "cgst": 28.57,
    "sgst": 28.57,
    "roomRentIncTaxes": 1200.00,
    "basicAmount": 1142.86
  },
  {
    "type": "treebo",
    "guestName": "Alok",
    "date": "2026-07-10",
    "invoiceNo": "180962826-000400",
    "gstNo": "",
    "cgst": 160.56,
    "sgst": 160.56,
    "basicAmount": 6423.10,
    "total": 6744.22
  },
  {
    "type": "treebo",
    "guestName": "Kunal Wadhwa",
    "date": "2026-07-10",
    "invoiceNo": "180962826-000402",
    "gstNo": "",
    "cgst": 45.22,
    "sgst": 45.22,
    "basicAmount": 1808.59,
    "total": 1899.03
  }
];

const foodBillsRaw = [
  { file: '16293', date: '17-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 292.69, cgst: 7.32, sgst: 7.32, discount: 0, total: 307.00, items: [{name: 'Paneer Bhurji', rate: 197.45, amount: 197.45}, {name: 'Tawa Butter Roti', rate: 23.81, amount: 95.24}] },
  { file: '16310', date: '18-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 348.96, cgst: 8.73, sgst: 8.73, discount: 0, total: 366.00, items: [{name: 'Aloo Parantha', rate: 57.14, amount: 57.14}, {name: 'Kadhai Paneer', rate: 172.77, amount: 172.77}, {name: 'Tawa Butter Roti', rate: 23.81, amount: 119.05}] },
  { file: '16328', date: '19-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 419.04, cgst: 10.48, sgst: 10.48, discount: 0, total: 440.00, items: [{name: 'Manchurian Fried Rice', rate: 161.90, amount: 161.90}, {name: 'Mineral Water', rate: 28.57, amount: 57.14}, {name: 'Special Thali', rate: 200.00, amount: 200.00}] },
  { file: '16341', date: '20-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 426.90, cgst: 10.68, sgst: 10.68, discount: 0, total: 448.00, items: [{name: 'Mix Paratha', rate: 57.60, amount: 57.60}, {name: 'Paneer Lawabdar', rate: 164.54, amount: 164.54}, {name: 'Paneer Paratha', rate: 85.71, amount: 85.71}, {name: 'Tawa Butter Roti', rate: 23.81, amount: 119.05}] },
  { file: '16362', date: '22-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 238.10, cgst: 5.96, sgst: 5.96, discount: 0, total: 250.00, items: [{name: 'Delux Thali', rate: 238.10, amount: 238.10}] },
  { file: '16367', date: '22-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 242.48, cgst: 6.07, sgst: 6.07, discount: 0, total: 255.00, items: [{name: 'Dal Arhar Tadka', rate: 123.41, amount: 123.41}, {name: 'Jeera Rice', rate: 90.50, amount: 90.50}, {name: 'Mineral Water', rate: 28.57, amount: 28.57}] },
  { file: '16376', date: '23-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 142.85, cgst: 3.58, sgst: 3.58, discount: 0, total: 150.00, items: [{name: 'Aloo Parantha', rate: 57.14, amount: 57.14}, {name: 'Paneer Paratha', rate: 85.71, amount: 85.71}] },
  { file: '16381', date: '23-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 345.07, cgst: 8.63, sgst: 8.63, discount: 0, total: 362.00, items: [{name: 'Mineral Water', rate: 28.57, amount: 28.57}, {name: 'Paneer Bhurji', rate: 197.45, amount: 197.45}, {name: 'Tawa Butter Roti', rate: 23.81, amount: 119.05}] },
  { file: '16385', date: '24-Jun-26', guest: 'Walk-In Customer', tableOrRoom: 'CL 3', isWalkIn: true, isCL: true, basic: 131.62, cgst: 3.29, sgst: 3.29, discount: 0, total: 138.00, items: [{name: 'Omelette Plain/bread', rate: 65.81, amount: 131.62}] },
  { file: '16389', date: '24-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 228.57, cgst: 5.72, sgst: 5.72, discount: 0, total: 240.00, items: [{name: 'Mineral Water', rate: 28.57, amount: 28.57}, {name: 'Special Thali', rate: 200.00, amount: 200.00}] },
  { file: '16448', date: '27-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 457.14, cgst: 11.44, sgst: 11.44, discount: 0, total: 480.00, items: [{name: 'Delux Thali', rate: 238.10, amount: 238.10}, {name: 'Manchurian Fried Rice', rate: 161.90, amount: 161.90}, {name: 'Mineral Water', rate: 28.57, amount: 57.14}] },
  { file: '16451', date: '27-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 161.90, cgst: 4.05, sgst: 4.05, discount: 0, total: 170.00, items: [{name: 'Manchurian Fried Rice', rate: 161.90, amount: 161.90}] },
  { file: '16460', date: '28-Jun-26', guest: 'MR. BHARAT SIR GUEST', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 283.59, cgst: 7.09, sgst: 7.09, discount: 0, total: 298.00, items: [{name: 'Paneer Lawabdar', rate: 164.54, amount: 164.54}, {name: 'Tawa Butter Roti', rate: 23.81, amount: 119.05}] },
  { file: '16477', date: '29-Jun-26', guest: 'MR. ENGLABS EMPOLYEE', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 142.85, cgst: 3.58, sgst: 3.58, discount: 0, total: 150.00, items: [{name: 'Aloo Parantha', rate: 57.14, amount: 57.14}, {name: 'Paneer Paratha', rate: 85.71, amount: 85.71}] },
  { file: '16487', date: '30-Jun-26', guest: 'MR. ENGLABS EMPOLYEE', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 266.67, cgst: 6.67, sgst: 6.67, discount: 0, total: 280.00, items: [{name: 'Delux Thali', rate: 238.10, amount: 238.10}, {name: 'Mineral Water', rate: 28.57, amount: 28.57}] },
  { file: '16498', date: '01-Jul-26', guest: 'MR. ENGLABS EMPOLYEE', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 238.60, cgst: 5.97, sgst: 5.97, discount: 0, total: 251.00, items: [{name: 'Jeera Rice', rate: 90.50, amount: 90.50}, {name: 'Yellow Dal Tadka/fry', rate: 148.10, amount: 148.10}] },
  { file: '16520', date: '03-Jul-26', guest: 'MR. ENGLABS EMPOLYEE', tableOrRoom: '120', isWalkIn: false, isCL: false, basic: 57.14, cgst: 1.43, sgst: 1.43, discount: 0, total: 60.00, items: [{name: 'Mineral Water', rate: 28.57, amount: 57.14}] },
  { file: '16566', date: '06-Jul-26', guest: 'MR. ALOK KUMAR', tableOrRoom: '111', isWalkIn: false, isCL: false, basic: 285.71, cgst: 7.15, sgst: 7.15, discount: 0, total: 300.00, items: [{name: 'Chicken Fried Rice', rate: 285.71, amount: 285.71}] },
  { file: '16579', date: '07-Jul-26', guest: 'MR. KUNAL WADHWA', tableOrRoom: '104', isWalkIn: false, isCL: false, basic: 28.57, cgst: 0.72, sgst: 0.72, discount: 0, total: 30.00, items: [{name: 'Mineral Water', rate: 28.57, amount: 28.57}] },
  { file: '16582', date: '07-Jul-26', guest: 'MR. ALOK KUMAR', tableOrRoom: '111', isWalkIn: false, isCL: false, basic: 359.36, cgst: 8.99, sgst: 8.99, discount: 0, total: 377.00, items: [{name: 'Paneer Bhurji', rate: 197.45, amount: 197.45}, {name: 'Tawa Missi Roti', rate: 28.57, amount: 57.14}, {name: 'Tea', rate: 38.10, amount: 38.10}, {name: 'Veg Maggies', rate: 66.67, amount: 66.67}] },
  { file: '16593', date: '08-Jul-26', guest: 'MR. ALOK KUMAR', tableOrRoom: '111', isWalkIn: false, isCL: false, basic: 404.76, cgst: 10.12, sgst: 10.12, discount: 0, total: 425.00, items: [{name: 'Chicken Biryani + Raita', rate: 380.95, amount: 380.95}, {name: 'Limca 250 Ml', rate: 23.81, amount: 23.81}] },
  { file: '16598', date: '09-Jul-26', guest: 'MR. SAHIL', tableOrRoom: '277', isWalkIn: true, isCL: false, basic: 171.43, cgst: 3.00, sgst: 3.00, discount: 51.43, total: 126.00, items: [{name: 'Egg Bhurji', rate: 171.43, amount: 171.43}] },
  { file: '16599', date: '09-Jul-26', guest: 'MR. BHEL SIR', tableOrRoom: '278', isWalkIn: true, isCL: false, basic: 380.95, cgst: 6.67, sgst: 6.67, discount: 114.29, total: 280.00, items: [{name: 'Chicken Biryani + Raita', rate: 380.95, amount: 380.95}] },
  { file: '16600', date: '09-Jul-26', guest: 'Walk-In Customer', tableOrRoom: 'SHREEYA', isWalkIn: true, isCL: false, basic: 454.59, cgst: 5.69, sgst: 5.69, discount: 227.30, total: 239.00, items: [{name: 'Veg. Sandwich', rate: 85.71, amount: 257.13}, {name: 'French Fries', rate: 98.73, amount: 197.46}] },
  { file: '16601', date: '09-Jul-26', guest: 'Walk-In Customer', tableOrRoom: 'A&A', isWalkIn: true, isCL: false, basic: 66.68, cgst: 1.67, sgst: 1.67, discount: 0, total: 70.00, items: [{name: 'Staff Coffee', rate: 19.05, amount: 38.10}, {name: 'Staff Tea', rate: 14.29, amount: 28.58}] },
  { file: '16602', date: '09-Jul-26', guest: 'Walk-In Customer', tableOrRoom: 'S& A', isWalkIn: true, isCL: false, basic: 38.10, cgst: 0.96, sgst: 0.96, discount: 0, total: 40.00, items: [{name: 'Staff Coffee', rate: 19.05, amount: 38.10}] },
  { file: '16603', date: '09-Jul-26', guest: 'MR. HANISH KUMAR', tableOrRoom: '108', isWalkIn: false, isCL: false, basic: 174.93, cgst: 4.38, sgst: 4.38, discount: 0, total: 184.00, items: [{name: 'Mix Sauce Pasta', rate: 98.73, amount: 98.73}, {name: 'Tea', rate: 38.10, amount: 76.20}] },
  { file: '16605', date: '09-Jul-26', guest: 'Walk-In Customer', tableOrRoom: 'ENGLABS', isWalkIn: true, isCL: false, basic: 400.00, cgst: 5.00, sgst: 5.00, discount: 200.00, total: 210.00, items: [{name: 'Special Thali', rate: 200.00, amount: 400.00}] },
  { file: '16606', date: '09-Jul-26', guest: 'AMIT', tableOrRoom: '102', isWalkIn: false, isCL: false, basic: 433.34, cgst: 10.83, sgst: 10.83, discount: 0, total: 455.00, items: [{name: 'Coca Cola 250 Ml', rate: 23.81, amount: 71.43}, {name: 'Paneer Fried Rice', rate: 190.48, amount: 190.48}, {name: 'Veg. Manchurian (dry/gravy)', rate: 171.43, amount: 171.43}] },
  { file: '16607', date: '09-Jul-26', guest: 'MR. HANISH KUMAR', tableOrRoom: '108', isWalkIn: false, isCL: false, basic: 171.43, cgst: 4.29, sgst: 4.29, discount: 0, total: 180.00, items: [{name: 'Veg Biryani', rate: 171.43, amount: 171.43}] },
  { file: '16608', date: '09-Jul-26', guest: 'AMIT', tableOrRoom: '102', isWalkIn: false, isCL: false, basic: 200.00, cgst: 5.00, sgst: 5.00, discount: 0, total: 210.00, items: [{name: 'Special Thali', rate: 200.00, amount: 200.00}] },
  { file: '16609', date: '09-Jul-26', guest: 'AMIT', tableOrRoom: '102', isWalkIn: false, isCL: false, basic: 95.24, cgst: 2.38, sgst: 2.38, discount: 0, total: 100.00, items: [{name: 'Coca Cola 250 Ml', rate: 23.81, amount: 95.24}] },
  { file: '16610', date: '09-Jul-26', guest: 'MR. HARSH KUMAR', tableOrRoom: '105', isWalkIn: false, isCL: false, basic: 228.57, cgst: 5.72, sgst: 5.72, discount: 0, total: 240.00, items: [{name: 'Coffee', rate: 57.14, amount: 57.14}, {name: 'Veg Biryani', rate: 171.43, amount: 171.43}] },
  { file: '16611', date: '10-Jul-26', guest: 'MR. JASMEET SINGH', tableOrRoom: '106', isWalkIn: false, isCL: false, basic: 28.57, cgst: 0.72, sgst: 0.72, discount: 0, total: 30.00, items: [{name: 'Mineral Water', rate: 28.57, amount: 28.57}] },
  { file: '16612', date: '10-Jul-26', guest: 'MR. HANISH KUMAR', tableOrRoom: '108', isWalkIn: false, isCL: false, basic: 247.62, cgst: 6.19, sgst: 6.19, discount: 0, total: 260.00, items: [{name: 'Aloo Parantha', rate: 57.14, amount: 171.42}, {name: 'Tea', rate: 38.10, amount: 76.20}] },
  { file: '16613', date: '10-Jul-26', guest: 'Walk-In Customer', tableOrRoom: 'CL 4', isWalkIn: true, isCL: true, basic: 162.37, cgst: 4.06, sgst: 4.06, discount: 0, total: 170.00, items: [{name: 'Curd Bowl', rate: 38.10, amount: 38.10}, {name: 'Mix Paratha', rate: 57.60, amount: 57.60}, {name: 'Poha', rate: 66.67, amount: 66.67}] },
  { file: '16614', date: '10-Jul-26', guest: 'MR. JASMEET SINGH', tableOrRoom: '106', isWalkIn: false, isCL: false, basic: 28.57, cgst: 0.72, sgst: 0.72, discount: 0, total: 30.00, items: [{name: 'Mineral Water', rate: 28.57, amount: 28.57}] }
];

foodBillsRaw.forEach(f => {
  data.push({
    type: 'food',
    guestName: f.guest,
    date: f.date,
    billNo: 'POS-' + f.file + '-23/24',
    roomNo: f.tableOrRoom,
    isWalkIn: f.isWalkIn,
    isCL: f.isCL,
    items: f.items,
    cgst: f.cgst,
    sgst: f.sgst,
    discount: f.discount,
    total: f.total
  });
});

fs.writeFileSync('C:/Users/Administrator/OneDrive/MANGEMENT FILE/Documents/Antigravity/Hotel/tally_integration_v2/data_day_09.07.26.json', JSON.stringify(data, null, 2));
console.log("Written successfully");
