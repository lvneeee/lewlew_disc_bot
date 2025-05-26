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
  const logger = require('./logger');
  logger.info('[YTDLP] Running with options:', { args, hasCookies: fs.existsSync(ytdlpCookiesPath) });

  // Base arguments with format selection
  let finalArgs = [
    '--extractor-args', 'youtube:formats=missing_pot',
    ...args
  ];

  // Kiểm tra và thêm cookies nếu có
  if (fs.existsSync(ytdlpCookiesPath)) {
    logger.info('[YTDLP] Using cookies file');
    finalArgs = [
      '--cookies', ytdlpCookiesPath,
      ...finalArgs
    ];
  } 
  // Nếu không có cookies và có visitor_data, sử dụng visitor_data
  else if (config.ytdlpVisitorData && !isWindows) {
    logger.info('[YTDLP] No cookies found, using visitor data');
    finalArgs = [
      '--extractor-args',
      'youtubetab:skip=webpage',
      '--extractor-args',
      `youtube:player_skip=webpage,configs;visitor_data=${config.ytdlpVisitorData}`,
      ...finalArgs
    ];
  } else {
    logger.warn('[YTDLP] No authentication method available');
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
  const { PassThrough } = require('stream');
  logger.info(`[YTDLP] Bắt đầu tải xuống audio từ: ${url}`);
  
  return new Promise((resolve, reject) => {
    // Tạo mảng args với các tùy chọn cơ bản
    let finalArgs = [
      '-f', 'bestaudio',
      '-o', '-',
      '--no-warnings'
    ];

    // Thêm extractor-args để thử lấy audio chất lượng cao hơn
    finalArgs = [
      '--extractor-args', 'youtube:formats=missing_pot',
      ...finalArgs
    ];

    // Ưu tiên sử dụng cookies nếu có
    if (fs.existsSync(ytdlpCookiesPath)) {
      finalArgs = ['--cookies', ytdlpCookiesPath, ...finalArgs];
      logger.info('[YTDLP] Đang sử dụng file cookies để xác thực');
    }
    // Nếu không có cookies và có visitor_data (trên Linux), sử dụng visitor_data
    else if (config.ytdlpVisitorData && !isWindows) {
      finalArgs = [
        '--extractor-args',
        'youtubetab:skip=webpage',
        '--extractor-args',
        `youtube:player_skip=webpage,configs;visitor_data=${config.ytdlpVisitorData}`,
        ...finalArgs
      ];
      logger.info('[YTDLP] Đang sử dụng visitor_data để xác thực');
    } else {
      logger.warn('[YTDLP] Không có phương thức xác thực nào được cấu hình');
    }

    // Thêm URL vào cuối
    finalArgs.push(url);

    logger.info(`[YTDLP] Thực thi lệnh: ${ytdlpPath} ${finalArgs.join(' ')}`);
    
    const process = spawn(ytdlpPath, finalArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    const passThrough = new PassThrough();
    let gotData = false;
    let errorOutput = '';
    let dataSize = 0;

    process.stdout.on('data', (chunk) => {
      dataSize += chunk.length;
      if (!gotData) {
        gotData = true;
        logger.info('[YTDLP] Đã bắt đầu nhận dữ liệu audio');
        resolve(passThrough);
      }
      
      try {
        passThrough.write(chunk);
      } catch (err) {
        logger.error(`[YTDLP] Lỗi khi ghi dữ liệu vào stream: ${err}`);
        passThrough.destroy(err);
      }
    });

    process.stderr.on('data', (data) => {
      const message = data.toString().trim();
      errorOutput += message + '\n';
      
      // Chỉ log các lỗi quan trọng
      if (!message.startsWith('[debug]') && 
          !message.startsWith('[info]') && 
          !message.startsWith('WARNING:')) {
        logger.warn(`[YTDLP] Cảnh báo/Lỗi: ${message}`);
      }
    });

    process.on('error', (err) => {
      const error = new Error(`Lỗi khi khởi chạy yt-dlp: ${err.message}`);
      logger.error(`[YTDLP] ${error.message}`);
      passThrough.destroy(error);
      if (!gotData) {
        reject(error);
      }
    });

    process.on('close', (code) => {
      logger.info(`[YTDLP] Tiến trình kết thúc với mã: ${code}`);
      if (!gotData) {
        const error = new Error(`yt-dlp không thể tải audio. Mã lỗi: ${code}. Chi tiết: ${errorOutput}`);
        logger.error(`[YTDLP] ${error.message}`);
        reject(error);
      } else {
        logger.info(`[YTDLP] Đã tải xuống thành công ${(dataSize / 1024 / 1024).toFixed(2)}MB audio`);
        passThrough.end();
        logger.info('[YTDLP] Stream audio đã kết thúc bình thường');
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
    // Tạo args cơ bản
    let finalArgs = [
      '--yes-playlist',
      '--flat-playlist',
      '--dump-json'
    ];

    // Thêm xác thực nếu có
    if (fs.existsSync(ytdlpCookiesPath)) {
      finalArgs = ['--cookies', ytdlpCookiesPath, ...finalArgs];
    } else if (config.ytdlpVisitorData && !isWindows) {
      finalArgs = [
        '--extractor-args',
        'youtubetab:skip=webpage',
        '--extractor-args',
        `youtube:player_skip=webpage,configs;visitor_data=${config.ytdlpVisitorData}`,
        ...finalArgs
      ];
    }

    // Thêm URL
    finalArgs.push(playlistUrl);

    const videos = [];
    const process = spawn(ytdlpPath, finalArgs);

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
    // Tạo args cơ bản
    let finalArgs = [
      'ytsearch' + limit + ':' + query,
      '--flat-playlist',
      '--dump-json'
    ];

    // Thêm xác thực nếu có
    if (fs.existsSync(ytdlpCookiesPath)) {
      finalArgs = ['--cookies', ytdlpCookiesPath, ...finalArgs];
    } else if (config.ytdlpVisitorData && !isWindows) {
      finalArgs = [
        '--extractor-args',
        'youtubetab:skip=webpage',
        '--extractor-args',
        `youtube:player_skip=webpage,configs;visitor_data=${config.ytdlpVisitorData}`,
        ...finalArgs
      ];
    }

    const process = spawn(ytdlpPath, finalArgs);

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
