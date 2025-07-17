const { proto } = require('@whiskeysockets/baileys');

module.exports = async ({ text, sock, msg, from }) => {
  if (text.toLowerCase() === 'اذكار') {
    await sock.sendMessage(from, {
      text: '🕌 الأذكار اليومية',
      footer: 'اختر من الأزرار أدناه:',
      templateButtons: [
        { index: 1, quickReplyButton: { displayText: '⬅️ السابق', id: 'azkar_prev' } },
        { index: 2, quickReplyButton: { displayText: 'التالي ➡️', id: 'azkar_next' } },
        { index: 3, quickReplyButton: { displayText: '↩️ الرجوع', id: 'azkar_back' } }
      ]
    }, { quoted: msg });
  }

  // التعامل مع الردود
  if (text === 'azkar_prev') {
    await sock.sendMessage(from, { text: '📖 الذكر السابق:\n"لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير"' }, { quoted: msg });
  }

  if (text === 'azkar_next') {
    await sock.sendMessage(from, { text: '📖 الذكر التالي:\n"سبحان الله وبحمده سبحان الله العظيم"' }, { quoted: msg });
  }

  if (text === 'azkar_back') {
    await sock.sendMessage(from, { text: '🔙 تم الرجوع إلى القائمة الرئيسية.' }, { quoted: msg });
  }
};
