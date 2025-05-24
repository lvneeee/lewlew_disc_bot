const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Bỏ qua bài hát hiện tại'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    if (!interaction.member.voice.channel) {
      logger.warn(`[SKIP] User ${interaction.user.tag} tried to skip without joining a voice channel.`);
      return interaction.reply('Bạn cần vào voice channel trước!');
    }
    const currentTrack = guildManager.getCurrentTrack();
    if (!currentTrack) {
      logger.warn(`[SKIP] No track to skip in guild ${interaction.guildId}`);
      return interaction.reply('Không có bài hát nào đang phát!');
    }
    guildManager.getPlayer().stop();
    logger.info(`[SKIP] Track skipped in guild ${interaction.guildId} by ${interaction.user.tag}: ${currentTrack.title}`);
    await interaction.reply(`⏭️ Đã bỏ qua: **${currentTrack.title}**`);
  },
};
