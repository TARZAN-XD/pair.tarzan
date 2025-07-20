const yts = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith('play')) return;

  const query = text.replace(/^play\s*/i, '').trim();
  if (!query) return reply("❌ يرجى كتابة اسم الأغنية أو رابط اليوتيوب.\nمثال: play عبدالمجيد عبدالله - أحبك");

  try {
    await reply('⏳ جاري البحث وتحميل الصوت، الرجاء الانتظار...');

    const search = await yts(query);
    const video = search.videos[0];
    if (!video) return reply("❌ لم يتم العثور على نتائج.");

    const info = await ytdl.getInfo(video.url);
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' });
    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(__dirname, '..', 'temp', fileName);

    const audioStream = ytdl(video.url, { filter: 'audioonly' });
    const fileWrite = fs.createWriteStream(filePath);
    audioStream.pipe(fileWrite);

    fileWrite.on('finish', async () => {
      await sock.sendMessage(msg.key.remoteJid, {
        audio: fs.readFileSync(filePath),
        mimetype: 'audio/mp4',
        fileName: `${video.title}.mp3`
      }, { quoted: msg });

      fs.unlinkSync(filePath); // حذف الملف بعد الإرسال
    });

    fileWrite.on('error', (err) => {
      console.error('خطأ في تحميل الصوت:', err);
      reply("❌ حدث خطأ أثناء تحميل الملف الصوتي.");
    });

  } catch (err) {
    console.error('Play Error:', err);
    reply("❌ تعذر معالجة الطلب، يرجى المحاولة لاحقًا.");
  }
};
