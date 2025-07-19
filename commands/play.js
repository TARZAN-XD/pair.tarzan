const yts = require("yt-search");
const fetch = require("node-fetch");

module.exports = {
  name: "yt2",
  alias: ["play2", "music"],
  category: "download",
  desc: "تحميل الصوت من يوتيوب باستخدام الاسم أو الرابط",
  use: "yt2 <اسم الأغنية أو رابط اليوتيوب>",

  async exec({ conn, m, args, prefix, command }) {
    const q = args.join(" ");
    if (!q) return m.reply("❌ يرجى كتابة اسم الأغنية أو رابط يوتيوب!");

    try {
      let videoUrl, title;

      // ✅ إذا كان رابط
      if (q.match(/(youtube\.com|youtu\.be)/)) {
        videoUrl = q;
        const videoInfo = await yts({ videoId: q.split(/[=/]/).pop() });
        title = videoInfo.title;
      } else {
        // 🔍 البحث عن الفيديو
        const search = await yts(q);
        if (!search.videos.length)
          return m.reply("❌ لم يتم العثور على نتائج!");
        videoUrl = search.videos[0].url;
        title = search.videos[0].title;
      }

      await m.reply("⏳ يتم التحميل الآن...");

      // 🌐 API مجانية
      const apiUrl = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(
        videoUrl
      )}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.success)
        return m.reply("❌ فشل في تحميل الصوت! حاول برابط آخر.");

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: data.result.download_url },
          mimetype: "audio/mpeg",
          ptt: false,
        },
        { quoted: m }
      );

      await m.reply(`✅ *${title}* تم تحميله بنجاح!`);
    } catch (err) {
      console.error(err);
      m.reply(`❌ خطأ: ${err.message}`);
    }
  },
};
