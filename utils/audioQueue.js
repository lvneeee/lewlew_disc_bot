const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');

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
    if (this.player.state.resource) {
      this.player.state.resource.volume.setVolume(value);
    }
  }

  getVolume() {
    return this.volume;
  }
}

// Map to store guild-specific audio managers
const guildManagers = new Map();

function getGuildManager(guildId) {
  if (!guildManagers.has(guildId)) {
    guildManagers.set(guildId, new GuildAudioManager(guildId));
  }
  return guildManagers.get(guildId);
}

module.exports = {
  getGuildManager,
  // Export các phương thức helper
  enqueue: (guildId, track) => getGuildManager(guildId).enqueue(track),
  dequeue: (guildId) => getGuildManager(guildId).dequeue(),
  getQueue: (guildId) => getGuildManager(guildId).getQueue(),
  clear: (guildId) => getGuildManager(guildId).clear(),
  removeAt: (guildId, index) => getGuildManager(guildId).removeAt(index),
  getCurrentTrack: (guildId) => getGuildManager(guildId).getCurrentTrack(),
  setCurrentTrack: (guildId, track) => getGuildManager(guildId).setCurrentTrack(track),
  getConnection: (guildId) => getGuildManager(guildId).getConnection(),
  setConnection: (guildId, connection) => getGuildManager(guildId).setConnection(connection),
  clearConnection: (guildId) => getGuildManager(guildId).clearConnection(),
  getPlayer: (guildId) => getGuildManager(guildId).getPlayer(),
  setVolume: (guildId, value) => getGuildManager(guildId).setVolume(value),
  getVolume: (guildId) => getGuildManager(guildId).getVolume()
};
