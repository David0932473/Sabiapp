const https = require('https');

function getKey(req, envVar) {
    if (process.env[envVar] && process.env[envVar].trim()) {
        return process.env[envVar].trim();
    }
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        if (token) return token;
    }
    return '';
}

function streamOpenRouter(req, res, payload, apiKey) {
    return new Promise((resolve, reject) => {
        if (!apiKey) return reject(new Error('Missing OpenRouter API key'));

        if (!payload.model || payload.model.includes('llama-3.2-11b')) {
            payload.model = 'deepseek/deepseek-chat';
        }

        const orReq = https.request({
            hostname: 'openrouter.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://sabiapp.vercel.app',
                'X-Title': 'Steady - Sabi Academic OS'
            }
        }, (orRes) => {
            if (orRes.statusCode >= 200 && orRes.statusCode < 300) {
                res.writeHead(orRes.statusCode, {
                    'Content-Type': orRes.headers['content-type'] || (payload.stream ? 'text/event-stream' : 'application/json'),
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*'
                });
                orRes.pipe(res);
                orRes.on('end', () => resolve());
            } else {
                let errData = '';
                orRes.on('data', chunk => errData += chunk);
                orRes.on('end', () => reject(new Error(`OpenRouter returned status ${orRes.statusCode}: ${errData}`)));
            }
        });

        orReq.on('error', (err) => reject(err));
        orReq.setTimeout(25000, () => {
            orReq.destroy();
            reject(new Error('OpenRouter connection timeout'));
        });

        orReq.write(typeof payload === 'string' ? payload : JSON.stringify(payload));
        orReq.end();
    });
}

function streamNvidia(req, res, payload, apiKey) {
    return new Promise((resolve, reject) => {
        if (!apiKey) return reject(new Error('Missing NVIDIA API key'));

        payload.model = 'meta/llama-3.2-11b-vision-instruct';

        const nvReq = https.request({
            hostname: 'integrate.api.nvidia.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        }, (nvRes) => {
            res.writeHead(nvRes.statusCode, {
                'Content-Type': nvRes.headers['content-type'] || (payload.stream ? 'text/event-stream' : 'application/json'),
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });
            nvRes.pipe(res);
            nvRes.on('end', () => resolve());
        });

        nvReq.on('error', (err) => reject(err));
        nvReq.setTimeout(25000, () => {
            nvReq.destroy();
            reject(new Error('NVIDIA API timeout'));
        });

        nvReq.write(typeof payload === 'string' ? payload : JSON.stringify(payload));
        nvReq.end();
    });
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let payload = req.body;
    try {
        if (typeof payload === 'string') payload = JSON.parse(payload);
    } catch (e) {}

    const openRouterKey = getKey(req, 'OPENROUTER_API_KEY');
    const nvidiaKey = getKey(req, 'NVIDIA_API_KEY');

    // 1. Try OpenRouter (supports streaming SSE token-by-token)
    if (openRouterKey && openRouterKey.startsWith('sk-or-')) {
        try {
            await streamOpenRouter(req, res, payload, openRouterKey);
            return;
        } catch (err) {
            console.warn('OpenRouter request failed, checking NVIDIA fallback:', err.message);
        }
    }

    // 2. Try NVIDIA fallback
    if (nvidiaKey && nvidiaKey.startsWith('nvapi-')) {
        try {
            await streamNvidia(req, res, payload, nvidiaKey);
            return;
        } catch (err) {
            console.error('NVIDIA request failed:', err.message);
        }
    }

    // Fallback: If no provider succeeded or keys are missing
    if (!res.headersSent) {
        return res.status(502).json({
            error: 'AI service unavailable',
            message: 'No active AI key available. Please check environment configuration.'
        });
    }
};
