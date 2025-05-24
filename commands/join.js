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
            });
            guildManager.setConnection(connection);
            logger.info(`[JOIN] Bot joined voice channel ${voiceChannel.id} in guild ${interaction.guildId}`);
            return interaction.reply('✅ Bot đã vào voice channel!');
        } else {
            return interaction.reply('Bot đã ở trong voice channel!');
        }
    },
};
