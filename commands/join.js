const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Bot vào voice channel hiện tại.'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply('❗ Bạn phải vào voice channel trước.');
        }
        const guildManager = getGuildManager(interaction.guildId);
        let connection = guildManager.getConnection();
        if (!connection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false, // Đảm bảo bot không bị deaf (tùy nhu cầu)
                selfMute: false
            });
            guildManager.setConnection(connection);
            // Lưu connection vào voiceChannel object để debug
            voiceChannel._lastBotConnection = connection;
            logger.info(`[JOIN] Bot joined voice channel ${voiceChannel.id} in guild ${interaction.guildId}`);
            return interaction.reply('✅ Bot đã vào voice channel!');
        } else {
            // Nếu đã có connection, kiểm tra xem connection còn hoạt động không
            if (connection.state.status === 'destroyed') {
                guildManager.setConnection(null);
                return interaction.reply('Bot đã bị disconnect trước đó, hãy dùng lại lệnh /join.');
            }
            return interaction.reply('Bot đã ở trong voice channel!');
        }
    },
};
