const fs = require('fs');

try {
    const content = fs.readFileSync('D:\\TallyPrime\\Tally.imp', 'utf16le');
    
    // Find the LAST occurrence of the file import
    const target = "Final_Tally_Import_1_to_10_July.xml";
    const startIndex = content.lastIndexOf(target);
    
    if (startIndex === -1) {
        console.log("Could not find the import block for Final_Tally_Import_1_to_10_July.xml");
        process.exit();
    }
    
    // Extract everything from that point onwards
    const block = content.substring(startIndex);
    console.log(block.substring(0, 5000));

} catch (e) {
    console.error(e);
}
