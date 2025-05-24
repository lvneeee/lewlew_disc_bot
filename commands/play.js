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

const {
  enqueue,
  dequeue,
  setCurrentTrack,
  getQueue,
} = require('../utils/audioQueue');

const {
  createPlayer,
  getPlayer,
  setConnection,
  getConnection,
  clearConnection,
  setDisconnectTimeout,
  clearDisconnectTimeout,
  clearPlayer,
  AudioPlayerStatus,
} = require('../utils/audioPlayer');

const { setVolumeTransformer } = require('../utils/volumeControl');
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

    let connection = getConnection(interaction.guildId);
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      setConnection(interaction.guildId, connection);
    }

    // Hàm phát bài tiếp theo, truyền guildId để tái sử dụng
    const playNext = async (guildId) => {
      clearDisconnectTimeout(guildId);

      const next = dequeue(guildId);
      if (!next) {
        // Queue trống, đợi 2 phút rồi disconnect
        setDisconnectTimeout(
          guildId,
          () => {
            const conn = getConnection(guildId);
            if (conn) {
              conn.destroy();
              clearConnection(guildId);
              clearPlayer(guildId);
            }
          },
          2 * 60 * 1000
        );
        setCurrentTrack(guildId, null);
        return;
      }

      try {
        const stream = await getAudioStream(next.url);

        const ffmpeg = spawn(ffmpegPath, [
          '-i', 'pipe:0',
          '-f', 's16le',
          '-ar', '48000',
          '-ac', '2',
          'pipe:1',
        ], { stdio: ['pipe', 'pipe', 'ignore'] });

        stream.pipe(ffmpeg.stdin);

        const volumeTransformer = new prism.VolumeTransformer({ type: 's16le', volume: 1 });
        ffmpeg.stdout.pipe(volumeTransformer);
        
        // Lưu volumeTransformer để có thể điều chỉnh âm lượng sau này
        setVolumeTransformer(guildId, volumeTransformer);

        const resource = createAudioResource(volumeTransformer, {
          inputType: StreamType.Raw,
        });

        setCurrentTrack(guildId, next);
        const player = getPlayer(guildId);
        player.play(resource);

        // Chỉ gửi thông báo nếu không phải bài đầu tiên
        if (player.state.status === AudioPlayerStatus.Playing) {
          interaction.channel.send(`🎶 Đang phát: **${next.title}**`);
        }
      } catch (error) {
        logger.error('Error playing next track: ' + error);
        await interaction.editReply('Có lỗi xảy ra khi phát nhạc!');
        await playNext(interaction, guildManager);
      }
    };

    let player = getPlayer(interaction.guildId);
    if (!player) {
      player = createPlayer(interaction.guildId, playNext);
      connection.subscribe(player);
    }

    // Nếu player đang paused thì resume (unpause)
    if (player.state.status === AudioPlayerStatus.Paused) {
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

        videos.forEach(video => enqueue(interaction.guildId, video));
        await interaction.editReply(`✅ Đã thêm ${videos.length} bài từ playlist vào hàng đợi.`);

        if (
          player.state.status !== AudioPlayerStatus.Playing &&
          player.state.status !== AudioPlayerStatus.Paused
        ) {
          await playNext(interaction.guildId);
        }
      } catch (err) {
        console.error(err);
        await interaction.editReply('❌ Lỗi khi lấy playlist.');
      }
    } else {
      try {
        let title = url;
        try {
          title = await getVideoInfo(url);
        } catch (e) {
          console.warn('Không lấy được tiêu đề video:', e.message);
        }
        enqueue(interaction.guildId, { url, title });

        if (
          player.state.status !== AudioPlayerStatus.Playing &&
          player.state.status !== AudioPlayerStatus.Paused
        ) {          const message = `✅ Đã thêm vào hàng đợi và bắt đầu phát: **${title}**`;
          if (isFromSearch) {
            await interaction.followUp(message);
          } else {
            await interaction.editReply(message);
          }
          await playNext(interaction.guildId);
        } else {
          const message = `✅ Đã thêm vào hàng đợi: **${title}**`;
          if (isFromSearch) {
            await interaction.followUp(message);
          } else {
            await interaction.editReply(message);
          }
        }
      } catch (error) {
        logger.error('Error in play command: ' + error);
        await interaction.editReply('Có lỗi xảy ra khi phát nhạc!');
      }
    }
  },
};
