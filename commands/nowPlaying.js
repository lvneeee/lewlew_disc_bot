const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Hiển thị bài hát đang phát'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    const currentTrack = guildManager.getCurrentTrack();

    if (!currentTrack) {
      return interaction.reply('Không có bài hát nào đang phát!');
    }

    const embed = new EmbedBuilder()
      .setTitle('🎵 Đang phát')
      .setDescription(`**${currentTrack.title}**\nYêu cầu bởi: ${currentTrack.requestedBy}`)
      .setColor('#0099ff');

    if (currentTrack.thumbnail) {
      embed.setThumbnail(currentTrack.thumbnail);
    }

    await interaction.reply({ embeds: [embed] });
  },
};
