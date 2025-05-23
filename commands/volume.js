const { SlashCommandBuilder } = require('discord.js');
const { getVolumeTransformer, setVolume } = require('../utils/volumeControl');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Điều chỉnh âm lượng')
    .addNumberOption(option =>
      option
        .setName('level')
        .setDescription('Mức âm lượng (0,0 đến 2,0)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(2)
    ),

  async execute(interaction) {
    const volume = interaction.options.getNumber('level');

    const transformer = getVolumeTransformer(interaction.guildId);
    if (!transformer) {
      return interaction.reply('❗ Không thể chỉnh volume vì chưa có nhạc nào đang phát.');
    }

    setVolume(interaction.guildId, volume);
    transformer.setVolume(volume);
    interaction.reply(`🔊 Đã chỉnh âm lượng về **${volume*100}%**`);
  },
};
