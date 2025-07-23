const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { createCanvas } = require('canvas');

module.exports = async ({ sock, msg, text, reply, from }) => {
  if (!text.toLowerCase().startsWith('mix')) return;

  const parts = text.trim().split(/\s+/).slice(1); // الإيموجيات بعد الأمر
  if (parts.length === 0) {
    return reply('❌ يرجى إدخال إيموجيات.\nمثال: mix 😋 😎 😂');
  }

  try {
    await sock.sendMessage(from, { react: { text: '🎨', key: msg.key } });

    const emojis = parts.join(' ');
    const size = 512;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const fontSize = Math.floor(size / (parts.length <= 2 ? 2 : 3));
    ctx.font = `${fontSize}px "Segoe UI Emoji"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = size / 2;
    const centerY = size / 2;

    if (parts.length === 1) {
      ctx.fillText(parts[0], centerX, centerY);
    } else {
      // توزيع الإيموجيات بشكل دائري أو أفقي
      const angleStep = (2 * Math.PI) / parts.length;
      const radius = size / 3;
      parts.forEach((emoji, i) => {
        const angle = i * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        ctx.fillText(emoji, x, y);
      });
    }

    // تحويل الصورة إلى ملصق
    const buffer = canvas.toBuffer();
    const sticker = new Sticker(buffer, {
      pack: 'Tarzan Pack',
      author: 'طرزان الواقدي',
      type: StickerTypes.FULL,
      quality: 100
    });

    const stickerBuffer = await sticker.build();

    await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('❌ خطأ في mixemoji:', err);
    await reply('❌ حدث خطأ أثناء إنشاء الملصق.');
  }
};
