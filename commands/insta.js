const axios = require("axios");

module.exports = {
  name: "insta",
  description: "تحميل من انستجرام",
  command: ["insta"],
  async execute({ sock, msg, text, reply }) {
    if (!text || !text.includes("instagram.com")) {
      return reply("❌ الرجاء إرسال رابط إنستجرام صالح.\nمثال:\ninsta https://www.instagram.com/reel/xxx/");
    }

    const api = `https://inrl-web.onrender.com/api/download/insta?apikey=f2aa1b720cdbce02f6ae29e2&url=${encodeURIComponent(text)}`;

    try {
      const res = await axios.get(api);
      if (!res.data.status || !res.data.result || res.data.result.length === 0) {
        return reply("❌ لم يتم العثور على أي وسائط في الرابط أو أن الرابط غير مدعوم.");
      }

      const mediaList = res.data.result;

      // إرسال أول فيديو/صورة (يمكنك تعديل ذلك لإرسال الكل)
      const media = mediaList[0];

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: media.url }, // إذا كانت صورة استخدم: image
        caption: "✅ تم التحميل بنجاح من إنستجرام",
      }, { quoted: msg });

    } catch (err) {
      console.error("Instagram Error:", err.message);
      return reply("❌ تعذر التحميل. تأكد من صحة الرابط أو أعد المحاولة لاحقًا.");
    }
  },
};
