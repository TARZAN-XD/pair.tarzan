const axios = require("axios");

module.exports = async ({ sock, msg, text, reply, from }) => {
    if (!text.startsWith("apk")) return;

    const appName = text.replace("apk", "").trim();
    if (!appName) {
        return reply("❌ يرجى كتابة اسم التطبيق.\nمثال: apk واتساب");
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

    try {
        // ✅ API الأول (NexOracle)
        const apiUrl = `https://api.nexoracle.com/downloader/apk?apikey=free_key@maher_apis&q=${encodeURIComponent(appName)}`;
        let res = await axios.get(apiUrl);

        if (!res.data || res.data.status !== 200 || !res.data.result) {
            return reply("❌ لم يتم العثور على التطبيق، جرب اسم آخر.");
        }

        const { name, lastup, package: pkg, size, icon, dllink } = res.data.result;

        // ✅ إرسال رسالة بالتفاصيل قبل التنزيل
        await sock.sendMessage(from, {
            image: { url: icon },
            caption: `📦 *اسم التطبيق:* ${name}\n📅 *آخر تحديث:* ${lastup}\n📦 *الحزمة:* ${pkg}\n📏 *الحجم:* ${size}\n\n⏳ *جاري تنزيل التطبيق...*`
        }, { quoted: msg });

        // ✅ تنزيل الملف كـ Buffer
        const apkResponse = await axios.get(dllink, { responseType: 'arraybuffer' });
        const apkBuffer = Buffer.from(apkResponse.data, "binary");

        // ✅ إرسال التطبيق كملف
        await sock.sendMessage(from, {
            document: apkBuffer,
            mimetype: "application/vnd.android.package-archive",
            fileName: `${name}.apk`,
            caption: `✅ تم تنزيل التطبيق بنجاح!\n📱 ${name}\n> بواسطة *طرزان الواقدي*`
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
    } catch (error) {
        console.error("❌ خطأ:", error.message);
        await reply("❌ حدث خطأ أثناء جلب التطبيق، حاول لاحقًا.");
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
    }
};
