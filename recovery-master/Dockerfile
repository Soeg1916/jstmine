# Building this Dockerfile executes a full build of the Recovery Tool, cross-compiling inside 
# the container. The resulting executable is copied to the output directory using Docker BuildKit.

# You need to pass 3 parameters via --build-arg:
# 1. `os`  : the GOOS env var -- `linux`, `windows` or `darwin`.
# 2. `arch`: the GOARCH env var -- `386` or `amd64` (note that darwin/386 is not a thing).
# 3. `cc`  : the CC env var -- a C compiler for CGO to use, empty to use the default.
# 4. `out` : the name of the resulting executable, placed in the output directory on the host.

# For example, to build a linux/386 binary into `bin/rt`:
#   docker build . --output bin --build-arg os=linux --build-arg arch=386 --build-arg out=rt

# Note that the --output <dir> flag refers to the host, outside the container.

# --------------------------------------------------------------------------------------------------

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
