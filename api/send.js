const BOT_TOKEN = "9195323787:AAHV95AHKtcnAPExfE6PhvtWAUUqiydpJwk";
const CHAT_ID = "6684879160";

const clean = (v, max) =>
  String(v || "").replace(/\s+/g, " ").trim().slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = BOT_TOKEN;
  const chatId = CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ error: "الخادم غير مهيّأ (متغيرات البيئة ناقصة)" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const type = body.type;
  const name = clean(body.name, 60);
  const group = clean(body.group, 40);

  if (!name) return res.status(400).json({ error: "الاسم مطلوب" });

  const now = new Date().toLocaleString("ar-DZ", {
    timeZone: "Africa/Algiers",
    dateStyle: "short",
    timeStyle: "short",
  });

  let text;
  if (type === "name") {
    text = `👤 تلميذ جديد\nالاسم: ${name}\n🕒 ${now}`;
  } else if (type === "group") {
    if (!group) return res.status(400).json({ error: "المجموعة مطلوبة" });
    text = `✅ تسجيل حضور\nالاسم: ${name}\nالمجموعة: ${group}\n🕒 ${now}`;
  } else {
    return res.status(400).json({ error: "نوع غير صالح" });
  }

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!r.ok) {
      return res.status(502).json({ error: "رفض تيليغرام الرسالة، تحقق من التوكن ومعرّف المحادثة" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "تعذر الاتصال بتيليغرام" });
  }
};
