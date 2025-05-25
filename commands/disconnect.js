const { SlashCommandBuilder } = require('discord.js');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Bot rời khỏi voice channel.'),
    async execute(interaction) {
        const guildManager = getGuildManager(interaction.guildId);
        const connection = guildManager.getConnection();
        // Nếu connection đã bị destroy (do lỗi hoặc disconnect thủ công), reset lại
        if (connection && connection.state.status === 'destroyed') {
            guildManager.setConnection(null);
        }
        if (guildManager.getConnection()) {
            guildManager.clear(); // Xóa hàng đợi và currentTrack
            guildManager.clearConnection();
            logger.info(`[DISCONNECT] Bot disconnected from voice channel in guild ${interaction.guildId}`);
            return interaction.reply('✅ Bot đã rời khỏi voice channel và xóa hàng đợi!');
        } else {
            return interaction.reply('Bot không ở trong voice channel nào!');
        }
    },
};
