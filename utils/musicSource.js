// utils/musicSource.js
// Tập trung xử lý các nguồn phát nhạc (YouTube, Spotify)
const { getAudioStream, getVideoInfo, getPlaylistVideos, searchVideos } = require('./ytdlp');
const { getSpotifyTrackInfo, getSpotifyPlaylistTracks } = require('./spotify');
const { getSoundCloudTrackInfo } = require('./soundcloud');
const ytSearch = require('yt-search');

async function resolveYoutubeFromUrlOrQuery(input) {
  // Nếu là link YouTube hoặc playlist
  if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(input)) {
    if (input.includes('list=')) {
      // Playlist
      const videos = await getPlaylistVideos(input);
      return videos.map(v => ({ url: v.url, title: v.title }));
    } else {
      // Video đơn
      const title = await getVideoInfo(input);
      return [{ url: input, title }];
    }
  }
  // Nếu là query (từ Spotify hoặc search)
  const ytResult = await ytSearch(input);
  if (!ytResult.videos.length) return [];
  return [{ url: ytResult.videos[0].url, title: ytResult.videos[0].title }];
}

async function resolveSpotifyTrackToYoutube(url) {
  const searchQuery = await getSpotifyTrackInfo(url);
  if (!searchQuery) return [];
  return await resolveYoutubeFromUrlOrQuery(searchQuery);
}

async function resolveSpotifyPlaylistToYoutube(url) {
  // Lấy tối đa 20 bài đầu tiên
  const queries = await getSpotifyPlaylistTracks(url, 20);
  if (!queries.length) return [];
  // Tìm YouTube song song cho các bài
  const results = await Promise.all(queries.map(q => resolveYoutubeFromUrlOrQuery(q)));
  // Lọc ra các bài tìm được
  return results.map(r => r[0]).filter(Boolean);
}

async function resolveSoundCloudToYoutubeOrStream(url, soundcloudClientId) {
  // Nếu là link SoundCloud
  if (/^(https?:\/\/)?(www\.)?soundcloud\.com\//.test(url)) {
    const info = await getSoundCloudTrackInfo(url, soundcloudClientId);
    if (!info) return [];
    // Trả về object đặc biệt để play trực tiếp stream SoundCloud
    return [{ url: info.url, title: info.title, source: 'soundcloud' }];
  }
  return [];
}

module.exports = {
  resolveYoutubeFromUrlOrQuery,
  resolveSpotifyTrackToYoutube,
  resolveSpotifyPlaylistToYoutube,
  resolveSoundCloudToYoutubeOrStream
};
