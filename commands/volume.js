const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Điều chỉnh âm lượng')
    .addNumberOption(option =>
      option
        .setName('level')
        .setDescription('Mức âm lượng (0.0 đến 2.0)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(2)
    ),

  async execute(interaction) {
    const volume = interaction.options.getNumber('level');
    const guildManager = getGuildManager(interaction.guildId);
    const player = guildManager.getPlayer();
    if (!player || !guildManager.getCurrentTrack()) {
      return interaction.reply('❗ Không thể chỉnh volume vì chưa có nhạc nào đang phát.');
    }
    guildManager.setVolume(volume);
    if (player.state.resource && player.state.resource.volume) {
      player.state.resource.volume.setVolume(volume);
    }
    logger.info(`[VOLUME] Volume set to ${volume} in guild ${interaction.guildId} by ${interaction.user.tag}`);
    interaction.reply(`🔊 Đã chỉnh âm lượng về **${volume * 100}%**`);
  },
};
