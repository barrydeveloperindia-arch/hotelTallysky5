const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\1st_june_ocr_results.txt', 'utf-8');

const blocks = content.split(/={10,}/);
console.log("Found", blocks.length, "blocks in OCR results.");

blocks.forEach(b => {
  if (!b.trim()) return;
  const lines = b.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const fileLine = lines[0];
  console.log(`\n======================================================`);
  console.log(fileLine);
  
  // Find guest name
  const nameLine = lines.find(l => l.toUpperCase().includes("MR ") || l.toUpperCase().includes("GUEST NAME"));
  if (nameLine) console.log(`  Guest Name: ${nameLine}`);
  
  // Find bill / invoice number
  const billLine = lines.find(l => l.toUpperCase().includes("BILL NO") || l.toUpperCase().includes("INVOICE NO") || l.toUpperCase().includes("NO :") || l.toUpperCase().includes("NO. :") || l.toUpperCase().includes("1190") || l.toUpperCase().includes("1191"));
  if (billLine) console.log(`  Bill/Invoice No: ${billLine}`);
  
  // Find Room No
  const roomLine = lines.find(l => l.toUpperCase().includes("ROOM NO"));
  if (roomLine) console.log(`  Room No: ${roomLine}`);
  
  // Find net amount
  const netAmtLine = lines.find(l => l.toUpperCase().includes("NET AMOUNT") || l.toUpperCase().includes("TOTAL BILL") || l.toUpperCase().includes("RECEIVABLE"));
  if (netAmtLine) console.log(`  Amount: ${netAmtLine}`);
});
