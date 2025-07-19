const axios = require('axios');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.startsWith('play')) return;

  const parts = text.trim().split(' ');
  if (parts.length < 2) {
    return reply('❌ يرجى إدخال اسم الأغنية.\nمثال: play يا زهراء');
  }

  const query = parts.slice(1).join(' ');

  try {
    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

    const apiUrl = `https://api.nexoracle.com/downloader/play-audio?apikey=free_key@maher_apis&query=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || response.data.status !== 200 || !response.data.result || !response.data.result.url) {
      return reply('❌ تعذر العثور على الأغنية. حاول باسم مختلف.');
    }

    const { title, url, duration, channel } = response.data.result;

    await reply(`🎧 جارٍ تحميل: *${title}* (${duration}) من قناة *${channel}*...`);

    const audioData = await axios.get(url, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(audioData.data, 'binary');

    await sock.sendMessage(from, {
      audio: audioBuffer,
      mimetype: 'audio/mp4',
      ptt: false,
      fileName: `${title}.mp3`,
      caption: `🎵 *${title}*\n📺 *${channel}*\n⌛ *${duration}*\n\n> تم التحميل بواسطة طرزان الواقدي`
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('❌ خطأ أثناء تنفيذ أمر play:', err);
    await reply('❌ حدث خطأ أثناء جلب الصوت. حاول مجددًا لاحقًا.');
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
