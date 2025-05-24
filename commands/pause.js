const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { getPlayer } = require('../utils/audioPlayer');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Tạm dừng phát nhạc'),

  async execute(interaction) {
    const player = getPlayer(interaction.guildId);

    if (!interaction.member.voice.channel) {
      logger.warn(`[PAUSE] User ${interaction.user.tag} tried to pause without joining a voice channel.`);
      return interaction.reply('Bạn cần vào voice channel trước!');
    }

    const currentTrack = player.getCurrentTrack();
    if (!currentTrack) {
      logger.warn(`[PAUSE] No track to pause in guild ${interaction.guildId}`);
      return interaction.reply('Không có bài hát nào đang phát!');
    }

    const success = player.pause();
    if (success) {
      logger.info(`[PAUSE] Music paused in guild ${interaction.guildId} by ${interaction.user.tag}`);
      await interaction.reply('⏸️ Đã tạm dừng phát nhạc');
    } else {
      interaction.reply('⚠️ Không thể tạm dừng.');
    }
  },
};
