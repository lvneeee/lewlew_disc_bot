const { SlashCommandBuilder } = require('discord.js');
const { searchVideos } = require('../utils/ytdlp');
const { execute: playExecute } = require('./play');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Tìm và phát video từ YouTube')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Từ khóa tìm kiếm')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const query = interaction.options.getString('query');
      const results = await searchVideos(query, 1); // Chỉ lấy 1 kết quả

      if (results.length === 0) {
        logger.info(`[SEARCH] User ${interaction.user.tag} searched '${query}' in guild ${interaction.guildId} (no result)`);
        return interaction.editReply('❌ Không tìm thấy video nào.');
      }

      const video = results[0];
      const voiceChannel = interaction.member.voice.channel;
      
      if (!voiceChannel) {
        logger.warn(`[SEARCH] User ${interaction.user.tag} searched '${query}' but not in voice channel (guild ${interaction.guildId})`);
        return interaction.editReply('❗ Bạn phải vào voice channel trước.');
      }
      logger.info(`[SEARCH] User ${interaction.user.tag} searched '${query}' and found '${video.title}' in guild ${interaction.guildId}`);
      await interaction.editReply(`🔎 Đã tìm thấy: **${video.title}**`);

      // Pass the original interaction, isFromSearch flag, and video URL
      await playExecute(interaction, true, video.url);

    } catch (error) {
      logger.error(`[SEARCH] Error searching in guild ${interaction.guildId}: ${error}`);
      return interaction.editReply('❌ Có lỗi xảy ra khi tìm kiếm.');
    }
  }
};
