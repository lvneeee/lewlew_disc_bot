require('dotenv').config();
const os = require('os');
const isWindows = os.platform() === 'win32';
const isRailway = process.env.RAILWAY_STATIC_URL !== undefined;

module.exports = {
  token: process.env.DISCORD_TOKEN,
  prefix: process.env.PREFIX || '!',
  ytdlpPath: process.env.YTDLP_PATH || (isRailway || !isWindows ? '/usr/local/bin/yt-dlp' : require('path').join(__dirname, '..', 'yt-dlp.exe')),
  ytdlpCookiesPath: process.env.YTDLP_COOKIES_PATH || './youtube_cookies.txt',
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
};
