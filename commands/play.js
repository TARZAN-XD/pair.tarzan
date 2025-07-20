const ytdl = require("ytdl-core");
const yts = require("yt-search");

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith("play")) return;

  const query = text.trim().slice(5).trim();
  if (!query) return reply("❌ يرجى كتابة اسم الأغنية أو الرابط.\nمثال: play سورة الكهف");

  await reply("⏳ يتم البحث وتحميل الصوت، الرجاء الانتظار...");

  try {
    const search = await yts(query);
    const video = search.videos[0];
    if (!video) return reply("❌ لم يتم العثور على نتائج.");

    const title = video.title;
    const url = video.url;
    const audioStream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
    });

    const fileName = `${title.replace(/[^\w\s]/gi, "")}.mp3`;

    await sock.sendMessage(msg.key.remoteJid, {
      document: { stream: audioStream },
      mimetype: "audio/mp3",
      fileName: fileName,
    }, { quoted: msg });

    await reply(`✅ تم إرسال الملف الصوتي: *${title}*`);

  } catch (err) {
    console.error(err);
    return reply("❌ حدث خطأ أثناء التحميل. تأكد من الرابط أو الكلمة.");
  }
};
