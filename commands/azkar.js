module.exports = async ({ text, reply, sock, msg, from }) => {
  if (text.toLowerCase() === 'اذكار') {
    await sock.sendMessage(from, {
      text: "🕌 الأذكار اليومية",
      buttons: [
        { buttonId: 'azkar_next', buttonText: { displayText: 'التالي ➡️' }, type: 1 },
        { buttonId: 'azkar_prev', buttonText: { displayText: '⬅️ السابق' }, type: 1 },
        { buttonId: 'azkar_back', buttonText: { displayText: '↩️ الرجوع' }, type: 1 }
      ],
      headerType: 1
    }, { quoted: msg });
  }

  if (text === 'azkar_next') {
    await reply('📖 الذكر التالي:\n"سبحان الله وبحمده سبحان الله العظيم"');
  }

  if (text === 'azkar_prev') {
    await reply('📖 الذكر السابق:\n"لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير"');
  }

  if (text === 'azkar_back') {
    await reply('🔙 تم الرجوع إلى القائمة الرئيسية.');
  }
};
