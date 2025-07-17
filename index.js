const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      const qrCode = require('qrcode');
      qrCode.toFile('./public/qr.png', qr, (err) => {
        if (err) console.error('❌ خطأ في توليد QR:', err);
        else console.log('✅ تم حفظ كود QR في public/qr.png');
      });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('📴 الاتصال مغلق. إعادة الاتصال:', shouldReconnect);
      if (shouldReconnect) startSock();
    }

    if (connection === 'open') {
      console.log('✅ تم الاتصال بواتساب بنجاح');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (!text) return;

    const reply = (message) => sock.sendMessage(from, { text: message }, { quoted: msg });

    if (text.toLowerCase().includes('اذكار')) {
      reply('🌿 قال رسول الله ﷺ: "ألا أدلك على كنز من كنوز الجنة؟ قل: لا حول ولا قوة إلا بالله"');
    } else if (text.toLowerCase().includes('دعاء')) {
      reply('🤲 اللهم إنا نسألك الهداية والتوفيق والرضا والقبول.');
    } else if (text.toLowerCase().includes('حديث')) {
      reply('📖 قال رسول الله ﷺ: "من دل على خير فله مثل أجر فاعله"');
    }
  });
};

startSock();

app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
});
