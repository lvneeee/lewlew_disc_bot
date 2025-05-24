const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Xóa toàn bộ hàng đợi phát nhạc'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    if (!interaction.member.voice.channel) {
      logger.warn(`[CLEARQUEUE] User ${interaction.user.tag} tried to clear queue without joining a voice channel.`);
      return interaction.reply('Bạn cần vào voice channel trước!');
    }
    guildManager.clear();
    logger.info(`[CLEARQUEUE] Queue cleared in guild ${interaction.guildId} by ${interaction.user.tag}`);
    await interaction.reply('🗑️ Đã xóa toàn bộ hàng đợi!');
  },
};
