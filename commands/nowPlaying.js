const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCurrentTrack } = require('../utils/audioQueue');
const { getPlayer, AudioPlayerStatus } = require('../utils/audioPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Hiển thị thông tin bài hát đang phát'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);
    const currentTrack = getCurrentTrack(interaction.guildId);

    if (!player || !currentTrack || player.state.status === AudioPlayerStatus.Idle) {
      return interaction.reply('❗ Không có bài hát nào đang phát.');
    }

    const embed = new EmbedBuilder()
      .setTitle('🎵 Đang phát')
      .setDescription(`**${currentTrack.title}**`)
      .setColor('#0099ff')
      .setURL(currentTrack.url);

    interaction.reply({ embeds: [embed] });
  },
};
