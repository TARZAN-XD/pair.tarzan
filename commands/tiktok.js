const axios = require('axios');
const axiosRetry = require('axios-retry');

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => axiosRetry.isNetworkError(error) || error.code === 'ECONNABORTED'
});

module.exports = async (m, sock) => {
  const body = m.body || m.message?.conversation || "";
  if (!body.startsWith('.tiktok')) return;

  const url = body.split(" ")[1];
  if (!url || !url.includes("tiktok.com")) {
    await sock.sendMessage(m.key.remoteJid, { text: "📌 أرسل الرابط بهذا الشكل:\n.tiktok https://vt.tiktok.com/xxxx" }, { quoted: m });
    return;
  }

  try {
    await sock.sendMessage(m.key.remoteJid, { text: "🔄 جاري التحميل بدون علامة مائية..." }, { quoted: m });

    const api = `https://api.tiklydown.me/api/download?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api);

    if (!data || !data.video?.noWatermark) {
      throw new Error("❌ لم يتم العثور على الفيديو.");
    }

    const videoBuffer = await axios.get(data.video.noWatermark, { responseType: 'arraybuffer' });

    await sock.sendMessage(m.key.remoteJid, {
      video: Buffer.from(videoBuffer.data),
      mimetype: 'video/mp4',
      caption: '✅ تم التحميل بدون علامة مائية.'
    }, { quoted: m });

  } catch (err) {
    console.error("❌ خطأ في تحميل فيديو TikTok:", err.message);
    await sock.sendMessage(m.key.remoteJid, { text: "⚠️ حدث خطأ أثناء تحميل الفيديو. تأكد من الرابط." }, { quoted: m });
  }
};
