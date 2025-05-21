const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function deploySlashCommands(token, clientId) {
  if (!token || !clientId) {
    throw new Error('TOKEN và CLIENT_ID không được để trống!');
  }

  const commands = [];
  const commandFiles = fs.readdirSync(path.join(__dirname, '../commands'))
    .filter(file => file.endsWith('.js'));

  // Đọc tất cả các file commands
  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('Bắt đầu đăng ký slash commands...');

    // Đăng ký global commands
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log('✅ Hoàn tất đăng ký global slash commands!');
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký slash commands:', error);
    return false;
  }
}

module.exports = { deploySlashCommands };
