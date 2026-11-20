const http = require('http');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN ="9195323787:AAHV95AHKtcnAPExfE6PhvtWAUUqiydpJwk";
const CHAT_ID = "6684879160";// معرّف المحادثة التي تصلها الرسائل
const PORT = process.env.PORT || 3000;

const hits = new Map(); // حماية بسيطة من الإرسال المتكرر: 5 طلبات/دقيقة لكل IP
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }

  if (req.method === 'POST' && req.url === '/api/attendance') {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (limited(ip)) return send(res, 429, { error: 'محاولات كثيرة، انتظر قليلاً' });

    let body = '';
    req.on('data', c => { body += c; if (body.length > 2000) req.destroy(); });
    req.on('end', async () => {
      try {
        const name = String(JSON.parse(body).name || '').trim().replace(/\s+/g, ' ');
        if (name.length < 3 || name.length > 60) return send(res, 400, { error: 'الاسم غير صالح' });

        const time = new Date().toLocaleString('ar-DZ', {
          timeZone: 'Africa/Algiers', dateStyle: 'full', timeStyle: 'short'
        });
        const text = `✅ حضور جديد\n👤 ${name}\n🕒 ${time}`;

        const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text })
        });
        if (!r.ok) return send(res, 502, { error: 'تعذّر الإرسال إلى تيليغرام' });
        send(res, 200, { ok: true });
      } catch (e) {
        send(res, 400, { error: 'طلب غير صالح' });
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
}).listen(PORT, () => console.log('Running on port ' + PORT));
        
