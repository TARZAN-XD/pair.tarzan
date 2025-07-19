const axios = require('axios');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.toLowerCase().startsWith('img')) return;

  const parts = text.trim().split(' ');
  if (parts.length < 2) {
    return reply('❌ اكتب كلمة أو رابط صورة.\nمثال: img قطة');
  }

  const query = parts.slice(1).join(' ');

  try {
    await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } });

    // ✅ إن كان رابط مباشر
    if (query.startsWith('http')) {
      const buffer = await axios.get(query, { responseType: 'arraybuffer' });
      await sock.sendMessage(from, {
        image: Buffer.from(buffer.data, 'binary'),
        caption: `🖼️ صورة من الرابط:\n${query}\n> بواسطة طــــرزان الواقدي`
      }, { quoted: msg });
      return await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
    }

    // ✅ محرك بحث متعدد المصادر
    const results = [];

    // 🟡 1. Pexels
    try {
      const pexelsAPI = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
      const pexelsRes = await axios.get(pexelsAPI, {
        headers: {
          Authorization: '9vySYMFQtn9OjUO2jHt7CQ45Uwfw4fWyE3UcLouC4kb1oqc8Da8cNNHy'
        }
      });
      if (pexelsRes.data.photos?.length > 0) {
        results.push({
          url: pexelsRes.data.photos[0].src.original,
          source: 'Pexels'
        });
      }
    } catch (e) { }

    // 🟡 2. Unsplash
    try {
      const unsplashAPI = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=KTVJieF4bPuxmAs4AqSw95CEH3ozNjU6cTcNSrTrSpE`;
      const unsplashRes = await axios.get(unsplashAPI);
      if (unsplashRes.data.results?.length > 0) {
        results.push({
          url: unsplashRes.data.results[0].urls.full,
          source: 'Unsplash'
        });
      }
    } catch (e) { }

    // 🟡 3. Pixabay (كمصدر إضافي)
    try {
      const pixabayAPI = `https://pixabay.com/api/?key=38524332-3800d1d58030c7fbe8b0375f6&q=${encodeURIComponent(query)}&image_type=photo&per_page=1`;
      const pixabayRes = await axios.get(pixabayAPI);
      if (pixabayRes.data.hits?.length > 0) {
        results.push({
          url: pixabayRes.data.hits[0].largeImageURL,
          source: 'Pixabay'
        });
      }
    } catch (e) { }

    if (results.length === 0) {
      await reply('❌ لم يتم العثور على صورة. جرب كلمة أخرى أو صياغة مختلفة.');
      return await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } });
    }

    // ✅ إرسال أول نتيجة ناجحة
    const result = results[0];
    const buffer = await axios.get(result.url, { responseType: 'arraybuffer' });
    await sock.sendMessage(from, {
      image: Buffer.from(buffer.data, 'binary'),
      caption: `🔍 نتيجة البحث عن: *${query}*\n> عبر ${result.source}\n- بواسطة طــــرزان الواقدي`
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('❌ خطأ:', err.message);
    await reply('❌ حدث خطأ غير متوقع. حاول لاحقًا.');
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
