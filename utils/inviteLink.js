require('dotenv').config();

// Tạo invite link với permissions cần thiết
const botId = process.env.CLIENT_ID;
// Toàn quyền cho bot (ADMINISTRATOR + applications.commands)
const permissions = '274877975552';

const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${botId}&permissions=${permissions}&scope=bot%20applications.commands`;

console.log('Invite Link:', inviteLink);
