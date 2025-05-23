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

# Download and install yt-dlp directly
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    ln -s /usr/local/bin/yt-dlp /usr/bin/yt-dlp

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
