const axios = require('axios');

async function getBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data, 'utf-8');
}

module.exports = { getBuffer };
