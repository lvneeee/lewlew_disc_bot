const { AudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const logger = require('./logger');

const players = new Map();
const connections = new Map();
const disconnectTimeouts = new Map();

function createPlayer(guildId, onIdleCallback) {
  if (players.has(guildId)) {
    logger.info(`[PLAYER] Reusing existing player for guild ${guildId}`);
    return players.get(guildId);
  }

  const player = new AudioPlayer();
  logger.info(`[PLAYER] Created new player for guild ${guildId}`);

  // Log all player state changes
  player.on('stateChange', (oldState, newState) => {
    logger.info(`[PLAYER] State changed from ${oldState.status} to ${newState.status} in guild ${guildId}`);
    
    if (oldState.status !== newState.status) {
      switch (newState.status) {
        case AudioPlayerStatus.Playing:
          logger.info(`[PLAYER] Started playing in guild ${guildId}`);
          break;
        case AudioPlayerStatus.Paused:
          logger.info(`[PLAYER] Paused in guild ${guildId}`);
          break;
        case AudioPlayerStatus.Idle:
          logger.info(`[PLAYER] Became idle in guild ${guildId}`);
          break;
        case AudioPlayerStatus.Buffering:
          logger.info(`[PLAYER] Buffering in guild ${guildId}`);
          break;
      }
    }
  });

  // Register error handler
  player.on('error', error => {
    logger.error(`[PLAYER] Error in guild ${guildId}: ${error.message}`);
  });

  if (onIdleCallback) {
    player.on(AudioPlayerStatus.Idle, () => {
      logger.info(`[PLAYER] Triggering idle callback for guild ${guildId}`);
      onIdleCallback(guildId);
    });
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
