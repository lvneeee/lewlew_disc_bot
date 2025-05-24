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

module.exports = { getSpotifyTrackInfo };
