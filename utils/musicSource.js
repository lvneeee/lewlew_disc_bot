// utils/musicSource.js
// Tập trung xử lý các nguồn phát nhạc (YouTube, Spotify)
const { getAudioStream, getVideoInfo, getPlaylistVideos, searchVideos } = require('./ytdlp');
const { getSpotifyTrackInfo, getSpotifyPlaylistTracks } = require('./spotify');
const ytSearch = require('yt-search');

async function resolveYoutubeFromUrlOrQuery(input) {
  const logger = require('./logger');
  logger.info(`[MUSIC SOURCE] Processing input: ${input}`);

  // Nếu là link YouTube hoặc playlist
  if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(input)) {
    logger.info('[MUSIC SOURCE] Input is a YouTube URL');
    
    if (input.includes('list=')) {
      // Playlist
      logger.info('[MUSIC SOURCE] Processing YouTube playlist');
      const videos = await getPlaylistVideos(input);
      logger.info(`[MUSIC SOURCE] Found ${videos.length} videos in playlist`);
      return videos.map(v => ({ url: v.url, title: v.title }));
    } else {
      // Video đơn
      logger.info('[MUSIC SOURCE] Processing single YouTube video');
      const title = await getVideoInfo(input);
      logger.info(`[MUSIC SOURCE] Video title: ${title}`);
      return [{ url: input, title }];
    }
  }
  
  // Nếu là query (từ Spotify hoặc search)
  logger.info('[MUSIC SOURCE] Input is a search query, searching YouTube');
  const ytResult = await ytSearch(input);
  if (!ytResult.videos.length) {
    logger.warn('[MUSIC SOURCE] No videos found for query');
    return [];
  }
  logger.info(`[MUSIC SOURCE] Found video: ${ytResult.videos[0].title}`);
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

module.exports = {
  resolveYoutubeFromUrlOrQuery,
  resolveSpotifyTrackToYoutube,
  resolveSpotifyPlaylistToYoutube
};
