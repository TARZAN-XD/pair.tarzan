const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' })
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('❌ الاتصال مغلق، إعادة الاتصال:', shouldReconnect)
      if (shouldReconnect) {
        startBot()
      }
    } else if (connection === 'open') {
      console.log('✅ تم الاتصال بواتساب بنجاح')
    }
  })

  sock.ev.on('messages.upsert', async (msg) => {
    const m = msg.messages[0]
    if (!m.message || m.key.fromMe) return

    const sender = m.key.remoteJid
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || ''

    if (text.toLowerCase().includes('اذكار')) {
      await sock.sendMessage(sender, { text: '📿 الأذكار:\n- سبحان الله\n- الحمد لله\n- لا إله إلا الله\n- الله أكبر' })
    } else if (text.toLowerCase().includes('دعاء')) {
      await sock.sendMessage(sender, { text: '🤲 دعاء:\nاللهم إني أسألك العفو والعافية في الدنيا والآخرة.' })
    } else if (text.toLowerCase().includes('حديث')) {
      await sock.sendMessage(sender, { text: '📖 حديث:\nقال رسول الله ﷺ: "الدال على الخير كفاعله"' })
    }
  })
}

startBot()
