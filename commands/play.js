const yts = require('yt-search');
const { downloadMp3 } = require('../lib/ytdl'); // تأكد أن مكتبة التحميل موجودة

module.exports = (sock) => {
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const type = Object.keys(msg.message)[0];
    const body = (type === 'conversation') ? msg.message.conversation :
                 (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : '';

    if (body.startsWith('play ')) {
      const query = body.slice(5).trim();
      if (!query) return sock.sendMessage(from, { text: "يرجى كتابة اسم المقطع بعد الأمر." });

      let search = await yts(query);
      let video = search.videos[0];
      if (!video) return sock.sendMessage(from, { text: "لم يتم العثور على نتيجة." });

      const info = `🎵 *${video.title}*\n⏱️ ${video.timestamp}\n📺 ${video.author.name}`;
      await sock.sendMessage(from, { text: info });

      const { audioBuffer } = await downloadMp3(video.url); // يجب أن تعيد buffer
      await sock.sendMessage(from, {
        audio: audioBuffer,
        mimetype: 'audio/mp4'
      }, { quoted: msg });
    }
  });
};
