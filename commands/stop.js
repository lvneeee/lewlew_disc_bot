const { getPlayer, getConnection, clearConnection, clearDisconnectTimeout } = require('../utils/audioPlayer');
const { clearQueue } = require('../utils/audioQueue');

module.exports = {
  name: 'stop',
  async execute(message) {
    const player = getPlayer(message.guild.id);
    const connection = getConnection(message.guild.id);

    clearQueue(message.guild.id);
    player.stop();

    if (connection) {
      connection.destroy();
      clearConnection(message.guild.id);
      clearDisconnectTimeout(message.guild.id);
    }

    message.reply('⏹️ Đã dừng phát nhạc và xóa hàng đợi.');
  },
};
