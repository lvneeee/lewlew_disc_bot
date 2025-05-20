const transformers = new Map(); // guildId => volumeTransformer

function setVolumeTransformer(guildId, transformer) {
  transformers.set(guildId, transformer);
}

function getVolumeTransformer(guildId) {
  return transformers.get(guildId);
}

function setVolume(guildId, volume) {
  const transformer = transformers.get(guildId);
  if (transformer) transformer.setVolume(volume);
}

module.exports = {
  setVolumeTransformer,
  getVolumeTransformer,
  setVolume,
};
