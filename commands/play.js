const yts = require("yt-search");
const ytdl = require("ytdl-core");
const fetch = require("node-fetch");

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.startsWith("video") && !text.startsWith("mp4") && !text.startsWith("play")) return;

  const keyword = text.split(" ").slice(1).join(" ");
  if (!keyword) return reply("❌ اكتب اسم الفيديو أو رابط يوتيوب.\nمثال: video قرآن كريم");

  await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } });

  try {
    let videoUrl = "";

    // ✅ إذا النص رابط مباشر من يوتيوب
    if (keyword.includes("youtube.com") || keyword.includes("youtu.be")) {
      videoUrl = keyword;
    } else {
      // ✅ البحث عن الفيديو بالكلمة
      const result = await yts(keyword);
      if (!result || !result.videos || result.videos.length === 0) {
        return reply("❌ لم يتم العثور على نتائج.");
      }
      videoUrl = result.videos[0].url;
    }

    // ✅ جلب معلومات الفيديو
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: '18' }); // mp4 360p
    const title = info.videoDetails.title;
    const thumb = info.videoDetails.thumbnails?.[0]?.url || null;

    // ✅ تحميل الفيديو من الرابط
    const res = await fetch(format.url);
    const buffer = Buffer.from(await res.arrayBuffer());

    // ✅ إذا الملف كبير جدًا
    if (buffer.length > 16 * 1024 * 1024) {
      return reply(`⚠️ الفيديو كبير جدًا للإرسال.\n📎 رابط التحميل:\n${format.url}`);
    }

    await sock.sendMessage(from, {
      video: buffer,
      mimetype: "video/mp4",
      caption: `🎬 *${title}*\n\n> تم التحميل بواسطة طرزان الواقدي`,
      thumbnail: thumb ? { url: thumb } : null
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error("❌ خطأ:", err.message);
    await reply("❌ حدث خطأ أثناء تحميل الفيديو. جرب بكلمة أخرى أو رابط آخر.");
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
