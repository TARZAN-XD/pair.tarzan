const axios = require("axios");

module.exports = {
  command: ["tiktok", "tt", "tiktokdl", "ttdl"],
  description: "تحميل فيديوهات تيك توك",
  category: "التحميل",
  use: ".tiktok <رابط فيديو تيك توك>",
  async handler(sock, msg, { args }) {
    const { from, sender, reply } = msg;

    try {
      const tiktokUrl = args[0];
      if (!tiktokUrl || !tiktokUrl.includes("tiktok.com")) {
        return await reply('❌ يرجى إدخال رابط فيديو تيك توك صالح.\nمثال: `.tiktok https://tiktok.com/...`');
      }

      await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

      const apiUrl = `https://api.nexoracle.com/downloader/tiktok-nowm?apikey=free_key@maher_apis&url=${encodeURIComponent(tiktokUrl)}`;
      const res = await axios.get(apiUrl);

      if (!res.data || res.data.status !== 200 || !res.data.result) {
        return await reply('❌ تعذر جلب الفيديو. تحقق من الرابط وحاول مجددًا.');
      }

      const { title, thumbnail, author, metrics, url } = res.data.result;

      await reply(`📥 *جاري تحميل فيديو تيك توك من @${author.username} ... الرجاء الانتظار.*`);

      const videoBuffer = await axios.get(url, { responseType: "arraybuffer" }).then(res => res.data);

      await sock.sendMessage(from, {
        video: Buffer.from(videoBuffer),
        caption:
          `📥 *فيديو TikTok*\n\n` +
          `🎬 *العنوان:* ${title || "بدون عنوان"}\n` +
          `👤 *الناشر:* @${author.username} (${author.nickname})\n` +
          `❤️ *الإعجابات:* ${metrics.digg_count}\n` +
          `💬 *التعليقات:* ${metrics.comment_count}\n` +
          `🔁 *المشاركات:* ${metrics.share_count}\n` +
          `⬇️ *التحميلات:* ${metrics.download_count}\n\n` +
          `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ᴍᴀʟᴠɪɴ ᴋɪɴɢ`,
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 999,
          isForwarded: true
        }
      }, { quoted: msg });

      await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    } catch (err) {
      console.error("خطأ في أمر tiktok:", err);
      await reply("❌ حدث خطأ أثناء تحميل الفيديو. حاول مجددًا لاحقًا.");
      await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
    }
  }
};
