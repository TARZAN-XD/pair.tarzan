const express = require("express");
const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static("public")); // مجلد للملفات الثابتة مثل index.html

(async () => {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  let sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("✅ رمز QR جاهز، افتح صفحة HTML");
      // حفظ QR مؤقت لعرضه في HTML
      const qrImage = await qrcode.toDataURL(qr);
      fs.writeFileSync("./public/qr.html", `
        <html>
        <head><title>ربط واتساب</title></head>
        <body style="text-align:center; font-family:sans-serif;">
          <h2>👆 امسح رمز QR لتفعيل البوت 👇</h2>
          <img src="${qrImage}" />
        </body>
        </html>
      `);
    }

    if (connection === "open") {
      console.log("✅ تم الاتصال بواتساب بنجاح");
    }

    if (connection === "close") {
      const reason = update.lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔁 إعادة الاتصال...");
        sock = makeWASocket({
          version,
          auth: state,
          printQRInTerminal: false
        });
      } else {
        console.log("❌ تم تسجيل الخروج من واتساب");
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
})();

app.get("/", (req, res) => {
  if (fs.existsSync("./public/qr.html")) {
    res.sendFile(__dirname + "/public/qr.html");
  } else {
    res.send("<h2>✅ البوت متصل بواتساب بالفعل</h2>");
  }
});

app.listen(PORT, () => {
  console.log(`🌐 الواجهة تعمل على http://localhost:${PORT}`);
});
