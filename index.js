// tarzan_bot_fixed.js // تحديث آمن ومُحسن من سكربت طرزان (Node.js + Baileys) // ملاحظات: تم تحسين التحقق من المدخلات، إدارة الجلسات، حدود تخزين الرسائل، ومعالجة الأخطاء.

const express = require('express'); const fs = require('fs'); const path = require('path'); const qrCode = require('qrcode'); const moment = require('moment-timezone'); const helmet = require('helmet'); const rateLimit = require('express-rate-limit'); const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

const app = express(); const PORT = process.env.PORT || 10000; const PASSWORD = process.env.TARZAN_PASSWORD || 'tarzanbot'; const SESSIONS_DIR = path.join(__dirname, 'sessions'); const commands = []; const sessions = {}; const msgStore = new Map(); // Map<"jid_id", message> const MSG_STORE_LIMIT = 1500; // حدود منع تسخين الذاكرة

// ====== إعدادات أمان ووسائط ====== app.use(helmet()); app.use(express.json({ limit: '500kb' })); app.use(express.urlencoded({ extended: true })); app.use(express.static(path.join(__dirname, 'public')));

// طلبات محدودة لمنع إساءة الاستخدام const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 120 }); app.use(limiter);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ====== تحميل الأوامر (بحذر) ====== try { const commandsPath = path.join(__dirname, 'commands'); if (fs.existsSync(commandsPath)) { fs.readdirSync(commandsPath).forEach(file => { if (file.endsWith('.js')) { try { const cmdPath = path.join(commandsPath, file); delete require.cache[require.resolve(cmdPath)]; const command = require(cmdPath); // نسمح إما بدالة مباشرة أو كائن به execute if (typeof command === 'function') commands.push(command); else if (command && typeof command.execute === 'function') commands.push(command.execute); } catch (err) { console.error(⚠️ خطأ بتحميل الأمر ${file}:, err.message); } } }); } } catch (err) { console.error('⚠️ خطأ أثناء تحميل الأوامر:', err.message); }

// ====== مساعدة: تنظيف اسم الجلسة لتجنب Path Traversal ====== function sanitizeSessionId(sessionId) { if (!sessionId || typeof sessionId !== 'string') return null; // نسمح بأحرف آمنة فقط const safe = sessionId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 50); return safe || null; }

// ====== مساعدة: تحديد واستخدام أحدث إصدار من Baileys ====== async function getBaileysVersion() { try { const fetched = await fetchLatestBaileysVersion(); // fetchLatestBaileysVersion قد يرجع مصفوفة أو كائن if (Array.isArray(fetched)) return fetched[0]; if (fetched && fetched.version) return fetched.version; } catch (err) { console.warn('⚠️ تعذر جلب نسخة Baileys:', err.message); } return undefined; // يسمح للبائليز باستخدام القيمة الافتراضية إن لزم }

// ====== مساعدة: إدارة حجم msgStore ====== function ensureMsgStoreLimit() { while (msgStore.size > MSG_STORE_LIMIT) { // حذف أقدم عنصر const firstKey = msgStore.keys().next().value; msgStore.delete(firstKey); } }

// ====== إيقاف جلسة بشكل صحيح ====== async function stopSession(sessionId) { const sock = sessions[sessionId]; if (!sock) return; try { // إزالة كل المستمعين sock.ev.removeAllListeners && sock.ev.removeAllListeners(); // محاولة إغلاق الاتصال sock?.ws?.close?.(); await sock.logout?.().catch(() => {}); } catch (err) { console.warn('⚠️ خطأ أثناء إغلاق الجلسة:', err.message); } delete sessions[sessionId]; }

// ====== بدء جلسة جديدة ====== async function startSession(rawSessionId, res = null) { const sessionId = sanitizeSessionId(rawSessionId); if (!sessionId) throw new Error('اسم الجلسة غير صالح');

const sessionPath = path.join(SESSIONS_DIR, sessionId); fs.mkdirSync(sessionPath, { recursive: true, mode: 0o700 });

const { state, saveCreds } = await useMultiFileAuthState(sessionPath); const version = await getBaileysVersion();

const sock = makeWASocket({ version, auth: state, printQRInTerminal: false, generateHighQualityLinkPreview: true, syncFullHistory: false });

sessions[sessionId] = sock;

sock.ev.on('creds.update', async () => { try { await saveCreds(); } catch (err) { console.warn('⚠️ لم يتم حفظ بيانات الاعتماد:', err.message); } });

sock.ev.on('connection.update', async (update) => { try { const { connection, qr, lastDisconnect } = update;

if (qr && res) {
    try {
      const qrData = await qrCode.toDataURL(qr);
      res.json({ qr: qrData });
    } catch (err) {
      console.error('❌ خطأ بتحويل QR إلى DataURL:', err.message);
      res.json({ error: 'خطأ في توليد QR' });
    }
    // منع إعادة الاستجابة لنفس الطلب
    res = null;
  }

  if (connection === 'close') {
    const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
    console.log(`⚠️ اتصال الجلسة ${sessionId} اغلق. سيتم إعادة الاتصال؟ ${shouldReconnect}`);
    if (shouldReconnect) {
      // إعادة المحاولة بعد تأخير قصير
      setTimeout(() => startSession(sessionId).catch(e => console.error(e)), 3000);
    } else {
      await stopSession(sessionId);
    }
  }

  if (connection === 'open') {
    console.log(`✅ جلسة ${sessionId} متصلة`);

    // قد لا تكون user موجودة فوراً - تحقق
    const selfId = sock.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : null;

    if (!selfId) return;

    const caption = `✨ *مرحباً بك في بوت طرزان الواقدي* ✨\n\n✅ تم ربط الرقم بنجاح.`;

    try {
      await sock.sendMessage(selfId, {
        image: { url: 'https://b.top4top.io/p_3489wk62d0.jpg' },
        caption,
        footer: '🤖 طرزان الواقدي - بوت الذكاء الاصطناعي ⚔️',
        buttons: [
          { buttonId: 'help', buttonText: { displayText: '📋 عرض الأوامر' }, type: 1 },
          { buttonId: 'menu', buttonText: { displayText: '📦 قائمة الميزات' }, type: 1 }
        ],
        headerType: 4
      });
    } catch (err) {
      console.warn('⚠️ فشل إرسال رسالة الترحيب:', err.message);
    }
  }
} catch (err) {
  console.error('❌ خطأ في تحديث الاتصال:', err.message);
}

});

// منع الحذف - نجمع التحديثات ونحاول استرجاعها sock.ev.on('messages.update', async updates => { for (const u of updates) { try { const { key, update } = u; if (update?.message === null && key?.remoteJid && !key.fromMe) { const stored = msgStore.get(${key.remoteJid}_${key.id}); if (!stored?.message) continue;

const selfId = sock.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : null;
      if (!selfId) continue;

      const senderJid = key.participant || stored.key?.participant || key.remoteJid;
      const number = senderJid?.split('@')[0] || 'مجهول';
      const name = stored.pushName || 'غير معروف';
      const type = Object.keys(stored.message)[0];
      const time = moment().tz('Asia/Riyadh').format('YYYY-MM-DD HH:mm:ss');

      await sock.sendMessage(selfId, { text: `🚫 *تم حذف رسالة!*\n👤 *الاسم:* ${name}\n📱 *الرقم:* wa.me/${number}\n🕒 *الوقت:* ${time}\n📂 *نوع الرسالة:* ${type}` });
      await sock.sendMessage(selfId, { forward: stored });
    }
  } catch (err) {
    console.error('❌ خطأ في معالجة messages.update:', err.message);
  }
}

});

// استقبال الرسائل sock.ev.on('messages.upsert', async ({ messages }) => { try { const msg = messages?.[0]; if (!msg || !msg.message) return;

const from = msg.key.remoteJid;
  const msgId = msg.key.id;
  msgStore.set(`${from}_${msgId}`, msg);
  ensureMsgStoreLimit();

  // استخراج نص بشكل أمثل
  const text = msg.message.conversation
    || msg.message?.extendedTextMessage?.text
    || msg.message?.buttonsResponseMessage?.selectedButtonId
    || msg.message?.templateButtonReplyMessage?.selectedId
    || (msg.message?.imageMessage && msg.message.imageMessage.caption)
    || (msg.message?.videoMessage && msg.message.videoMessage.caption)
    || '';

  if (!text) return;

  const reply = async (message, buttons = null) => {
    try {
      if (buttons && Array.isArray(buttons)) {
        await sock.sendMessage(from, {
          text: message,
          buttons: buttons.map(b => ({ buttonId: b.id, buttonText: { displayText: b.text }, type: 1 })),
          headerType: 1
        }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: message }, { quoted: msg });
      }
    } catch (err) {
      console.warn('⚠️ فشل إرسال الرد:', err.message);
    }
  };

  for (const command of commands) {
    try {
      await command({ text, reply, sock, msg, from });
    } catch (err) {
      console.error('❌ خطأ أثناء تنفيذ الأمر:', err.message);
    }
  }
} catch (err) {
  console.error('❌ خطأ في messages.upsert:', err.message);
}

});

return sock; }

// ====== API Endpoints ====== app.post('/create-session', async (req, res) => { try { const { sessionId } = req.body; const safe = sanitizeSessionId(sessionId); if (!safe) return res.status(400).json({ error: 'أدخل اسم جلسة صالح (حروف أرقام - _ فقط)' }); if (sessions[safe]) return res.status(200).json({ message: 'الجلسة موجودة مسبقاً' }); await startSession(safe, res).catch(e => { throw e; }); // ملاحظة: startSession قد يرد QR عبر res } catch (err) { console.error('❌ خطأ في /create-session:', err.message); if (!res.headersSent) res.status(500).json({ error: 'فشل إنشاء الجلسة' }); } });

app.post('/pair', async (req, res) => { const { sessionId, number } = req.body; const safe = sanitizeSessionId(sessionId); if (!safe || !number) return res.status(400).json({ error: 'أدخل اسم الجلسة والرقم' });

const sock = sessions[safe]; if (!sock) return res.status(404).json({ error: 'الجلسة غير موجودة أو لم يتم تهيئتها' });

try { if (typeof sock.requestPairingCode !== 'function') throw new Error('Pairing غير مدعوم في هذه النسخة'); const code = await sock.requestPairingCode(number); res.json({ pairingCode: code }); } catch (err) { console.error('❌ خطأ في طلب رمز الاقتران:', err.message); res.status(500).json({ error: 'فشل في توليد رمز الاقتران' }); } });

app.get('/sessions', (req, res) => { res.json(Object.keys(sessions)); });

app.post('/delete-session', (req, res) => { try { const { sessionId, password } = req.body; if (password !== PASSWORD) return res.status(403).json({ error: 'كلمة المرور غير صحيحة' }); const safe = sanitizeSessionId(sessionId); if (!safe || !sessions[safe]) return res.status(404).json({ error: 'الجلسة غير موجودة' });

// الإغلاق الآمن
stopSession(safe).catch(() => {});

// حذف الملفات على القرص
const sessionPath = path.join(SESSIONS_DIR, safe);
try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch (err) { console.warn('⚠️ فشل حذف ملفات الجلسة:', err.message); }

res.json({ message: `تم حذف الجلسة ${safe} بنجاح` });

} catch (err) { console.error('❌ خطأ في /delete-session:', err.message); res.status(500).json({ error: 'فشل في حذف الجلسة' }); } });

// ====== إغلاق السيرفر بنعومة ====== async function gracefulShutdown() { console.log('🛑 إيقاف السيرفر... جاري إغلاق الجلسات'); for (const id of Object.keys(sessions)) { try { await stopSession(id); } catch (err) { console.warn(err.message); } } process.exit(0); } process.on('SIGINT', gracefulShutdown); process.on('SIGTERM', gracefulShutdown);

app.listen(PORT, () => { console.log(🚀 السيرفر شغال على http://localhost:${PORT}); });
