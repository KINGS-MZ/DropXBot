# DropXBot - Steam Accounts Telegram Bot

A professional Telegram bot for distributing Steam accounts.

## Features
- User verification system
- Referral program with points
- Admin control panel
- Premium accounts system
- Account distribution with game cover images

## Setup Instructions

### Prerequisites
- Node.js 16.x or higher
- NPM

### Installation
1. Clone this repository
2. Run `npm install` to install dependencies
3. Create the necessary data files (will be created automatically on first run)

### Configuration
You can configure the bot using environment variables:
- `BOT_TOKEN` - Your Telegram bot token
- `ADMIN_ID` - Your Telegram user ID
- `CHANNEL_USERNAME` - Your channel username (optional)
- `ADMIN_USERNAME` - Your admin username (optional)

### Running Locally
```
npm start
```

## Hosting on Free Platforms

### Render.com (Recommended)
1. Create an account on [Render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables (BOT_TOKEN, ADMIN_ID)
7. Deploy

### Railway.app
1. Create an account on [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the project
4. Add environment variables
5. Start the service

### Heroku (Free Tier Discontinued)
If you have Heroku credits:
1. Create an app on Heroku
2. Connect your GitHub repository
3. Deploy the app
4. Add environment variables
5. Enable worker dyno

## Usage
1. Start the bot with `/start`
2. Follow verification instructions
3. Use the referral system to earn points
4. Redeem points for Steam accounts

## Admin Commands
- `/admin` - Access admin panel
- Upload accounts by sending a JSON file
- View bot statistics

## Bot Details
- Name: DropXBot
- Username: @VPsyncBot
- Admin ID: 7008504508 