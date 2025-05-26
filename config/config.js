require('dotenv').config();
const os = require('os');
const isWindows = os.platform() === 'win32';
const isRailway = process.env.RAILWAY_STATIC_URL !== undefined;

module.exports = {
  token: process.env.DISCORD_TOKEN,
  prefix: process.env.PREFIX || '!',
  ytdlpPath: process.env.YTDLP_PATH || (isWindows ? require('path').join(__dirname, '..', 'yt-dlp.exe') : '/usr/local/bin/yt-dlp'),
  ytdlpCookiesPath: process.env.YTDLP_COOKIES_PATH || './youtube_cookies.txt',
  ytdlpVisitorData: process.env.YTDLP_VISITOR_DATA || '',
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
};
