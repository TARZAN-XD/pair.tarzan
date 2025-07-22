const yts = require('yt-search');
const ytdl = require('ytdl-core');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.toLowerCase().startsWith('video')) return;

  const parts = text.trim().split(' ');
  if (parts.length < 2) {
    return reply('❌ اكتب اسم الفيديو للبحث عنه.\nمثال: video أهداف ميسي');
  }

  const query = parts.slice(1).join(' ');

  try {
    await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } });

    const result = await yts(query);
    const video = result.videos[0];

    if (!video) return reply('❌ لم يتم العثور على نتائج.');

    const title = video.title;
    const url = video.url;
    const duration = video.timestamp;
    const views = video.views;

    const caption = `🎬 *${title}*\n⏱️ المدة: ${duration}\n👁️ المشاهدات: ${views}\n🔗 الرابط: ${url}`;

    // تحميل مباشر بدون تخزين مؤقت
    const stream = ytdl(url, {
      filter: 'audioandvideo',
      quality: 'lowest',
    });

    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', async () => {
      const buffer = Buffer.concat(chunks);

      await sock.sendMessage(from, {
        video: buffer,
        mimetype: 'video/mp4',
        caption,
      }, { quoted: msg });

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
    });

    stream.on('error', async err => {
      console.error('❌ خطأ في التحميل:', err.message);
      await reply('⚠️ حدث خطأ أثناء تحميل الفيديو.');
    });

  } catch (err) {
    console.error('❌ خطأ عام:', err.message);
    await reply('⚠️ حدث خطأ أثناء العملية.');
  }
};
