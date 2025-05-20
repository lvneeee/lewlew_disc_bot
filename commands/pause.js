const { AudioPlayerStatus } = require('@discordjs/voice');
const { getPlayer } = require('../utils/audioPlayer');

module.exports = {
  name: 'pause',
  async execute(message) {
    const player = getPlayer(message.guild.id);

    if (!player || player.state.status !== AudioPlayerStatus.Playing) {
      return message.reply('❗ Không có nhạc nào đang phát để tạm dừng.');
    }

    const success = player.pause();
    if (success) {
      message.reply('⏸️ Đã tạm dừng phát nhạc.');
    } else {
      message.reply('⚠️ Không thể tạm dừng.');
    }
  },
};
