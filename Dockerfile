FROM node:18-bullseye

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    python3 \
    curl \
    ffmpeg \
    build-essential \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install and setup yt-dlp
RUN python3 -m pip install --no-cache-dir -U yt-dlp && \
    YT_DLP_PATH=$(which yt-dlp) && \
    mkdir -p /usr/local/bin && \
    cp "$YT_DLP_PATH" /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp && \
    mkdir -p /usr/bin && \
    cp /usr/local/bin/yt-dlp /usr/bin/yt-dlp && \
    chmod +x /usr/bin/yt-dlp

# Set npm config
ENV NPM_CONFIG_LOGLEVEL=error
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# Copy package files
COPY package*.json ./

# Create .npmrc
RUN echo "legacy-peer-deps=true\naudit=false\nfund=false" > .npmrc

# Install node dependencies
RUN npm ci || npm install --no-optional

# Copy the rest of the application
COPY . .

# Set environment variable for Node
ENV NODE_OPTIONS="--no-experimental-fetch"

CMD ["npm", "start"]
