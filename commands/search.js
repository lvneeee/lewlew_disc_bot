const { SlashCommandBuilder } = require('discord.js');
const { searchVideos } = require('../utils/ytdlp');
const { execute: playExecute } = require('./play');

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
        return interaction.editReply('❌ Không tìm thấy video nào.');
      }

      const video = results[0];
      const voiceChannel = interaction.member.voice.channel;
      
      if (!voiceChannel) {
        return interaction.editReply('❗ Bạn phải vào voice channel trước.');
      }      await interaction.editReply(`🔎 Đã tìm thấy: **${video.title}**`);

      // Pass the original interaction, isFromSearch flag, and video URL
      await playExecute(interaction, true, video.url);

    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      return interaction.editReply('❌ Có lỗi xảy ra khi tìm kiếm.');
    }
  }
};
