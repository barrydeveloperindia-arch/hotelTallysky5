const fs = require('fs');
const PDFParser = require("pdf2json");

function parsePDF(filePath) {
    return new Promise((resolve, reject) => {
        let pdfParser = new PDFParser(this, 1);
        
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            let rawText = pdfParser.getRawTextContent();
            console.log(`\n\n--- Content of ${filePath} ---`);
            console.log(rawText.substring(0, 1500));
            resolve();
        });

        pdfParser.loadPDF(filePath);
    });
}

async function main() {
    const dir = 'C:/Users/Administrator/OneDrive/MANGEMENT FILE/Documents/Antigravity/Hotel/Sales Bills/july/1JULY TO 10 JLUY/Daily Sale Repot june-26 pdf file/01.07.26';
    await parsePDF(`${dir}/12192.pdf`);
    await parsePDF(`${dir}/16494.pdf`);
    await parsePDF(`${dir}/376.pdf`);
}

main();
