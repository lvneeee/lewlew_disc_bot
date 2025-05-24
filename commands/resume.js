const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Tiếp tục phát nhạc'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    if (!interaction.member.voice.channel) {
      logger.warn(`[RESUME] User ${interaction.user.tag} tried to resume without joining a voice channel.`);
      return interaction.reply('Bạn cần vào voice channel trước!');
    }
    const currentTrack = guildManager.getCurrentTrack();
    if (!currentTrack) {
      logger.warn(`[RESUME] No track to resume in guild ${interaction.guildId}`);
      return interaction.reply('Không có bài hát nào đang phát!');
    }
    guildManager.getPlayer().unpause();
    logger.info(`[RESUME] Music resumed in guild ${interaction.guildId} by ${interaction.user.tag}`);
    await interaction.reply('▶️ Đã tiếp tục phát nhạc');
  },
};
