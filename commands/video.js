const axios = require("axios");

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.startsWith("video")) return;

  const args = text.split(" ");
  if (args.length < 2) {
    return reply("❌ أرسل رابط الفيديو أو كلمات البحث بعد الأمر\nمثال:\nvideo https://youtube.com/... أو video دعاء جميل");
  }

  const input = args.slice(1).join(" ");
  const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(input);

  try {
    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

    let videoUrl = input;

    // في حال لم يكن رابط، نقوم بالبحث عن الفيديو
    if (!isUrl) {
      const searchRes = await axios.get(`https://ytsearch-api.p.rapidapi.com/search`, {
        params: {
          query: input,
          type: "video",
          sort_by: "relevance"
        },
        headers: {
          'X-RapidAPI-Key': '0', // طلب بدون مفتاح فعلي
          'X-RapidAPI-Host': 'ytsearch-api.p.rapidapi.com'
        }
      });

      if (!searchRes.data || !searchRes.data.videos || searchRes.data.videos.length === 0) {
        return reply("❌ لم يتم العثور على نتائج.");
      }

      videoUrl = `https://www.youtube.com/watch?v=${searchRes.data.videos[0].video_id}`;
    }

    // الآن نحمّل الفيديو باستخدام API مجاني (yt-dlp backend)
    const res = await axios.get(`https://youtube-video-download-info.p.rapidapi.com/dl`, {
      params: { url: videoUrl },
      headers: {
        'X-RapidAPI-Key': '0',
        'X-RapidAPI-Host': 'youtube-video-download-info.p.rapidapi.com'
      }
    });

    if (!res.data || !res.data.formats || res.data.formats.length === 0) {
      return reply("❌ لم يتم العثور على فيديو قابل للتحميل.");
    }

    const video = res.data.formats.find(f => f.mimeType.includes("video/mp4") && f.qualityLabel === "360p")
      || res.data.formats.find(f => f.mimeType.includes("video/mp4"));

    if (!video || !video.url) {
      return reply("❌ تعذر استخراج رابط الفيديو.");
    }

    const videoBuffer = await axios.get(video.url, { responseType: "arraybuffer" });

    await sock.sendMessage(from, {
      video: Buffer.from(videoBuffer.data),
      caption: `📥 تم تحميل الفيديو بنجاح.\n${videoUrl}`,
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

  } catch (err) {
    console.error("❌ Video Error:", err.message);
    await reply("❌ حدث خطأ أثناء تحميل الفيديو. حاول مرة أخرى أو أرسل رابطًا مختلفًا.");
  }
};
