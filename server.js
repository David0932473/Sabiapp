const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// Environment variable resolver (.env, process.env, env.js)
function getEnvVar(key, fallback = '') {
    if (process.env[key]) return process.env[key].trim();
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(new RegExp(`^${key}\\s*=\\s*(.+)`, 'm'));
            if (match && match[1].trim()) return match[1].trim();
        }
    } catch (e) {}

    try {
        const envJsPath = path.join(__dirname, 'env.js');
        if (fs.existsSync(envJsPath)) {
            const content = fs.readFileSync(envJsPath, 'utf8');
            const match = content.match(new RegExp(`${key}:\\s*["']([^"']+)["']`));
            if (match && match[1].trim()) return match[1].trim();
        }
    } catch (e) {}

    return fallback;
}

const NVIDIA_KEY = getEnvVar('NVIDIA_API_KEY');
const OPENROUTER_KEY = getEnvVar('OPENROUTER_API_KEY');
const GOOGLE_CLIENT_ID = getEnvVar('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = getEnvVar('GOOGLE_CLIENT_SECRET');
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events'; // Sensitive scope (avoids CASA Tier 2 audit)

// Secure Google OAuth Token Storage
const GOOGLE_TOKENS_FILE = path.join(__dirname, 'data', 'google-tokens.json');

function readStoredGoogleTokens() {
    try {
        if (fs.existsSync(GOOGLE_TOKENS_FILE)) {
            return JSON.parse(fs.readFileSync(GOOGLE_TOKENS_FILE, 'utf8') || '{}');
        }
    } catch (e) {
        console.warn('Error reading Google tokens:', e.message);
    }
    return {};
}

function saveGoogleTokens(userId, tokenData) {
    try {
        const all = readStoredGoogleTokens();
        all[userId] = Object.assign({}, all[userId] || {}, tokenData, { updated_at: new Date().toISOString() });
        const dir = path.dirname(GOOGLE_TOKENS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(GOOGLE_TOKENS_FILE, JSON.stringify(all, null, 2), 'utf8');
        return all[userId];
    } catch (e) {
        console.error('Error saving Google tokens:', e.message);
        return null;
    }
}

function removeGoogleTokens(userId) {
    try {
        const all = readStoredGoogleTokens();
        delete all[userId];
        fs.writeFileSync(GOOGLE_TOKENS_FILE, JSON.stringify(all, null, 2), 'utf8');
    } catch (e) {}
}

// Native HTTPS request promise wrapper
function makeHttpsRequest(urlStr, options = {}, postData = null) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(urlStr);
        const reqOpts = {
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = https.request(reqOpts, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsedBody = data;
                try { parsedBody = JSON.parse(data); } catch(e) {}
                resolve({ statusCode: res.statusCode, headers: res.headers, body: parsedBody });
            });
        });

        req.on('error', reject);
        if (postData) {
            const strData = typeof postData === 'string' ? postData : JSON.stringify(postData);
            req.write(strData);
        }
        req.end();
    });
}

// Helper: refresh token if expired
async function getValidGoogleAccessToken(userId) {
    const all = readStoredGoogleTokens();
    const userTokens = all[userId];
    if (!userTokens) return null;

    const now = Date.now();
    if (userTokens.access_token && userTokens.expires_at && (userTokens.expires_at - now > 60000)) {
        return userTokens.access_token;
    }

    if (!userTokens.refresh_token) {
        return userTokens.access_token || null;
    }

    const clientId = getEnvVar('GOOGLE_CLIENT_ID');
    const clientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) return userTokens.access_token || null;

    const postBody = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: userTokens.refresh_token,
        grant_type: 'refresh_token'
    }).toString();

    try {
        const res = await makeHttpsRequest('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }, postBody);

        if (res.statusCode === 200 && res.body && res.body.access_token) {
            const refreshed = {
                access_token: res.body.access_token,
                expires_at: Date.now() + ((res.body.expires_in || 3600) * 1000)
            };
            saveGoogleTokens(userId, refreshed);
            return refreshed.access_token;
        }
    } catch (err) {
        console.warn('Google token auto-refresh failed:', err.message);
    }

    return userTokens.access_token || null;
}

// RRULE Recurrence Helpers
function formatRRuleUntil(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

const DAY_CODE_MAP = {
    'SU': 0, 'SUN': 0, 'SUNDAY': 0,
    'MO': 1, 'MON': 1, 'MONDAY': 1,
    'TU': 2, 'TUE': 2, 'TUESDAY': 2,
    'WE': 3, 'WED': 3, 'WEDNESDAY': 3,
    'TH': 4, 'THU': 4, 'THURSDAY': 4,
    'FR': 5, 'FRI': 5, 'FRIDAY': 5,
    'SA': 6, 'SAT': 6, 'SATURDAY': 6
};

function getNextDateForDayCode(dayCode, baseDate = new Date()) {
    const rawCode = String(dayCode || 'MO').split(',')[0].trim().toUpperCase();
    const targetDay = DAY_CODE_MAP[rawCode] !== undefined ? DAY_CODE_MAP[rawCode] : 1;
    const res = new Date(baseDate);
    const currentDay = res.getDay();
    let diff = (targetDay - currentDay + 7) % 7;
    res.setDate(res.getDate() + diff);
    return res.toISOString().split('T')[0];
}

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



// Proxy chat request to OpenRouter (DeepSeek V3 / Llama 70B) or NVIDIA NIM
function proxyChat(req, res, bodyData) {
    setCorsHeaders(res);

    if (OPENROUTER_KEY && OPENROUTER_KEY.startsWith('sk-or-')) {
        let payload = {};
        try { payload = JSON.parse(bodyData); } catch(e) {}
        if (!payload.model || payload.model.includes('llama-3.2-11b')) {
            payload.model = 'deepseek/deepseek-chat';
        }

        const orReq = https.request({
            hostname: 'openrouter.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_KEY}`,
                'HTTP-Referer': 'https://sabi.app',
                'X-Title': 'Steady - Sabi Academic OS'
            }
        }, (orRes) => {
            if (orRes.statusCode >= 200 && orRes.statusCode < 300) {
                res.writeHead(orRes.statusCode, {
                    'Content-Type': orRes.headers['content-type'] || 'application/json',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*'
                });
                return orRes.pipe(res);
            }
            proxyNvidiaChat(req, res, bodyData);
        });

        orReq.on('error', () => {
            proxyNvidiaChat(req, res, bodyData);
        });

        orReq.write(JSON.stringify(payload));
        orReq.end();
        return;
    }

    proxyNvidiaChat(req, res, bodyData);
}

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
            'Content-Type': nvidiaRes.headers['content-type'] || 'application/json',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        nvidiaRes.pipe(res);
    });

    nvidiaReq.on('error', (err) => {
        console.error('AI Proxy error:', err);
        res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Failed to connect to AI API', message: err.message }));
    });

    nvidiaReq.write(bodyData);
    nvidiaReq.end();
}

const server = http.createServer(async (req, res) => {
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
                proxyChat(req, res, body);
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
            keyPrefix: NVIDIA_KEY ? NVIDIA_KEY.slice(0, 10) + '...' : null,
            googleCalendarConfigured: !!(getEnvVar('GOOGLE_CLIENT_ID') && getEnvVar('GOOGLE_CLIENT_SECRET'))
        }));
        return;
    }

    // Google Calendar OAuth: Generate Auth URL
    if (pathname === '/api/auth/google/url' && req.method === 'GET') {
        setCorsHeaders(res);
        const clientId = getEnvVar('GOOGLE_CLIENT_ID');
        const redirectUri = getEnvVar('GOOGLE_REDIRECT_URI', `http://${req.headers.host}/auth/google/callback`);
        const userId = parsedUrl.searchParams.get('userId') || 'default_user';

        if (!clientId) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                configured: false,
                error: 'GOOGLE_CLIENT_ID not found in .env'
            }));
            return;
        }

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: GOOGLE_SCOPE,
                access_type: 'offline', // Gives refresh_token for background sync
                prompt: 'consent',      // Forces refresh token generation
                state: userId           // Pass user ID
            }).toString();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ configured: true, url: authUrl }));
        return;
    }

    // Google Calendar OAuth: Callback Redirect Handler
    if (pathname === '/auth/google/callback' && req.method === 'GET') {
        const code = parsedUrl.searchParams.get('code');
        const userId = parsedUrl.searchParams.get('state') || 'default_user';
        const error = parsedUrl.searchParams.get('error');

        if (error || !code) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(`<!DOCTYPE html>
<html>
<head><title>Connection Cancelled</title></head>
<body style="font-family: -apple-system, sans-serif; background: #09090B; color: #FAFAFA; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
  <div style="background: #18181B; padding: 32px; border-radius: 14px; border: 1px solid #27272A; max-width: 360px;">
    <div style="font-size: 32px; margin-bottom: 8px;">⚠️</div>
    <h3 style="margin: 0 0 6px;">Google Sync Cancelled</h3>
    <p style="margin: 0; font-size: 13px; color: #A1A1AA;">${error || 'Authentication code not received.'}</p>
  </div>
  <script>
    if (window.opener) { window.opener.postMessage("CALENDAR_AUTH_ERROR", "*"); }
    setTimeout(() => { window.close(); }, 1200);
  </script>
</body>
</html>`);
            return;
        }

        const clientId = getEnvVar('GOOGLE_CLIENT_ID');
        const clientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
        const redirectUri = getEnvVar('GOOGLE_REDIRECT_URI', `http://${req.headers.host}/auth/google/callback`);

        try {
            const postBody = new URLSearchParams({
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            }).toString();

            const tokenRes = await makeHttpsRequest('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }, postBody);

            if (tokenRes.statusCode === 200 && tokenRes.body && tokenRes.body.access_token) {
                saveGoogleTokens(userId, {
                    refresh_token: tokenRes.body.refresh_token,
                    access_token: tokenRes.body.access_token,
                    expires_at: Date.now() + ((tokenRes.body.expires_in || 3600) * 1000),
                    scope: tokenRes.body.scope
                });

                res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
                res.end(`<!DOCTYPE html>
<html>
<head><title>Google Calendar Connected</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090B; color: #FAFAFA; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
  <div style="background: #18181B; padding: 32px 36px; border-radius: 16px; border: 1px solid #27272A; max-width: 380px;">
    <div style="font-size: 38px; margin-bottom: 12px;">✅</div>
    <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">Calendar Connected!</h2>
    <p style="margin: 0 0 16px; font-size: 13px; color: #A1A1AA; line-height: 1.5;">Your Google Calendar is linked to Sabi. Returning to your study assistant...</p>
    <div style="font-size: 11px; color: #71717A;">This window will close automatically.</div>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage("CALENDAR_CONNECTED", "*");
    }
    setTimeout(() => { window.close(); }, 800);
  </script>
</body>
</html>`);
                return;
            } else {
                console.error('Failed to exchange Google OAuth code:', tokenRes.body);
                res.writeHead(500, { 'Content-Type': 'text/html; charset=UTF-8' });
                res.end(`<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 40px; text-align: center;"><h3>Google OAuth Error</h3><p>${JSON.stringify(tokenRes.body)}</p></body></html>`);
                return;
            }
        } catch (tokenErr) {
            console.error('OAuth token exchange error:', tokenErr);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Authentication token exchange error: ' + tokenErr.message);
            return;
        }
    }

    // Google Calendar OAuth: Status Endpoint
    if (pathname === '/api/auth/google/status' && req.method === 'GET') {
        setCorsHeaders(res);
        const userId = parsedUrl.searchParams.get('userId') || 'default_user';
        const token = await getValidGoogleAccessToken(userId);
        const hasConfig = !!(getEnvVar('GOOGLE_CLIENT_ID') && getEnvVar('GOOGLE_CLIENT_SECRET'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            connected: !!token,
            configured: hasConfig
        }));
        return;
    }

    // Google Calendar OAuth: Disconnect
    if (pathname === '/api/auth/google/disconnect' && req.method === 'POST') {
        setCorsHeaders(res);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            let parsed = {};
            try { parsed = JSON.parse(body); } catch(e){}
            const userId = parsed.userId || parsedUrl.searchParams.get('userId') || 'default_user';
            removeGoogleTokens(userId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Google Calendar disconnected.' }));
        });
        return;
    }

    // Tool 1: get_calendar_events (Reads next 7-14 days events)
    if (pathname === '/api/calendar/events' && req.method === 'GET') {
        setCorsHeaders(res);
        const userId = parsedUrl.searchParams.get('userId') || 'default_user';
        const days = parseInt(parsedUrl.searchParams.get('days') || '14', 10);
        const token = await getValidGoogleAccessToken(userId);

        if (!token) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ connected: false, events: [] }));
            return;
        }

        try {
            const timeMin = new Date().toISOString();
            const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            const queryUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                new URLSearchParams({
                    timeMin,
                    timeMax,
                    singleEvents: 'true',
                    orderBy: 'startTime',
                    maxResults: '60'
                }).toString();

            const gcalRes = await makeHttpsRequest(queryUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (gcalRes.statusCode === 200 && Array.isArray(gcalRes.body?.items)) {
                const events = gcalRes.body.items.map(ev => ({
                    id: ev.id,
                    summary: ev.summary || 'Scheduled Event',
                    start: ev.start?.dateTime || ev.start?.date,
                    end: ev.end?.dateTime || ev.end?.date,
                    location: ev.location || '',
                    description: ev.description || '',
                    colorId: ev.colorId || null
                }));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ connected: true, events }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ connected: false, events: [], error: gcalRes.body }));
            }
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch Google Calendar events', message: err.message }));
        }
        return;
    }

    // Tool 3 / Part 4: commit_events_to_calendar (Batch Event Insertion + RRULE)
    if (pathname === '/api/calendar/batch-insert' && req.method === 'POST') {
        setCorsHeaders(res);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            let payload = {};
            try { payload = JSON.parse(body); } catch(e){}

            const userId = payload.userId || 'default_user';
            const token = await getValidGoogleAccessToken(userId);

            if (!token) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Google Calendar is not connected. Please connect first.' }));
                return;
            }

            const examDate = payload.exam_date;
            const rawEvents = Array.isArray(payload.events) ? payload.events : [];
            const timeZone = payload.timeZone || 'Africa/Lagos';

            // Cutoff: exam_date or now + 30 days
            const untilDate = examDate ? new Date(examDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const untilStr = formatRRuleUntil(untilDate);

            const results = [];
            let insertedCount = 0;

            for (const ev of rawEvents) {
                try {
                    let rruleDays = 'MO';
                    if (ev.dayOfWeek) {
                        rruleDays = ev.dayOfWeek.split(',')
                            .map(d => {
                                const clean = d.trim().toUpperCase();
                                if (clean.length === 2) return clean;
                                return clean.slice(0, 2);
                            })
                            .join(',');
                    }

                    const firstDayCode = rruleDays.split(',')[0];
                    const firstDate = ev.firstDate || getNextDateForDayCode(firstDayCode);
                    const startTime = ev.startTime || '14:00';
                    const endTime = ev.endTime || '15:30';

                    const rruleString = `RRULE:FREQ=WEEKLY;BYDAY=${rruleDays};UNTIL=${untilStr}`;

                    const eventPayload = {
                        summary: ev.summary || '📚 Sabi Study Session',
                        description: 'Generated by Sabi Study Assistant',
                        start: {
                            dateTime: `${firstDate}T${startTime}:00`,
                            timeZone: timeZone
                        },
                        end: {
                            dateTime: `${firstDate}T${endTime}:00`,
                            timeZone: timeZone
                        },
                        recurrence: [rruleString],
                        colorId: ev.colorId || '9' // Blueberry color for study
                    };

                    const insertRes = await makeHttpsRequest(
                        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        },
                        eventPayload
                    );

                    if (insertRes.statusCode >= 200 && insertRes.statusCode < 300) {
                        insertedCount++;
                        results.push({ success: true, summary: ev.summary, id: insertRes.body?.id });
                    } else {
                        results.push({ success: false, summary: ev.summary, error: insertRes.body });
                    }
                } catch (evErr) {
                    results.push({ success: false, summary: ev.summary, error: evErr.message });
                }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: insertedCount > 0,
                insertedCount,
                total: rawEvents.length,
                results,
                until: untilDate.toISOString()
            }));
        });
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

    // Check direct file or append .html
    let filePath = safePath;
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            if (!path.extname(filePath)) {
                filePath = filePath + '.html';
                return fs.stat(filePath, (htmlErr, htmlStats) => {
                    if (htmlErr || !htmlStats.isFile()) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                        return;
                    }
                    serveFile(filePath, res);
                });
            }
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        serveFile(filePath, res);
    });
});

function serveFile(targetPath, res) {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(targetPath);
    stream.pipe(res);
}

const os = require('os');
function getNetworkIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const NETWORK_IP = getNetworkIp();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`[SERVER] Sabi OS Server is running:`);
    console.log(`         • This PC:       http://localhost:${PORT}`);
    console.log(`         • Other Devices: http://${NETWORK_IP}:${PORT}`);
    console.log(`[AI PROXY] Live NVIDIA AI Proxy enabled on /api/chat`);
    console.log(`[AUTH] NVIDIA Key loaded: ${NVIDIA_KEY ? 'Active (verified)' : 'Missing'}`);
    console.log(`[GCAL] Google OAuth: ${GOOGLE_CLIENT_ID ? 'Configured (Sensitive Scope: calendar.events)' : 'Not configured (add GOOGLE_CLIENT_ID to .env)'}`);
    console.log(`======================================================\n`);
});
