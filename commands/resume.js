const { AudioPlayerStatus } = require('@discordjs/voice');
const { getPlayer, createPlayer, setConnection, getConnection } = require('../utils/audioPlayer');

module.exports = {
  name: 'resume',
  async execute(message) {
    const guildId = message.guild.id;

    let player = getPlayer(guildId);

    if (!player) {
      // Nếu chưa có player, tạo 1 player mới (không cần callback playNext vì resume chỉ resume)
      player = createPlayer(guildId);
      // Nếu bạn muốn player được subscribe voiceConnection thì cũng cần getConnection và subscribe
      const connection = getConnection(guildId);
      if (connection) {
        connection.subscribe(player);
      }
    }

    if (player.state.status !== AudioPlayerStatus.Paused) {
      return message.reply('❗ Hiện tại không có nhạc nào bị tạm dừng.');
    }

    const success = player.unpause();
    if (success) {
      message.reply('▶️ Đã tiếp tục phát nhạc.');
    } else {
      message.reply('⚠️ Không thể tiếp tục phát.');
    }
  },
};
