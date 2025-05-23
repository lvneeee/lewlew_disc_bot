const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { getPlayer } = require('../utils/audioPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Tiếp tục phát nhạc'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);

    if (!player || player.state.status !== AudioPlayerStatus.Paused) {
      return interaction.reply('❗ Không có nhạc nào đang tạm dừng để tiếp tục.');
    }

    const success = player.unpause();
    if (success) {
      interaction.reply('▶️ Đã tiếp tục phát nhạc.');
    } else {
      interaction.reply('⚠️ Không thể tiếp tục phát.');
    }
  },
};
