module.exports = async ({ text, reply, sock, msg, from }) => {
  const azkar = [
    '📿 *ذكر 1:* سبحان الله وبحمده، سبحان الله العظيم.',
    '📿 *ذكر 2:* لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.',
    '📿 *ذكر 3:* أستغفر الله العظيم وأتوب إليه.',
    '📿 *ذكر 4:* اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم.',
    '📿 *ذكر 5:* لا حول ولا قوة إلا بالله العلي العظيم.'
  ];

  // توليد الأزرار حسب الفهرس
  const createButtons = (index) => [
    { buttonId: `azkar_prev_${index}`, buttonText: { displayText: '⬅️ السابق' }, type: 1 },
    { buttonId: `azkar_next_${index}`, buttonText: { displayText: '➡️ التالي' }, type: 1 },
    { buttonId: 'azkar_home', buttonText: { displayText: '🏠 العودة للبداية' }, type: 1 },
  ];

  // إذا كتب المستخدم "اذكار"
  if (text.toLowerCase().includes('اذكار')) {
    await sock.sendMessage(from, {
      text: azkar[0],
      buttons: createButtons(0),
      headerType: 1
    }, { quoted: msg });
  }

  // معالجة الرد على الأزرار
  if (msg.message?.buttonsResponseMessage) {
    const btnId = msg.message.buttonsResponseMessage.selectedButtonId;

    if (btnId.startsWith('azkar_')) {
      let index = parseInt(btnId.split('_')[2]) || 0;

      if (btnId.startsWith('azkar_next')) {
        index = Math.min(index + 1, azkar.length - 1);
      } else if (btnId.startsWith('azkar_prev')) {
        index = Math.max(index - 1, 0);
      } else if (btnId === 'azkar_home') {
        index = 0;
      }

      await sock.sendMessage(from, {
        text: azkar[index],
        buttons: createButtons(index),
        headerType: 1
      }, { quoted: msg });
    }
  }
};
