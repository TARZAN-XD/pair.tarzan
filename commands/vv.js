module.exports = {
  name: "vv",
  description: "استعادة صورة أو فيديو العرض لمرة واحدة",
  category: "owner",
  use: "<الرد على الوسائط>",
  async execute(client, message, args) {
    const { from, quoted, sender } = message;

    // تحقق إذا تم الرد على رسالة
    if (!quoted || !quoted.message) {
      return await client.sendMessage(from, {
        text: "❌ من فضلك قم بالرد على صورة أو فيديو عرض لمرة واحدة."
      }, { quoted: message });
    }

    // تحميل الوسائط
    try {
      const buffer = await quoted.download();
      const mtype = quoted.type;

      switch (mtype) {
        case "imageMessage":
          return await client.sendMessage(from, {
            image: buffer,
            caption: "✅ تمت استعادة الصورة."
          }, { quoted: message });

        case "videoMessage":
          return await client.sendMessage(from, {
            video: buffer,
            caption: "✅ تم استعادة الفيديو."
          }, { quoted: message });

        default:
          return await client.sendMessage(from, {
            text: "❌ فقط الصور والفيديوهات مدعومة."
          }, { quoted: message });
      }

    } catch (err) {
      console.error("خطأ في استرجاع الوسائط:", err);
      return await client.sendMessage(from, {
        text: "❌ فشل في استرجاع الوسائط."
      }, { quoted: message });
    }
  }
}
