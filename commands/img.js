const axios = require('axios');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.startsWith('img')) return;

  const parts = text.trim().split(' ');
  if (parts.length < 2) {
    return reply('❌ يرجى كتابة كلمة أو رابط صورة.\nمثال: img قطة');
  }

  const query = parts.slice(1).join(' ');

  try {
    await sock.sendMessage(from, { react: { text: '🖼️', key: msg.key } });

    // تحميل صورة من كلمة مفتاحية عبر API Pexels
    if (!query.startsWith('http')) {
      const api = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
      const response = await axios.get(api, {
        headers: {
          Authorization: '563492ad6f91700001000001a3c7dd038d8240fdb8592965c0a7f92e' // مفتاح تجريبي
        }
      });

      const photo = response.data.photos[0];
      if (!photo) return reply('❌ لم يتم العثور على صورة، جرب كلمة أخرى.');

      const image = photo.src.original;
      const buffer = await axios.get(image, { responseType: 'arraybuffer' });

      await sock.sendMessage(from, {
        image: Buffer.from(buffer.data, 'binary'),
        caption: `🖼️ نتائج البحث عن: *${query}*\n> تم بواسطة طــــرزان الواقدي`
      }, { quoted: msg });

    } else {
      // تحميل صورة مباشرة من رابط
      const buffer = await axios.get(query, { responseType: 'arraybuffer' });

      await sock.sendMessage(from, {
        image: Buffer.from(buffer.data, 'binary'),
        caption: `🖼️ صورة من الرابط:\n${query}\n> بواسطة طــــرزان الواقدي`
      }, { quoted: msg });
    }

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (error) {
    console.error('❌ خطأ في أمر img:', error);
    await reply('❌ تعذر تحميل الصورة. تحقق من الرابط أو الكلمة وحاول مجددًا.');
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
