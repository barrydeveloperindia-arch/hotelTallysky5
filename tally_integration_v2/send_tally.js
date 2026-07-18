const fs = require('fs');
const http = require('http');

const xml = fs.readFileSync('Final_Tally_Import_1_to_10_July.xml', 'utf8');

const options = {
    hostname: 'localhost',
    port: 9000,
    path: '/',
    method: 'POST',
    headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(xml)
    }
};

const req = http.request(options, (res) => {
    let responseData = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    res.on('end', () => {
        console.log("Response from Tally:");
        console.log(responseData);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(xml);
req.end();
