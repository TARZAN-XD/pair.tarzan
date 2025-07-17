const data = require('../data/hadith.json');
module.exports = function () {
  const random = Math.floor(Math.random() * data.length);
  return `📖 *حديث شريف:*\n\n"${data[random]}"`;
};
