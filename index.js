const { default: makeWASocket, useSingleFileAuthState, makeInMemoryStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode');
const fs = require('fs');
const express = require('express');

const { state, saveState } = useSingleFileAuthState('./auth.json');

const app = express();
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(3000, () => {
  console.log('📡 صفحة QR تعمل على http://localhost:3000');
});

async function startBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;

    if (qr) {
      await qrcode.toFile('./public/qr.png', qr);
      console.log("✅ رمز QR تم حفظه في public/qr.png");
    }

    if (connection === 'open') {
      console.log('✅ تم الاتصال بواتساب');
    } else if (connection === 'close') {
      const shouldReconnect = update.lastDisconnect?.error?.output?.statusCode !== 401;
      console.log('❌ الاتصال مقطوع... إعادة المحاولة:', shouldReconnect);
      if (shouldReconnect) startBot();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const reply = (t) => sock.sendMessage(msg.key.remoteJid, { text: t });

    if (text?.toLowerCase().includes('اذكار')) {
      reply("📿 أذكار الصباح:\n1. أصبحنا وأصبح الملك لله...");
    } else if (text?.toLowerCase().includes('دعاء')) {
      reply("🤲 دعاء اليوم:\nاللهم إني أسألك العفو والعافية...");
    } else if (text?.toLowerCase().includes('حديث')) {
      reply("📖 حديث شريف:\nقال رسول الله ﷺ: 'الدين النصيحة'...");
    }
  });
}

startBot();
