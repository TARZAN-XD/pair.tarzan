const yts = require('yt-search');
const fetch = require('node-fetch');

sock.ev.on("messages.upsert", async ({ messages }) => {
  const m = messages[0];
  if (!m.message) return;
  const msg = m.message.conversation || m.message.extendedTextMessage?.text || "";
  const from = m.key.remoteJid;
  const sender = m.key.participant || m.key.remoteJid;

  if (msg.startsWith(".yt2")) {
    const q = msg.split(" ").slice(1).join(" ");
    if (!q) return await sock.sendMessage(from, { text: "❌ أرسل اسم الأغنية أو رابط من يوتيوب!" }, { quoted: m });

    await sock.sendMessage(from, { text: "⏳ جاري التحميل ..." }, { quoted: m });

    let videoUrl = "";
    let title = "";

    try {
      if (q.includes("youtube.com") || q.includes("youtu.be")) {
        videoUrl = q;
      } else {
        const search = await yts(q);
        if (!search.videos.length) {
          return await sock.sendMessage(from, { text: "❌ لم يتم العثور على نتائج!" }, { quoted: m });
        }
        videoUrl = search.videos[0].url;
        title = search.videos[0].title;
      }

      const api = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
      const res = await fetch(api);
      const data = await res.json();

      if (!data.success || !data.result || !data.result.download_url) {
        return await sock.sendMessage(from, { text: "❌ فشل التحميل من API!" }, { quoted: m });
      }

      await sock.sendMessage(from, {
        audio: { url: data.result.download_url },
        mimetype: 'audio/mpeg',
        ptt: false
      }, { quoted: m });

      await sock.sendMessage(from, { text: `✅ تم التحميل: *${title || data.result.title}*` }, { quoted: m });

    } catch (err) {
      console.error(err);
      await sock.sendMessage(from, { text: "❌ حصل خطأ أثناء تحميل الصوت!" }, { quoted: m });
    }
  }
});
