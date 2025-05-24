const { SlashCommandBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioResource,
  StreamType,
} = require('@discordjs/voice');
const prism = require('prism-media');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const {
  getAudioStream,
  getVideoInfo,
  getPlaylistVideos,
} = require('../utils/ytdlp');

const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

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
    
    if (!voiceChannel) {
      return isFromSearch 
        ? interaction.followUp('❗ Bạn phải vào voice channel trước.')
        : interaction.editReply('❗ Bạn phải vào voice channel trước.');
    }

    const guildId = interaction.guildId;
    const guildManager = getGuildManager(guildId);
    guildManager.setLastInteraction(interaction);
    let connection = guildManager.getConnection();
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      guildManager.setConnection(connection);
    }

    let player = guildManager.getPlayer();
    // Nếu player đang paused thì resume (unpause)
    if (player.state.status === 'paused') {
      player.unpause();
      return interaction.editReply('▶️ Tiếp tục phát nhạc.');
    }

    const isPlaylist = url.includes('list=');

    if (isPlaylist) {
      try {
        const videos = await getPlaylistVideos(url);
        if (videos.length === 0) {
          return interaction.editReply('❌ Không tìm thấy video trong playlist.');
        }

        videos.forEach(video => guildManager.enqueue(video));
        await interaction.editReply(`✅ Đã thêm ${videos.length} bài từ playlist vào hàng đợi.`);

        if (player.state.status !== 'playing' && player.state.status !== 'paused') {
          await guildManager.playNext(interaction);
        }
      } catch (err) {
        logger.error('Lỗi khi lấy playlist: ' + err);
        await interaction.editReply('❌ Lỗi khi lấy playlist.');
      }
    } else {
      try {
        let title = url;
        try {
          title = await getVideoInfo(url);
        } catch (e) {
          logger.warn('Không lấy được tiêu đề video: ' + e.message);
        }
        guildManager.enqueue({ url, title });
        if (player.state.status !== 'playing' && player.state.status !== 'paused') {
          await guildManager.playNext(interaction);
        } else {
          await interaction.editReply(`✅ Đã thêm vào hàng đợi: **${title}**`);
        }
      } catch (err) {
        logger.error('Lỗi khi thêm bài hát: ' + err);
        await interaction.editReply('❌ Lỗi khi thêm bài hát.');
      }
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
