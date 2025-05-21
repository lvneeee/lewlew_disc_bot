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
  AudioPlayerStatus,
} = require('../utils/audioPlayer');

module.exports = {
  name: 'play',
  async execute(message, args) {
    const url = args[0];
    if (!url) return message.reply('❗ Hãy cung cấp URL YouTube!');
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('❗ Bạn phải vào voice channel trước.');

    let connection = getConnection(message.guild.id);
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });
      setConnection(message.guild.id, connection);
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
              // Thêm dòng này để xóa player khi disconnect
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

        const resource = createAudioResource(volumeTransformer, {
          inputType: StreamType.Raw,
        });

        setCurrentTrack(guildId, next);
        const player = getPlayer(guildId);
        player.play(resource);

        const textChannel = message.channel;
        if (textChannel) {
          textChannel.send(`🎶 Đang phát: **${next.title}**`);
        }
      } catch (err) {
        console.error('Lỗi phát bài:', err);
        const textChannel = message.channel;
        if (textChannel) {
          textChannel.send(`❌ Không thể phát bài: ${next.title || next.url}`);
        }
        playNext(guildId); // tiếp tục bài tiếp theo nếu lỗi
      }
    };

    let player = getPlayer(message.guild.id);
    if (!player) {
      // Tạo player mới với callback playNext
      player = createPlayer(message.guild.id, playNext);
      connection.subscribe(player);
    }

    // Nếu player đang paused thì resume (unpause)
    if (player.state.status === AudioPlayerStatus.Paused) {
      player.unpause();
      return message.reply('▶️ Tiếp tục phát nhạc.');
    }

    const isPlaylist = url.includes('list=');

    if (isPlaylist) {
      try {
        const videos = await getPlaylistVideos(url);
        if (videos.length === 0) return message.reply('❌ Không tìm thấy video trong playlist.');

        videos.forEach(video => enqueue(message.guild.id, video));
        message.reply(`✅ Đã thêm ${videos.length} bài từ playlist vào hàng đợi.`);

        if (
          player.state.status !== AudioPlayerStatus.Playing &&
          player.state.status !== AudioPlayerStatus.Paused
        ) {
          await playNext(message.guild.id);
        }
      } catch (err) {
        console.error(err);
        message.reply('❌ Lỗi khi lấy playlist.');
      }
    } else {
      try {
        let title = url;
        try {
          title = await getVideoInfo(url);
        } catch (e) {
          console.warn('Không lấy được tiêu đề video:', e.message);
        }
        enqueue(message.guild.id, { url, title });

        if (
          player.state.status !== AudioPlayerStatus.Playing &&
          player.state.status !== AudioPlayerStatus.Paused
        ) {
          await playNext(message.guild.id);
        } else {
          message.reply(`✅ Đã thêm vào hàng đợi: **${title}**`);
        }
      } catch (err) {
        console.error(err);
        message.reply('❌ Lỗi khi thêm bài hát.');
      }
    }
  },
};
