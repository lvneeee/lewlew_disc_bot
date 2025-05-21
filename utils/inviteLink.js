require('dotenv').config();

// Tạo invite link với permissions cần thiết
const botId = process.env.CLIENT_ID;
// Permissions cần thiết cho bot nhạc:
// - Xem kênh, gửi tin nhắn, nhúng links
// - Kết nối voice, nói, phát hiện giọng nói
// - applications.commands cho slash commands
const permissions = '36768832';

const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${botId}&permissions=${permissions}&scope=bot%20applications.commands`;

console.log('Invite Link:', inviteLink);
