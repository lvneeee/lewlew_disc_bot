const { SlashCommandBuilder } = require('discord.js');
const { getPlayer, getConnection, clearConnection, clearDisconnectTimeout, clearPlayer } = require('../utils/audioPlayer');
const { clearQueue } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Dừng phát nhạc và xóa hàng đợi'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    const connection = getConnection(interaction.guildId);

    if (!interaction.member.voice.channel) {
      logger.warn(`[STOP] User ${interaction.user.tag} tried to stop music without joining a voice channel.`);
      return interaction.reply('Bạn cần vào voice channel trước!');
    }

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

    logger.info(`[STOP] Music stopped and queue cleared in guild ${interaction.guildId} by ${interaction.user.tag}`);
    await interaction.reply('⏹️ Đã dừng phát nhạc và xóa hàng đợi.');
  },
};
