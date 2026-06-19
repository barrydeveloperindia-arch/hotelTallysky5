const fs = require('fs');
const path = "D:\\TallyPrime\\tally.imp";

if (fs.existsSync(path)) {
  const bytes = fs.readFileSync(path);
  let content = bytes.toString('utf16le');
  if (content.includes('\u0000')) {
    content = bytes.toString('utf8').replace(/\u0000/g, '');
  }
  
  const lines = content.split('\n');
  console.log("=== Raw Last 30 lines in tally.imp ===");
  const start = Math.max(0, lines.length - 30);
  for (let i = start; i < lines.length; i++) {
    console.log(`${i}: [${lines[i].trim()}]`);
  }
} else {
  console.log("tally.imp does not exist");
}
