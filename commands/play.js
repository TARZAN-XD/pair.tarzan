const axios = require("axios");

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.startsWith("play")) return;

  const parts = text.trim().split(" ");
  const query = parts.slice(1).join(" ");

  if (!query) return reply("❌ يرجى كتابة اسم الأغنية.\nمثال: play نوال الكويتية - قول احبك");

  await reply("🔍 جارٍ البحث عن الأغنية... الرجاء الانتظار ⏳");

  try {
    const apiUrl = `https://api.akuari.my.id/downloader/youtube?query=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);

    const result = response.data?.hasil?.[0];
    if (!result) return reply("❌ لم يتم العثور على نتائج، حاول بصيغة مختلفة.");

    const { title, url, thumb } = result;

    await sock.sendMessage(from, {
      image: { url: thumb },
      caption:
        `🎵 *العنوان:* ${title}\n` +
        `📥 *جاري إرسال الصوت...*\n\n` +
        `> تم الطلب بواسطة طرزان الواقدي`
    }, { quoted: msg });

    await sock.sendMessage(from, {
      document: { url },
      mimetype: "audio/mpeg",
      fileName: `${title}.mp3`
    }, { quoted: msg });

    await sock.sendMessage(from, {
      react: { text: "✅", key: msg.key }
    });

  } catch (err) {
    console.error(err);
    await reply("❌ تعذر معالجة الطلب، الرجاء المحاولة لاحقًا.");
  }
};
