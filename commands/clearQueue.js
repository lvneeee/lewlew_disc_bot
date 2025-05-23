const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Xóa toàn bộ hàng đợi'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    
    if (!interaction.member.voice.channel) {
      return interaction.reply('Bạn cần vào voice channel trước!');
    }

    guildManager.clear();
    await interaction.reply('🗑️ Đã xóa toàn bộ hàng đợi!');
  },
};
