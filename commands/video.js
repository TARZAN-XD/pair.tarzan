const axios = require('axios');

module.exports = async ({ sock, msg, text, reply, from }) => {
  // تحقق أن الأمر يبدأ بـ "video"
  if (!text.startsWith('video')) return;

  // استخراج الكلمات أو الرابط من النص
  const parts = text.trim().split(' ');
  if (parts.length < 2) {
    return reply('❌ يرجى كتابة رابط اليوتيوب أو كلمات البحث بعد الأمر.\nمثال:\nvideo https://youtube.com/... \nأو\nvideo دعاء جميل');
  }

  // النص أو الرابط بعد الأمر
  const query = parts.slice(1).join(' ');

  try {
    await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } });

    const apiUrl = `https://api.zahwazein.xyz/downloader/ytmp4?apikey=zenzkey_7e7ff13a15&url=${encodeURIComponent(query)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.result || !data.result.url) {
      return reply('❌ تعذر تحميل الفيديو. تأكد من صحة الرابط أو الكلمات.');
    }

    const { title, url } = data.result;

    await reply(`📥 يتم الآن تحميل: *${title}* ... الرجاء الانتظار.`);

    const videoRes = await axios.get(url, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoRes.data, 'binary');

    await sock.sendMessage(from, {
      video: videoBuffer,
      caption: `🎬 *${title}*\nتم التحميل من يوتيوب.`,
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('خطأ في تحميل الفيديو:', err);
    await reply('❌ حدث خطأ أثناء تحميل الفيديو. حاول مرة أخرى.');
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
