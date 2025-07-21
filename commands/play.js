const yts = require('yt-search');
const ytdl = require('ytdl-core');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.toLowerCase().startsWith('play')) return;

  const query = text.replace(/^play/i, '').trim();
  if (!query) {
    return reply('❌ يرجى كتابة كلمات البحث.\nمثال: play قرآن كريم');
  }

  await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } });

  try {
    const results = await yts(query);
    const video = results.videos[0];

    if (!video) {
      return reply('❌ لم يتم العثور على نتائج. حاول بكلمات أخرى.');
    }

    const info = await ytdl.getInfo(video.url);
    const format = ytdl.chooseFormat(info.formats, { quality: '18' }); // mp4 360p

    if (!format || !format.url) {
      return reply('❌ فشل في الحصول على رابط التحميل.');
    }

    const response = await fetch(format.url);
    const buffer = Buffer.from(await response.arrayBuffer());

    await sock.sendMessage(from, {
      video: buffer,
      mimetype: 'video/mp4',
      caption:
        `🎬 *${video.title}*\n` +
        `⏱️ *المدة:* ${video.timestamp}\n` +
        `👤 *القناة:* ${video.author.name}\n\n` +
        `> تم التحميل تلقائيًا بواسطة طرزان الواقدي.`,
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('❌ خطأ أثناء تحميل الفيديو:', err.message);
    await reply('❌ حدث خطأ أثناء تحميل الفيديو. حاول لاحقًا.');
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
