module.exports = async ({ sock, msg, from }) => {
  const listMessage = {
    text: "👋 مرحبًا بك في البوت الإسلامي\nاختر من القائمة أدناه:",
    footer: "🤖 بوت الأذكار",
    title: "📋 القائمة الرئيسية",
    buttonText: "عرض الخيارات",
    sections: [
      {
        title: "الأذكار اليومية",
        rows: [
          { title: "📿 أذكار الصباح", rowId: "azkar_morning" },
          { title: "🌙 أذكار المساء", rowId: "azkar_evening" },
          { title: "🕌 أذكار بعد الصلاة", rowId: "azkar_prayer" },
        ],
      },
      {
        title: "الإعدادات",
        rows: [
          { title: "🌐 تغيير اللغة", rowId: "change_language" },
          { title: "❌ خروج", rowId: "exit" },
        ],
      },
    ],
  };

  await sock.sendMessage(from, { listMessage });
};
