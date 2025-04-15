FROM node:20-slim

# Install required system packages including Go
RUN apt-get update && apt-get install -y \
    git \
    wget \
    ca-certificates \
    golang-go \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Download and make the recovery tool executable
RUN mkdir -p recovery-master \
    && wget -q -O recovery-master/recovery-tool https://github.com/muun/recovery/releases/download/v0.3/recovery-tool-linux-amd64 \
    && chmod +x recovery-master/recovery-tool

# Build the application
RUN npm run build

# Expose the port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
