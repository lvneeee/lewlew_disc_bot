const { SlashCommandBuilder } = require('discord.js');
const { resolveSoundCloudToYoutubeOrStream } = require('../utils/musicSource');
const { getGuildManager } = require('../utils/audioQueue');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soundcloud')
    .setDescription('Phát nhạc từ link SoundCloud')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('SoundCloud track URL')
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const url = interaction.options.getString('url');
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.editReply('❗ Bạn phải vào voice channel trước.');
    }
    const guildManager = getGuildManager(interaction.guildId);
    guildManager.setLastInteraction(interaction);
    let connection = guildManager.getConnection();
    if (!connection) {
      const { joinVoiceChannel } = require('@discordjs/voice');
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      guildManager.setConnection(connection);
    }
    // Lấy thông tin bài hát từ SoundCloud
    const clientId = process.env.SOUNDCLOUD_CLIENT_ID || '';
    const tracks = await resolveSoundCloudToYoutubeOrStream(url, clientId);
    if (!tracks.length) {
      return interaction.editReply('❌ Không lấy được thông tin bài hát từ SoundCloud.');
    }
    tracks.forEach(track => guildManager.enqueue(track));
    const player = guildManager.getPlayer();
    if (player.state.status !== 'playing' && player.state.status !== 'paused') {
      await guildManager.playNext(interaction);
    } else {
      await interaction.editReply(`✅ Đã thêm vào hàng đợi: **${tracks[0].title}**`);
    }
    logger.info(`[SOUNDCLOUD] User ${interaction.user.tag} added SoundCloud track to queue in guild ${interaction.guildId}: ${tracks[0].title}`);
  },
};
