const { SlashCommandBuilder } = require('discord.js');
const { getPlayer, getConnection, clearConnection, clearDisconnectTimeout, clearPlayer } = require('../utils/audioPlayer');
const { clearQueue } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Dừng phát nhạc và xóa hàng đợi'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    const connection = getConnection(interaction.guildId);

    clearQueue(interaction.guildId);
    
    if (player) {
      player.stop();
      clearPlayer(interaction.guildId);
    }

    if (connection) {
      connection.destroy();
      clearConnection(interaction.guildId);
      clearDisconnectTimeout(interaction.guildId);
    }

    interaction.reply('⏹️ Đã dừng phát nhạc và xóa hàng đợi.');
  },
};
