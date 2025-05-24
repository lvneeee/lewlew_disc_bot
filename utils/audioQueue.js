const { createAudioPlayer } = require('@discordjs/voice');

class GuildAudioManager {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = [];
    this.currentTrack = null;
    this.player = createAudioPlayer();
    this.connection = null;
    this.volume = 1;
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
