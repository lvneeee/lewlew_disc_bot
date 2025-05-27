const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Xáo trộn thứ tự các bài hát trong hàng đợi'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    
    // Kiểm tra xem người dùng có trong voice channel không
    if (!interaction.member.voice.channel) {
      logger.warn(`[SHUFFLE] User ${interaction.user.tag} tried to shuffle without joining a voice channel.`);
      return interaction.reply('❗ Bạn phải vào voice channel trước.');
    }

    // Xáo trộn hàng đợi và kiểm tra kết quả
    const shuffleSuccess = guildManager.shuffle();
    if (!shuffleSuccess) {
      logger.info(`[SHUFFLE] Not enough tracks to shuffle for user ${interaction.user.tag}`);
      return interaction.reply('❗ Cần ít nhất 2 bài hát trong hàng đợi để xáo trộn.');
    }

    // Lấy danh sách hàng đợi mới để hiển thị
    const queue = guildManager.getQueue();
    const currentTrack = guildManager.getCurrentTrack();
    
    // Tạo embed để hiển thị hàng đợi mới
    const embed = new EmbedBuilder()
      .setTitle('🔀 Đã xáo trộn hàng đợi')
      .setColor('#0099ff');

    let description = '';
    const MAX_QUEUE_DISPLAY = 10; // Giới hạn số bài hiển thị

    if (currentTrack) {
      description += `**Đang phát:** ${currentTrack.title}\n\n`;
    }

    if (queue.length > 0) {
      description += '**Hàng đợi mới:**\n';
      const displayQueue = queue.slice(0, MAX_QUEUE_DISPLAY);
      description += displayQueue
        .map((track, index) => `${index + 1}. ${track.title}`)
        .join('\n');

      if (queue.length > MAX_QUEUE_DISPLAY) {
        description += `\n...và ${queue.length - MAX_QUEUE_DISPLAY} bài khác.`;
      }
    }

    embed.setDescription(description);
    logger.info(`[SHUFFLE] Queue shuffled by ${interaction.user.tag}, new queue size: ${queue.length}`);
    await interaction.reply({ embeds: [embed] });
  },
};
