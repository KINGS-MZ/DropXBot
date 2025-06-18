const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const express = require('express');

// Simple server for web-based hosting platforms
const app = express();
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 Steam Accounts Bot</h1>
        <p>Bot Status: <span style="color: green;">✅ Online</span></p>
        <p>Uptime: ${process.uptime()} seconds</p>
        <p>Last Update: ${new Date().toLocaleString()}</p>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Bot configuration with environment variables
const BOT_TOKEN = process.env.BOT_TOKEN || '7283540512:AAE6UAq6j8y9YkrAMv26RoLoq8e4FXYOdr4';
const ADMIN_ID = process.env.ADMIN_ID || '7008504508'; // Updated admin ID
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || '@YourChannel';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '@YourAdminUsername';
const BOT_USERNAME = process.env.BOT_USERNAME || '@VPsyncBot'; // Updated bot username

console.log('🚀 Initializing Steam Accounts Bot...');
console.log(`📱 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log(`👤 Admin ID: ${ADMIN_ID}`);

const bot = new TelegramBot(BOT_TOKEN, { 
    polling: {
        interval: 1000,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

// Data storage files
const USERS_FILE = 'users.json';
const ACCOUNTS_FILE = 'steam_accounts.json';
const REFERRALS_FILE = 'referrals.json';

// Initialize data storage
let users = loadData(USERS_FILE) || {};
let steamAccounts = loadData(ACCOUNTS_FILE) || {};
let referrals = loadData(REFERRALS_FILE) || {};

// Create accounts directory if it doesn't exist
if (!fs.existsSync('./accounts')) {
    fs.mkdirSync('./accounts');
    console.log('📁 Created accounts directory');
}

// If no accounts, try to load from alternative location
if (Object.keys(steamAccounts).length === 0 && fs.existsSync('./accounts/steam_accounts.json')) {
    try {
        steamAccounts = JSON.parse(fs.readFileSync('./accounts/steam_accounts.json', 'utf8'));
        console.log('📁 Loaded accounts from accounts directory');
    } catch (error) {
        console.error('❌ Error loading accounts from accounts directory:', error.message);
    }
}

// Configuration
const CONFIG = {
    POINTS_PER_REFERRAL: 10,
    VERIFICATION_REQUIRED: true,
    MIN_POINTS_FOR_ACCOUNT: 5,
    DAILY_FREE_ACCOUNTS: 1,
    PREMIUM_ACCOUNTS_COST: 20
};

// Utility functions
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
        console.log(`💾 Saved data to ${filename}`);
    } catch (error) {
        console.error(`❌ Error saving ${filename}:`, error.message);
    }
}

function generateReferralCode(userId) {
    return `REF${userId}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
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

// User registration and verification
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
            referrals: []
        };

        if (referredBy && users[referredBy]) {
            users[referredBy].referrals.push(userId);
            users[referredBy].points += CONFIG.POINTS_PER_REFERRAL;
            
            // Notify referrer
            bot.sendMessage(referredBy, 
                `🎉 Great news! Someone joined using your referral code!\n` +
                `💰 You earned ${CONFIG.POINTS_PER_REFERRAL} points!\n` +
                `📊 Total referrals: ${users[referredBy].referrals.length}`
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

// Main menu keyboard
function getMainMenuKeyboard(userId) {
    const status = getUserStatus(userId);
    const keyboard = [];
    
    if (status === 'verified' || status === 'premium') {
        keyboard.push([{ text: '🎮 Get Steam Account', callback_data: 'get_account' }]);
        keyboard.push([
            { text: '📊 My Stats', callback_data: 'my_stats' },
            { text: '🔗 Referrals', callback_data: 'referrals' }
        ]);
    }
    
    if (status === 'unverified') {
        keyboard.push([{ text: '✅ Verify Account', callback_data: 'verify' }]);
    }
    
    keyboard.push([
        { text: '💎 Premium', callback_data: 'premium' },
        { text: '❓ Help', callback_data: 'help' }
    ]);
    
    return { inline_keyboard: keyboard };
}

// Admin keyboard
function getAdminKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '📤 Upload Accounts', callback_data: 'admin_upload' }],
            [{ text: '📊 Bot Stats', callback_data: 'admin_stats' }],
            [{ text: '👥 User Management', callback_data: 'admin_users' }],
            [{ text: '🔧 Settings', callback_data: 'admin_settings' }]
        ]
    };
}

// Start command
bot.onText(/\/start(?:\s+(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    const referralCode = match ? match[1] : null;
    
    console.log(`🚀 /start command from ${firstName} (${userId})`);
    
    let referredBy = null;
    if (referralCode && referralCode.startsWith('REF')) {
        // Find user by referral code
        for (const [uid, user] of Object.entries(users)) {
            if (user.referralCode === referralCode && uid !== userId.toString()) {
                referredBy = uid;
                break;
            }
        }
    }
    
    const isNewUser = registerUser(userId, username, firstName, referredBy);
    
    let welcomeMessage = `🎮 Welcome to Steam Accounts Bot!\n\n`;
    
    if (isNewUser) {
        welcomeMessage += `✨ Account created successfully!\n`;
        if (referredBy) {
            welcomeMessage += `🔗 You were referred by another user - they earned bonus points!\n`;
        }
        welcomeMessage += `\n📋 To get started:\n`;
        welcomeMessage += `1. Verify your account\n`;
        welcomeMessage += `2. Start earning points through referrals\n`;
        welcomeMessage += `3. Redeem Steam accounts\n\n`;
    } else {
        welcomeMessage += `👋 Welcome back, ${firstName}!\n\n`;
    }
    
    if (isAdmin(userId)) {
        welcomeMessage += `🔐 Admin panel is available for you.\n\n`;
    }
    
    welcomeMessage += `Choose an option below:`;
    
    bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: isAdmin(userId) ? getAdminKeyboard() : getMainMenuKeyboard(userId)
    }).catch(err => console.log('Error sending welcome message:', err.message));
});

// Callback query handler
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    console.log(`🔘 Callback query: ${data} from ${userId}`);
    
    bot.answerCallbackQuery(callbackQuery.id).catch(err => console.log('Error answering callback:', err.message));
    
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
            case 'verify':
                handleVerification(chatId, userId);
                break;
            case 'premium':
                handlePremium(chatId, userId);
                break;
            case 'help':
                handleHelp(chatId, userId);
                break;
            case 'admin_upload':
                if (isAdmin(userId)) handleAdminUpload(chatId, userId);
                break;
            case 'admin_stats':
                if (isAdmin(userId)) handleAdminStats(chatId, userId);
                break;
            case 'back_to_menu':
                bot.editMessageText('🎮 Main Menu:', {
                    chat_id: chatId,
                    message_id: msg.message_id,
                    reply_markup: isAdmin(userId) ? getAdminKeyboard() : getMainMenuKeyboard(userId)
                }).catch(err => console.log('Error editing message:', err.message));
                break;
        }
    } catch (error) {
        console.error('Error handling callback query:', error.message);
        bot.sendMessage(chatId, '❌ An error occurred. Please try again.').catch(err => console.log('Error sending error message:', err.message));
    }
});

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

function distributeAccount(chatId, userId, game) {
    const user = users[userId];
    const account = steamAccounts[game];
    
    if (!account) {
        bot.sendMessage(chatId, '❌ This game is no longer available.').catch(err => console.log('Error:', err.message));
        return;
    }
    
    console.log(`🎮 Distributing ${game} account to ${userId}`);
    
    // Remove account from available list
    delete steamAccounts[game];
    saveData(ACCOUNTS_FILE, steamAccounts);
    
    // Update user stats
    user.accountsReceived++;
    if (!user.premium) {
        user.dailyAccountsUsed++;
    }
    saveData(USERS_FILE, users);
    
    // Send account details
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