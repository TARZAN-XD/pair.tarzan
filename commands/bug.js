const { bugpdf } = require('../bugpdf');

module.exports = async ({ sock, msg, text, reply }) => {
  // التأكد أن الأمر يبدأ بـ bug
  if (!text.startsWith("bug")) return;

  const parts = text.trim().split(' ');
  const command = parts[0];
  const second = parts[1];
  const third = parts[2];

  let number;
  let showConfirm = false;

  // إذا المستخدم كتب: bug confirm <رقم>
  if (second === 'confirm' && third && !isNaN(third)) {
    number = third;
    showConfirm = true;
  }
  // إذا كتب: bug <رقم>
  else if (second && !isNaN(second)) {
    number = second;
  } else {
    return reply("❌ يرجى كتابة الرقم بشكل صحيح.\nمثال:\n- bug 966xxxxxxxxx\n- bug confirm 966xxxxxxxxx");
  }

  const jid = `${number}@s.whatsapp.net`;

  try {
    await sock.sendMessage(jid, {
      text: bugpdf
    });

    if (showConfirm) {
      await reply(`✅ تم إرسال BugPDF إلى: ${number}`);
    }
    // لا شيء يُرسل في حال لم يكن confirm
  } catch (err) {
    console.error(err);
    await reply(`❌ فشل في إرسال الرسالة إلى: ${number}`);
  }
};
