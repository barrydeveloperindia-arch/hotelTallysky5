const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractTextFromPDF(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({ data });
    
    try {
        const pdf = await loadingTask.promise;
        let numPages = pdf.numPages;
        let fullText = "";

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Sort text items by Y, then X to preserve reading order (approximate)
            textContent.items.sort((a, b) => {
                if (Math.abs(b.transform[5] - a.transform[5]) > 2) { // 2 units tolerance for Y
                    return b.transform[5] - a.transform[5];
                }
                return a.transform[4] - b.transform[4];
            });

            const pageText = textContent.items.map(item => item.str).join(" ");
            fullText += pageText + "\n";
        }
        
        console.log(`\n\n--- Content of ${filePath} ---`);
        console.log(fullText.substring(0, 1500));
        return fullText;
    } catch (err) {
        console.error(`Error parsing ${filePath}:`, err);
    }
}

async function main() {
    const dir = 'C:/Users/Administrator/OneDrive/MANGEMENT FILE/Documents/Antigravity/Hotel/Sales Bills/july/1JULY TO 10 JLUY/Daily Sale Repot june-26 pdf file/01.07.26';
    await extractTextFromPDF(`${dir}/12192.pdf`);
    await extractTextFromPDF(`${dir}/16494.pdf`);
    await extractTextFromPDF(`${dir}/376.pdf`);
}

main();
