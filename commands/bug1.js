const { bugUrl } = require('../bugUrl');

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith("bug")) return;

  const parts = text.trim().split(' ');
  const number = parts[1];

  if (!number || isNaN(number)) {
    return reply("❌ يرجى كتابة رقم الهاتف بعد الأمر.\nمثال: bug 966xxxxxxxxx");
  }

  const jid = `${number}@s.whatsapp.net`;

  try {
    await sock.sendMessage(jid, {
      text: bugUrl
    });

    await reply(`✅ تم إرسال bugUrl إلى: ${number}`);
  } catch (err) {
    console.error(err);
    await reply(`❌ فشل في إرسال الرسالة إلى: ${number}`);
  }
};
