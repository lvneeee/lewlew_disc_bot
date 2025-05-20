const { getQueue, getCurrentTrack } = require('../utils/audioQueue');

module.exports = {
  name: 'queue',
  async execute(message) {
    const guildId = message.guild.id;
    const current = getCurrentTrack(guildId);
    const queue = getQueue(guildId);

    if (!current && queue.length === 0) {
      return message.reply('📭 Không có bài hát nào trong hàng đợi.');
    }

    let reply = '';

    if (current) {
      reply += `🎶 Đang phát: **${current.title}**\n\n`;
    }

    if (queue.length > 0) {
      reply += `📜 Hàng đợi:\n`;
      queue.slice(0, 20).forEach((track, index) => {
        reply += `\`${index + 1}.\` ${track.title}\n`;
      });

      if (queue.length > 20) {
        reply += `\n...và ${queue.length - 20} bài nữa.`;
      }
    }

    message.reply(reply);
  },
};
