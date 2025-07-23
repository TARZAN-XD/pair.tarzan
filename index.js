const express = require('express');
const fs = require('fs');
const path = require('path');
const qrCode = require('qrcode');
const moment = require('moment-timezone');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static('public'));

const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);

// حفظ جميع الجلسات في الذاكرة
const sessions = {};

// ✅ إنشاء جلسة جديدة
async function createSession(id) {
  const sessionPath = path.join(sessionsDir, id);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false
  });

  sessions[id] = { sock, status: 'connecting' };

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      sessions[id].qr = qr;
    }

    if (connection === 'open') {
      sessions[id].status = 'connected';
      sessions[id].qr = null;
      console.log(`✅ جلسة ${id} متصلة`);
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      sessions[id].status = 'disconnected';
      if (shouldReconnect) createSession(id);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.buttonsResponseMessage?.selectedButtonId;

    if (!text) return;

    // رد بسيط لاختبار الجلسة
    if (text.toLowerCase() === 'ping') {
      await sock.sendMessage(from, { text: '🏓 Pong!' });
    }
  });
}

// ✅ واجهة API

// جلب كل الجلسات
app.get('/sessions', (req, res) => {
  const data = Object.keys(sessions).map(id => ({
    id,
    status: sessions[id].status
  }));
  res.json(data);
});

// إنشاء جلسة
app.post('/session', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'أدخل رقم الجلسة' });

  if (sessions[id]) return res.json({ message: 'الجلسة موجودة بالفعل' });

  await createSession(id);
  res.json({ message: `تم إنشاء الجلسة ${id}` });
});

// جلب QR لجلسة معينة
app.get('/session/:id/qr', async (req, res) => {
  const { id } = req.params;
  if (!sessions[id]) return res.status(404).json({ error: 'الجلسة غير موجودة' });

  if (sessions[id].status === 'connected') {
    return res.json({ message: 'متصل بالفعل' });
  }

  if (!sessions[id].qr) return res.json({ message: 'جاري التوليد...' });

  const qrImage = await qrCode.toDataURL(sessions[id].qr);
  res.json({ qr: qrImage });
});

// حذف جلسة (بكلمة مرور)
app.delete('/session/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (password !== 'tarzanbot') {
    return res.status(403).json({ error: 'كلمة المرور غير صحيحة' });
  }

  const sessionPath = path.join(sessionsDir, id);
  if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
  delete sessions[id];

  res.json({ message: `تم حذف الجلسة ${id}` });
});

// ✅ تشغيل السيرفر
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`));
