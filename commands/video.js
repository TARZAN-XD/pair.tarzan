const ytdl = require('ytdl-core');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.startsWith("video")) return;

  const parts = text.trim().split(" ");
  if (parts.length < 2) {
    return reply("❌ يرجى إدخال رابط فيديو يوتيوب.\nمثال: video https://youtube.com/...");
  }

  const videoUrl = parts[1];
  if (!ytdl.validateURL(videoUrl)) {
    return reply("❌ الرابط غير صالح، تأكد أنه من YouTube.");
  }

  await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

  try {
    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title;
    const stream = ytdl(videoUrl, {
      quality: '18', // جودة متوسطة mp4
      filter: format => format.container === 'mp4' && format.hasVideo && format.hasAudio
    });

    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    await sock.sendMessage(from, {
      video: buffer,
      mimetype: 'video/mp4',
      caption: `🎬 تم التحميل من YouTube\n\n📌 العنوان: ${title}`,
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('❌ خطأ:', err);
    await reply("❌ تعذر تحميل الفيديو. تأكد من الرابط أو حاول لاحقًا.");
    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
  }
};
