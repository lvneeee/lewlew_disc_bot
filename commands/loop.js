const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Bật/tắt chế độ lặp lại bài hát hiện tại'),

  async execute(interaction) {
    const guildManager = getGuildManager(interaction.guildId);
    
    // Kiểm tra xem người dùng có trong voice channel không
    if (!interaction.member.voice.channel) {
      logger.warn(`[LOOP] User ${interaction.user.tag} tried to toggle loop without joining a voice channel.`);
      return interaction.reply('❗ Bạn phải vào voice channel trước.');
    }

    // Kiểm tra xem có bài hát nào đang phát không
    const currentTrack = guildManager.getCurrentTrack();
    if (!currentTrack) {
      logger.warn(`[LOOP] No track playing when ${interaction.user.tag} tried to toggle loop`);
      return interaction.reply('❗ Không có bài hát nào đang phát.');
    }

    // Chuyển đổi trạng thái loop
    const isNowLooping = guildManager.toggleLoop();
    logger.info(`[LOOP] User ${interaction.user.tag} ${isNowLooping ? 'enabled' : 'disabled'} loop for track: ${currentTrack.title}`);
    
    // Phản hồi với trạng thái mới
    await interaction.reply(
      isNowLooping
        ? '🔁 Đã bật chế độ lặp lại. Bài hát hiện tại sẽ được phát lại liên tục.'
        : '➡️ Đã tắt chế độ lặp lại.'
    );
  },
};
