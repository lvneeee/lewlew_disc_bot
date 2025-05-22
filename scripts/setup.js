const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

function setupYtDlp() {
    const isWindows = os.platform() === 'win32';
    const isDocker = process.env.RAILWAY_STATIC_URL !== undefined;
    
    if (isWindows) {
        console.log('Windows detected - skipping yt-dlp installation');
        return;
    }

    if (isDocker) {
        console.log('Running in Docker - yt-dlp should be pre-installed');
        return;
    }

    try {
        const ytdlpPath = path.join(__dirname, '..', 'yt-dlp');
        console.log('Installing yt-dlp...');
        // Download yt-dlp
        execSync('curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ' + ytdlpPath);
        // Make it executable
        execSync('chmod +x ' + ytdlpPath);
        console.log('yt-dlp installed successfully!');
    } catch (error) {
        console.error('Error installing yt-dlp:', error.message);
        process.exit(1);
    }
}

setupYtDlp();
