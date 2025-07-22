const moment = require('moment-timezone');

module.exports = {
  name: 'antidelete',
  type: 'system',
  onStart(sock, store, sessionNumber) {
    sock.ev.on('messages.update', async (updates) => {
      for (const { key, update } of updates) {
        try {
          if (
            update?.message === null &&
            key?.remoteJid &&
            !key.fromMe
          ) {
            const { remoteJid, id, participant } = key;
            const deletedMsg = await sock.loadMessage(remoteJid, id);
            if (!deletedMsg?.message) return;

            const sender = participant || remoteJid;
            const number = sender.split('@')[0];
            const name = deletedMsg.pushName || 'مستخدم غير معروف';

            const timestamp = moment().tz("Asia/Riyadh").format("YYYY-MM-DD HH:mm:ss");
            const messageType = Object.keys(deletedMsg.message)[0];

            const header =
              `📛 *تم حذف رسالة!*\n` +
              `👤 *من:* wa.me/${number}\n` +
              `🧾 *الاسم:* ${name}\n` +
              `⏱️ *الوقت:* ${timestamp}\n` +
              `📌 *النوع:* ${messageType}`;

            await sock.sendMessage(sessionNumber, { text: header });

            await sock.sendMessage(sessionNumber, {
              forward: deletedMsg
            });

            console.log(`📤 تم استرجاع رسالة محذوفة (${messageType}) من ${number}`);
          }
        } catch (err) {
          console.error("🚫 خطأ في antidelete:", err.message);
        }
      }
    });
  }
};
