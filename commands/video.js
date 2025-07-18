const yts = require('yt-search');
const fetch = require('node-fetch');

module.exports = {
  command: ['video2', 'vid'],
  description: 'تحميل فيديو من اليوتيوب عن طريق الرابط أو البحث',
  category: 'download',
  use: '.video2 <رابط أو كلمة بحث>',
  react: "🎥",
  async handler({ sock, msg, text }) {
    const sender = msg.key.remoteJid;

    if (!text) {
      return await sock.sendMessage(sender, { text: '❌ يرجى كتابة اسم فيديو أو رابط YouTube!' }, { quoted: msg });
    }

    let videoUrl, title;

    try {
      // التحقق من أنه رابط يوتيوب
      if (text.match(/(youtube\.com|youtu\.be)/)) {
        videoUrl = text;
        const videoInfo = await yts({ videoId: text.split(/[=/]/).pop() });
        title = videoInfo.title;
      } else {
        // البحث عن الفيديو
        const search = await yts(text);
        if (!search.videos.length) return await sock.sendMessage(sender, { text: '❌ لم يتم العثور على نتائج!' }, { quoted: msg });

        videoUrl = search.videos[0].url;
        title = search.videos[0].title;
      }

      await sock.sendMessage(sender, { text: '⏳ *جارٍ تحميل الفيديو...*' }, { quoted: msg });

      // استدعاء API
      const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.success) return await sock.sendMessage(sender, { text: '❌ فشل في تحميل الفيديو!' }, { quoted: msg });

      await sock.sendMessage(sender, {
        video: { url: data.result.download_url },
        mimetype: 'video/mp4',
        caption: `🎬 *${title}*\n\n> 👑 بواسطة طــــــرزان الواقدي`
      }, { quoted: msg });

      await sock.sendMessage(sender, { text: `✅ *${title}* تم تحميله بنجاح!` }, { quoted: msg });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(sender, { text: `❌ حدث خطأ:\n${error.message}` }, { quoted: msg });
    }
  }
};
