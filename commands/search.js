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
    // Immediately defer the reply to prevent timeout
    await interaction.deferReply().catch(error => {
      if (error.code === 10062) return; // Ignore unknown interaction
      throw error;
    });

    try {
      const query = interaction.options.getString('query');
      
      // Set a timeout for the search operation
      const searchPromise = searchVideos(query, 1);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 5000)
      );
      
      const results = await Promise.race([searchPromise, timeoutPromise]);// Chỉ lấy 1 kết quả

      if (results.length === 0) {
        return interaction.editReply('❌ Không tìm thấy video nào.');
      }

      const video = results[0];
      const voiceChannel = interaction.member.voice.channel;
      
      if (!voiceChannel) {
        return interaction.editReply('❗ Bạn phải vào voice channel trước.');
      }

      await interaction.editReply(`🔎 Đã tìm thấy: **${video.title}**`);

      try {
        // Pass the original interaction, isFromSearch flag, and video URL
        await playExecute(interaction, true, video.url);
      } catch (playError) {
        console.error('Lỗi khi phát nhạc:', playError);
        await interaction.followUp({
          content: '❌ Có lỗi xảy ra khi phát nhạc.',
          ephemeral: true
        });
      }    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      
      // Handle specific error cases
      if (error.message === 'Search timeout') {
        return interaction.editReply('❌ Tìm kiếm mất quá nhiều thời gian, vui lòng thử lại.').catch(console.error);
      }
      
      // If interaction is still valid, send error message
      try {
        await interaction.editReply('❌ Có lỗi xảy ra khi tìm kiếm, vui lòng thử lại sau.');
      } catch (replyError) {
        if (replyError.code !== 10062) { // Only log if it's not an unknown interaction
          console.error('Error sending reply:', replyError);
        }
      }
    }
  }
};
