const { SlashCommandBuilder } = require('discord.js');
const { resolveSpotifyTrackToYoutube, resolveSpotifyPlaylistToYoutube } = require('../utils/musicSource');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spotify')
    .setDescription('Phát nhạc từ link Spotify')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('Spotify track URL')
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const url = interaction.options.getString('url');
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.editReply('❗ Bạn phải vào voice channel trước.');
    }
    const guildManager = getGuildManager(interaction.guildId);
    guildManager.setLastInteraction(interaction);
    let connection = guildManager.getConnection();
    if (!connection) {
      const { joinVoiceChannel } = require('@discordjs/voice');
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      guildManager.setConnection(connection);
    }
    // Kiểm tra là playlist hay track
    let tracks = [];
    if (url.includes('playlist/')) {
      tracks = await resolveSpotifyPlaylistToYoutube(url);
    } else {
      tracks = await resolveSpotifyTrackToYoutube(url);
    }
    if (!tracks.length) {
      return interaction.editReply('❌ Không lấy được thông tin bài hát từ Spotify. Nếu là playlist, chỉ hỗ trợ tối đa 20 bài đầu tiên.');
    }
    tracks.forEach(track => guildManager.enqueue(track));
    const player = guildManager.getPlayer();
    if (player.state.status !== 'playing' && player.state.status !== 'paused') {
      await guildManager.playNext(interaction);
    } else {
      await interaction.editReply(`✅ Đã thêm vào hàng đợi: **${tracks[0].title}**`);
    }
    logger.info(`[SPOTIFY] User ${interaction.user.tag} added Spotify track(s) to queue in guild ${interaction.guildId}: ${tracks[0].title}`);
  },
};
