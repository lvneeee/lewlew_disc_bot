const { SlashCommandBuilder } = require('discord.js');
const { getPlayer } = require('../utils/audioPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Bỏ qua bài hát hiện tại'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);

    if (!player) {
      return interaction.reply('❗ Không có nhạc nào đang phát để bỏ qua.');
    }

    player.stop(); // Việc dừng sẽ trigger event idle -> tự động phát bài tiếp
    interaction.reply('⏭️ Đã bỏ qua bài hát hiện tại.');
  },
};
