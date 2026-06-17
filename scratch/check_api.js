const https = require('https');

function postJSON(url, payload) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, data: data }); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function getJSONWithToken(url, token) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, data: data }); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function run() {
    const baseURL = 'https://damabella-backend.onrender.com/api';
    try {
        const loginRes = await postJSON(`${baseURL}/auth/login/`, {
            email: 'testgemini_17@example.com',
            password: 'Password123'
        });
        if (!loginRes.data.success) {
            console.error('Login failed');
            return;
        }

        const token = loginRes.data.access;
        const clientsRes = await getJSONWithToken(`${baseURL}/clients/get_clients/`, token);
        console.log('Raw clients results:');
        console.log(JSON.stringify(clientsRes.data.results, null, 2));

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
