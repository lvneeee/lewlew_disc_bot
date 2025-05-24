const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Hiển thị danh sách các bài hát trong hàng đợi'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    const queue = guildManager.getQueue();
    const currentTrack = guildManager.getCurrentTrack();

    if (!currentTrack && queue.length === 0) {
      logger.info(`[QUEUE] User ${interaction.user.tag} checked queue in guild ${interaction.guildId} (empty queue)`);
      return interaction.reply('Không có bài hát nào trong hàng đợi!');
    }

    logger.info(`[QUEUE] User ${interaction.user.tag} checked queue in guild ${interaction.guildId}`);

    const embed = new EmbedBuilder()
      .setTitle('🎵 Hàng đợi phát nhạc')
      .setColor('#0099ff');

    let description = '';
    const MAX_QUEUE_DISPLAY = 20;
    if (currentTrack) {
      description += `**Đang phát:** ${currentTrack.title}\n\n`;
    }
    if (queue.length > 0) {
      const displayQueue = queue.slice(0, MAX_QUEUE_DISPLAY);
      description += displayQueue
        .map((track, index) => `${index + 1}. ${track.title}`)
        .join('\n');
      if (queue.length > MAX_QUEUE_DISPLAY) {
        description += `\n...và ${queue.length - MAX_QUEUE_DISPLAY} bài nữa.`;
      }
    }
    // Đảm bảo không vượt quá 4096 ký tự
    if (description.length > 4096) {
      description = description.slice(0, 4093) + '...';
    }
    embed.setDescription(description);
    interaction.reply({ embeds: [embed] });
  },
};
