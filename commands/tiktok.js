const axios = require('axios');
const { default: axiosRetry } = require('axios-retry');
const { getBuffer } = require('../lib/buffer');

axiosRetry(axios, { retries: 3 });

module.exports = async ({ sock, msg, text }) => {
  const sender = msg.key.remoteJid;

  if (!text.startsWith('.tiktok')) return;

  const url = text.split(' ')[1];
  if (!url || !url.includes('tiktok.com')) {
    return await sock.sendMessage(sender, { text: '❌ يرجى إرسال رابط تيك توك صالح بعد الأمر\nمثال: .tiktok https://www.tiktok.com/...' });
  }

  try {
    const api = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const res = await axios.get(api);
    const data = res.data;

    if (!data || !data.data || !data.data.play) {
      return await sock.sendMessage(sender, { text: '❌ لم يتم العثور على الفيديو أو حدث خطأ في التحميل.' });
    }

    const videoBuffer = await getBuffer(data.data.play); // بدون علامة مائية

    await sock.sendMessage(sender, {
      video: videoBuffer,
      caption: `🎬 تم تحميل فيديو تيك توك:\n${data.data.title || ''}`,
    });

  } catch (err) {
    console.error('خطأ في تحميل TikTok:', err);
    await sock.sendMessage(sender, { text: '❌ حدث خطأ أثناء تحميل الفيديو. حاول مجددًا لاحقًا.' });
  }
};
