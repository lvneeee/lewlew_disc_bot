const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const logger = require('./logger');
const config = require('../config/config');

// Detect platform and environment
const isWindows = os.platform() === 'win32';
const isDocker = process.env.RAILWAY_STATIC_URL !== undefined;

// Set appropriate yt-dlp executable path and validate it exists
const ytdlpPath = config.ytdlpPath || (isDocker ? '/usr/local/bin/yt-dlp' : 
    isWindows ? path.join(__dirname, '..', 'yt-dlp.exe') : '/usr/bin/yt-dlp');
const ytdlpCookiesPath = config.ytdlpCookiesPath || './youtube_cookies.txt';

// Helper function to run yt-dlp with error handling
function runYtDlp(args, options = {}) {
  // Thêm cookies nếu file tồn tại
  const fs = require('fs');
  if (fs.existsSync(ytdlpCookiesPath)) {
    args = [
      '--cookies', ytdlpCookiesPath,
      ...args
    ];
  }
  return new Promise((resolve, reject) => {
    const process = spawn(ytdlpPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      ...options
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
      // Chỉ log debug/info nếu là debug/info, chỉ log error nếu exit code != 0
      logger.debug('yt-dlp stderr: ' + data.toString());
    });

    process.on('error', (err) => {
      logger.error('yt-dlp spawn error: ' + err);
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
    });

    process.on('close', (code) => {
      logger.info('yt-dlp process exited with code: ' + code);
      if (code !== 0) {
        logger.error('yt-dlp failed with stderr: ' + stderr);
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
        return;
      }
      resolve(stdout);
    });
  });
}

async function getAudioStream(url) {
  try {
    const process = spawn(ytdlpPath, [
      '-f', 'bestaudio',
      '-o', '-',
      url,
    ], {
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: false
    });

    process.on('error', (err) => {
      logger.error('yt-dlp audio stream error: ' + err);
      throw err;
    });

    return process.stdout;
  } catch (error) {
    logger.error('Error in getAudioStream: ' + error);
    throw error;
  }
}

async function getVideoInfo(url) {
  try {
    const output = await runYtDlp([
      '--no-playlist',
      '--print', '%(title)s',
      '--verbose',
      url
    ]);
    
    return output.trim();
  } catch (error) {
    logger.error('Error in getVideoInfo:', error);
    throw error;
  }
}

function getPlaylistVideos(playlistUrl) {
  return new Promise((resolve, reject) => {
    const videos = [];
    const process = spawn(ytdlpPath, [
      '--yes-playlist',
      '--flat-playlist',
      '--dump-json',
      playlistUrl,
    ]);

    let dataBuffer = '';

    process.stdout.on('data', (chunk) => {
      dataBuffer += chunk.toString();
      // yt-dlp dump-json xuất từng dòng là 1 json video
      let lines = dataBuffer.split('\n');
      dataBuffer = lines.pop(); // giữ phần dư cuối chưa đủ 1 dòng

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const json = JSON.parse(line);
          videos.push({
            url: `https://www.youtube.com/watch?v=${json.id}`,
            title: json.title,
          });
        } catch (e) {
          // lỗi parse json, bỏ qua
        }
      }
    });

    process.stderr.on('data', (data) => {
      // có thể log nếu cần
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(videos);
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
}

async function searchVideos(query, limit = 5) {
  return new Promise((resolve, reject) => {
    const process = spawn(ytdlpPath, [
      'ytsearch' + limit + ':' + query,
      '--flat-playlist',
      '--dump-json'
    ]);

    let dataBuffer = '';

    process.stdout.on('data', (chunk) => {
      dataBuffer += chunk.toString();
    });

    process.stderr.on('data', (data) => {
      logger.error(`yt-dlp stderr: ${data}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        try {
          const results = dataBuffer
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              const data = JSON.parse(line);
              return {
                title: data.title,
                url: `https://www.youtube.com/watch?v=${data.id}`,
                duration: data.duration,
                thumbnail: data.thumbnail
              };
            });
          resolve(results);
        } catch (e) {
          reject(new Error('Lỗi khi xử lý kết quả tìm kiếm'));
        }
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
}

module.exports = {
  getAudioStream,
  getVideoInfo,
  getPlaylistVideos,
  searchVideos
};
