const axios = require("axios");

async function generateImage(sock, m, prompt, reply, apiUrl) {
  if (!prompt) return reply("❌ الرجاء إدخال وصف للصورة.");

  try {
    await reply("> *جاري إنشاء الصورة... 🔥*");

    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
    if (!response?.data) return reply("❌ لم يتم استلام صورة من الخادم.");

    const imageBuffer = Buffer.from(response.data, "binary");

    await sock.sendMessage(m.chat, {
      image: imageBuffer,
      caption: `✨ *تم إنشاء الصورة بنجاح!*  
🔍 *الوصف:* ${prompt}`
    }, { quoted: m });

  } catch (error) {
    console.error("❌ خطأ:", error);
    reply(`❌ حدث خطأ: ${error.response?.data?.message || error.message}`);
  }
}

module.exports = async ({ sock, m, text, reply }) => {
  const args = text.trim().split(/\s+/);
  const command = args[0].toLowerCase();
  const prompt = args.slice(1).join(' ');

  if (command === "تخيل") {
    const helpMsg = `
╔════◇◆◇════╗
   ✨ *أوامر توليد الصور بالذكاء الاصطناعي* ✨
╚════◇◆◇════╝

🖼️ *يمكنك إنشاء صور احترافية بسهولة عبر هذه الأوامر:*

━━━━━━━━━━━━━━━━━━━━━━━
🔹 1️⃣ *fluxai*  
✔ مولد الصور بتقنية *Flux AI*  
💡 مثال: \`fluxai غروب الشمس في الصحراء\`

🔹 2️⃣ *stablediffusion*  
✔ مولد الصور بخاصية *Stable Diffusion*  
💡 مثال: \`stablediffusion منظر طبيعي خيالي\`

🔹 3️⃣ *stabilityai*  
✔ مولد الصور عبر *Stability AI*  
💡 مثال: \`stabilityai قطة تلعب بالكرة\`
━━━━━━━━━━━━━━━━━━━━━━━

⚡ *اكتب الأمر متبوعًا بوصف دقيق لتحصل على أفضل النتائج!*

💡 *نصيحة:* كلما كان الوصف مفصلًا، كانت الصورة أجمل وأقرب لما تريد.

━━━━━━━━━━━━━━━━━━━━━━━
🔥 *مثال سريع:*  
\`fluxai فتاة في فضاء خارجي تحمل نجومًا\`

🤖 *طرزان الواقدي – الأفضل دائمًا*
`.trim();

    return reply(helpMsg);
  }

  // تنفيذ أوامر التوليد
  if (["fluxai", "flux", "imagine"].includes(command)) {
    const apiUrl = `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(prompt)}`;
    return generateImage(sock, m, prompt, reply, apiUrl);
  }

  if (["stablediffusion", "sdiffusion", "imagine2"].includes(command)) {
    const apiUrl = `https://api.siputzx.my.id/api/ai/stable-diffusion?prompt=${encodeURIComponent(prompt)}`;
    return generateImage(sock, m, prompt, reply, apiUrl);
  }

  if (["stabilityai", "stability", "imagine3"].includes(command)) {
    const apiUrl = `https://api.siputzx.my.id/api/ai/stabilityai?prompt=${encodeURIComponent(prompt)}`;
    return generateImage(sock, m, prompt, reply, apiUrl);
  }
};
