const axios = require("axios");

module.exports = async ({ sock, msg, text, reply, from }) => {
    if (!text.toLowerCase().startsWith("apk")) return;

    const parts = text.trim().split(" ");
    if (parts.length < 2) {
        return reply("❌ يرجى كتابة اسم التطبيق بعد الأمر.\nمثال: apk whatsapp");
    }

    const appName = parts.slice(1).join(" ");

    try {
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        // 🔗 API لجلب بيانات التطبيق
        const apiUrl = `https://api.nexoracle.com/downloader/apk`;
        const params = {
            apikey: "free_key@maher_apis",
            q: appName
        };

        const response = await axios.get(apiUrl, { params });

        if (!response.data || response.data.status !== 200 || !response.data.result) {
            await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
            return reply("❌ لم يتم العثور على التطبيق. جرب اسم مختلف.");
        }

        const { name, lastup, package: pkg, size, icon, dllink } = response.data.result;

        // ✅ رسالة انتظار مع صورة التطبيق
        await sock.sendMessage(from, {
            image: { url: icon },
            caption: `📦 *جاري تحميل ${name}...*`
        }, { quoted: msg });

        // ✅ تحميل APK من الرابط
        const apkResponse = await axios.get(dllink, { responseType: "arraybuffer" });
        if (!apkResponse.data) {
            await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
            return reply("❌ فشل في تنزيل التطبيق.");
        }

        const apkBuffer = Buffer.from(apkResponse.data, "binary");

        // ✅ تفاصيل التطبيق
        const details = `📦 *تفاصيل التطبيق:*\n\n` +
            `🔖 *الاسم:* ${name}\n` +
            `📅 *آخر تحديث:* ${lastup}\n` +
            `📦 *الحزمة:* ${pkg}\n` +
            `📏 *الحجم:* ${size}\n\n✅ *تم التحميل بنجاح*`;

        // ✅ إرسال الملف
        await sock.sendMessage(from, {
            document: apkBuffer,
            mimetype: "application/vnd.android.package-archive",
            fileName: `${name}.apk`,
            caption: details
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    } catch (err) {
        console.error("❌ خطأ في تحميل APK:", err.message);
        await reply("❌ حدث خطأ أثناء جلب التطبيق. حاول لاحقًا.");
        await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
    }
};
