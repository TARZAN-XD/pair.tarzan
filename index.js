const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    version,
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;

    if (qr) {
      const qrImage = await qrcode.toDataURL(qr);
      io.emit('qr', qrImage);
      console.log("✅ رمز QR جاهز وأُرسل للواجهة");
    }

    if (connection === 'open') {
      console.log("✅ واتساب متصل الآن");
      io.emit('connected');
    }

    if (connection === 'close') {
      const shouldReconnect = (update.lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🔁 الاتصال مغلق، إعادة الاتصال:', shouldReconnect);
      if (shouldReconnect) startBot();
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

startBot();

server.listen(PORT, () => {
  console.log(`🌐 الواجهة تعمل على http://localhost:${PORT}`);
});
