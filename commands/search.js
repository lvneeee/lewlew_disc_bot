const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');
const { getPlaylistVideos } = require('../utils/ytdlp');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Tìm kiếm bài hát trên YouTube')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Tên bài hát cần tìm')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const query = interaction.options.getString('query');
      const videos = await getPlaylistVideos('ytsearch5:' + query);

      if (!videos || videos.length === 0) {
        return interaction.editReply('Không tìm thấy kết quả nào!');
      }

      const embed = new EmbedBuilder()
        .setTitle('🔎 Kết quả tìm kiếm')
        .setColor('#0099ff')
        .setDescription(
          videos
            .map((video, index) => `${index + 1}. [${video.title}](${video.url})`)
            .join('\n\n')
        )
        .setFooter({ text: 'Sử dụng lệnh /play với URL để phát bài hát' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in search command:', error);
      await interaction.editReply('Có lỗi xảy ra khi tìm kiếm!');
    }
  },
};
