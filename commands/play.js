const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioResource } = require('@discordjs/voice');
const { getAudioStream, getVideoInfo, getPlaylistVideos } = require('../utils/ytdlp');
const { getGuildManager } = require('../utils/audioQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Phát nhạc từ YouTube')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Link YouTube hoặc tên bài hát')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const guildManager = getGuildManager(guildId);

    await interaction.deferReply();

    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply('Bạn cần vào voice channel trước!');
    }

    try {
      let title;
      let url;

      if (query.startsWith('http')) {
        // Xử lý playlist
        if (query.includes('playlist')) {
          const videos = await getPlaylistVideos(query);
          if (!videos || videos.length === 0) {
            return interaction.editReply('Không tìm thấy video nào trong playlist!');
          }

          for (const video of videos) {
            guildManager.enqueue({
              url: video.url,
              title: video.title,
              requestedBy: interaction.user.tag
            });
          }

          await interaction.editReply(
            `Đã thêm ${videos.length} bài hát vào hàng đợi!`
          );

          if (!guildManager.getCurrentTrack()) {
            await playNext(interaction, guildManager);
          }
          return;
        }

        // Link trực tiếp
        title = await getVideoInfo(query);
        url = query;
      } else {
        // Search query
        const videos = await getPlaylistVideos('ytsearch1:' + query);
        if (!videos || videos.length === 0) {
          return interaction.editReply('Không tìm thấy video!');
        }
        title = videos[0].title;
        url = videos[0].url;
      }

      // Kiểm tra connection hiện tại
      let connection = guildManager.getConnection();
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        guildManager.setConnection(connection);
      }

      // Thêm vào queue
      guildManager.enqueue({
        url,
        title,
        requestedBy: interaction.user.tag
      });

      // Nếu không có bài hát nào đang phát, phát bài hát mới
      if (!guildManager.getCurrentTrack()) {
        await playNext(interaction, guildManager);
      } else {
        await interaction.editReply(
          `Đã thêm vào hàng đợi: **${title}**`
        );
      }

    } catch (error) {
      console.error('Error in play command:', error);
      await interaction.editReply('Có lỗi xảy ra khi phát nhạc!');
    }
  },
};

async function playNext(interaction, guildManager) {
  const track = guildManager.dequeue();
  if (!track) {
    guildManager.clearConnection();
    return interaction.editReply('Hết bài hát trong hàng đợi!');
  }

  try {
    guildManager.setCurrentTrack(track);
    const stream = await getAudioStream(track.url);
    const resource = createAudioResource(stream, {
      inputType: 'opus',
      inlineVolume: true
    });

    const player = guildManager.getPlayer();
    resource.volume.setVolume(guildManager.getVolume());
    player.play(resource);

    await interaction.editReply(
      `🎵 Đang phát: **${track.title}**`
    );

  } catch (error) {
    console.error('Error playing next track:', error);
    await interaction.editReply('Có lỗi xảy ra khi phát nhạc!');
    // Try to play next song
    await playNext(interaction, guildManager);
  }
}
