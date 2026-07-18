const fs = require('fs');
const PDFParser = require("pdf2json");

function parsePDF(filePath) {
    return new Promise((resolve, reject) => {
        let pdfParser = new PDFParser();
        
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            let fullText = "";
            for (let i = 0; i < pdfData.Pages.length; i++) {
                const page = pdfData.Pages[i];
                // page.Texts has {x, y, w, sw, A, R: [{T: "url-encoded text", S: -1, ts: [font details]}]}
                let texts = page.Texts.map(t => {
                    let decoded = t.R[0].T;
                    try {
                        decoded = decodeURIComponent(t.R[0].T);
                    } catch (e) {
                        decoded = unescape(t.R[0].T);
                    }
                    return {
                        x: t.x,
                        y: t.y,
                        text: decoded
                    };
                });
                
                // Sort by Y, then X
                texts.sort((a, b) => {
                    if (Math.abs(b.y - a.y) > 0.5) {
                        return a.y - b.y; // Top to bottom
                    }
                    return a.x - b.x; // Left to right
                });
                
                // Group by lines
                let lines = [];
                let currentLine = [];
                let currentY = -1;
                
                for (let t of texts) {
                    if (currentY === -1 || Math.abs(t.y - currentY) <= 0.5) {
                        currentLine.push(t.text);
                        currentY = t.y;
                    } else {
                        lines.push(currentLine.join(" "));
                        currentLine = [t.text];
                        currentY = t.y;
                    }
                }
                if (currentLine.length > 0) {
                    lines.push(currentLine.join(" "));
                }
                
                fullText += lines.join("\n") + "\n";
            }
            
            console.log(`\n\n--- Content of ${filePath} ---`);
            console.log(fullText.substring(0, 1500));
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
