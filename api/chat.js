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

function proxyOpenRouter(bodyData, apiKey) {
    return new Promise((resolve, reject) => {
        if (!apiKey) {
            return reject(new Error('Missing OpenRouter API key'));
        }

        let payload = {};
        try {
            payload = typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData;
        } catch (e) {
            payload = bodyData;
        }

        if (!payload.model || payload.model.includes('llama-3.2-11b')) {
            payload.model = 'deepseek/deepseek-chat';
        }

        const req = https.request({
            hostname: 'openrouter.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://sabiapp.vercel.app',
                'X-Title': 'Steady - Sabi'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ status: res.statusCode, data });
                } else {
                    reject(new Error(`OpenRouter returned status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('OpenRouter timeout'));
        });

        req.write(typeof payload === 'string' ? payload : JSON.stringify(payload));
        req.end();
    });
}

function proxyNvidia(bodyData, apiKey) {
    return new Promise((resolve, reject) => {
        if (!apiKey) {
            return reject(new Error('Missing NVIDIA API key'));
        }

        let payload = {};
        try {
            payload = typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData;
        } catch (e) {
            payload = bodyData;
        }

        payload.model = 'meta/llama-3.2-11b-vision-instruct';

        const req = https.request({
            hostname: 'integrate.api.nvidia.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', (err) => reject(err));
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('NVIDIA API timeout'));
        });

        req.write(typeof payload === 'string' ? payload : JSON.stringify(payload));
        req.end();
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

    const bodyData = req.body;
    const openRouterKey = getKey(req, 'OPENROUTER_API_KEY');
    const nvidiaKey = getKey(req, 'NVIDIA_API_KEY');

    // 1. Try OpenRouter if key is present
    if (openRouterKey && openRouterKey.startsWith('sk-or-')) {
        try {
            const result = await proxyOpenRouter(bodyData, openRouterKey);
            return res.status(result.status).setHeader('Content-Type', 'application/json').send(result.data);
        } catch (err) {
            console.warn('OpenRouter request failed, checking NVIDIA fallback:', err.message);
        }
    }

    // 2. Try NVIDIA if key is present
    if (nvidiaKey && nvidiaKey.startsWith('nvapi-')) {
        try {
            const result = await proxyNvidia(bodyData, nvidiaKey);
            return res.status(result.status).setHeader('Content-Type', 'application/json').send(result.data);
        } catch (err) {
            console.error('NVIDIA request failed:', err.message);
        }
    }

    // Fallback: If no provider succeeded or keys are missing
    return res.status(502).json({
        error: 'AI service unavailable',
        message: 'No active AI key available. Please check environment configuration.'
    });
};
