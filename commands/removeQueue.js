const { SlashCommandBuilder } = require('discord.js');
const { removeFromQueue, getQueue } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Xóa một bài hát khỏi hàng đợi')
    .addIntegerOption(option =>
      option
        .setName('position')
        .setDescription('Vị trí bài hát trong hàng đợi (1, 2, 3,...)')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const position = interaction.options.getInteger('position') - 1; // Chuyển về index 0-based
    const queue = getQueue(interaction.guildId);

    if (queue.length === 0) {
      return interaction.reply('❗ Hàng đợi đang trống.');
    }

    if (position >= queue.length) {
      return interaction.reply(`❗ Chỉ có ${queue.length} bài trong hàng đợi.`);
    }

    const removedTrack = queue[position];
    const success = removeFromQueue(interaction.guildId, position);

    if (success) {
      interaction.reply(`✅ Đã xóa bài **${removedTrack.title}** khỏi hàng đợi.`);
    } else {
      interaction.reply('❌ Không thể xóa bài hát.');
    }
  },
};
