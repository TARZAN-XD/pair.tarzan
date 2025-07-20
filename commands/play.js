const axios = require("axios");
const ytSearch = require("yt-search");

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text) {
    return reply("❌ يرجى كتابة اسم الأغنية بعد الأمر\n\nمثال:\n`play محمد عبده الأماكن`");
  }

  await reply("⏳ جاري البحث عن الصوت...");

  try {
    const search = await ytSearch(text);
    const video = search.videos[0];
    if (!video) return reply("❌ لم يتم العثور على نتائج.");

    const videoUrl = video.url;
    const apis = [
      `https://api.akuari.my.id/downloader/youtube?query=${encodeURIComponent(videoUrl)}`,
      `https://api.lolhuman.xyz/api/ytmp3?apikey=trial&url=${encodeURIComponent(videoUrl)}`,
      `https://skizo.tech/api/yta?url=${encodeURIComponent(videoUrl)}`,
      `https://vihangayt.me/download/ytmp3?url=${encodeURIComponent(videoUrl)}`
    ];

    for (const api of apis) {
      try {
        const res = await axios.get(api);
        const data = res.data;

        // محاولة استخراج رابط الصوت من أكثر من صيغة استجابة
        const audioUrl =
          data?.mp3?.url ||
          data?.result?.link?.audio ||
          data?.result?.url ||
          data?.result;

        const title =
          data?.mp3?.judul ||
          data?.result?.title ||
          video.title;

        if (!audioUrl) continue;

        await sock.sendMessage(msg.key.remoteJid, {
          audio: { url: audioUrl },
          mimetype: "audio/mp4"
        }, { quoted: msg });

        return await reply(`✅ تم إرسال الصوت: *${title}*`);
      } catch (err) {
        console.log(`❌ فشل API: ${api}`);
        continue;
      }
    }

    return reply("⚠️ جميع واجهات API فشلت في المعالجة. حاول لاحقًا أو بجملة بحث مختلفة.");
  } catch (err) {
    console.error(err);
    return reply("❌ حدث خطأ أثناء التحميل.");
  }
};
