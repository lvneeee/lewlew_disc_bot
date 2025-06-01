require('dotenv').config();
const { deploySlashCommands, clearGlobalCommands } = require('../utils/deployCommands');

// Đăng ký slash commands
(async () => {
  try {
    // Xóa toàn bộ lệnh global trước
    await clearGlobalCommands(process.env.DISCORD_TOKEN, process.env.CLIENT_ID);

    // Đăng ký lại lệnh mới
    const success = await deploySlashCommands(process.env.DISCORD_TOKEN, process.env.CLIENT_ID);
    if (success) {
      console.log('Đăng ký commands thành công!');
    } else {
      console.log('Đăng ký commands thất bại!');
    }
  } catch (error) {
    console.error('Lỗi:', error);
  }
  process.exit(0);
})();
