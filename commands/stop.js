const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Dừng phát nhạc và xóa hàng đợi'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    if (!interaction.member.voice.channel) {
      logger.warn(`[STOP] User ${interaction.user.tag} tried to stop music without joining a voice channel.`);
      return interaction.reply('Bạn cần vào voice channel trước!');
    }
    guildManager.clear();
    guildManager.setCurrentTrack(null);
    guildManager.getPlayer().stop();
    guildManager.clearConnection();
    logger.info(`[STOP] Music stopped and queue cleared in guild ${interaction.guildId} by ${interaction.user.tag}`);
    await interaction.reply('Đã dừng phát nhạc và xóa hàng đợi!');
  },
};
