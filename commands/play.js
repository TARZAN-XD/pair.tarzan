// commands/play.js

const axios = require("axios"); const yts = require("yt-search");

module.exports = async ({ sock, msg, text, reply }) => { if (!text.startsWith("play")) return;

const parts = text.trim().split(/\s+/); const query = parts.slice(1).join(" "); if (!query) return reply("❌ يرجى كتابة اسم الأغنية أو الرابط بعد الأمر.");

await reply("⏳ جاري البحث وتحميل الصوت، يرجى الانتظار...");

try { const search = await yts(query); const video = search.videos[0]; if (!video) return reply("❌ لم يتم العثور على نتائج. حاول بكلمات أخرى.");

const link = video.url;
const apis = [
  `https://apis.davidcyriltech.my.id/youtube/mp3?url=${link}`,
  `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${link}`
];

for (const api of apis) {
  try {
    const { data } = await axios.get(api);

    if (data.status === 200 || data.success) {
      const audioUrl = data.result?.downloadUrl || data.url;
      const songData = {
        title: data.result?.title || video.title,
        artist: data.result?.author || video.author.name,
        thumbnail: data.result?.image || video.thumbnail,
        videoUrl: link
      };

      // صورة وبيانات
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: songData.thumbnail },
        caption:
          `🎵 *العنوان:* ${songData.title}\n` +
          `🎤 *الفنان:* ${songData.artist}\n` +
          `🔗 *المصدر:* ${songData.videoUrl}\n` +
          `\n> تم التحميل بواسطة طرزان الواقدي`
      }, { quoted: msg });

      await reply("📤 جارٍ إرسال الصوت...");

      // الصوت العادي
      await sock.sendMessage(msg.key.remoteJid, {
        audio: { url: audioUrl },
        mimetype: "audio/mp4"
      }, { quoted: msg });

      // الصوت كمستند
      await sock.sendMessage(msg.key.remoteJid, {
        document: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${songData.title.replace(/[^a-zA-Z0-9 ]/g, "")}.mp3`
      }, { quoted: msg });

      await reply("✅ تم الإرسال بنجاح!");
      return;
    }
  } catch (e) {
    console.error(`API Error (${api}):`, e.message);
    continue;
  }
}

return reply("⚠️ جميع واجهات API فشلت في التحميل، حاول لاحقًا.");

} catch (error) { console.error(error); return reply("❌ حدث خطأ أثناء التحميل:\n" + error.message); } };

