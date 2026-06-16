const fs = require('fs');

const file = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\scratch\\2nd_june_ocr_results.txt';
if (!fs.existsSync(file)) {
  console.error("OCR results file not found!");
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf-8');
const blocks = content.split(/={10,}/);

console.log("Analyzing", blocks.length, "blocks in OCR results...");

blocks.forEach((b, idx) => {
  if (!b.trim()) return;
  const lines = b.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // First line should be the filename block
  if (lines[0] && lines[0].startsWith("FILE:")) {
    const filename = lines[0];
    const blockText = b.toLowerCase();
    
    // Simple key info matching
    let billNo = "N/A";
    let roomNo = "N/A";
    let guest = "N/A";
    let amount = "N/A";
    let items = [];
    
    // Regex or line matching for fields
    lines.forEach(line => {
      const uLine = line.toUpperCase();
      if (uLine.includes("BILL NO") || uLine.includes("INVOICE NO") || uLine.includes("BILL  NO")) {
        const m = /BILL\s*NO\.?\s*[:\.-]?\s*([a-z0-9\-]+)/i.exec(line) || /INVOICE\s*NO\.?\s*[:\.-]?\s*([a-z0-9\-]+)/i.exec(line) || /NO\s*:\s*([a-z0-9\-]+)/i.exec(line);
        if (m) billNo = m[1].trim();
        else billNo = line;
      }
      if (uLine.includes("ROOM NO") || uLine.includes("ROOM  NO")) {
        const m = /ROOM\s*NO\.?\s*[:\.-]?\s*([a-z0-9\.\/]+)/i.exec(line);
        if (m) roomNo = m[1].trim();
        else roomNo = line;
      }
      if (uLine.includes("GUEST NAME") || uLine.includes("MR ")) {
        guest = line;
      }
      if (uLine.includes("RECEIVABLE") || uLine.includes("TOTAL RS") || uLine.includes("NET AMOUNT") || uLine.includes("TOTAL BILL AMOUNT")) {
        amount = line;
      }
      
      // Let's capture item candidates (lines containing quantity, price numbers)
      // Standard item format: item_name followed by rate and amount, or quantity rate
      // e.g. Mineral Water 1 20 20 or Matar Paneer 1 200 200
      if (/^[a-z\s\.\(\)\-\/]+$/i.test(line) && !uLine.includes("TAX INVOICE") && !uLine.includes("GUEST NAME") && !uLine.includes("SERVER") && !uLine.includes("PANCHKULA") && !uLine.includes("ROAD") && !uLine.includes("SECTOR") && !uLine.includes("DISHA") && !uLine.includes("ARCADE") && !uLine.includes("THANKS") && !uLine.includes("CASHIER") && !uLine.includes("PARTICULARS")) {
        // Look ahead for numbers or see if the line has numbers
      }
    });

    console.log(`\n======================================================`);
    console.log(filename);
    console.log(`  Bill No: ${billNo}`);
    console.log(`  Room No: ${roomNo}`);
    console.log(`  Guest Name: ${guest}`);
    console.log(`  Amount: ${amount}`);
    
    // Print first few lines of the text block to see details manually
    console.log("  Text snippet:");
    lines.slice(1, 20).forEach(l => console.log(`    ${l}`));
  }
});
