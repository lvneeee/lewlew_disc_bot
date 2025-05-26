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

    // Đăng ký sự kiện idle để tự động phát tiếp bài tiếp theo
    this.player.on(AudioPlayerStatus.Idle, async () => {
      try {
        await this.playNext(this.lastInteraction);
      } catch (e) {}
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
    connection.subscribe(this.player);
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
    const track = this.dequeue();
    if (!track) {
      this.clearConnection();
      if (interaction) {
        await interaction.editReply('Hết bài hát trong hàng đợi!');
      }
      return;
    }
    try {
      this.setCurrentTrack(track);
      // Chỉ còn phát YouTube (và các nguồn hợp pháp khác nếu có)
      const { getAudioStream } = require('../utils/ytdlp');
      const stream = await getAudioStream(track.url);
      const { createAudioResource, StreamType } = require('@discordjs/voice');
      const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });
      resource.volume.setVolume(this.getVolume());
      const player = this.getPlayer();
      player.play(resource);
      if (interaction) {
        await interaction.editReply(`🎵 Đang phát: **${track.title}**`);
      }
    } catch (error) {
      const logger = require('./logger');
      logger.error('Error playing next track: ' + error);
      if (interaction) {
        await interaction.editReply('Có lỗi xảy ra khi phát nhạc!');
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
