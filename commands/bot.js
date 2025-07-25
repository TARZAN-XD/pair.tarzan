const axios = require('axios');

const userSessions = {}; // لتخزين الجلسات

module.exports = async (sock, msg) => {
  try {
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    if (!text) return;

    // ✅ تفعيل المحادثة
    if (text.trim() === "تحدث معي يا طرزان") {
      userSessions[sender] = true;
      return await sock.sendMessage(from, {
        text: `✨ *مرحباً بك في وضع المحادثة الذكية!* ✨\n\n` +
              `✅ *تم تفعيل المحادثة مع طرزان.*\n` +
              `💬 يمكنك الآن التحدث بحرية وسأرد على كل رسائلك.\n\n` +
              `🛑 *لإيقاف المحادثة أرسل:* توقف\n` +
              `━━━━━━━━━━━━━━━\n` +
              `⚡ *استمتع بالتجربة!*`
      }, { quoted: msg });
    }

    // ✅ إيقاف المحادثة
    if (text.trim() === "توقف") {
      delete userSessions[sender];
      return await sock.sendMessage(from, { text: "✅ *تم إيقاف وضع المحادثة بنجاح.*" }, { quoted: msg });
    }

    // ✅ إذا المحادثة مفعلة
    if (userSessions[sender]) {
      await sock.sendMessage(from, { react: { text: "⌛", key: msg.key } });

      const apiUrl = `https://vapis.my.id/api/openai?q=${encodeURIComponent(text)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.result) {
        await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
        return await sock.sendMessage(from, { text: "❌ لم أتمكن من الرد حالياً." }, { quoted: msg });
      }

      await sock.sendMessage(from, {
        text: `🤖 *طرزان يرد:*\n\n${data.result}`
      }, { quoted: msg });

      await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
};
