// utils/musicSource.js
// Tập trung xử lý các nguồn phát nhạc (YouTube, Spotify)
const { getAudioStream, getVideoInfo, getPlaylistVideos, searchVideos } = require('./ytdlp');
const { getSpotifyTrackInfo, getSpotifyPlaylistTracks } = require('./spotify');
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
  const queries = await getSpotifyPlaylistTracks(url);
  if (!queries.length) return [];
  const results = [];
  for (const q of queries) {
    const yt = await resolveYoutubeFromUrlOrQuery(q);
    if (yt.length) results.push(yt[0]);
  }
  return results;
}

module.exports = {
  resolveYoutubeFromUrlOrQuery,
  resolveSpotifyTrackToYoutube,
  resolveSpotifyPlaylistToYoutube
};
