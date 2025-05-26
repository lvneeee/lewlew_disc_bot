const { createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');

class GuildAudioManager {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = [];
    this.currentTrack = null;
    this.player = createAudioPlayer();
    this.connection = null;
    this.volume = 1;
    this.lastInteraction = null;
    this.connectAttempts = 0;
    this.maxConnectAttempts = 5;
    this.connectionTimeout = null;

    // Đăng ký sự kiện idle để tự động phát tiếp bài tiếp theo
    this.player.on(AudioPlayerStatus.Idle, async () => {
      try {
        await this.playNext(this.lastInteraction);
      } catch (e) {}
    });
    // Đăng ký log lỗi cho player
    this.player.on('error', (error) => {
      const logger = require('./logger');
      logger.error(`[AUDIO PLAYER ERROR] ${error && error.stack ? error.stack : error}`);
    });
  }

  enqueue(track) {
    this.queue.push(track);
  }

  dequeue() {
    return this.queue.shift() || null;
  }

  clear() {
    this.queue = [];
    this.currentTrack = null;
    this.connectAttempts = 0;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  removeAt(index) {
    if (index >= 0 && index < this.queue.length) {
      return this.queue.splice(index, 1)[0];
    }
    return null;
  }

  getQueue() {
    return [...this.queue];
  }

  setCurrentTrack(track) {
    this.currentTrack = track;
  }

  getCurrentTrack() {
    return this.currentTrack;
  }

  setConnection(connection) {
    this.connection = connection;
    this.connectAttempts = 0; // Reset số lần thử khi có kết nối mới
    connection.subscribe(this.player);
    
    // Đăng ký log lỗi và xử lý reconnect cho connection
    if (connection) {
      connection.on('error', (error) => {
        const logger = require('./logger');
        logger.error(`[VOICE CONNECTION ERROR] ${error && error.stack ? error.stack : error}`);
      });

      // Handle disconnection events
      connection.on('stateChange', async (oldState, newState) => {
        const logger = require('./logger');
        logger.info(`Connection state changed from ${oldState.status} to ${newState.status}`);
        
        // Theo dõi số lần thử kết nối
        if (newState.status === 'connecting') {
          this.connectAttempts++;
          logger.info(`[Queue] Đang thử kết nối lần ${this.connectAttempts}/${this.maxConnectAttempts}`);
          
          // Tăng thời gian chờ theo cấp số nhân
          const timeout = Math.min(1000 * Math.pow(2, this.connectAttempts - 1), 10000);
          this.connectionTimeout = setTimeout(() => {
            if (newState.status === 'connecting') {
              logger.warn('[Queue] Kết nối bị timeout, đang thử lại...');
              connection.rejoin();
            }
          }, timeout);
        }
        
        // Reset bộ đếm khi kết nối thành công
        if (newState.status === 'ready') {
          logger.info('[Queue] Kết nối voice đã sẵn sàng');
          this.connectAttempts = 0;
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
        }
        
        // Xử lý ngắt kết nối
        if (newState.status === 'disconnected') {
          logger.warn('[Queue] Kết nối voice bị ngắt');
          
          if (this.connectAttempts < this.maxConnectAttempts) {
            logger.info('[Queue] Đang thử kết nối lại...');
            try {
              newState.rejoin();
            } catch (error) {
              logger.error(`[Queue] Không thể kết nối lại: ${error}`);
            }
          } else {
            logger.error('[Queue] Đã vượt quá số lần thử kết nối tối đa, hủy kết nối');
            this.clearConnection();
            this.connectAttempts = 0;
          }
        }

        // Xử lý trạng thái đã hủy
        if (newState.status === 'destroyed') {
          logger.info('[Queue] Kết nối voice đã bị hủy, đang dọn dẹp');
          this.clear();
        }
      });
    }
  }

  getConnection() {
    return this.connection;
  }

  clearConnection() {
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
  }

  getPlayer() {
    return this.player;
  }

  setVolume(value) {
    this.volume = value;
    if (this.player.state.resource && this.player.state.resource.volume) {
      this.player.state.resource.volume.setVolume(value);
    }
  }

  getVolume() {
    return this.volume;
  }

  setLastInteraction(interaction) {
    this.lastInteraction = interaction;
  }

  async playNext(interaction) {
    const logger = require('./logger');
    logger.info(`[QUEUE] Current queue length: ${this.queue.length}`);
    
    const track = this.dequeue();
    if (!track) {
      logger.info('[QUEUE] No track found in queue');
      if (interaction) {
        await interaction.editReply('Hết bài hát trong hàng đợi!');
      }
      // Add a delay before disconnecting
      setTimeout(() => {
        if (this.queue.length === 0 && !this.currentTrack) {
          logger.info('[QUEUE] Queue empty and no current track, clearing connection');
          this.clearConnection();
        }
      }, 5000);
      return;
    }
    
    logger.info(`[QUEUE] Starting playback of track: ${track.title} (${track.url})`);
    try {
      this.setCurrentTrack(track);
      // Chỉ còn phát YouTube (và các nguồn hợp pháp khác nếu có)
      const { getAudioStream } = require('../utils/ytdlp');
      logger.info(`[YTDLP] Fetching audio stream for: ${track.url}`);
      const stream = await getAudioStream(track.url);
      
      if (!stream) {
        logger.error('[YTDLP] Failed to get audio stream - stream is null');
        throw new Error('Failed to get audio stream');
      }
      
      const { createAudioResource, StreamType } = require('@discordjs/voice');
      const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });
      
      if (!resource) {
        logger.error('[PLAYER] Failed to create audio resource');
        throw new Error('Failed to create audio resource');
      }
      
      resource.volume.setVolume(this.getVolume());
      const player = this.getPlayer();
      
      // Kiểm tra trạng thái player trước khi phát
      logger.info(`[PLAYER] Current player status: ${player.state.status}`);
      
      player.play(resource);
      logger.info(`[PLAYER] Started playing: ${track.title}`);
      
      if (interaction) {
        await interaction.editReply(`🎵 Đang phát: **${track.title}**`);
      }
    } catch (error) {
      logger.error(`[ERROR] Error playing next track: ${error.stack || error}`);
      logger.error(`[ERROR] Track info: ${JSON.stringify(track)}`);
      if (interaction) {
        await interaction.editReply('Có lỗi xảy ra khi phát nhạc!\n' + (error && error.message ? error.message : error));
      }
      await this.playNext(interaction);
    }
  }
}

const guildManagers = new Map();

function getGuildManager(guildId) {
  if (!guildManagers.has(guildId)) {
    guildManagers.set(guildId, new GuildAudioManager(guildId));
  }
  return guildManagers.get(guildId);
}

module.exports = {
  getGuildManager
};
