const fetch = require('node-fetch');

const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    console.log(`🔁 إعادة المحاولة (${i + 1})...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("❌ فشل في جلب البيانات بعد عدة محاولات");
};

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.startsWith("video") && !text.startsWith("mp4")) return;

  const parts = text.trim().split(" ");
  if (parts.length < 2) {
    return reply("❌ يرجى كتابة كلمة مفتاحية أو رابط لتحميل الفيديو.\n\n📌 مثال:\n`video cat funny`\nأو\n`video https://tiktok.com/...`");
  }

  const query = parts.slice(1).join(" ");
  await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

  try {
    const apiURL = `https://api.giftedtech.web.id/api/download/dlmp4?apikey=gifted&url=${encodeURIComponent(query)}`;
    const apiRes = await fetchWithRetry(apiURL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    const data = await apiRes.json();
    if (!data.success || !data.result) throw new Error("❌ لم يتم العثور على فيديو.");

    const { title, quality, thumbail, download_url } = data.result;
    const videoRes = await fetchWithRetry(download_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      }
    });

    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    if (!videoBuffer || videoBuffer.length === 0) throw new Error("❌ الملف فارغ.");

    await sock.sendMessage(from, {
      video: videoBuffer,
      mimetype: 'video/mp4',
      caption: `🎬 *العنوان:* ${title || "بدون عنوان"}\n📺 *الجودة:* ${quality || "غير معروفة"}\n\n> تم التحميل بواسطة طرزان الواقدي.`,
      thumbnail: thumbail ? { url: thumbail } : null
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error("❌ خطأ أثناء التحميل:", err.message);
    await reply("❌ حدث خطأ أثناء تحميل الفيديو. الرجاء المحاولة لاحقًا.");
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
