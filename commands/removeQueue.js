const { SlashCommandBuilder } = require('discord.js');
const { removeFromQueue, getQueue } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Xóa một bài hát khỏi hàng đợi')
    .addIntegerOption(option =>
      option
        .setName('position')
        .setDescription('Vị trí bài hát trong hàng đợi (1, 2, 3,...)')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    
    if (!interaction.member.voice.channel) {
      logger.warn(`[REMOVE] User ${interaction.user.tag} tried to remove track without joining a voice channel.`);
      return interaction.reply('Bạn cần vào voice channel trước!');
    }

    const position = interaction.options.getInteger('position') - 1;
    const queue = guildManager.getQueue();

    if (position >= queue.length) {
      logger.warn(`[REMOVE] Invalid position ${position + 1} in guild ${interaction.guildId}`);
      return interaction.reply('Không tìm thấy bài hát ở vị trí này!');
    }

    const removedTrack = guildManager.removeAt(position);
    if (removedTrack) {
      logger.info(`[REMOVE] Track removed in guild ${interaction.guildId} by ${interaction.user.tag}: ${removedTrack.title}`);
      await interaction.reply(`🗑️ Đã xóa: **${removedTrack.title}**`);
    } else {
      logger.error(`[REMOVE] Failed to remove track at position ${position + 1} in guild ${interaction.guildId}`);
      await interaction.reply('Không thể xóa bài hát!');
    }
  },
};
