const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const OPENAI_API_KEY = "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"; //  OpenAI هنا

module.exports = async ({ sock, msg, text, reply, from }) => {
  const command = text.trim().split(/\s+/)[0].toLowerCase();

  if (command === "عدل") {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quotedMsg?.imageMessage;

    if (!quotedImage) {
      return reply("❌ يجب أن ترد على صورة مع كتابة الوصف للتعديل.\n\nمثال:\nرد على صورة واكتب: *عدل اجعلها أنمي بخلفية نيون*");
    }

    const prompt = text.replace("عدل", "").trim();
    if (!prompt) return reply("❌ يرجى كتابة وصف التعديل بعد الأمر.\nمثال: *عدل اجعلها أنمي بخلفية نيون*");

    await reply("> ⏳ *جارٍ معالجة الصورة وتطبيق التصميم المطلوب باستخدام الذكاء الاصطناعي...*");

    try {
      // ✅ تحميل الصورة الأصلية
      const buffer = await sock.downloadMediaMessage({ message: quotedMsg });
      const tempFile = `./temp_${Date.now()}.png`;
      fs.writeFileSync(tempFile, buffer);

      // ✅ تجهيز البيانات للإرسال إلى OpenAI
      const formData = new FormData();
      formData.append("image", fs.createReadStream(tempFile));
      formData.append("model", "dall-e-2"); // أو dall-e-3 إذا مدعوم
      formData.append("prompt", prompt);
      formData.append("size", "1024x1024");

      const response = await axios.post("https://api.openai.com/v1/images/edits", formData, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders()
        }
      });

      fs.unlinkSync(tempFile); // حذف الصورة المؤقتة

      if (!response.data || !response.data.data || response.data.data.length === 0) {
        return reply("❌ فشل تعديل الصورة. حاول مرة أخرى.");
      }

      const imageUrl = response.data.data[0].url;
      await sock.sendMessage(from, {
        image: { url: imageUrl },
        caption: `✅ *تم تعديل الصورة بنجاح!*\n🎨 *الوصف:* ${prompt}`
      }, { quoted: msg });

    } catch (error) {
      console.error("❌ خطأ:", error.response?.data || error.message);
      reply("❌ حدث خطأ أثناء تعديل الصورة. تحقق من إعداداتك أو حاول لاحقًا.");
    }
  }
};
