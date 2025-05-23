const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Xóa một bài hát khỏi hàng đợi')
    .addIntegerOption(option =>
      option
        .setName('position')
        .setDescription('Vị trí bài hát trong hàng đợi')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    
    if (!interaction.member.voice.channel) {
      return interaction.reply('Bạn cần vào voice channel trước!');
    }

    const position = interaction.options.getInteger('position') - 1;
    const queue = guildManager.getQueue();

    if (position >= queue.length) {
      return interaction.reply('Không tìm thấy bài hát ở vị trí này!');
    }

    const removedTrack = guildManager.removeAt(position);
    if (removedTrack) {
      await interaction.reply(`🗑️ Đã xóa: **${removedTrack.title}**`);
    } else {
      await interaction.reply('Không thể xóa bài hát!');
    }
  },
};
