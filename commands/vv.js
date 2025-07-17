const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: "vv",
  description: "📥 استرجاع الوسائط ذات العرض لمرة واحدة",
  category: "owner",
  alias: ["viewonce", "retrive"],
  react: "🐳",
  ownerOnly: true,

  execute: async (client, message, args, { isCreator }) => {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!isCreator) {
      return await client.sendMessage(message.key.remoteJid, {
        text: "*📛 هذا الأمر مخصص للمالك فقط.*"
      }, { quoted: message });
    }

    if (!quoted) {
      return await client.sendMessage(message.key.remoteJid, {
        text: "*🍁 من فضلك قم بالرد على رسالة تحتوي على وسائط ذات عرض لمرة واحدة.*"
      }, { quoted: message });
    }

    try {
      let mtype = Object.keys(quoted)[0];
      const stream = await downloadContentFromMessage(quoted[mtype], mtype.replace('Message', ''));
      let buffer = Buffer.from([]);

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      let sendOptions = { quoted: message };

      if (mtype === "imageMessage") {
        await client.sendMessage(message.key.remoteJid, {
          image: buffer,
          caption: quoted[mtype]?.caption || ""
        }, sendOptions);
      } else if (mtype === "videoMessage") {
        await client.sendMessage(message.key.remoteJid, {
          video: buffer,
          caption: quoted[mtype]?.caption || ""
        }, sendOptions);
      } else if (mtype === "audioMessage") {
        await client.sendMessage(message.key.remoteJid, {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: quoted[mtype]?.ptt || false
        }, sendOptions);
      } else {
        await client.sendMessage(message.key.remoteJid, {
          text: "❌ فقط الصور، الفيديو، والصوتيات مدعومة."
        }, sendOptions);
      }

    } catch (err) {
      console.error("vv Error:", err);
      await client.sendMessage(message.key.remoteJid, {
        text: `❌ حدث خطأ أثناء استرجاع الوسائط:\n${err.message}`
      }, { quoted: message });
    }
  }
};
