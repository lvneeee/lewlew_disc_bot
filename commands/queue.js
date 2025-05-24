const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue, getCurrentTrack } = require('../utils/audioQueue');
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
    
    if (currentTrack) {
      description += `**Đang phát:** ${currentTrack.title}\n\n`;
    }

    if (queue.length > 0) {
      description += queue
        .map((track, index) => `${index + 1}. ${track.title}`)
        .join('\n');
    }

    embed.setDescription(description);
    interaction.reply({ embeds: [embed] });
  },
};
