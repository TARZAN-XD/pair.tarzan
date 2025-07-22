module.exports = {
  name: 'antidelete',
  type: 'system',
  onStart(sock, store, sessionNumber) {
    sock.ev.on('messages.update', async (updates) => {
      for (const update of updates) {
        if (
          update.update &&
          update.update.messageStubType === 68 && // حذف الرسالة
          update.key
        ) {
          try {
            const { remoteJid, id, participant } = update.key;
            const original = await sock.loadMessage(remoteJid, id);
            if (!original) return;

            const sender = participant || remoteJid;
            const number = sender.split('@')[0];
            const name = original.pushName || 'مستخدم';

            const header = `📛 *تم حذف رسالة!*\n👤 *من:* wa.me/${number}\n💬 *الاسم:* ${name}`;

            // إرسال الرسالة المحذوفة إلى الرقم المرتبط (صاحب الجلسة)
            await sock.sendMessage(sessionNumber, { text: header });

            // إعادة توجيه الرسالة المحذوفة
            await sock.sendMessage(sessionNumber, {
              forward: original
            });

          } catch (err) {
            console.error("🚫 خطأ عند التعامل مع الحذف:", err.message);
          }
        }
      }
    });
  }
};
