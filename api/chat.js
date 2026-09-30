const https = require('https');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY || "";

    return new Promise((resolve) => {
        const nvidiaReq = https.request({
            hostname: 'integrate.api.nvidia.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${nvidiaKey}`
            }
        }, (nvidiaRes) => {
            let data = '';
            nvidiaRes.on('data', chunk => data += chunk);
            nvidiaRes.on('end', () => {
                res.status(nvidiaRes.statusCode).setHeader('Content-Type', 'application/json').send(data);
                resolve();
            });
        });

        nvidiaReq.on('error', (err) => {
            res.status(502).json({ error: 'NVIDIA API connection error', message: err.message });
            resolve();
        });

        const bodyData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        nvidiaReq.write(bodyData);
        nvidiaReq.end();
    });
};
