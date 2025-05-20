const { getVolumeTransformer, setVolume } = require('../utils/volumeControl');

module.exports = {
  name: 'volume',
  async execute(message, args) {
    const volume = parseFloat(args[0]);
    if (isNaN(volume) || volume < 0 || volume > 2) {
      return message.reply('❗ Vui lòng nhập volume từ 0.0 đến 2.0');
    }

    const transformer = getVolumeTransformer(message.guild.id);
    if (!transformer) {
      return message.reply('❗ Không thể chỉnh volume vì chưa có nhạc nào đang phát.');
    }

    setVolume(message.guild.id, volume);
    transformer.setVolume(volume);
    message.reply(`🔊 Đã chỉnh âm lượng về **${volume * 100}%**`);
  },
};
