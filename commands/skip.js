const { getPlayer } = require('../utils/audioPlayer');
const { getQueue } = require('../utils/audioQueue');

module.exports = {
  name: 'skip',
  async execute(message) {
    const player = getPlayer(message.guild.id);
    const queue = getQueue(message.guild.id);
    if (!queue || queue.length === 0) {
      return message.reply('❌ Không có bài nào trong hàng đợi.');
    }

    player.stop(); // dừng bài hiện tại, sẽ kích hoạt event 'Idle' và phát bài kế tiếp

    message.reply('⏭️ Đã bỏ qua bài hiện tại.');
  },
};
