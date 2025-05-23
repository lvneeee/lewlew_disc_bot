const { SlashCommandBuilder } = require('discord.js');
const { clearQueue } = require('../utils/audioQueue');
const { getPlayer } = require('../utils/audioPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Xóa toàn bộ hàng đợi phát nhạc'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    
    if (!player) {
      return interaction.reply('❗ Không có hàng đợi nào để xóa.');
    }

    clearQueue(interaction.guildId);
    interaction.reply('🗑️ Đã xóa toàn bộ hàng đợi.');
  },
};
