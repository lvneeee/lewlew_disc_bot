const { createLogger, format, transports } = require('winston');
const fs = require('fs');

// Đảm bảo thư mục logs tồn tại
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/app.log', maxsize: 5242880, maxFiles: 5 })
  ],
});

module.exports = logger;
