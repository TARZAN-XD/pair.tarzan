const data = require('../data/dua.json');
module.exports = function () {
  const random = Math.floor(Math.random() * data.length);
  return `🤲 *دعاء اليوم:*\n\n${data[random]}`;
};
