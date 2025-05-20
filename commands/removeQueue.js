const { removeFromQueue, getQueue } = require('../utils/audioQueue');

module.exports = {
  name: 'remove',
  description: 'Xoá một bài khỏi hàng đợi theo vị trí (bắt đầu từ 1)',
  async execute(message, args) {
    const guildId = message.guild.id;

    if (!args[0] || isNaN(args[0])) {
      return message.reply('⚠️ Vui lòng cung cấp vị trí bài muốn xoá. Ví dụ: `!remove 2`');
    }

    const index = parseInt(args[0], 10) - 1; // người dùng nhập từ 1, nhưng index bắt đầu từ 0
    const queue = getQueue(guildId);

    if (queue.length === 0) {
      return message.reply('📭 Hàng đợi đang trống.');
    }

    if (index < 0 || index >= queue.length) {
      return message.reply(`❌ Vị trí không hợp lệ. Hàng đợi hiện có ${queue.length} bài.`);
    }

    const removed = queue[index];
    const success = removeFromQueue(guildId, index);

    if (success) {
      return message.reply(`🗑️ Đã xoá **${removed.title}** khỏi hàng đợi.`);
    } else {
      return message.reply('❌ Không thể xoá bài đó.');
    }
  }
};
