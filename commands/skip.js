const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Bỏ qua bài hát hiện tại'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    
    if (!interaction.member.voice.channel) {
      return interaction.reply('Bạn cần vào voice channel trước!');
    }

    const currentTrack = guildManager.getCurrentTrack();
    if (!currentTrack) {
      return interaction.reply('Không có bài hát nào đang phát!');
    }

    guildManager.getPlayer().stop();
    await interaction.reply(`⏭️ Đã bỏ qua: **${currentTrack.title}**`);
  },
};
