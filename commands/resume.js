const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Tiếp tục phát nhạc'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    
    if (!interaction.member.voice.channel) {
      return interaction.reply('Bạn cần vào voice channel trước!');
    }

    const currentTrack = guildManager.getCurrentTrack();
    if (!currentTrack) {
      return interaction.reply('Không có bài hát nào đang phát!');
    }

    guildManager.getPlayer().unpause();
    await interaction.reply('▶️ Đã tiếp tục phát nhạc');
  },
};
