const { getCurrentTrack } = require('../utils/audioQueue');

module.exports = {
  name: 'nowplaying',
  async execute(message) {
    const current = getCurrentTrack(message.guild.id);
    if (!current) {
      return message.reply('❗ Không có bài hát nào đang phát.');
    }

    message.reply(`🎶 Đang phát: **${current.title}**`);
  },
};
