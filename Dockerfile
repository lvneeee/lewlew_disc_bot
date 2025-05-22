FROM node:18

WORKDIR /app

# Install python and other dependencies
RUN apt-get update && \
    apt-get install -y python3 curl ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp globally
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

# Copy package files
COPY package*.json ./

# Install node dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Set environment variable for Node
ENV NODE_OPTIONS="--no-experimental-fetch"

CMD ["npm", "start"]
