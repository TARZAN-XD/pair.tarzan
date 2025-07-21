const axios = require("axios");

module.exports = {
  name: "insta",
  description: "تحميل صور وفيديوهات من انستجرام",
  command: ["insta"],
  async execute({ sock, msg, text, reply }) {
    if (!text || !text.includes("instagram.com")) {
      return reply("❌ الرجاء إرسال رابط Instagram صالح.\nمثال: insta https://www.instagram.com/reel/xxxx");
    }

    const api = `https://api.lolhuman.xyz/api/instagram?apikey=f2aa1b720cdbce02f6ae29e2&url=${encodeURIComponent(text)}`;

    try {
      const { data } = await axios.get(api);
      if (!data || !data.result || data.result.length === 0) {
        return reply("❌ لم يتم العثور على أي وسائط في هذا الرابط.");
      }

      // إرسال كل الوسائط
      for (let mediaUrl of data.result) {
        await sock.sendMessage(msg.chat, {
          video: { url: mediaUrl },
          caption: `📥 تم التحميل من Instagram`,
        }, { quoted: msg });
      }

    } catch (error) {
      console.error("❌ Instagram Error:", error.message);
      reply("❌ تعذر تحميل الوسائط من Instagram. تحقق من الرابط أو أعد المحاولة لاحقًا.");
    }
  }
};
