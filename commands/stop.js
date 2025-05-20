const { getPlayer, getConnection, clearConnection, clearDisconnectTimeout, clearPlayer } = require('../utils/audioPlayer');
const { clearQueue } = require('../utils/audioQueue');

module.exports = {
  name: 'stop',
  async execute(message) {
    const player = getPlayer(message.guild.id);
    const connection = getConnection(message.guild.id);

    clearQueue(message.guild.id);
    
    if (player) {
      player.stop();
      clearPlayer(message.guild.id);  // Xóa player cũ
    }

    if (connection) {
      connection.destroy();
      clearConnection(message.guild.id);
      clearDisconnectTimeout(message.guild.id);
    }

    message.reply('⏹️ Đã dừng phát nhạc và xóa hàng đợi.');
  },
};
