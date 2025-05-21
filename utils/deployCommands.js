const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function deploySlashCommands(token, clientId) {
  const commands = [];
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  // Đọc tất cả các file commands
  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    commands.push(command.data.toJSON());
  }

  // Đăng ký slash commands với Discord
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('Bắt đầu đăng ký slash commands...');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('Đăng ký slash commands thành công!');
    return true;
  } catch (error) {
    console.error('Lỗi khi đăng ký slash commands:', error);
    return false;
  }
}

module.exports = { deploySlashCommands };
