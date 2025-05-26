const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const which = require('which');
const logger = require('./logger');
const config = require('../config/config');

// Detect platform
const isWindows = os.platform() === 'win32';

// Resolve yt-dlp path
let ytdlpPath = config.ytdlpPath;

if (!ytdlpPath) {
  if (isWindows) {
    ytdlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
    if (!fs.existsSync(ytdlpPath)) {
      console.error(`Không tìm thấy yt-dlp.exe tại: ${ytdlpPath}`);
      process.exit(1);
    }
  } else {
    try {
      ytdlpPath = which.sync('yt-dlp');
    } catch (err) {
      console.error('Không tìm thấy yt-dlp trong hệ thống. Cài đặt bằng: pip install yt-dlp hoặc tải từ GitHub.');
      process.exit(1);
    }
  }
}

const ytdlpCookiesPath = config.ytdlpCookiesPath || './youtube_cookies.txt';

function runYtDlp(args, options = {}) {
  // Thêm extractor-args để thử lấy audio chất lượng cao hơn nếu thiếu PO Token
  if (!args.some(arg => arg.includes('formats=missing_pot'))) {
    args = [
      '--extractor-args', 'youtube:formats=missing_pot',
      ...args
    ];
  }

  if (config.ytdlpVisitorData && !isWindows) {
    args = [
      '--extractor-args',
      'youtubetab:skip=webpage',
      '--extractor-args',
      `youtube:player_skip=webpage,configs;visitor_data=${config.ytdlpVisitorData}`,
      ...args.filter(arg => arg !== '--cookies' && !arg.includes('youtube_cookies.txt'))
    ];
  } else {
    if (fs.existsSync(ytdlpCookiesPath)) {
      args = [
        '--cookies', ytdlpCookiesPath,
        ...args
      ];
    }
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
      logger.debug('yt-dlp stdout: ' + data.toString());
    });

    process.stderr.on('data', (data) => {
      // Lọc log: chỉ log các dòng không phải debug/info/warning
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (
          line &&
          !line.startsWith('[debug]') &&
          !line.startsWith('[info]') &&
          !line.startsWith('WARNING:')
        ) {
          logger.error('yt-dlp stderr: ' + line);
        }
      }
      stderr += data.toString();
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
  const logger = require('./logger');
  logger.info(`[YTDLP] Getting audio stream for: ${url}`);
  
  return new Promise((resolve, reject) => {
    // Tạo mảng args với các tùy chọn cơ bản
    let args = [
      '-f', 'bestaudio',
      '-o', '-',
      '--no-warnings'
    ];

    // Thêm extractor-args để thử lấy audio chất lượng cao hơn
    args = [
      '--extractor-args', 'youtube:formats=missing_pot',
      ...args
    ];

    // Trên Linux, sử dụng visitor data thay vì cookies
    if (config.ytdlpVisitorData && !isWindows) {
      args = [
        '--extractor-args',
        'youtubetab:skip=webpage',
        '--extractor-args',
        `youtube:player_skip=webpage,configs;visitor_data=${config.ytdlpVisitorData}`,
        ...args
      ];
      logger.info('[YTDLP] Using visitor data for authentication');
    } else if (fs.existsSync(ytdlpCookiesPath)) {
      args = ['--cookies', ytdlpCookiesPath, ...args];
      logger.info('[YTDLP] Using cookies file for authentication');
    }

    // Thêm URL vào cuối
    args.push(url);

    logger.info(`[YTDLP] Running command: ${ytdlpPath} ${args.join(' ')}`);
    
    const process = spawn(ytdlpPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    let gotData = false;
    let errorOutput = '';

    process.stdout.once('data', () => {
      gotData = true;
      logger.info('[YTDLP] Started receiving audio data');
      resolve(process.stdout);
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
      logger.warn(`[YTDLP] Warning/Error output: ${data.toString().trim()}`);
    });

    process.on('error', (err) => {
      logger.error(`[YTDLP] Process error: ${err}`);
      reject(err);
    });

    process.on('close', (code) => {
      logger.info(`[YTDLP] Process exited with code: ${code}`);
      if (!gotData) {
        logger.error(`[YTDLP] No audio data received. Error output: ${errorOutput}`);
        reject(new Error(`yt-dlp failed to get audio data. Exit code: ${code}. Error: ${errorOutput}`));
      } else if (code !== 0) {
        logger.warn(`[YTDLP] Process exited with non-zero code: ${code}`);
      }
    });
  });
}

async function getVideoInfo(url) {
  try {
    const output = await runYtDlp([
      '--no-playlist',
      '--print', '%(title)s',
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
      let lines = dataBuffer.split('\n');
      dataBuffer = lines.pop();

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const json = JSON.parse(line);
          videos.push({
            url: `https://www.youtube.com/watch?v=${json.id}`,
            title: json.title,
          });
        } catch (e) {}
      }
    });

    process.stderr.on('data', (data) => {
      // Log nếu cần
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
