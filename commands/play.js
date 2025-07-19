const ytdl = require('ytdl-core');
const fetch = require('node-fetch');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.toLowerCase().startsWith('yt2') && !text.toLowerCase().startsWith('play2') && !text.toLowerCase().startsWith('music')) return;

  const parts = text.trim().split(' ');
  if (parts.length < 2) return reply('❌ يرجى كتابة اسم الأغنية أو رابط يوتيوب!\nمثال: yt2 اسم الأغنية');

  const query = parts.slice(1).join(' ');

  try {
    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

    let videoUrl, title;

    if (ytdl.validateURL(query)) {
      // إذا الرابط صالح
      videoUrl = query;
      const info = await ytdl.getInfo(videoUrl);
      title = info.videoDetails.title;
    } else {
      // البحث عبر YouTube API (باستخدام yt-search)
      const yts = require('yt-search');
      const search = await yts(query);
      if (!search.videos.length) return reply('❌ لم يتم العثور على نتائج!');
      videoUrl = search.videos[0].url;
      title = search.videos[0].title;
    }

    await reply(`⏳ جاري تحميل الصوت من: ${title}`);

    // جلب رابط تنزيل الصوت عبر API خارجي (مثل اللي تستخدمه)
    const apiUrl = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.success) return reply('❌ فشل في تحميل الصوت!');

    await sock.sendMessage(from, {
      audio: { url: data.result.download_url },
      mimetype: 'audio/mpeg',
      ptt: false
    }, { quoted: msg });

    await reply(`✅ تم تحميل: *${title}* بنجاح!`);
    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (error) {
    console.error(error);
    await reply(`❌ حدث خطأ: ${error.message}`);
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
