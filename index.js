const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const fs = require('fs');
const path = require('path');
const qrCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تحميل ملفات الأوامر من مجلد commands/
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(file => {
  if (file.endsWith('.js')) {
    const command = require(`./commands/${file}`);
    if (typeof command === 'function') {
      commands.push(command);
    }
  }
});

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      // توليد وحفظ رمز QR على شكل صورة داخل public/
      await qrCode.toFile('./public/qr.png', qr).catch(err => {
        console.error('❌ خطأ في توليد QR:', err);
      });
      console.log('✅ تم حفظ كود QR في public/qr.png');
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('📴 الاتصال مغلق. إعادة الاتصال:', shouldReconnect);
      if (shouldReconnect) startSock();
    }

    if (connection === 'open') {
      console.log('✅ تم الاتصال بواتساب بنجاح');

      // إرسال رسالة ترحيب فخمة على رقم البوت نفسه مرفقة بصورة وأزرار
      await sock.sendMessage(
        `${sock.user.id}@s.whatsapp.net`,
        {
          image: { url: 'https://b.top4top.io/p_3489wk62d0.jpg' },
          caption: `✨ *مرحباً بك يا صديقي!* ✨

🔰 لقد تم ربط رقمك بنجاح مع بوت *طرزان الواقدي*  
🤖 هنا بعض الأوامر للبدء:
• *video* لتحميل فيديو  
• *mp3* لتحميل موسيقى  
• *insta* لتحميل من إنستجرام  
• *help* لعرض كل الأوامر  

💡 أي استفسار؟ أرسل الأمر *help*`,
          footer: "بوت طرزان الواقدي ⚔️",
          buttons: [
            { buttonId: "help", buttonText: { displayText: "📋 عرض الأوامر" }, type: 1 },
            { buttonId: "menu", buttonText: { displayText: "🔍 جرب أمر جديد" }, type: 1 }
          ],
          headerType: 4 // رسالة صورة + أزرار
        }
      );

      console.log("✅ تم إرسال رسالة الترحيب مع الصورة بنجاح");
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.buttonsResponseMessage?.selectedButtonId;

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
        console.error('❌ خطأ في تنفيذ الأمر:', err);
      }
    }
  });
};

startSock();

app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
});
