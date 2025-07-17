const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const express = require('express');
const qrcode = require('qrcode');

// استخدم مجلد auth
const { state, saveCreds } = await useMultiFileAuthState('./auth');

// إعداد صفحة QR
const app = express();
app.use(express.static('public'));
app.listen(3000, () => {
  console.log("✅ صفحة QR جاهزة على http://localhost:3000");
});

async function startBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, qr }) => {
    if (qr) {
      await qrcode.toFile('./public/qr.png', qr);
      console.log("📸 تم إنشاء رمز QR");
    }

    if (connection === 'open') {
      console.log("✅ تم الاتصال بنجاح");
    } else if (connection === 'close') {
      console.log("❌ الاتصال مغلق... إعادة المحاولة");
      startBot();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const reply = (t) => sock.sendMessage(msg.key.remoteJid, { text: t });

    if (text?.toLowerCase().includes('اذكار')) {
      reply("📿 أذكار الصباح:\nأصبحنا وأصبح الملك لله...");
    } else if (text?.toLowerCase().includes('دعاء')) {
      reply("🤲 دعاء اليوم:\nاللهم إني أسألك العفو والعافية...");
    } else if (text?.toLowerCase().includes('حديث')) {
      reply("📖 حديث شريف:\nقال رسول الله ﷺ: 'الدين النصيحة'");
    }
  });
}

startBot();
