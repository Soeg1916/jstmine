# Muun Wallet Recovery Bot Deployment Guide

This document provides step-by-step instructions for deploying the Muun Wallet Recovery Bot on Koyeb.

## Prerequisites

1. A [Koyeb](https://www.koyeb.com) account
2. A [Docker Hub](https://hub.docker.com) account
3. [Docker](https://www.docker.com/get-started) installed on your local machine
4. Your Telegram Bot Token from [BotFather](https://t.me/botfather)

## Manual Deployment Steps

### 1. Build and Push Docker Image

```bash
# Login to Docker Hub
docker login

# Build the Docker image
docker build -t yourusername/muun-recovery-bot:latest .

# Push to Docker Hub
docker push yourusername/muun-recovery-bot:latest
```

### 2. Deploy to Koyeb using Web UI

1. Log in to your [Koyeb Control Panel](https://app.koyeb.com)
2. Click on "Create App"
3. Select "Docker Image" deployment method
4. Enter your Docker image: `yourusername/muun-recovery-bot:latest`
5. Configure the following:
   - **Name**: muun-recovery-bot
   - **Region**: Choose the region closest to your users
   - **Instance Type**: Small (0.5 CPU, 512MB RAM)
   - **Port**: 8080
   - **Environment Variables**:
     - Name: `TELEGRAM_BOT_TOKEN`
     - Value: Your Telegram Bot Token
     - Mark as Secret: Yes
6. Click "Deploy"

### 3. Deploy to Koyeb using CLI

1. Install the [Koyeb CLI](https://www.koyeb.com/docs/cli/installation)
2. Login to your Koyeb account:
   ```bash
   koyeb login
   ```
3. Create a new app:
   ```bash
   koyeb app create muun-recovery-bot
   ```
4. Deploy the service:
   ```bash
   koyeb service create muun-recovery-bot \
     --app muun-recovery-bot \
     --docker yourusername/muun-recovery-bot:latest \
     --ports 8080:http \
     --routes /:8080 \
     --env TELEGRAM_BOT_TOKEN=your_telegram_bot_token:secret \
     --instance-type small \
     --min-scale 1 \
     --max-scale 1 \
     --region fra
   ```

## GitHub Actions Deployment (Recommended)

For automated deployments, we've included a GitHub Actions workflow file:

1. Push your code to GitHub in a repository
2. Add the following secrets to your GitHub repository:
   - `DOCKER_HUB_USERNAME`: Your Docker Hub username
   - `DOCKER_HUB_TOKEN`: Your Docker Hub access token
   - `KOYEB_TOKEN`: Your Koyeb API token
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot Token
3. Push changes to the main branch to trigger automatic deployment

## Verifying Your Deployment

1. Once deployed, Koyeb will assign a domain to your application (e.g., `muun-recovery-bot-youraccount.koyeb.app`)
2. Test your Telegram bot by sending it a `/start` command
3. Monitor the application logs in the Koyeb dashboard

## Troubleshooting

### Common Issues

1. **Bot Not Responding**: 
   - Check if the `TELEGRAM_BOT_TOKEN` is correct
   - View the application logs in Koyeb dashboard

2. **Docker Image Build Failing**:
   - Verify that all dependencies are properly installed
   - Check Docker Hub repository settings 

3. **Application Crashing**:
   - Check application logs in Koyeb dashboard
   - Increase instance size if out of memory errors occur

### Useful Commands

**Check Logs**:
```bash
koyeb service logs muun-recovery-bot/muun-recovery-bot
```

**Restart Service**:
```bash
koyeb service redeploy muun-recovery-bot/muun-recovery-bot
```

**Update Environment Variables**:
```bash
koyeb service update muun-recovery-bot/muun-recovery-bot --env NEW_KEY=value 
```