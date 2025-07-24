const gplay = require("google-play-scraper");
const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.startsWith("apk")) return;

  const parts = text.trim().split(" ");
  const query = parts.slice(1).join(" ");

  if (!query) {
    return reply("❌ اكتب اسم التطبيق.\nمثال: apk واتساب");
  }

  try {
    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

    // ✅ البحث في Google Play
    const searchResults = await gplay.search({ term: query, num: 1 });
    if (!searchResults.length) {
      return reply("❌ لم يتم العثور على أي تطبيق. حاول بكلمة أخرى.");
    }

    const app = searchResults[0];

    // ✅ جلب رابط APK من APKPure (Scraper)
    const apkPureUrl = `https://apkpure.com/search?q=${encodeURIComponent(app.title)}`;
    const { data } = await axios.get(apkPureUrl);
    const $ = cheerio.load(data);
    const appPageLink = $("p.title > a").attr("href");
    if (!appPageLink) return reply("❌ لم أتمكن من إيجاد رابط التحميل.");

    const fullAppLink = `https://apkpure.com${appPageLink}`;

    // جلب رابط التحميل المباشر
    const appPage = await axios.get(fullAppLink);
    const $$ = cheerio.load(appPage.data);
    const downloadPageLink = $$(".fast-download-box a").attr("href");

    const finalDownloadLink = downloadPageLink
      ? `https://apkpure.com${downloadPageLink}`
      : null;

    // ✅ إرسال تفاصيل التطبيق
    const caption = `📦 *اسم التطبيق:* ${app.title}\n` +
                    `🖋 *الوصف:* ${app.summary}\n` +
                    `⭐ *التقييم:* ${app.scoreText || "N/A"}\n` +
                    `📥 *تحميل APK:* ${finalDownloadLink || "لم يتم إيجاده"}`;

    await sock.sendMessage(from, {
      image: { url: app.icon },
      caption
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

  } catch (err) {
    console.error("❌ خطأ:", err.message);
    await reply("❌ حدث خطأ أثناء البحث أو التحميل.");
    await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
  }
};
