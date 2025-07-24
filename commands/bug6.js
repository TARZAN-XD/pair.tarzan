const xeontext6 = require('../data/bugvip6'); // استدعاء النص من ملف البيانات

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith("bug6")) return;

  const parts = text.trim().split(' ');
  const number = parts[1];

  if (!number || isNaN(number)) {
    return reply("❌ يرجى كتابة رقم الهاتف بعد الأمر.\nمثال: bug6 966xxxxxxxxx");
  }

  const jid = `${number}@s.whatsapp.net`;

  try {
    for (let i = 0; i < 10; i++) {
      await sock.sendMessage(jid, { text: xeontext6 });
      await new Promise(resolve => setTimeout(resolve, 500)); // نصف ثانية بين كل إرسال
    }

    await reply(`✅ تم إرسال BugVIP6 إلى: ${number} (10 مرات)`);
  } catch (err) {
    console.error(err);
    await reply(`❌ فشل في إرسال الرسالة إلى: ${number}`);
  }
};
