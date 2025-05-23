const { AudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');

const players = new Map();
const connections = new Map();
const disconnectTimeouts = new Map();

function createPlayer(guildId, onIdleCallback) {
  if (players.has(guildId)) return players.get(guildId);

  const player = new AudioPlayer();

  if (onIdleCallback) {
    player.on(AudioPlayerStatus.Idle, () => onIdleCallback(guildId));
  }

  players.set(guildId, player);
  return player;
}

function getPlayer(guildId) {
  return players.get(guildId);
}

function setConnection(guildId, connection) {
  connections.set(guildId, connection);
}

function getConnection(guildId) {
  return connections.get(guildId);
}

function clearConnection(guildId) {
  connections.delete(guildId);
}

function setDisconnectTimeout(guildId, fn, delay) {
  if (disconnectTimeouts.has(guildId)) {
    clearTimeout(disconnectTimeouts.get(guildId));
  }
  const timeout = setTimeout(fn, delay);
  disconnectTimeouts.set(guildId, timeout);
}

function clearDisconnectTimeout(guildId) {
  if (disconnectTimeouts.has(guildId)) {
    clearTimeout(disconnectTimeouts.get(guildId));
    disconnectTimeouts.delete(guildId);
  }
}

function clearPlayer(guildId) {
  if (players.has(guildId)) {
    players.delete(guildId);
  }
}

module.exports = {
  createPlayer,
  getPlayer,
  setConnection,
  getConnection,
  clearConnection,
  setDisconnectTimeout,
  clearDisconnectTimeout,
  clearPlayer,
  AudioPlayerStatus,
};
