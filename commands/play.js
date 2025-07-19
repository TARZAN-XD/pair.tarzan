const yts = require("yt-search");
const fetch = require("node-fetch");

module.exports = {
  name: "yt2",
  alias: ["play2", "music"],
  category: "download",
  desc: "تحميل الصوت من يوتيوب باستخدام الاسم أو الرابط",
  use: "yt2 <اسم الأغنية أو رابط اليوتيوب>",

  async exec({ conn, m, args, reply }) {
    const q = args.join(" ");
    if (!q) return reply("❌ يرجى كتابة اسم الأغنية أو رابط يوتيوب!");

    try {
      let videoUrl, title;

      if (q.match(/(youtube\.com|youtu\.be)/)) {
        videoUrl = q;
        const videoId = q.split(/[=/]/).pop();
        const videoInfo = await yts({ videoId });
        title = videoInfo.title;
      } else {
        const search = await yts(q);
        if (!search.videos.length) return reply("❌ لم يتم العثور على نتائج!");
        videoUrl = search.videos[0].url;
        title = search.videos[0].title;
      }

      await reply("⏳ يتم التحميل الآن...");

      const apiUrl = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.success) return reply("❌ فشل في تحميل الصوت! حاول برابط آخر.");

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: data.result.download_url },
          mimetype: "audio/mpeg",
          ptt: false,
        },
        { quoted: m }
      );

      await reply(`✅ *${title}* تم تحميله بنجاح!`);
    } catch (err) {
      console.error(err);
      reply(`❌ خطأ: ${err.message}`);
    }
  },
};
