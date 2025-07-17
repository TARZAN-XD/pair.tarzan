const { proto } = require('@whiskeysockets/baileys');

const azkarList = [
  "🕋 *الذكر 1*: سبحان الله وبحمده، سبحان الله العظيم",
  "🕌 *الذكر 2*: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
  "📿 *الذكر 3*: أستغفر الله العظيم وأتوب إليه",
  "📖 *الذكر 4*: اللهم صل وسلم على نبينا محمد",
  "💫 *الذكر 5*: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر"
];

module.exports = async ({ text, sock, m }) => {
  if (text.toLowerCase().startsWith('اذكار')) {
    const currentIndex = 0;

    const buttons = [
      { buttonId: `.azkar_prev_${currentIndex}`, buttonText: { displayText: '⬅️ السابق' }, type: 1 },
      { buttonId: `.azkar_next_${currentIndex}`, buttonText: { displayText: '➡️ التالي' }, type: 1 },
      { buttonId: `.azkar_back`, buttonText: { displayText: '↩️ العودة' }, type: 1 }
    ];

    await sock.sendMessage(m.chat, {
      text: azkarList[currentIndex],
      buttons,
      footer: '📿 تصفح الأذكار',
      headerType: 1
    }, { quoted: m });
  }
};
