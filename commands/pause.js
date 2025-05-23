const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { getPlayer } = require('../utils/audioPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Tạm dừng phát nhạc'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);

    if (!player || player.state.status !== AudioPlayerStatus.Playing) {
      return interaction.reply('❗ Không có nhạc nào đang phát để tạm dừng.');
    }

    const success = player.pause();
    if (success) {
      interaction.reply('⏸️ Đã tạm dừng phát nhạc.');
    } else {
      interaction.reply('⚠️ Không thể tạm dừng.');
    }
  },
};
