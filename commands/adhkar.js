const data = require('../data/adhkar.json');
module.exports = function () {
  const random = Math.floor(Math.random() * data.length);
  return `📿 *ذكر اليوم:*\n\n${data[random]}`;
};
