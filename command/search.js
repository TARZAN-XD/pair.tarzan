const yts = require('yt-search');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.toLowerCase().startsWith('search')) return;

  const query = text.replace(/^search/i, '').trim();
  if (!query) {
    return reply('❌ يرجى كتابة كلمات للبحث.\nمثال: search القرآن الكريم');
  }

  await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } });

  try {
    const results = await yts(query);
    const video = results.videos[0];

    if (!video) {
      return reply('❌ لم يتم العثور على نتائج، جرّب كلمات مختلفة.');
    }

    const message = `🔎 *نتيجة البحث:*\n\n` +
      `🎬 *العنوان:* ${video.title}\n` +
      `👤 *القناة:* ${video.author.name}\n` +
      `⏱️ *المدة:* ${video.timestamp}\n` +
      `📺 *رابط:* ${video.url}\n\n` +
      `> للتحميل أرسل: video ${video.url}`;

    await reply(message);
    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (error) {
    console.error("❌ خطأ أثناء البحث:", error.message);
    await reply("❌ حدث خطأ أثناء البحث، حاول لاحقًا.");
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
