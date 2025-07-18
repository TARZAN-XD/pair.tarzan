const axios = require('axios');

module.exports = async ({ sock, msg, text, reply, from }) => {
  // تحقق أن الأمر يبدأ بـ "tiktok" أو أي من الأسماء البديلة
  if (!text.startsWith('tiktok') && !text.startsWith('ttdl') && !text.startsWith('tt')) return;

  // استخراج الرابط من النص
  const parts = text.trim().split(' ');
  if (parts.length < 2) {
    return reply('❌ يرجى إدخال رابط فيديو تيك توك.\nمثال: tiktok https://www.tiktok.com/...');
  }
  const tiktokUrl = parts[1];

  if (!tiktokUrl.includes('tiktok.com')) {
    return reply('❌ الرابط غير صالح. يرجى إدخال رابط تيك توك صحيح.');
  }

  try {
    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

    const apiUrl = `https://api.nexoracle.com/downloader/tiktok-nowm?apikey=free_key@maher_apis&url=${encodeURIComponent(tiktokUrl)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || response.data.status !== 200 || !response.data.result) {
      return reply('❌ تعذر جلب الفيديو. تحقق من الرابط وحاول مجددًا.');
    }

    const { title, author, metrics, url } = response.data.result;

    await reply(`📥 جاري تحميل فيديو تيك توك من @${author.username} ... الرجاء الانتظار.`);

    const videoResponse = await axios.get(url, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoResponse.data, 'binary');

    await sock.sendMessage(from, {
      video: videoBuffer,
      caption:
        `📥 فيديو TikTok\n\n` +
        `🎬 العنوان: ${title || "بدون عنوان"}\n` +
        `👤 الناشر: @${author.username}\n` +
        `❤️ الإعجابات: ${metrics.digg_count}\n` +
        `💬 التعليقات: ${metrics.comment_count}\n` +
        `🔁 المشاركات: ${metrics.share_count}\n` +
        `⬇️ التحميلات: ${metrics.download_count}\n\n` +
        `> تم التحميل بواسطه طـــــرزان الواقدي`
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (error) {
    console.error('خطأ أثناء تحميل فيديو TikTok:', error);
    await reply('❌ تعذر تحميل الفيديو. الرجاء المحاولة لاحقًا.');
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
