const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Điều chỉnh âm lượng')
    .addIntegerOption(option =>
      option
        .setName('level')
        .setDescription('Mức âm lượng (0-200)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(200)
    ),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    
    if (!interaction.member.voice.channel) {
      return interaction.reply('Bạn cần vào voice channel trước!');
    }

    const volume = interaction.options.getInteger('level');
    const normalizedVolume = volume / 100;

    guildManager.setVolume(normalizedVolume);
    await interaction.reply(`🔊 Đã đặt âm lượng: ${volume}%`);
  },
};
