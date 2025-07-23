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
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ✅ تخزين الأوامر كما في كودك
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(file => {
  if (file.endsWith('.js')) {
    const command = require(`./commands/${file}`);
    if (typeof command === 'function') commands.push(command);
  }
});

// ✅ نفس كودك لحفظ الرسائل
const msgStore = new Map();

// ✅ تخزين كل الجلسات
const sessions = {};
const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

// ✅ إنشاء جلسة جديدة
const startSock = async (sessionId = 'default') => {
  const sessionPath = path.join(SESSIONS_DIR, sessionId);
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
      await qrCode.toFile(`./public/${sessionId}.png`, qr).catch(err => console.error('QR Error:', err));
      console.log(`✅ تم حفظ رمز QR في ./public/${sessionId}.png`);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log(`📴 الجلسة ${sessionId} انقطعت. إعادة الاتصال:`, shouldReconnect);
      if (shouldReconnect) startSock(sessionId);
    }

    if (connection === 'open') {
      console.log(`✅ الجلسة ${sessionId} متصلة بنجاح`);

      const selfId = sock.user.id.split(':')[0] + "@s.whatsapp.net";
      await sock.sendMessage(selfId, {
        image: { url: 'https://b.top4top.io/p_3489wk62d0.jpg' },
        caption: `✨ *مرحباً بك في بوت طرزان الواقدي* ✨
✅ تم ربط الجلسة (${sessionId}) بنجاح.

🧠 *أوامر مقترحة:*
• *video* لتحميل الفيديوهات
• *mp3* لتحويل الصوتيات
• *insta* لتحميل من انستجرام
• *help* لعرض جميع الأوامر

⚡ استمتع بالتجربة!`,
        footer: "🤖 طرزان الواقدي - بوت الذكاء الاصطناعي ⚔️",
        buttons: [
          { buttonId: "help", buttonText: { displayText: "📋 عرض الأوامر" }, type: 1 },
          { buttonId: "menu", buttonText: { displayText: "📦 قائمة الميزات" }, type: 1 }
        ],
        headerType: 4
      });
      console.log(`📩 تم إرسال رسالة ترحيب للجلسة ${sessionId}.`);
    }
  });

  // ✅ منع الحذف كما في كودك
  sock.ev.on('messages.update', async updates => {
    for (const { key, update } of updates) {
      if (update?.message === null && key?.remoteJid && !key.fromMe) {
        try {
          const stored = msgStore.get(`${key.remoteJid}_${key.id}`);
          if (!stored?.message) return;

          const selfId = sock.user.id.split(':')[0] + "@s.whatsapp.net";
          const senderJid = key.participant || stored.key?.participant || key.remoteJid;
          const number = senderJid?.split('@')[0] || 'مجهول';
          const name = stored.pushName || 'غير معروف';
          const type = Object.keys(stored.message)[0];
          const time = moment().tz("Asia/Riyadh").format("YYYY-MM-DD HH:mm:ss");

          const infoMessage =
`🚫 *تم حذف رسالة!*
👤 *الاسم:* ${name}
📱 *الرقم:* wa.me/${number}
🕒 *الوقت:* ${time}
📂 *نوع الرسالة:* ${type}`;

          fs.appendFileSync('./deleted_messages.log',
            `🧾 حذف من: ${name} - wa.me/${number} - ${type} - ${time}\n==========================\n`
          );

          await sock.sendMessage(selfId, { text: infoMessage });
          await sock.sendMessage(selfId, { forward: stored });

        } catch (err) {
          console.error('❌ خطأ في منع الحذف:', err.message);
        }
      }
    }
  });

  // ✅ استقبال الأوامر كما في كودك
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    const msgId = msg.key.id;
    msgStore.set(`${from}_${msgId}`, msg);

    const text = msg.message.conversation ||
                 msg.message.extendedTextMessage?.text ||
                 msg.message.buttonsResponseMessage?.selectedButtonId;

    if (!text) return;

    const reply = async (message, buttons = null) => {
      if (buttons && Array.isArray(buttons)) {
        await sock.sendMessage(from, {
          text: message,
          buttons: buttons.map(b => ({ buttonId: b.id, buttonText: { displayText: b.text }, type: 1 })),
          headerType: 1
        }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: message }, { quoted: msg });
      }
    };

    for (const command of commands) {
      try {
        await command({ text, reply, sock, msg, from });
      } catch (err) {
        console.error('❌ خطأ أثناء تنفيذ الأمر:', err);
      }
    }
  });

  sessions[sessionId] = sock;
};

// ✅ واجهة API لإنشاء وحذف الجلسات مع حماية كلمة المرور
app.post('/create-session', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId مطلوب' });
  if (sessions[sessionId]) return res.json({ message: 'الجلسة موجودة بالفعل' });

  await startSock(sessionId);
  res.json({ message: `تم إنشاء الجلسة ${sessionId} بنجاح`, qr: `${sessionId}.png` });
});

app.post('/delete-session', async (req, res) => {
  const { sessionId, password } = req.body;
  if (password !== 'tarzanbot') return res.status(403).json({ error: 'كلمة المرور غير صحيحة' });

  if (!sessions[sessionId]) return res.status(404).json({ error: 'الجلسة غير موجودة' });

  delete sessions[sessionId];
  fs.rmSync(path.join(SESSIONS_DIR, sessionId), { recursive: true, force: true });
  const qrPath = path.join(__dirname, 'public', `${sessionId}.png`);
  if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);

  res.json({ message: `تم حذف الجلسة ${sessionId}` });
});

app.get('/sessions', (req, res) => {
  res.json(Object.keys(sessions));
});

app.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال على http://localhost:${PORT}`);
});

// ✅ الجلسة الأساسية كما كانت
startSock('default');
