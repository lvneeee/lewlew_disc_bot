const { clearQueue } = require('../utils/audioQueue');

module.exports = {
  name: 'clear',
  async execute(message) {
    const guildId = message.guild.id;
    clearQueue(guildId);
    message.reply('🗑️ Đã xóa toàn bộ hàng đợi.');
  },
};
