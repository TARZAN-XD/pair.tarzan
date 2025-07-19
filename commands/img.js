const axios = require('axios');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.toLowerCase().startsWith('img')) return;

  const parts = text.trim().split(' ');
  if (parts.length < 2) {
    return reply('❌ يرجى كتابة كلمة أو رابط صورة.\nمثال: img قطة');
  }

  const query = parts.slice(1).join(' ');

  try {
    await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } });

    // 📸 رابط مباشر
    if (query.startsWith('http')) {
      const buffer = await axios.get(query, { responseType: 'arraybuffer' });
      return await sock.sendMessage(from, {
        image: Buffer.from(buffer.data, 'binary'),
        caption: `🖼️ صورة من الرابط:\n${query}\n> بواسطة طــــرزان الواقدي`
      }, { quoted: msg });
    }

    // 🌐 أولًا Pexels
    const pexelsAPI = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3`;
    const pexelsRes = await axios.get(pexelsAPI, {
      headers: {
        Authorization: '9vySYMFQtn9OjUO2jHt7CQ45Uwfw4fWyE3UcLouC4kb1oqc8Da8cNNHy'
      }
    });

    if (pexelsRes.data.photos.length > 0) {
      for (const photo of pexelsRes.data.photos) {
        const imgURL = photo.src.original;
        const buffer = await axios.get(imgURL, { responseType: 'arraybuffer' });

        await sock.sendMessage(from, {
          image: Buffer.from(buffer.data, 'binary'),
          caption: `🔍 نتيجة البحث عن: *${query}*\n> عبر Pexels\n- بواسطة طــــرزان الواقدي`
        }, { quoted: msg });
      }

    } else {
      // 🌐 ثانيًا Unsplash
      const unsplash = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&client_id=KTVJieF4bPuxmAs4AqSw95CEH3ozNjU6cTcNSrTrSpE`;
      const unsplashRes = await axios.get(unsplash);

      if (unsplashRes.data.results.length === 0) {
        return reply('❌ لم يتم العثور على صور. جرب كلمة أخرى.');
      }

      for (const result of unsplashRes.data.results) {
        const imgURL = result.urls.full;
        const buffer = await axios.get(imgURL, { responseType: 'arraybuffer' });

        await sock.sendMessage(from, {
          image: Buffer.from(buffer.data, 'binary'),
          caption: `🔍 نتيجة البحث عن: *${query}*\n> عبر Unsplash\n- بواسطة طــــرزان الواقدي`
        }, { quoted: msg });
      }
    }

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('❌ خطأ في أمر img:', err);
    await reply('❌ حدث خطأ أثناء تحميل الصور. حاول لاحقًا أو بكلمة أبسط.');
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
