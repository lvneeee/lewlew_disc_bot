require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  prefix: process.env.PREFIX || '!',
  ytdlpPath: process.env.YTDLP_PATH || '../yt-dlp.exe',
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
};
