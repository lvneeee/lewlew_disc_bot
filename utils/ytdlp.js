const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Detect platform and environment
const isWindows = os.platform() === 'win32';
const isDocker = process.env.RAILWAY_STATIC_URL !== undefined;

// Set appropriate yt-dlp executable path
const ytdlpPath = isDocker ? 'yt-dlp' : 
    isWindows ? path.join(__dirname, '..', 'yt-dlp.exe') : 'yt-dlp';

async function getAudioStream(url) {
  return new Promise((resolve, reject) => {
    const process = spawn(ytdlpPath, [
      '-f', 'bestaudio',
      '-o', '-',
      url,
    ], {      stdio: ['ignore', 'pipe', 'ignore'],
      shell: false
    });

    process.on('error', (err) => {
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
    });

    resolve(process.stdout);
  });
}

async function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const process = spawn(ytdlpPath, [
      '--no-playlist',
      '--print', '%(title)s',
      url,
    ]);

    let title = '';
    process.stdout.on('data', (data) => {
      title += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(title.trim());
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
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
      console.error(`yt-dlp stderr: ${data}`);
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
