const https = require('https');

function fetchGST(gstin) {
    const url = `https://sheet.gstincheck.co.in/check/${gstin}`;
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Response from gstincheck:', data);
        });
    }).on('error', err => console.log('Error:', err.message));
}

fetchGST('06OVXPS4147G1ZL');
