const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const fs = require("fs");

const { state, saveState } = useSingleFileAuthState("./auth.json");

async function startBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("connection closed due to ", lastDisconnect.error, ", reconnecting:", shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === "open") {
      console.log("✅ Bot is connected to WhatsApp!");
    }
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

    if (text.toLowerCase().includes("اذكار")) {
      await sock.sendMessage(sender, { text: "🌿 أذكار الصباح:\n\nاللهم بك أصبحنا وبك أمسينا، وبك نحيا وبك نموت وإليك النشور." });
    } else if (text.toLowerCase().includes("دعاء")) {
      await sock.sendMessage(sender, { text: "🤲 دعاء اليوم:\n\nاللهم إني أسألك العفو والعافية في الدنيا والآخرة." });
    } else if (text.toLowerCase().includes("حديث")) {
      await sock.sendMessage(sender, { text: "📖 حديث شريف:\n\nقال رسول الله ﷺ: «الدال على الخير كفاعله»" });
    }
  });
}

startBot();
