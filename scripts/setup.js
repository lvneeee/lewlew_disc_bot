const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

function verifyYtDlp(path) {
  try {
    execSync(`"${path}" --version`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function setupYtDlp() {
  const isWindows = os.platform() === 'win32';
  const isDocker = process.env.RAILWAY_STATIC_URL !== undefined;
  
  if (isDocker) {
    // In Docker, check both possible locations
    if (verifyYtDlp('/usr/local/bin/yt-dlp') || verifyYtDlp('/usr/bin/yt-dlp')) {
      console.log('yt-dlp is already installed in Docker');
      return;
    }
    console.log('yt-dlp not found in Docker, installing...');
  }

  if (isWindows) {
    const ytdlpPath = path.join(__dirname, '..', 'yt-dlp.exe');
    if (verifyYtDlp(ytdlpPath)) {
      console.log('yt-dlp is already installed');
      return;
    }
    console.log('Windows detected - downloading yt-dlp.exe...');
    try {
      execSync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o "${ytdlpPath}"`);
      if (verifyYtDlp(ytdlpPath)) {
        console.log('yt-dlp installed successfully!');
        return;
      }
      throw new Error('yt-dlp verification failed after installation');
    } catch (error) {
      console.error('Error installing yt-dlp:', error.message);
      process.exit(1);
    }
  }

  try {
    const ytdlpPath = isDocker ? '/usr/local/bin/yt-dlp' : path.join(__dirname, '..', 'yt-dlp');
    console.log('Installing yt-dlp...');
    execSync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "${ytdlpPath}"`);
    execSync(`chmod +x "${ytdlpPath}"`);
    
    if (verifyYtDlp(ytdlpPath)) {
      console.log('yt-dlp installed successfully!');
      if (isDocker) {
        // Create symlink in Docker
        try {
          execSync(`ln -sf "${ytdlpPath}" /usr/bin/yt-dlp`);
        } catch (error) {
          console.log('Note: Could not create symlink, but yt-dlp is still installed');
        }
      }
    } else {
      throw new Error('yt-dlp verification failed after installation');
    }
  } catch (error) {
    console.error('Error installing yt-dlp:', error.message);
    process.exit(1);
  }
}

setupYtDlp();
