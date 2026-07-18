const http = require('http');
const fs = require('fs');

const xml = fs.readFileSync('test_upsert_guid.xml', 'utf8');

const req = http.request({
    hostname: 'localhost',
    port: 9000,
    method: 'POST',
    headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(xml)
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});

req.on('error', console.error);
req.write(xml);
req.end();
