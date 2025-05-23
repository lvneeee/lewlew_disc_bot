const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Hiển thị danh sách phát'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    const queue = guildManager.getQueue();
    const currentTrack = guildManager.getCurrentTrack();

    if (!currentTrack && queue.length === 0) {
      return interaction.reply('Không có bài hát nào trong hàng đợi!');
    }

    const embed = new EmbedBuilder()
      .setTitle('🎵 Danh sách phát')
      .setColor('#0099ff');

    let description = '';

    if (currentTrack) {
      description += `**Đang phát:**\n${currentTrack.title} | Yêu cầu bởi: ${currentTrack.requestedBy}\n\n`;
    }

    if (queue.length > 0) {
      description += '**Tiếp theo:**\n';
      queue.forEach((track, index) => {
        description += `${index + 1}. ${track.title} | Yêu cầu bởi: ${track.requestedBy}\n`;
      });
    }

    embed.setDescription(description);
    await interaction.reply({ embeds: [embed] });
  },
};
