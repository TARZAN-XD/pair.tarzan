// commands/adhkar.js
const adhkarList = [
  "🕌 الذكر 1: سبحان الله",
  "🕌 الذكر 2: الحمد لله",
  "🕌 الذكر 3: لا إله إلا الله",
  "🕌 الذكر 4: الله أكبر",
  "🕌 الذكر 5: لا حول ولا قوة إلا بالله",
  "🕌 الذكر 6: سبحان الله وبحمده",
  "🕌 الذكر 7: سبحان الله العظيم",
  "🕌 الذكر 8: أستغفر الله",
  "🕌 الذكر 9: اللهم صل على محمد",
  "🕌 الذكر 10: حسبي الله لا إله إلا هو عليه توكلت",
  // أكمل حتى 100
];

for (let i = 11; i <= 100; i++) {
  adhkarList.push(`🕌 الذكر ${i}: ذكر رقم ${i}`);
}

module.exports = async ({ text, reply, sock, msg, from }) => {
  const command = text.toLowerCase();

  if (command === "اذكار" || command === "/اذكار") {
    await sendAdhkar(0);
  }

  if (msg?.message?.buttonsResponseMessage) {
    const selectedId = msg.message.buttonsResponseMessage.selectedButtonId;

    if (selectedId.startsWith("adhkar_")) {
      const index = parseInt(selectedId.split("_")[1]);
      if (!isNaN(index)) {
        await sendAdhkar(index);
      }
    }
  }

  async function sendAdhkar(index) {
    if (index < 0 || index >= adhkarList.length) return;

    const buttons = [];

    if (index > 0) {
      buttons.push({ buttonId: `adhkar_${index - 1}`, buttonText: { displayText: "⬅️ السابق" }, type: 1 });
    }

    if (index < adhkarList.length - 1) {
      buttons.push({ buttonId: `adhkar_${index + 1}`, buttonText: { displayText: "➡️ التالي" }, type: 1 });
    }

    buttons.push({ buttonId: `adhkar_exit`, buttonText: { displayText: "❌ خروج" }, type: 1 });

    await sock.sendMessage(from, {
      text: adhkarList[index],
      buttons,
      headerType: 1
    }, { quoted: msg });
  }
};
