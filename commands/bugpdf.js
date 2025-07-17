module.exports = {
  name: 'bugpdf',
  description: 'يرسل ملف PDF يحتوي على مشاكل أو تقارير',
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      document: { url: "https://example.com/bugreport.pdf" },
      fileName: "bug_report.pdf",
      mimetype: "application/pdf",
      caption: "📄 تقرير الأخطاء"
    });
  }
};
