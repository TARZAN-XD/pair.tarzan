const axios = require('axios');

// تخزين الجلسات النشطة لكل مستخدم
const userSessions = {};

module.exports = {
  name: "talk",
  alias: ["openai", "chatgpt", "gpt3"],
  category: "ai",
  desc: "تفعيل وضع المحادثة مع الذكاء الاصطناعي",
  async run({ sock, m, text, reply }) {
    const command = text.trim();

    // ✅ تفعيل المحادثة
    if (command === "تحدث معي يا طرزان") {
      userSessions[m.sender] = true;
      return reply(
        `✨ *مرحباً بك في وضع المحادثة الذكية!* ✨\n\n` +
        `✅ *تم تفعيل المحادثة مع طرزان.*\n` +
        `💬 يمكنك الآن التحدث بحرية، وسأرد على كل رسائلك.\n\n` +
        `🛑 *لإيقاف المحادثة أرسل:* توقف\n` +
        `━━━━━━━━━━━━━━━\n` +
        `⚡ *استمتع بالتجربة!*`
      );
    }

    // ✅ إيقاف المحادثة
    if (command === "توقف") {
      delete userSessions[m.sender];
      return reply("✅ *تم إيقاف وضع المحادثة بنجاح.*");
    }

    // ✅ إذا المحادثة مفعلة
    if (userSessions[m.sender]) {
      try {
        if (!text) return; // تجاهل الرسائل الفارغة
        await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        const apiUrl = `https://vapis.my.id/api/openai?q=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.result) {
          await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
          return reply("❌ لم يتمكن OpenAI من الرد.");
        }

        await reply(`🤖 *طرزان يرد:*\n\n${data.result}`);
        await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

      } catch (err) {
        console.error("Error in AI Chat:", err.message);
        await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        reply("❌ حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.");
      }
    }
  }
};
