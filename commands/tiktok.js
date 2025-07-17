const axios = require("axios");
const fs = require("fs");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: "tiktok",
  description: "تحميل فيديوهات من TikTok",
  use: ".tiktok [الرابط]",
  execute: async (sock, msg, command, args) => {
    try {
      const url = args[0];
      if (!url || !url.includes("tiktok")) {
        return await sock.sendMessage(msg.from, { text: "📌 الرجاء إدخال رابط TikTok صالح." }, { quoted: msg });
      }

      const api = `https://api.tiklydown.me/api/download?url=${url}`;
      const response = await axios.get(api);
      const videoUrl = response.data?.video?.url;

      if (!videoUrl) {
        return await sock.sendMessage(msg.from, { text: "❌ تعذر تحميل الفيديو، تأكد من الرابط." }, { quoted: msg });
      }

      const videoBuffer = (await axios.get(videoUrl, { responseType: "arraybuffer" })).data;

      await sock.sendMessage(msg.from, {
        video: videoBuffer,
        caption: "✅ تم تحميل فيديو TikTok."
      }, { quoted: msg });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(msg.from, { text: "❌ حدث خطأ أثناء التحميل." }, { quoted: msg });
    }
  }
};
