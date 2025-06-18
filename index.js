const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const express = require('express');
const https = require('https');

// Professional Keep-alive server
const app = express();
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>DropXBot Status</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: 0; padding: 20px; }
                .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px); }
                .status { display: flex; align-items: center; gap: 10px; margin: 20px 0; }
                .online { color: #00ff88; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px; }
                .stat-card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 DropXBot Status Dashboard</h1>
                <div class="status">
                    <span>Status:</span>
                    <span class="online">✅ Online & Active</span>
                </div>
                <div class="stats">
                    <div class="stat-card">
                        <h3>⏱️ Uptime</h3>
                        <p>${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m</p>
                    </div>
                    <div class="stat-card">
                        <h3>🎮 Service</h3>
                        <p>Steam Account Distribution</p>
                    </div>
                    <div class="stat-card">
                        <h3>🕐 Last Update</h3>
                        <p>${new Date().toLocaleString()}</p>
                    </div>
                    <div class="stat-card">
                        <h3>🔧 Version</h3>
                        <p>v2.0 Professional</p>
                    </div>
                </div>
                <p style="text-align: center; margin-top: 30px; opacity: 0.8;">Powered by Railway • Built with Node.js</p>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Professional dashboard running on port ${PORT}`);
});

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '7283540512:AAE6UAq6j8y9YkrAMv26RoLoq8e4FXYOdr4';
const ADMIN_ID = process.env.ADMIN_ID || '7008504508';
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || '@VPSync';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '@VPSyncAdmin';
const BOT_USERNAME = 'VPsyncBot';

console.log('🚀 Initializing DropXBot Professional...');
console.log(`🤖 Bot: @${BOT_USERNAME}`);
console.log(`👤 Admin: ${ADMIN_ID}`);

const bot = new TelegramBot(BOT_TOKEN, { 
    polling: {
        interval: 1000,
        autoStart: true,
        params: { timeout: 10 }
    }
});

// Enhanced data storage
const USERS_FILE = 'users.json';
const ACCOUNTS_FILE = 'steam_accounts.json';
const REFERRALS_FILE = 'referrals.json';
const VERIFICATION_FILE = 'pending_verifications.json';

let users = loadData(USERS_FILE) || {};
let steamAccounts = loadData(ACCOUNTS_FILE) || {};
let referrals = loadData(REFERRALS_FILE) || {};
let pendingVerifications = loadData(VERIFICATION_FILE) || {};

// Professional Configuration
const CONFIG = {
    POINTS_PER_REFERRAL: 15,
    VERIFICATION_REQUIRED: true,
    MIN_POINTS_FOR_ACCOUNT: 0,
    DAILY_FREE_ACCOUNTS: 2,
    PREMIUM_ACCOUNTS_COST: 50,
    VERIFICATION_METHODS: {
        CHANNEL_JOIN: 'channel_join',
        PHONE_VERIFY: 'phone_verify',
        CAPTCHA: 'captcha_verify'
    },
    PREMIUM_BENEFITS: [
        '🎮 Unlimited daily accounts',
        '⚡ Instant account delivery',
        '🎯 Priority support',
        '🔥 Early access to new games',
        '💎 Premium-only games',
        '📊 Advanced statistics'
    ]
};

// Enhanced utility functions
function loadData(filename) {
    try {
        if (fs.existsSync(filename)) {
            const data = fs.readFileSync(filename, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`❌ Error loading ${filename}:`, error.message);
    }
    return {};
}

function saveData(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`❌ Error saving ${filename}:`, error.message);
    }
}

function generateReferralCode(userId) {
    return `VPS${userId.toString().slice(-4)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

function generateVerificationCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

function isAdmin(userId) {
    return userId.toString() === ADMIN_ID.toString();
}

function getUserStatus(userId) {
    const user = users[userId];
    if (!user) return 'new';
    if (!user.verified) return 'unverified';
    if (user.premium) return 'premium';
    return 'verified';
}

function getStatusEmoji(status) {
    const emojis = {
        'new': '🆕',
        'unverified': '⏳',
        'verified': '✅',
        'premium': '💎'
    };
    return emojis[status] || '❓';
}

// Enhanced user registration
function registerUser(userId, username, firstName, referredBy = null) {
    if (!users[userId]) {
        users[userId] = {
            id: userId,
            username: username || 'N/A',
            firstName: firstName || 'User',
            joinDate: Date.now(),
            verified: false,
            premium: false,
            points: 0,
            accountsReceived: 0,
            dailyAccountsUsed: 0,
            lastDailyReset: Date.now(),
            referralCode: generateReferralCode(userId),
            referredBy: referredBy,
            referrals: [],
            verificationMethod: null,
            verificationCode: null,
            language: 'en',
            notifications: true,
            lastActivity: Date.now()
        };

        if (referredBy && users[referredBy]) {
            users[referredBy].referrals.push(userId);
            users[referredBy].points += CONFIG.POINTS_PER_REFERRAL;
            
            // Notify referrer with professional message
            bot.sendMessage(referredBy, 
                `🎉 *Referral Success!*\n\n` +
                `✨ A new user joined using your referral link!\n` +
                `💰 You earned *${CONFIG.POINTS_PER_REFERRAL} points*\n` +
                `👥 Total referrals: *${users[referredBy].referrals.length}*\n` +
                `🎯 Keep sharing to earn more rewards!`,
                { parse_mode: 'Markdown' }
            ).catch(err => console.log('Error sending referral notification:', err.message));
        }

        saveData(USERS_FILE, users);
        console.log(`👤 New user registered: ${firstName} (${userId})`);
        return true;
    }
    return false;
}

// Reset daily limits
function resetDailyLimits(userId) {
    const user = users[userId];
    if (!user) return;
    
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - user.lastDailyReset > dayInMs) {
        user.dailyAccountsUsed = 0;
        user.lastDailyReset = now;
        saveData(USERS_FILE, users);
    }
}

// Professional verification system
function initiateVerification(userId, method) {
    const verificationCode = generateVerificationCode();
    pendingVerifications[userId] = {
        code: verificationCode,
        method: method,
        timestamp: Date.now(),
        attempts: 0
    };
    
    users[userId].verificationCode = verificationCode;
    users[userId].verificationMethod = method;
    
    saveData(VERIFICATION_FILE, pendingVerifications);
    saveData(USERS_FILE, users);
    
    return verificationCode;
}

// Professional keyboards
function getMainMenuKeyboard(userId) {
    const status = getUserStatus(userId);
    const user = users[userId];
    const keyboard = [];
    
    // Header with user status
    if (status === 'verified' || status === 'premium') {
        keyboard.push([
            { text: '🎮 Get Steam Account', callback_data: 'get_account' },
            { text: '📊 My Profile', callback_data: 'my_stats' }
        ]);
        keyboard.push([
            { text: '🔗 Referrals', callback_data: 'referrals' },
            { text: '🎁 Rewards', callback_data: 'rewards' }
        ]);
    }
    
    if (status === 'unverified') {
        keyboard.push([
            { text: '✅ Verify Account', callback_data: 'verify' },
            { text: '❓ How to Verify', callback_data: 'verify_help' }
        ]);
    }
    
    keyboard.push([
        { text: status === 'premium' ? '💎 Premium Active' : '💎 Get Premium', callback_data: 'premium' },
        { text: '🎯 Support', callback_data: 'support' }
    ]);
    
    return { inline_keyboard: keyboard };
}

function getVerificationKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '📢 Join Channel', callback_data: 'verify_channel' },
                { text: '📱 Phone Verify', callback_data: 'verify_phone' }
            ],
            [
                { text: '🔐 Captcha Verify', callback_data: 'verify_captcha' },
                { text: '❓ Help', callback_data: 'verify_help' }
            ],
            [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
        ]
    };
}

function getAdminKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '📤 Upload Accounts', callback_data: 'admin_upload' },
                { text: '📊 Statistics', callback_data: 'admin_stats' }
            ],
            [
                { text: '👥 Manage Users', callback_data: 'admin_users' },
                { text: '✅ Verifications', callback_data: 'admin_verify' }
            ],
            [
                { text: '📢 Broadcast', callback_data: 'admin_broadcast' },
                { text: '⚙️ Settings', callback_data: 'admin_settings' }
            ]
        ]
    };
}

// Professional start command
bot.onText(/\/start(?:\s+(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    const referralCode = match ? match[1] : null;
    
    console.log(`🚀 /start from ${firstName} (${userId})`);
    
    let referredBy = null;
    if (referralCode && referralCode.startsWith('VPS')) {
        for (const [uid, user] of Object.entries(users)) {
            if (user.referralCode === referralCode && uid !== userId.toString()) {
                referredBy = uid;
                break;
            }
        }
    }
    
    const isNewUser = registerUser(userId, username, firstName, referredBy);
    const user = users[userId];
    const status = getUserStatus(userId);
    
    // Professional welcome message
    let welcomeMessage = `🎮 *Welcome to DropXBot!*\n\n`;
    
    if (isNewUser) {
        welcomeMessage += `✨ *Account Created Successfully!*\n`;
        if (referredBy) {
            welcomeMessage += `🔗 Referral bonus applied!\n`;
        }
        welcomeMessage += `\n🎯 *Getting Started:*\n`;
        welcomeMessage += `• Verify your account for access\n`;
        welcomeMessage += `• Refer friends to earn points\n`;
        welcomeMessage += `• Redeem premium Steam accounts\n\n`;
    } else {
        welcomeMessage += `👋 *Welcome back, ${firstName}!*\n\n`;
    }
    
    // Status information
    welcomeMessage += `${getStatusEmoji(status)} *Status:* ${status.toUpperCase()}\n`;
    welcomeMessage += `💰 *Points:* ${user.points}\n`;
    welcomeMessage += `🎮 *Accounts:* ${user.accountsReceived}\n`;
    
    if (isAdmin(userId)) {
        welcomeMessage += `\n🔐 *Admin Access Granted*\n`;
    }
    
    welcomeMessage += `\n🚀 *Choose an option below:*`;
    
    // Send welcome message with animation
    bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: isAdmin(userId) ? getAdminKeyboard() : getMainMenuKeyboard(userId)
    }).catch(err => console.log('Error sending welcome:', err.message));
});

// Enhanced callback query handler
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    console.log(`🔘 Callback: ${data} from ${userId}`);
    
    bot.answerCallbackQuery(callbackQuery.id).catch(err => console.log('Error:', err.message));
    
    // Update user activity
    if (users[userId]) {
        users[userId].lastActivity = Date.now();
        saveData(USERS_FILE, users);
    }
    
    try {
                  switch (data) {
              case 'get_account':
                  handleGetAccount(chatId, userId);
                  break;
            case 'my_stats':
                handleMyStats(chatId, userId);
                break;
            case 'referrals':
                handleReferrals(chatId, userId);
                break;
            case 'rewards':
                handleRewards(chatId, userId);
                break;
            case 'verify':
                handleVerificationMenu(chatId, userId);
                break;
            case 'verify_channel':
                handleChannelVerification(chatId, userId);
                break;
            case 'verify_phone':
                handlePhoneVerification(chatId, userId);
                break;
            case 'verify_captcha':
                handleCaptchaVerification(chatId, userId);
                break;
            case 'verify_help':
                handleVerificationHelp(chatId, userId);
                break;
            case 'premium':
                handlePremium(chatId, userId);
                break;
            case 'support':
                handleSupport(chatId, userId);
                break;
            case 'admin_upload':
                if (isAdmin(userId)) handleAdminUpload(chatId, userId);
                break;
            case 'admin_stats':
                if (isAdmin(userId)) handleAdminStats(chatId, userId);
                break;
            case 'admin_verify':
                if (isAdmin(userId)) handleAdminVerifications(chatId, userId);
                break;
            case 'back_to_menu':
                handleBackToMenu(chatId, userId, msg.message_id);
                break;
        }
    } catch (error) {
        console.error('Error handling callback:', error.message);
        bot.sendMessage(chatId, '❌ An error occurred. Please try again.').catch(err => console.log('Error:', err.message));
    }
});

// Handle back to menu
function handleBackToMenu(chatId, userId, messageId) {
    bot.editMessageText('🎮 *Main Menu*', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: isAdmin(userId) ? getAdminKeyboard() : getMainMenuKeyboard(userId)
    }).catch(err => console.log('Error editing message:', err.message));
}

// Handle get account request
function handleGetAccount(chatId, userId) {
    const user = users[userId];
    if (!user) {
        bot.sendMessage(chatId, '❌ Please start the bot first with /start').catch(err => console.log('Error:', err.message));
        return;
    }
    
    const status = getUserStatus(userId);
    
    if (status === 'unverified') {
        bot.sendMessage(chatId, 
            '❌ Please verify your account first to access Steam accounts.\n\n' +
            'Click "Verify Account" to get started!',
            { reply_markup: getMainMenuKeyboard(userId) }
        ).catch(err => console.log('Error:', err.message));
        return;
    }
    
    resetDailyLimits(userId);
    
    // Check daily limits
    if (!user.premium && user.dailyAccountsUsed >= CONFIG.DAILY_FREE_ACCOUNTS) {
        bot.sendMessage(chatId,
            '⏰ Daily limit reached!\n\n' +
            `You can get ${CONFIG.DAILY_FREE_ACCOUNTS} free account(s) per day.\n` +
            'Upgrade to Premium for unlimited access!',
            { reply_markup: getMainMenuKeyboard(userId) }
        ).catch(err => console.log('Error:', err.message));
        return;
    }
    
    // Show available games
    const availableGames = Object.keys(steamAccounts);
    if (availableGames.length === 0) {
        bot.sendMessage(chatId, 
            '😔 No Steam accounts available at the moment.\n' +
            'Please check back later!',
            { reply_markup: getMainMenuKeyboard(userId) }
        ).catch(err => console.log('Error:', err.message));
        return;
    }
    
    const gameKeyboard = availableGames.map(game => ([{
        text: `🎮 ${game.replace(/_/g, ' ')}`,
        callback_data: `game_${game}`
    }]));
    
    gameKeyboard.push([{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]);
    
    bot.sendMessage(chatId,
        '🎮 Choose a game to get an account:\n\n' +
        `💎 Premium users get unlimited access\n` +
        `🆓 Free users: ${CONFIG.DAILY_FREE_ACCOUNTS - user.dailyAccountsUsed} remaining today`,
        { reply_markup: { inline_keyboard: gameKeyboard } }
    ).catch(err => console.log('Error:', err.message));
}

// Handle game selection
bot.on('callback_query', (callbackQuery) => {
    const data = callbackQuery.data;
    if (data.startsWith('game_')) {
        const game = data.replace('game_', '');
        const chatId = callbackQuery.message.chat.id;
        const userId = callbackQuery.from.id;
        
        bot.answerCallbackQuery(callbackQuery.id).catch(err => console.log('Error:', err.message));
        distributeAccount(chatId, userId, game);
    }
});

// Professional verification menu
function handleVerificationMenu(chatId, userId) {
    const verificationMessage = 
        `✅ *Account Verification*\n\n` +
        `🔐 Choose your preferred verification method:\n\n` +
        `📢 *Channel Join* - Quick & Easy\n` +
        `📱 *Phone Verify* - Most Secure\n` +
        `🔐 *Captcha Verify* - Instant\n\n` +
        `💡 *Why verify?*\n` +
        `• Access to Steam accounts\n` +
        `• Unlock referral system\n` +
        `• Premium upgrade eligibility\n` +
        `• Priority support access`;
    
    bot.sendMessage(chatId, verificationMessage, {
        parse_mode: 'Markdown',
        reply_markup: getVerificationKeyboard()
    }).catch(err => console.log('Error:', err.message));
}

// Channel verification
function handleChannelVerification(chatId, userId) {
    const verificationCode = initiateVerification(userId, CONFIG.VERIFICATION_METHODS.CHANNEL_JOIN);
    
    bot.sendMessage(chatId,
        `📢 *Channel Verification*\n\n` +
        `🎯 *Steps to verify:*\n` +
        `1. Join our channel: ${CHANNEL_USERNAME}\n` +
        `2. Send this code in the channel: \`${verificationCode}\`\n` +
        `3. Return here and wait for approval\n\n` +
        `⏱️ *Verification usually takes 2-5 minutes*\n` +
        `💬 Need help? Contact ${ADMIN_USERNAME}`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📢 Join Channel', url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }],
                    [{ text: '🔄 Check Status', callback_data: 'check_verification' }],
                    [{ text: '🔙 Back', callback_data: 'verify' }]
                ]
            }
        }
    ).catch(err => console.log('Error:', err.message));
}

// Phone verification
function handlePhoneVerification(chatId, userId) {
    const verificationCode = initiateVerification(userId, CONFIG.VERIFICATION_METHODS.PHONE_VERIFY);
    
    bot.sendMessage(chatId,
        `📱 *Phone Verification*\n\n` +
        `🔐 *Your verification code:* \`${verificationCode}\`\n\n` +
        `📞 *Steps:*\n` +
        `1. Send your phone number to ${ADMIN_USERNAME}\n` +
        `2. Include this code: \`${verificationCode}\`\n` +
        `3. Wait for SMS confirmation\n\n` +
        `🛡️ *Most secure method*\n` +
        `⚡ *Usually verified within 10 minutes*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💬 Contact Admin', url: `https://t.me/${ADMIN_USERNAME.replace('@', '')}` }],
                    [{ text: '🔄 Check Status', callback_data: 'check_verification' }],
                    [{ text: '🔙 Back', callback_data: 'verify' }]
                ]
            }
        }
    ).catch(err => console.log('Error:', err.message));
}

// Captcha verification
function handleCaptchaVerification(chatId, userId) {
    const captchaAnswer = Math.floor(Math.random() * 100) + 1;
    const captchaQuestion = `${Math.floor(Math.random() * 50) + 1} + ${captchaAnswer - (Math.floor(Math.random() * 50) + 1)}`;
    
    pendingVerifications[userId] = {
        code: captchaAnswer.toString(),
        method: CONFIG.VERIFICATION_METHODS.CAPTCHA,
        timestamp: Date.now(),
        attempts: 0,
        question: captchaQuestion
    };
    
    saveData(VERIFICATION_FILE, pendingVerifications);
    
    bot.sendMessage(chatId,
        `🔐 *Captcha Verification*\n\n` +
        `🧮 *Solve this math problem:*\n` +
        `❓ What is: **${captchaQuestion}**\n\n` +
        `💡 Reply with just the number\n` +
        `⏱️ You have 5 minutes to answer`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔄 New Captcha', callback_data: 'verify_captcha' }],
                    [{ text: '🔙 Back', callback_data: 'verify' }]
                ]
            }
        }
    ).catch(err => console.log('Error:', err.message));
}

// Enhanced message handler for captcha answers
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    // Handle captcha verification
    if (pendingVerifications[userId] && pendingVerifications[userId].method === CONFIG.VERIFICATION_METHODS.CAPTCHA) {
        const verification = pendingVerifications[userId];
        
        if (text === verification.code) {
            // Correct answer
            users[userId].verified = true;
            users[userId].verificationMethod = CONFIG.VERIFICATION_METHODS.CAPTCHA;
            delete pendingVerifications[userId];
            
            saveData(USERS_FILE, users);
            saveData(VERIFICATION_FILE, pendingVerifications);
            
            bot.sendMessage(chatId,
                `🎉 *Verification Successful!*\n\n` +
                `✅ Your account is now verified!\n` +
                `🎮 You can now access Steam accounts\n` +
                `💰 Referral system activated\n` +
                `🎯 Premium upgrade available\n\n` +
                `🚀 Welcome to the community!`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getMainMenuKeyboard(userId)
                }
            ).catch(err => console.log('Error:', err.message));
        } else {
            verification.attempts++;
            if (verification.attempts >= 3) {
                delete pendingVerifications[userId];
                saveData(VERIFICATION_FILE, pendingVerifications);
                
                bot.sendMessage(chatId,
                    `❌ *Verification Failed*\n\n` +
                    `🚫 Too many incorrect attempts\n` +
                    `🔄 Please try again later\n` +
                    `💬 Or contact support: ${ADMIN_USERNAME}`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getMainMenuKeyboard(userId)
                    }
                ).catch(err => console.log('Error:', err.message));
            } else {
                bot.sendMessage(chatId,
                    `❌ *Incorrect Answer*\n\n` +
                    `🔢 The answer to **${verification.question}** is not **${text}**\n` +
                    `🎯 Attempts remaining: ${3 - verification.attempts}\n` +
                    `💡 Try again with just the number`,
                    { parse_mode: 'Markdown' }
                ).catch(err => console.log('Error:', err.message));
            }
            saveData(VERIFICATION_FILE, pendingVerifications);
        }
    }
});

// Professional game cover images
function getGameCoverImage(gameName) {
    const gameCovers = {
        "Counter_Strike_2": "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg",
        "Grand_Theft_Auto_V": "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg",
        "Rocket_League": "https://cdn.akamai.steamstatic.com/steam/apps/252950/header.jpg",
        "Assetto_Corsa": "https://cdn.akamai.steamstatic.com/steam/apps/244210/header.jpg",
        "BeamNG_drive": "https://cdn.akamai.steamstatic.com/steam/apps/284160/header.jpg",
        "Cyberpunk_2077": "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
        "Red_Dead_Redemption_2": "https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg",
        "Apex_Legends": "https://cdn.akamai.steamstatic.com/steam/apps/1172470/header.jpg",
        "Valorant": "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt5a5b8b2ce8d0bf6d/5eb7cdc1b1eca2be4e29a5b3/Valorant_keyart.jpg",
        "Fortnite": "https://cdn2.unrealengine.com/fortnite-chapter-4-season-2-mega-1920x1080-76a1e8eb0d3a.jpg"
    };
    
    return gameCovers[gameName] || "https://cdn.akamai.steamstatic.com/steam/apps/default/header.jpg";
}

function distributeAccount(chatId, userId, game) {
    const user = users[userId];
    const account = steamAccounts[game];
    
    if (!account) {
        bot.sendMessage(chatId, '❌ This game is no longer available.').catch(err => console.log('Error:', err.message));
        return;
    }
    
    // Send game cover image first
    const coverImage = getGameCoverImage(game);
    bot.sendPhoto(chatId, coverImage, {
        caption: `🎮 ${game.replace(/_/g, ' ')}`
    }).catch(err => console.log('Error sending cover:', err.message));
    
    // Rest of your existing distributeAccount code...
    console.log(`🎮 Distributing ${game} account to ${userId}`);
    
    delete steamAccounts[game];
    saveData(ACCOUNTS_FILE, steamAccounts);
    
    user.accountsReceived++;
    if (!user.premium) {
        user.dailyAccountsUsed++;
    }
    saveData(USERS_FILE, users);
    
    const accountMessage = 
        `🎉 Steam Account Delivered!\n\n` +
        `🎮 Game: ${game.replace(/_/g, ' ')}\n` +
        `👤 Login: \`${account.login}\`\n` +
        `🔐 Password: \`${account.password}\`\n\n` +
        `⚠️ Important Notes:\n` +
        `• Change password after first login\n` +
        `• Don't share account details\n` +
        `• Use Steam Guard if required\n\n` +
        `📊 Total accounts received: ${user.accountsReceived}`;
    
    bot.sendMessage(chatId, accountMessage, { 
        parse_mode: 'Markdown',
        reply_markup: getMainMenuKeyboard(userId)
    }).catch(err => console.log('Error:', err.message));
}

// Handle user stats
function handleMyStats(chatId, userId) {
    const user = users[userId];
    if (!user) return;
    
    resetDailyLimits(userId);
    
    const statsMessage = 
        `📊 Your Statistics\n\n` +
        `👤 Name: ${user.firstName}\n` +
        `🆔 User ID: ${user.id}\n` +
        `📅 Member since: ${new Date(user.joinDate).toLocaleDateString()}\n` +
        `✅ Status: ${getUserStatus(userId).toUpperCase()}\n` +
        `💰 Points: ${user.points}\n` +
        `🎮 Accounts received: ${user.accountsReceived}\n` +
        `📈 Referrals: ${user.referrals.length}\n` +
        `📊 Daily accounts used: ${user.dailyAccountsUsed}/${user.premium ? '∞' : CONFIG.DAILY_FREE_ACCOUNTS}`;
    
    bot.sendMessage(chatId, statsMessage, {
        reply_markup: {
            inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
        }
    }).catch(err => console.log('Error:', err.message));
}

// Handle referrals
function handleReferrals(chatId, userId) {
    const user = users[userId];
    if (!user) return;
    
    const referralMessage = 
        `🔗 Referral System\n\n` +
        `Your referral code: \`${user.referralCode}\`\n` +
        `Share link: https://t.me/${BOT_USERNAME}?start=${user.referralCode}\n\n` +
        `💰 Points per referral: ${CONFIG.POINTS_PER_REFERRAL}\n` +
        `📈 Your referrals: ${user.referrals.length}\n` +
        `💎 Total points earned: ${user.referrals.length * CONFIG.POINTS_PER_REFERRAL}\n\n` +
        `🎁 Invite friends and earn points for premium features!`;
    
    bot.sendMessage(chatId, referralMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
        }
    }).catch(err => console.log('Error:', err.message));
}

// Handle verification
function handleVerification(chatId, userId) {
    bot.sendMessage(chatId,
        '✅ Account Verification\n\n' +
        'To verify your account, please:\n' +
        `1. Join our channel: ${CHANNEL_USERNAME}\n` +
        '2. Send a screenshot of your joined status\n' +
        '3. Wait for admin approval\n\n' +
        `Or contact admin directly: ${ADMIN_USERNAME}`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📢 Join Channel', url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }],
                    [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
                ]
            }
        }
    ).catch(err => console.log('Error:', err.message));
}

// Handle premium
function handlePremium(chatId, userId) {
    const user = users[userId];
    if (!user) return;
    
    const premiumMessage = user.premium 
        ? `💎 You already have Premium access!\n\n✨ Benefits:\n• Unlimited daily accounts\n• Priority support\n• Early access to new games`
        : `💎 Premium Membership\n\n✨ Benefits:\n• Unlimited daily accounts\n• Priority support\n• Early access to new games\n• No waiting time\n\n💰 Cost: ${CONFIG.PREMIUM_ACCOUNTS_COST} points\n📊 Your points: ${user.points}\n\n${ADMIN_USERNAME} to upgrade!`;
    
    bot.sendMessage(chatId, premiumMessage, {
        reply_markup: {
            inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
        }
    }).catch(err => console.log('Error:', err.message));
}

// Handle help
function handleHelp(chatId, userId) {
    const helpMessage = 
        `❓ Help & Support\n\n` +
        `🎮 How to get accounts:\n` +
        `1. Verify your account first\n` +
        `2. Choose "Get Steam Account"\n` +
        `3. Select your desired game\n` +
        `4. Receive login credentials\n\n` +
        `🔗 Earn points:\n` +
        `• Refer friends (+${CONFIG.POINTS_PER_REFERRAL} points each)\n` +
        `• Use points for premium features\n\n` +
        `💬 Need help?\n` +
        `Contact: ${ADMIN_USERNAME}`;
    
    bot.sendMessage(chatId, helpMessage, {
        reply_markup: {
            inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]]
        }
    }).catch(err => console.log('Error:', err.message));
}

// Admin functions
function handleAdminUpload(chatId, userId) {
    bot.sendMessage(chatId,
        '📤 Upload Steam Accounts\n\n' +
        'Send a JSON file with the following format:\n\n' +
        '```json\n' +
        '{\n' +
        '  "GameName": {\n' +
        '    "login": "username",\n' +
        '    "password": "password"\n' +
        '  }\n' +
        '}\n' +
        '```',
        { parse_mode: 'Markdown' }
    ).catch(err => console.log('Error:', err.message));
}

function handleAdminStats(chatId, userId) {
    const totalUsers = Object.keys(users).length;
    const verifiedUsers = Object.values(users).filter(u => u.verified).length;
    const premiumUsers = Object.values(users).filter(u => u.premium).length;
    const totalAccounts = Object.keys(steamAccounts).length;
    const totalReferrals = Object.values(users).reduce((sum, u) => sum + u.referrals.length, 0);
    
    const statsMessage = 
        `📊 Bot Statistics\n\n` +
        `👥 Total users: ${totalUsers}\n` +
        `✅ Verified users: ${verifiedUsers}\n` +
        `💎 Premium users: ${premiumUsers}\n` +
        `🎮 Available accounts: ${totalAccounts}\n` +
        `🔗 Total referrals: ${totalReferrals}\n` +
        `📈 Accounts distributed: ${Object.values(users).reduce((sum, u) => sum + u.accountsReceived, 0)}\n` +
        `⏰ Bot uptime: ${Math.floor(process.uptime())} seconds`;
    
    bot.sendMessage(chatId, statsMessage, {
        reply_markup: {
            inline_keyboard: [[{ text: '🔙 Back to Admin Menu', callback_data: 'back_to_menu' }]]
        }
    }).catch(err => console.log('Error:', err.message));
}

// Handle file uploads (for admin)
bot.on('document', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isAdmin(userId)) {
        bot.sendMessage(chatId, '❌ Unauthorized access.').catch(err => console.log('Error:', err.message));
        return;
    }
    
    console.log(`📄 File upload from admin: ${msg.document.file_name}`);
    
    const fileId = msg.document.file_id;
    
    bot.getFile(fileId).then((file) => {
        const filePath = file.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        
        // Download and process file using https module
        const https = require('https');
        https.get(fileUrl, (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                try {
                    const newAccounts = JSON.parse(data);
                    const accountCount = Object.keys(newAccounts).length;
                    
                    // Merge with existing accounts
                    Object.assign(steamAccounts, newAccounts);
                    saveData(ACCOUNTS_FILE, steamAccounts);
                    
                    console.log(`✅ Successfully uploaded ${accountCount} accounts`);
                    
                    bot.sendMessage(chatId, 
                        `✅ Successfully uploaded ${accountCount} new accounts!\n` +
                        `📊 Total accounts available: ${Object.keys(steamAccounts).length}\n\n` +
                        `Games added:\n` +
                        Object.keys(newAccounts).map(game => `• ${game.replace(/_/g, ' ')}`).join('\n')
                    ).catch(err => console.log('Error:', err.message));
                } catch (error) {
                    console.error('Error parsing JSON:', error.message);
                    bot.sendMessage(chatId, 
                        '❌ Invalid JSON format. Please check your file.\n\n' +
                        'Expected format:\n' +
                        '```json\n' +
                        '{\n' +
                        '  "GameName": {\n' +
                        '    "login": "username",\n' +
                        '    "password": "password"\n' +
                        '  }\n' +
                        '}\n' +
                        '```',
                        { parse_mode: 'Markdown' }
                    ).catch(err => console.log('Error:', err.message));
                }
            });
        }).on('error', (error) => {
            console.error('Error downloading file:', error.message);
            bot.sendMessage(chatId, '❌ Error downloading file. Please try again.').catch(err => console.log('Error:', err.message));
        });
    }).catch((error) => {
        console.error('Error getting file:', error.message);
        bot.sendMessage(chatId, '❌ Error processing file. Please try again.').catch(err => console.log('Error:', err.message));
    });
});

// Admin commands
bot.onText(/\/verify (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetUserId = match[1];
    
    if (!isAdmin(userId)) {
        bot.sendMessage(chatId, '❌ Unauthorized access.').catch(err => console.log('Error:', err.message));
        return;
    }
    
    if (users[targetUserId]) {
        users[targetUserId].verified = true;
        saveData(USERS_FILE, users);
        
        console.log(`✅ User ${targetUserId} verified by admin`);
        
        bot.sendMessage(chatId, `✅ User ${targetUserId} has been verified.`).catch(err => console.log('Error:', err.message));
        bot.sendMessage(targetUserId, 
            '🎉 Your account has been verified! You can now access Steam accounts.\n\n' +
            'Use /start to continue.'
        ).catch(err => console.log('Error sending verification notification:', err.message));
    } else {
        bot.sendMessage(chatId, '❌ User not found.').catch(err => console.log('Error:', err.message));
    }
});

bot.onText(/\/premium (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetUserId = match[1];
    
    if (!isAdmin(userId)) {
        bot.sendMessage(chatId, '❌ Unauthorized access.').catch(err => console.log('Error:', err.message));
        return;
    }
    
    if (users[targetUserId]) {
        users[targetUserId].premium = true;
        users[targetUserId].verified = true; // Auto-verify premium users
        saveData(USERS_FILE, users);
        
        console.log(`💎 User ${targetUserId} upgraded to premium by admin`);
        
        bot.sendMessage(chatId, `💎 User ${targetUserId} has been upgraded to premium.`).catch(err => console.log('Error:', err.message));
        bot.sendMessage(targetUserId, 
            '🎉 Congratulations! You now have Premium access!\n\n' +
            '✨ Premium Benefits:\n' +
            '• Unlimited daily accounts\n' +
            '• Priority support\n' +
            '• Early access to new games\n\n' +
            'Use /start to continue.'
        ).catch(err => console.log('Error sending premium notification:', err.message));
    } else {
        bot.sendMessage(chatId, '❌ User not found.').catch(err => console.log('Error:', err.message));
    }
});

// Admin broadcast command
bot.onText(/\/broadcast (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const message = match[1];
    
    if (!isAdmin(userId)) {
        bot.sendMessage(chatId, '❌ Unauthorized access.').catch(err => console.log('Error:', err.message));
        return;
    }
    
    const userIds = Object.keys(users);
    let sentCount = 0;
    let failedCount = 0;
    
    bot.sendMessage(chatId, `📢 Broadcasting message to ${userIds.length} users...`).catch(err => console.log('Error:', err.message));
    
    userIds.forEach((uid, index) => {
        setTimeout(() => {
            bot.sendMessage(uid, `📢 Admin Announcement:\n\n${message}`)
                .then(() => {
                    sentCount++;
                    if (index === userIds.length - 1) {
                        bot.sendMessage(chatId, 
                            `✅ Broadcast completed!\n` +
                            `📤 Sent: ${sentCount}\n` +
                            `❌ Failed: ${failedCount}`
                        ).catch(err => console.log('Error:', err.message));
                    }
                })
                .catch(err => {
                    failedCount++;
                    console.log(`Failed to send broadcast to ${uid}:`, err.message);
                    if (index === userIds.length - 1) {
                        bot.sendMessage(chatId, 
                            `✅ Broadcast completed!\n` +
                            `📤 Sent: ${sentCount}\n` +
                            `❌ Failed: ${failedCount}`
                        ).catch(err => console.log('Error:', err.message));
                    }
                });
        }, index * 100); // 100ms delay between messages to avoid rate limits
    });
});

// Admin stats command
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isAdmin(userId)) {
        bot.sendMessage(chatId, '❌ Unauthorized access.').catch(err => console.log('Error:', err.message));
        return;
    }
    
    handleAdminStats(chatId, userId);
});

// Help command for all users
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    handleHelp(chatId, userId);
});

// Error handling
bot.on('polling_error', (error) => {
    console.error('🚨 Polling error:', error.message);
    
    // Try to restart polling after error
    setTimeout(() => {
        console.log('🔄 Attempting to restart polling...');
        bot.stopPolling().then(() => {
            bot.startPolling();
        }).catch(err => {
            console.error('Failed to restart polling:', err.message);
        });
    }, 5000);
});

bot.on('error', (error) => {
    console.error('🚨 Bot error:', error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down bot gracefully...');
    bot.stopPolling().then(() => {
        console.log('✅ Bot stopped successfully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    bot.stopPolling().then(() => {
        console.log('✅ Bot stopped successfully');
        process.exit(0);
    });
});

// Initialize default accounts if none exist (for testing)
if (Object.keys(steamAccounts).length === 0) {
    console.log('📝 Creating sample accounts for testing...');
    steamAccounts = {
        "Counter_Strike_2": {
            "login": "demo_user_cs2",
            "password": "demo_pass_123"
        },
        "Grand_Theft_Auto_V": {
            "login": "demo_user_gta",
            "password": "demo_pass_456"
        },
        "Rocket_League": {
            "login": "demo_user_rl",
            "password": "demo_pass_789"
        }
    };
    saveData(ACCOUNTS_FILE, steamAccounts);
}

// Bot ready message
bot.getMe().then((botInfo) => {
    console.log('🤖 Bot successfully started!');
    console.log(`📱 Bot Name: ${botInfo.first_name}`);
    console.log(`🆔 Bot Username: @${botInfo.username}`);
    console.log(`👤 Admin ID: ${ADMIN_ID}`);
    console.log(`📊 Users: ${Object.keys(users).length}`);
    console.log(`🎮 Available Accounts: ${Object.keys(steamAccounts).length}`);
    console.log('✅ Bot is ready to serve users!');
    
    // Send startup notification to admin
    if (ADMIN_ID && ADMIN_ID !== 'YOUR_ADMIN_TELEGRAM_ID') {
        bot.sendMessage(ADMIN_ID, 
            `🤖 Steam Accounts Bot Started!\n\n` +
            `📊 Status: Online\n` +
            `👥 Users: ${Object.keys(users).length}\n` +
            `🎮 Available accounts: ${Object.keys(steamAccounts).length}\n` +
            `⏰ Started at: ${new Date().toLocaleString()}`
        ).catch(err => console.log('Could not send startup notification to admin:', err.message));
    }
}).catch((error) => {
    console.error('❌ Failed to start bot:', error.message);
    process.exit(1);
});