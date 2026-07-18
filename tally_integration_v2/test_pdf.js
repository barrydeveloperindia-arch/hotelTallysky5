const fs = require('fs');
const pdf = require('pdf-parse');

async function parsePDF(filePath) {
    try {
        let dataBuffer = fs.readFileSync(filePath);
        let data = await pdf(dataBuffer);
        console.log(`\n\n--- Content of ${filePath} ---`);
        console.log(data.text.substring(0, 1000)); 
    } catch (e) {
        console.error(`Error parsing ${filePath}:`, e);
    }
}

async function main() {
    const dir = 'C:/Users/Administrator/OneDrive/MANGEMENT FILE/Documents/Antigravity/Hotel/Sales Bills/july/1JULY TO 10 JLUY/Daily Sale Repot june-26 pdf file/01.07.26';
    await parsePDF(`${dir}/12192.pdf`);
    await parsePDF(`${dir}/16494.pdf`);
    await parsePDF(`${dir}/376.pdf`);
}

main();
