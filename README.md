<div id="" class="">

<div align="center" class="text-center">
<h1>DISCORD MUSIC BOT</h1>
<p><em>A powerful Discord bot for seamless music playback and control.</em></p>

<img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" class="inline-block mx-1" style="margin: 0px 2px;">
<img alt="Discord" src="https://img.shields.io/badge/Discord-5865F2.svg?style=flat&logo=Discord&logoColor=white" class="inline-block mx-1" style="margin: 0px 2px;">
<img alt="npm" src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" class="inline-block mx-1" style="margin: 0px 2px;">
<img alt=".ENV" src="https://img.shields.io/badge/.ENV-ECD53F.svg?style=flat&logo=dotenv&logoColor=black" class="inline-block mx-1" style="margin: 0px 2px;">
<img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED.svg?style=flat&logo=Docker&logoColor=white" class="inline-block mx-1" style="margin: 0px 2px;">
</div>

<br>
<hr>

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Available Commands](#available-commands)
- [Docker Support](#docker-support)

<hr>

## Overview
A feature-rich Discord music bot that brings high-quality music playback to your Discord server. Supporting multiple music sources including YouTube and Spotify, with advanced queue management and playback controls.

## Features
- 🎵 **Multi-Source Playback**: Support for YouTube and Spotify
- 🎮 **Slash Commands**: Easy-to-use Discord slash commands
- 📋 **Queue Management**: Add, remove, and view your music queue
- 🔊 **Volume Control**: Adjust volume per server
- ⏯️ **Playback Controls**: Play, pause, resume, skip
- 🔍 **Search Function**: Search for songs directly
- 🎯 **Error Handling**: Robust error management system

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (Node Package Manager)
- Discord Bot Token
- Spotify API credentials (optional)

### Installation

1. **Clone and Setup**
\`\`\`bash
git clone <your-repository-url>
cd <your-project-directory>
npm install
\`\`\`

2. **Configure Environment**
Create a .env file with:
\`\`\`
DISCORD_TOKEN=your_discord_bot_token
PREFIX=!
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
\`\`\`

### Configuration
The bot can be configured through \`config/config.js\` with options for:
- Discord token
- Command prefix
- YouTube DLP settings
- Spotify credentials

## Usage

Start the bot:
\`\`\`bash
npm start
\`\`\`

### Available Commands
- \`/play\`: Play a song from YouTube or Spotify
- \`/pause\`: Pause current playback
- \`/resume\`: Resume playback
- \`/skip\`: Skip to next song
- \`/queue\`: View current queue
- \`/clear\`: Clear the queue
- \`/volume\`: Adjust playback volume
- \`/disconnect\`: Disconnect bot from voice
- \`/search\`: Search for a song
- \`/spotify\`: Play from Spotify
- \`/nowplaying\`: Show current track

## Docker Support

Build and run with Docker:
\`\`\`bash
# Build the image
docker build -t discord-music-bot .

# Run the container
docker run -d discord-music-bot
\`\`\`

<hr>
<div align="left" class=""><a href="#top">⬆ Return</a></div>
<hr>
</div>
