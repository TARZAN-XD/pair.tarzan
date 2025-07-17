const axios = require("axios");

module.exports = {
  command: ["tiktok", "tt"],
  description: "تحميل فيديو من TikTok",
  category: "التحميل",
  use: ".tiktok <رابط>",
  async handler(sock, msg, { args }) {
    const tiktokUrl = args[0];
    
    if (!tiktokUrl || !tiktokUrl.includes("tiktok.com")) {
      return sock.sendMessage(msg.from, { text: "❌ الرجاء إرسال رابط TikTok صالح." }, { quoted: msg });
    }

    try {
      const apiUrl = `https://api.nexoracle.com/downloader/tiktok-nowm?apikey=free_key@maher_apis&url=${encodeURIComponent(tiktokUrl)}`;
      const res = await axios.get(apiUrl);

      if (!res.data?.result?.url) {
        return sock.sendMessage(msg.from, { text: "❌ لم أستطع تحميل الفيديو. تأكد من الرابط." }, { quoted: msg });
      }

      const {
        title,
        author,
        metrics,
        url
      } = res.data.result;

      const videoBuffer = await axios.get(url, { responseType: "arraybuffer" }).then(res => res.data);

      await sock.sendMessage(msg.from, {
        video: Buffer.from(videoBuffer),
        caption:
          `🎬 *TikTok Video*\n\n` +
          `📝 *العنوان:* ${title || "بدون عنوان"}\n` +
          `👤 *الناشر:* @${author.username} (${author.nickname})\n` +
          `❤️ *الإعجابات:* ${metrics.digg_count}\n` +
          `💬 *التعليقات:* ${metrics.comment_count}\n` +
          `🔁 *المشاركات:* ${metrics.share_count}\n`,
      }, { quoted: msg });

    } catch (err) {
      console.error("❌ خطأ في تحميل TikTok:", err.message);
      await sock.sendMessage(msg.from, { text: "❌ حدث خطأ أثناء تحميل الفيديو." }, { quoted: msg });
    }
  }
};
