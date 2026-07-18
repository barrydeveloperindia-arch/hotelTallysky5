const fs = require('fs');

try {
    const content = fs.readFileSync('D:\\TallyPrime\\Tally.imp', 'utf16le');
    const lines = content.split('\n');
    
    // Get the last 1500 lines to surely cover the block
    const recent = lines.slice(-1500);
    
    for (let i = 0; i < recent.length; i++) {
        const line = recent[i].trim();
        // Look for typical error lines
        if (line.includes('does not exist') || 
            line.includes('mismatch') || 
            line.includes('Cannot delete') ||
            line.includes('Accounting') ||
            line.includes('Invalid')) {
            
            // Print this line and the couple of lines before it (usually the Voucher ID/Name)
            console.log("----");
            if (i >= 2) console.log(recent[i-2].trim());
            if (i >= 1) console.log(recent[i-1].trim());
            console.log("=> " + line);
        }
    }

} catch (e) {
    console.error(e);
}
