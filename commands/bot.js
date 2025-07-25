const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const GEMINI_API_KEY = "AIzaSyAmQKcLhUiobbwQTVn0W-Fx5XcrQGJEBdw";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

const userSessions = {};

module.exports = async ({ sock, msg, text, reply, from }) => {
  const command = text.trim();

  // ✅ أمر تفعيل المحادثة
  if (command === "تكلم يا طرزان") {
    userSessions[from] = { active: true, history: [] };

    return reply(
      `✨ *مرحباً بك في وضع المحادثة مع طرزان الواقدي!* ✨\n\n` +
      `✅ *تم تفعيل وضع الذكاء الاصطناعي (Gemini)*\n` +
      `💬 يمكنك الآن التحدث معي بحرية أو تحليل الصور.\n\n` +
      `🖼 *لتحليل صورة:* أرسل الصورة مع الوصف.\n` +
      `🛑 *لإيقاف المحادثة:* أرسل \`توقف\`\n` +
      `━━━━━━━━━━━━━━━\n` +
      `⚡ *استمتع بتجربة طرزان الذكية الآن!*`
    );
  }

  // ✅ أمر إيقاف المحادثة
  if (command === "توقف") {
    delete userSessions[from];
    return reply("✅ *تم إيقاف وضع المحادثة بنجاح.*");
  }

  // ✅ إذا الوضع مفعّل
  if (userSessions[from]?.active) {
    const quotedImg = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (quotedImg) {
      try {
        await reply("⏳ *جارٍ تحليل الصورة باستخدام Gemini...*");

        // ✅ تحميل الصورة
        const buffer = await sock.downloadMediaMessage(msg);
        const tempPath = path.join(__dirname, `temp_${Date.now()}.jpg`);
        fs.writeFileSync(tempPath, buffer);

        const imageData = fs.readFileSync(tempPath).toString("base64");
        fs.unlinkSync(tempPath); // حذف الصورة المؤقتة

        // ✅ تحليل الصورة
        const prompt = text.replace(/حلل|تحليل|image|picture/gi, "").trim() || "حلل الصورة بالتفصيل";
        const result = await visionModel.generateContent([
          { text: prompt },
          { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const analysis = result.response.text();

        await sock.sendMessage(from, {
          text: `🖼 *تحليل الصورة:*\n\n${analysis}`
        }, { quoted: msg });

      } catch (error) {
        console.error("Gemini Vision Error:", error.message);
        reply("❌ حدث خطأ أثناء تحليل الصورة. حاول لاحقًا.");
      }

    } else {
      // ✅ محادثة نصية عادية
      try {
        await sock.sendMessage(from, { react: { text: "⌛", key: msg.key } });

        userSessions[from].history.push({ role: "user", parts: [{ text }] });

        const chat = textModel.startChat({ history: userSessions[from].history });
        const result = await chat.sendMessage(text);
        const aiReply = result.response.text();

        userSessions[from].history.push({ role: "model", parts: [{ text: aiReply }] });

        await sock.sendMessage(from, {
          text: `🤖 *طرزان يرد:*\n\n${aiReply}`
        }, { quoted: msg });

      } catch (error) {
        console.error("Gemini Error:", error.message);
        reply("❌ حدث خطأ أثناء الاتصال بـ Gemini. حاول لاحقًا.");
      }
    }
  }
};
