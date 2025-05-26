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
    this.connectAttempts = 0; // Khởi tạo biến đếm số lần kết nối

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
        
        // Tăng số lần thử khi trạng thái chuyển sang connecting
        if (newState.status === 'connecting') {
          this.connectAttempts++;
          logger.info(`Attempting to connect... (attempt ${this.connectAttempts})`);
        }
        
        // Reset số lần thử khi kết nối thành công
        if (newState.status === 'ready') {
          logger.info(`Connection established after ${this.connectAttempts} attempts`);
          this.connectAttempts = 0;
        }
        
        if (newState.status === 'disconnected') {
          try {
            // Try to reconnect if we were playing something
            if (this.currentTrack) {
              // Tăng thời gian timeout theo số lần thử
              const timeoutMs = Math.min(15000 * this.connectAttempts, 60000);
              
              await Promise.race([
                connection.rejoin(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error(`Reconnection timeout after ${timeoutMs}ms`)), timeoutMs)
                )
              ]);
              
              logger.info('Successfully reconnected to voice channel');
            }
          } catch (error) {
            logger.error(`Failed to reconnect (attempt ${this.connectAttempts}):`, error);
            if (this.connectAttempts >= 3) { // Sau 3 lần thử
              logger.error('Max reconnection attempts reached, clearing connection');
              this.clearConnection();
              this.connectAttempts = 0;
            }
          }
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
