const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

module.exports = async ({ text, reply, sock, msg, from }) => {
  if (text !== 'vv') return;

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (!quoted) {
    return await reply('❌ أرسل الأمر *vv* على رد لوسائط العرض مرة واحدة.');
  }

  const mediaType = Object.keys(quoted)[0];
  const isViewOnce = quoted[mediaType]?.viewOnce;

  if (!isViewOnce) {
    return await reply('❌ الوسائط ليست من نوع العرض مرة واحدة.');
  }

  try {
    const mediaBuffer = await downloadMediaMessage(
      { key: msg.message.extendedTextMessage.contextInfo.stanzaId ? msg.message.extendedTextMessage.contextInfo : msg.key, message: quoted },
      'buffer',
      {},
      { logger: console }
    );

    const ext = mime.extension(quoted[mediaType].mimetype);
    const filename = `viewonce-${Date.now()}.${ext}`;
    const filePath = path.join(__dirname, '..', 'downloads', filename);

    // تأكد من وجود مجلد downloads
    if (!fs.existsSync(path.join(__dirname, '..', 'downloads'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'downloads'));
    }

    fs.writeFileSync(filePath, mediaBuffer);

    await sock.sendMessage(from, { document: mediaBuffer, fileName: filename, mimetype: quoted[mediaType].mimetype }, { quoted: msg });
    await reply('✅ تم استخراج الوسائط ذات العرض لمرة واحدة.');
  } catch (err) {
    console.error('❌ خطأ في تحميل الوسائط:', err);
    await reply('❌ حدث خطأ أثناء استخراج الوسائط.');
  }
};
