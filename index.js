require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { deploySlashCommands } = require('./utils/deployCommands');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Khởi tạo collection để lưu commands
client.commands = new Collection();

// Đọc tất cả các file commands
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Xử lý slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const reply = {
      content: 'Lỗi khi thực thi lệnh!',
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.once('ready', async () => {
  console.log(`Bot đã sẵn sàng: ${client.user.tag}`);
});

// Đăng ký global commands
(async () => {
  try {
    await deploySlashCommands(process.env.DISCORD_TOKEN, process.env.CLIENT_ID);
  } catch (error) {
    console.error('Lỗi khi đăng ký commands:', error);
  }
})();

client.login(process.env.DISCORD_TOKEN);
