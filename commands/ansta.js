const axios = require('axios');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.startsWith('insta') && !text.startsWith('ig')) return;

  const parts = text.trim().split(' ');
  if (parts.length < 2) {
    return reply('❌ يرجى إدخال رابط فيديو إنستغرام.\nمثال: insta https://www.instagram.com/reel/...');
  }

  const instaUrl = parts[1];

  if (!instaUrl.includes('instagram.com')) {
    return reply('❌ الرابط غير صالح. يرجى إدخال رابط إنستغرام صحيح.');
  }

  try {
    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

    // واجهة مجانية (تأكد من صلاحية الرابط لاحقًا)
    const apiUrl = `https://api.nexoracle.com/downloader/instagram?apikey=free_key@maher_apis&url=${encodeURIComponent(instaUrl)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || response.data.status !== 200 || !response.data.result || !response.data.result.url) {
      return reply('❌ تعذر جلب الفيديو. تحقق من الرابط أو جرب لاحقًا.');
    }

    const videoUrl = response.data.result.url;

    await reply(`📥 جاري تحميل فيديو إنستغرام ... الرجاء الانتظار.`);

    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoResponse.data, 'binary');

    await sock.sendMessage(from, {
      video: videoBuffer,
      caption: `📥 فيديو Instagram\n\n✅ تم التحميل بواسطة طـــــرزان الواقدي`,
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (error) {
    console.error('خطأ أثناء تحميل فيديو Instagram:', error);
    await reply('❌ حدث خطأ أثناء تحميل الفيديو. الرجاء المحاولة لاحقًا.');
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
