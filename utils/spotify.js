const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../config/config');

const spotifyApi = new SpotifyWebApi({
  clientId: config.spotifyClientId,
  clientSecret: config.spotifyClientSecret,
});

async function getSpotifyTrackInfo(url) {
  try {
    // Lấy access token
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);

    // Lấy ID bài hát từ URL
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    const trackId = match[1];

    // Lấy thông tin bài hát
    const track = await spotifyApi.getTrack(trackId);
    const name = track.body.name;
    const artist = track.body.artists.map(a => a.name).join(', ');
    return `${name} ${artist}`;
  } catch (err) {
    return null;
  }
}

async function getSpotifyPlaylistTracks(url) {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    // Lấy ID playlist từ URL
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match) return [];
    const playlistId = match[1];
    // Lấy tất cả track trong playlist (Spotify trả về theo trang, cần lặp)
    let tracks = [];
    let offset = 0;
    let total = 1;
    while (offset < total) {
      const res = await spotifyApi.getPlaylistTracks(playlistId, { offset, limit: 100 });
      total = res.body.total;
      tracks = tracks.concat(res.body.items.map(item => {
        const t = item.track;
        return t ? `${t.name} ${t.artists.map(a => a.name).join(', ')}` : null;
      }).filter(Boolean));
      offset += 100;
    }
    return tracks;
  } catch (err) {
    return [];
  }
}

module.exports = { getSpotifyTrackInfo, getSpotifyPlaylistTracks };
