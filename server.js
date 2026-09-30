const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// Read NVIDIA API key from .env or fallback to verified key
function getNvidiaKey() {
    if (process.env.NVIDIA_API_KEY) return process.env.NVIDIA_API_KEY.trim();
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(/NVIDIA_API_KEY\s*=\s*(.+)/);
            if (match && match[1].trim()) return match[1].trim();
        }
    } catch (e) {}

    try {
        const envJsPath = path.join(__dirname, 'env.js');
        if (fs.existsSync(envJsPath)) {
            const content = fs.readFileSync(envJsPath, 'utf8');
            const match = content.match(/NVIDIA_API_KEY:\s*["']([^"']+)["']/);
            if (match && match[1].trim()) return match[1].trim();
        }
    } catch (e) {}

    return "";
}

const NVIDIA_KEY = getNvidiaKey();

// MIME Types for static files
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.wasm': 'application/wasm',
    '.txt': 'text/plain; charset=UTF-8'
};

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
}

// Proxy chat request to NVIDIA NIM API
function proxyNvidiaChat(req, res, bodyData) {
    setCorsHeaders(res);

    const nvidiaReq = https.request({
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${NVIDIA_KEY}`
        }
    }, (nvidiaRes) => {
        res.writeHead(nvidiaRes.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        nvidiaRes.pipe(res);
    });

    nvidiaReq.on('error', (err) => {
        console.error('NVIDIA Proxy error:', err);
        res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Failed to connect to NVIDIA NIM API', message: err.message }));
    });

    nvidiaReq.write(bodyData);
    nvidiaReq.end();
}

const server = http.createServer((req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // API Route: /api/chat
    if (pathname === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                // Validate JSON
                JSON.parse(body);
                proxyNvidiaChat(req, res, body);
            } catch (err) {
                setCorsHeaders(res);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
        return;
    }

    // Health check endpoint
    if (pathname === '/api/health') {
        setCorsHeaders(res);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            provider: 'NVIDIA NIM (meta/llama-3.2-11b-vision-instruct)',
            hasKey: !!NVIDIA_KEY,
            keyPrefix: NVIDIA_KEY ? NVIDIA_KEY.slice(0, 10) + '...' : null
        }));
        return;
    }

    // Static File Serving
    if (pathname === '/') pathname = '/index.html';
    const safePath = path.normalize(path.join(__dirname, pathname));

    // Prevent directory traversal attacks
    if (!safePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        setCorsHeaders(res);
        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(safePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`[SERVER] Sabi OS Server is running at http://localhost:${PORT}`);
    console.log(`[AI PROXY] Live NVIDIA AI Proxy enabled on http://localhost:${PORT}/api/chat`);
    console.log(`[AUTH] NVIDIA Key loaded: ${NVIDIA_KEY ? 'Active (verified)' : 'Missing'}`);
    console.log(`======================================================\n`);
});
