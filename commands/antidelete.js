module.exports = {
  name: 'antidelete',
  type: 'system',
  onStart(sock, store, sessionNumber) {
    sock.ev.on('messages.update', async (updates) => {
      for (const update of updates) {
        if (
          update.update.message &&
          update.update.messageStubType === 68 && // رسالة محذوفة
          update.key
        ) {
          try {
            const msgKey = update.key;
            const chatId = msgKey.remoteJid;
            const id = msgKey.id;

            // تحميل الرسالة الأصلية
            const originalMsg = await sock.loadMessage(chatId, id);
            if (!originalMsg) return;

            const pushname = originalMsg.pushName || "مستخدم غير معروف";
            const senderJid = msgKey.participant || msgKey.remoteJid;
            const senderNumber = senderJid.split("@")[0];

            let caption = `🚫 *تم حذف رسالة*\n`;
            caption += `👤 *من:* ${pushname}\n`;
            caption += `📱 *رقم:* wa.me/${senderNumber}\n`;

            // إرسال لصاحب الجلسة (الرقم المرتبط بالبوت)
            await sock.sendMessage(sessionNumber, { text: caption });

            // إعادة توجيه الرسالة المحذوفة
            await sock.forwardMessage(sessionNumber, originalMsg, { force: true });

          } catch (e) {
            console.error("📛 فشل في التعامل مع رسالة محذوفة:", e.message);
          }
        }
      }
    });
  },
};
