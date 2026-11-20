const BOT_TOKEN = "9195323787:AAHV95AHKtcnAPExfE6PhvtWAUUqiydpJwk";
const CHAT_ID = "6684879160";

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'غير مسموح' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'محاولات كثيرة، انتظر قليلاً' });

  try {
    const name = String((req.body || {}).name || '').trim().replace(/\s+/g, ' ');
    if (name.length < 3 || name.length > 60) {
      return res.status(400).json({ error: 'الاسم غير صالح' });
    }

    const time = new Date().toLocaleString('ar-DZ', {
      timeZone: 'Africa/Algiers', dateStyle: 'full', timeStyle: 'short'
    });
    const text = `✅ حضور جديد\n👤 ${name}\n🕒 ${time}`;

    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text })
    });
    if (!r.ok) return res.status(502).json({ error: 'تعذّر الإرسال إلى تيليغرام' });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'طلب غير صالح' });
  }
};
