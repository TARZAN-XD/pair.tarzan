const axios = require("axios");

// ✅ المفتاح الذي طلبت تضمينه
const OPENAI_API_KEY = "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";

// ✅ لتخزين حالة المحادثة لكل مستخدم
const userSessions = {};

module.exports = async ({ sock, msg, text, reply, from }) => {
  const command = text.trim();

  // ✅ أمر تشغيل الوضع
  if (command === "تكلم يا طرزان") {
    userSessions[from] = { active: true, history: [] }; // إضافة التاريخ لاحقًا
    return reply("🤖 *تم تفعيل وضع المحادثة مع الذكاء الاصطناعي.*\nاكتب رسالتك الآن وسأجيبك بكل ذكاء!\n\n🛑 لإيقاف الوضع، أرسل: *توقف*");
  }

  // ✅ أمر إيقاف الوضع
  if (command === "توقف") {
    delete userSessions[from];
    return reply("✅ *تم إيقاف وضع المحادثة.*\nأهلاً بك في أي وقت يا صديقي!");
  }

  // ✅ إذا كان الوضع مفعّل
  if (userSessions[from]?.active) {
    try {
      await sock.sendMessage(from, { react: { text: "⌛", key: msg.key } });

      // إضافة الرسالة للسياق
      userSessions[from].history.push({ role: "user", content: text });

      const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4o-mini", // يمكنك تغييره إلى gpt-4o
        messages: [
          { role: "system", content: "أنت طرزان الواقدي، مساعد ذكي ومرح ومبدع." },
          ...userSessions[from].history
        ],
        temperature: 0.8
      }, {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      });

      const aiReply = response.data.choices[0].message.content;

      // حفظ رد الذكاء الاصطناعي في السياق
      userSessions[from].history.push({ role: "assistant", content: aiReply });

      await sock.sendMessage(from, {
        text: `💬 *طرزان يرد عليك:*\n\n${aiReply}`
      }, { quoted: msg });

    } catch (error) {
      console.error("خطأ في المحادثة:", error.response?.data || error.message);
      reply("❌ حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. حاول لاحقًا.");
    }
  }
};
