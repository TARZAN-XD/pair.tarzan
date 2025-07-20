const ytsr = require('ytsr');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith("play")) return;

  const query = text.split(" ").slice(1).join(" ");
  if (!query) return reply("❌ يرجى كتابة اسم الأغنية بعد الأمر.\nمثال: play اذكار الصباح");

  await reply("🔍 جاري البحث عن الأغنية...");

  try {
    const filters = await ytsr.getFilters(query);
    const videoFilter = filters.get('Type').get('Video');
    const searchResults = await ytsr(videoFilter.url, { limit: 1 });

    if (!searchResults.items.length) {
      return reply("❌ لم يتم العثور على أي نتائج!");
    }

    const video = searchResults.items[0];
    const videoUrl = video.url;
    const title = video.title.replace(/[^\w\s]/gi, '');
    const fileName = `${title}.mp3`;
    const filePath = path.join(__dirname, '../temp', fileName);

    // تأكد من وجود مجلد temp
    if (!fs.existsSync(path.join(__dirname, '../temp'))) {
      fs.mkdirSync(path.join(__dirname, '../temp'));
    }

    const stream = ytdl(videoUrl, {
      filter: "audioonly",
      quality: "highestaudio"
    });

    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);

    stream.on("end", async () => {
      await sock.sendMessage(msg.key.remoteJid, {
        document: fs.readFileSync(filePath),
        fileName: fileName,
        mimetype: 'audio/mpeg'
      }, { quoted: msg });

      fs.unlinkSync(filePath); // حذف الملف بعد الإرسال

      await reply(`✅ تم إرسال: *${title}*`);
    });

    stream.on("error", async (err) => {
      console.error(err);
      await reply("❌ حدث خطأ أثناء تحميل الصوت.");
    });

  } catch (err) {
    console.error(err);
    await reply("❌ فشل أثناء تنفيذ الأمر:\n" + err.message);
  }
};
