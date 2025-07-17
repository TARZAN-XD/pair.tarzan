const azkar = [
  '🕋 ذكر 1: سبحان الله وبحمده سبحان الله العظيم',
  '🕋 ذكر 2: لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير',
  '🕋 ذكر 3: أستغفر الله العظيم وأتوب إليه'
];

module.exports = async ({ text, reply, msg }) => {
  if (text.toLowerCase() === 'اذكار') {
    const index = 0;
    await reply(azkar[index], [
      { id: 'azkar_next_1', text: 'التالي ➡️' },
      { id: 'azkar_home', text: '🔙 رجوع' }
    ]);
  } else if (text.startsWith('azkar_next_')) {
    const index = parseInt(text.split('_')[2]);
    if (azkar[index]) {
      const buttons = [];
      if (azkar[index + 1]) buttons.push({ id: `azkar_next_${index + 1}`, text: 'التالي ➡️' });
      if (index > 0) buttons.push({ id: `azkar_next_${index - 1}`, text: '⬅️ السابق' });
      buttons.push({ id: 'azkar_home', text: '🔙 رجوع' });

      await reply(azkar[index], buttons);
    }
  } else if (text === 'azkar_home') {
    await reply('عدنا إلى البداية! أرسل "اذكار" لبدء التصفح من جديد.');
  }
};
