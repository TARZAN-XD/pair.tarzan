const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const express = require('express');
const fs = require('fs');
const path = require('path');
const qrCode = require('qrcode');
const moment = require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static('public'));

const sessionsDir = path.join(__dirname, 'auth_sessions');
const qrDir = path.join(__dirname, 'qrs');
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);

// تحميل الأوامر
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(file => {
  if (file.endsWith('.js')) {
    const command = require(`./commands/${file}`);
    if (typeof command === 'function') commands.push(command);
  }
});

const activeSessions = new Map(); // تخزين الجلسات

// ✅ إنشاء جلسة جديدة
const createSession = async (sessionId) => {
  const sessionPath = path.join(sessionsDir, sessionId);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update;
    if (qr) {
      const qrPath = path.join(qrDir, `${sessionId}.png`);
      await qrCode.toFile(qrPath, qr);
      console.log(`✅ QR جاهز للجلسة ${sessionId}`);
    }
    if (connection === 'open') {
      console.log(`✅ الجلسة ${sessionId} متصلة`);
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log(`📴 تم قطع الاتصال للجلسة ${sessionId}. إعادة الاتصال: ${shouldReconnect}`);
      if (shouldReconnect) createSession(sessionId);
    }
  });

  // استقبال الرسائل + الأوامر
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;
    const from = msg.key.remoteJid;

    const text = msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.buttonsResponseMessage?.selectedButtonId;

    if (!text) return;

    const reply = async (message) => {
      await sock.sendMessage(from, { text: message }, { quoted: msg });
    };

    for (const command of commands) {
      try {
        await command({ text, reply, sock, msg, from });
      } catch (err) {
        console.error('❌ خطأ في تنفيذ الأمر:', err);
      }
    }
  });

  activeSessions.set(sessionId, sock);
};

// ✅ عند التشغيل: تحميل كل الجلسات القديمة
fs.readdirSync(sessionsDir).forEach(sessionId => {
  createSession(sessionId);
});

// ✅ API لإضافة جلسة جديدة
app.post('/add-session', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.json({ success: false, message: 'أدخل رقم صحيح' });
  if (activeSessions.has(number)) return res.json({ success: false, message: 'الجلسة موجودة بالفعل' });

  await createSession(number);
  res.json({ success: true, message: 'تم إنشاء الجلسة بنجاح' });
});

// ✅ API لعرض الجلسات
app.get('/sessions', (req, res) => {
  res.json({ activeSessions: Array.from(activeSessions.keys()) });
});

// ✅ عرض واجهة التحكم
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`));
