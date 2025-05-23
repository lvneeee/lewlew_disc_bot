const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Dừng phát nhạc và xóa hàng đợi'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    
    if (!interaction.member.voice.channel) {
      return interaction.reply('Bạn cần vào voice channel trước!');
    }

    guildManager.clear();
    guildManager.setCurrentTrack(null);
    guildManager.getPlayer().stop();
    guildManager.clearConnection();

    await interaction.reply('Đã dừng phát nhạc và xóa hàng đợi!');
  },
};
