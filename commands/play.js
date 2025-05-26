const { SlashCommandBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioResource,
  StreamType,
} = require('@discordjs/voice');
const logger = require('../utils/logger');
const { resolveYoutubeFromUrlOrQuery } = require('../utils/musicSource');
const { getGuildManager } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Phát nhạc từ YouTube')
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('URL của video hoặc playlist YouTube')
        .setRequired(true)
    ),
  async execute(interaction, isFromSearch = false, directUrl = null) {
    // Only defer if this is a direct command, not from search
    if (!isFromSearch) {
      await interaction.deferReply();
    }

    const url = directUrl || interaction.options.getString('url');
    const voiceChannel = interaction.member.voice.channel;
    
    logger.info(`[PLAY] Processing play command for URL: ${url}`);
    
    if (!voiceChannel) {
      logger.warn(`[PLAY] User ${interaction.user.tag} tried to play without joining a voice channel`);
      return isFromSearch 
        ? interaction.followUp('❗ Bạn phải vào voice channel trước.')
        : interaction.editReply('❗ Bạn phải vào voice channel trước.');
    }

    const guildId = interaction.guildId;
    const guildManager = getGuildManager(guildId);
    guildManager.setLastInteraction(interaction);

    // Kiểm tra và thiết lập kết nối
    let connection = guildManager.getConnection();
    if (!connection) {
      logger.info(`[PLAY] Creating new voice connection in guild ${guildId}`);
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      guildManager.setConnection(connection);
    }

    let player = guildManager.getPlayer();
    logger.info(`[PLAY] Current player status: ${player.state.status}`);

    // Nếu player đang paused thì resume
    if (player.state.status === 'paused') {
      logger.info(`[PLAY] Resuming paused player in guild ${guildId}`);
      player.unpause();
      return interaction.editReply('▶️ Tiếp tục phát nhạc.');
    }

    // Xử lý nguồn nhạc
    try {
      logger.info(`[PLAY] Resolving tracks from input: ${url}`);
      const tracks = await resolveYoutubeFromUrlOrQuery(url);
      
      if (!tracks.length) {
        logger.warn(`[PLAY] No tracks found for input: ${url}`);
        return interaction.editReply('❌ Không tìm thấy hoặc không phát được nguồn nhạc.');
      }

      logger.info(`[PLAY] Found ${tracks.length} tracks, adding to queue`);
      tracks.forEach(track => {
        guildManager.enqueue(track);
        logger.info(`[PLAY] Added track to queue: ${track.title}`);
      });

      if (tracks.length > 1) {
        await interaction.editReply(`✅ Đã thêm ${tracks.length} bài vào hàng đợi.`);
        if (player.state.status !== 'playing' && player.state.status !== 'paused') {
          logger.info(`[PLAY] Starting playlist playback in guild ${guildId}`);
          await guildManager.playNext(interaction);
        }
      } else if (player.state.status !== 'playing' && player.state.status !== 'paused') {
        logger.info(`[PLAY] Starting single track playback in guild ${guildId}`);
        await guildManager.playNext(interaction);
      } else {
        await interaction.editReply(`✅ Đã thêm vào hàng đợi: **${tracks[0].title}**`);
      }
    } catch (err) {
      logger.error(`[PLAY] Error in guild ${guildId}: ${err}`);
      await interaction.editReply('❌ Lỗi khi phát nhạc.');
    }
  },
  playNext,
};

async function playNext(interaction, guildManager) {
  const track = guildManager.dequeue();
  if (!track) {
    guildManager.clearConnection();
    return interaction.editReply('Hết bài hát trong hàng đợi!');
  }
  try {
    guildManager.setCurrentTrack(track);
    const stream = await getAudioStream(track.url);
    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true
    });
    resource.volume.setVolume(guildManager.getVolume());
    const player = guildManager.getPlayer();
    player.play(resource);
    await interaction.editReply(`🎵 Đang phát: **${track.title}**`);
  } catch (error) {
    logger.error('Error playing next track: ' + error);
    await interaction.editReply('Có lỗi xảy ra khi phát nhạc!');
    await playNext(interaction, guildManager);
  }
}
