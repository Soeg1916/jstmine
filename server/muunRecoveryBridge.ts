import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface RecoveryOptions {
  recoveryCode: string;
  encryptionKey1: string;
  encryptionKey2: string;
  bitcoinAddress: string;
  feeLevel: 'low' | 'medium' | 'high';
}

interface RecoveryProgress {
  walletsScanned: number;
  satoshisFound: number | null;
  status: 'scanning' | 'complete' | 'error';
  message: string;
  txHash?: string; 
}

/**
 * Handles the real recovery process by executing the Go-based Muun recovery tool
 */
export class MuunRecoveryBridge {
  private tempDir: string;
  private recoveryToolDir: string;
  private keysFile: string;
  private onProgress: (progress: RecoveryProgress) => void;

  constructor(onProgressCallback: (progress: RecoveryProgress) => void) {
    this.recoveryToolDir = path.resolve('./recovery-master');
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muun-recovery-'));
    this.keysFile = path.join(this.tempDir, 'encryption_keys.txt');
    this.onProgress = onProgressCallback;
  }

  /**
   * Writes temporary files needed for the recovery process
   */
  private async setupTempFiles(encryptionKey1: string, encryptionKey2: string): Promise<void> {
    // Save encryption keys to file - one per line
    await fs.promises.writeFile(this.keysFile, `${encryptionKey1}\n${encryptionKey2}`);
  }

  /**
   * Get fee rate (in sats/byte) based on selected fee level
   */
  private getFeeRate(feeLevel: 'low' | 'medium' | 'high'): number {
    // These values should be adjusted based on current network conditions
    // For a production app, we'd fetch these from a fee estimation service
    switch (feeLevel) {
      case 'low':
        return 10; // Low priority: ~10 sats/byte
      case 'medium':
        return 25; // Medium priority: ~25 sats/byte
      case 'high':
        return 50; // High priority: ~50 sats/byte
      default:
        return 25; // Default to medium
    }
  }

  /**
   * Execute the recovery tool with all required parameters
   * Now using the actual Go-based recovery tool
   */
  public async executeRecovery(options: RecoveryOptions): Promise<string | null> {
    try {
      console.log('Executing real recovery process with options:', {
        recoveryCode: options.recoveryCode.substring(0, 4) + '...',
        bitcoinAddress: options.bitcoinAddress.substring(0, 6) + '...',
        feeLevel: options.feeLevel
      });
      
      // Set up temporary files
      await this.setupTempFiles(options.encryptionKey1, options.encryptionKey2);

      // Execute the real Go-based recovery tool with the validated dependencies
      const txHash = await this.runGoRecoveryTool(options);
      return txHash;
      
    } catch (error) {
      this.cleanup();
      console.error('Error in recovery process:', error);
      this.onProgress({
        walletsScanned: 0,
        satoshisFound: null,
        status: 'error',
        message: `Error executing recovery: ${error instanceof Error ? error.message : String(error)}`
      });
      return null;
    }
  }
  
  /**
   * Run the actual Go-based recovery tool using the compiled binary
   */
  private async runGoRecoveryTool(options: RecoveryOptions): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Starting real recovery process with Muun recovery tool...');
        
        // Make sure the recovery tool script is executable
        const toolPath = path.join(this.recoveryToolDir, 'recovery-tool');
        fs.chmodSync(toolPath, '755');
        
        // Based on examining the Go code, we need to run the recovery tool with --only-scan=true for scan mode
        // We can also add an optional Electrum server with --electrum-server=<server> if needed
        const args = options.feeLevel !== 'high' ? ['--only-scan=true'] : [];
        
        // First check if the recovery tool exists and is executable
        if (!fs.existsSync(toolPath)) {
          throw new Error(`Recovery tool not found at path: ${toolPath}`);
        }
        
        console.log(`Verified recovery tool exists at ${toolPath}`);
          
        // Launch the recovery tool process
        const recoveryProcess = spawn('./recovery-tool', args, {
          cwd: this.recoveryToolDir,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            // Add any extra environment variables the tool might need
            RECOVERY_MODE: 'interactive'
          }
        });
        
        let walletsScanned = 0;
        let satoshisFound = 0;
        let txHash: string | undefined = undefined;
        let currentPrompt = '';
        let hasFoundFunds = false;
        
        // Set up a timeout to prevent the process from hanging indefinitely
        const processTimeout = setTimeout(() => {
          console.error('Recovery process timed out after 15 minutes');
          recoveryProcess.kill();
          reject(new Error('Recovery process timed out after 15 minutes'));
        }, 15 * 60 * 1000);
        
        // Helper function to handle stdin writes with proper error handling
        const writeToStdin = (input: string) => {
          try {
            if (recoveryProcess.stdin.writable) {
              recoveryProcess.stdin.write(input + '\n');
              console.log(`Wrote to recovery tool: ${input.substring(0, 4)}${input.length > 4 ? '...' : ''}`);
            } else {
              console.error('Cannot write to recovery tool stdin: stream is not writable');
            }
          } catch (error) {
            console.error('Error writing to recovery tool stdin:', error);
          }
        };
        
        // Process stdout from the recovery tool
        recoveryProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('Recovery tool output:', output);
          currentPrompt += output;
          
          // Parse scanning progress - look for "Scanned addresses: X" pattern
          const scanMatch = output.match(/Scanned addresses: (\d+)/i);
          if (scanMatch && scanMatch[1]) {
            walletsScanned = parseInt(scanMatch[1], 10);
            this.onProgress({
              walletsScanned,
              satoshisFound: hasFoundFunds ? satoshisFound : null,
              status: 'scanning',
              message: `Scanning wallets: ${walletsScanned} addresses checked`
            });
          }
          
          // Check for "sats total" pattern to find total amount discovered
          const totalMatch = output.match(/(\d+) sats total/i);
          if (totalMatch && totalMatch[1]) {
            satoshisFound = parseInt(totalMatch[1], 10);
            hasFoundFunds = satoshisFound > 0;
            
            if (hasFoundFunds) {
              this.onProgress({
                walletsScanned,
                satoshisFound,
                status: 'scanning',
                message: `Found ${satoshisFound} satoshis! Continuing scan...`
              });
            }
          }
          
          // Look for individual UTXO finds in the format "X sats in ADDRESS"
          const utxoMatch = output.match(/(\d+) sats in ([a-zA-Z0-9]+)/);
          if (utxoMatch && utxoMatch[1]) {
            const utxoAmount = parseInt(utxoMatch[1], 10);
            const utxoAddress = utxoMatch[2];
            console.log(`Found UTXO: ${utxoAmount} sats in ${utxoAddress}`);
          }
          
          // Handle various prompts from the recovery tool and respond appropriately
          
          // Recovery Code prompt
          if (currentPrompt.includes('Enter your Recovery Code')) {
            writeToStdin(options.recoveryCode);
            currentPrompt = '';
          }
          
          // First encrypted private key prompt
          else if (currentPrompt.includes('Enter your first encrypted private key')) {
            writeToStdin(options.encryptionKey1);
            currentPrompt = '';
          }
          
          // Second encrypted private key prompt
          else if (currentPrompt.includes('Enter your second encrypted private key')) {
            writeToStdin(options.encryptionKey2);
            currentPrompt = '';
          }
          
          // Bitcoin address prompt (if not in scan-only mode)
          else if (currentPrompt.includes('Enter your destination bitcoin address')) {
            writeToStdin(options.bitcoinAddress);
            currentPrompt = '';
          }
          
          // Fee rate prompt
          else if (currentPrompt.includes('Enter the fee rate (sats/byte)')) {
            const feeRate = this.getFeeRate(options.feeLevel);
            writeToStdin(feeRate.toString());
            currentPrompt = '';
          }
          
          // Confirmation prompt
          else if (currentPrompt.includes('Confirm?')) {
            writeToStdin('y'); // Auto-confirm the transaction
            currentPrompt = '';
          }
          
          // Detect transaction completion and extract hash
          const txHashMatch = output.match(/Transaction sent!.*?([a-f0-9]{64})/i);
          if (txHashMatch && txHashMatch[1]) {
            txHash = txHashMatch[1];
            console.log(`Transaction successfully sent with hash: ${txHash}`);
            
            this.onProgress({
              walletsScanned,
              satoshisFound,
              status: 'complete',
              message: `Transaction sent! Funds recovered: ${satoshisFound} satoshis`,
              txHash
            });
          }
          
          // Detect scan completion without funds
          if (output.includes('No funds were discovered')) {
            this.onProgress({
              walletsScanned,
              satoshisFound: 0,
              status: 'complete',
              message: 'Scan complete. No funds were found.'
            });
          }
        });
        
        // Handle error output
        recoveryProcess.stderr.on('data', (data) => {
          const errorOutput = data.toString();
          console.error('Recovery tool error:', errorOutput);
          
          // Some Go compilation or warning messages might come through stderr but aren't fatal
          if (!errorOutput.includes('warning:') && !errorOutput.includes('#')) {
            this.onProgress({
              walletsScanned,
              satoshisFound: hasFoundFunds ? satoshisFound : null,
              status: 'error',
              message: `Error: ${errorOutput}`
            });
          }
        });
        
        // Process exit handler
        recoveryProcess.on('close', (code) => {
          clearTimeout(processTimeout);
          this.cleanup();
          
          if (code === 0) {
            if (hasFoundFunds && txHash) {
              // Successfully sent transaction
              resolve(txHash);
            } else if (hasFoundFunds) {
              // Found funds but no transaction (scan-only mode)
              this.onProgress({
                walletsScanned,
                satoshisFound,
                status: 'complete',
                message: `Scan complete. Found ${satoshisFound} satoshis that can be recovered.`
              });
              resolve(null);
            } else {
              // No funds found
              this.onProgress({
                walletsScanned,
                satoshisFound: 0,
                status: 'complete',
                message: 'Scan complete. No funds were found.'
              });
              resolve(null);
            }
          } else {
            console.error(`Recovery process exited with code ${code}`);
            reject(new Error(`Recovery process exited with code ${code}`));
          }
        });
        
        // Handle unexpected errors
        recoveryProcess.on('error', (error) => {
          clearTimeout(processTimeout);
          console.error('Error executing recovery tool:', error);
          this.cleanup();
          reject(error);
        });
        
      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }
  
  /**
   * Simulates the recovery process for demonstration purposes
   * This allows testing the UI flow without requiring the actual Go tool
   */
  private simulateRecoveryProcess(options: RecoveryOptions): Promise<string | null> {
    return new Promise((resolve) => {
      console.log('Starting simulated recovery process with options:', {
        recoveryCode: options.recoveryCode.substring(0, 4) + '...',
        bitcoinAddress: options.bitcoinAddress.substring(0, 6) + '...',
        feeLevel: options.feeLevel
      });
      
      // Simulate initial progress
      this.onProgress({
        walletsScanned: 0,
        satoshisFound: null,
        status: 'scanning',
        message: 'Starting wallet scan...'
      });
      
      let walletsScanned = 0;
      const totalWallets = 20000;
      const scanInterval = setInterval(() => {
        // Increase scanned count
        walletsScanned += Math.floor(Math.random() * 500) + 200;
        walletsScanned = Math.min(walletsScanned, totalWallets);
        
        // Send progress update
        this.onProgress({
          walletsScanned,
          satoshisFound: null,
          status: 'scanning',
          message: `Scanning wallets: ${walletsScanned} addresses checked`
        });
        
        // Simulate finding satoshis at 80% progress
        if (walletsScanned > totalWallets * 0.8 && walletsScanned < totalWallets * 0.9) {
          clearInterval(scanInterval);
          
          // Simulate found funds
          const satoshisFound = Math.floor(Math.random() * 1000000) + 500000; // 0.5 to 1.5 BTC
          
          this.onProgress({
            walletsScanned,
            satoshisFound,
            status: 'scanning',
            message: `Found ${satoshisFound} satoshis! Preparing transaction...`
          });
          
          // Simulate transaction preparation
          setTimeout(() => {
            // Generate a realistic-looking transaction hash
            const txHash = Array.from({length: 64}, () => 
              '0123456789abcdef'[Math.floor(Math.random() * 16)]
            ).join('');
            
            // Complete the process
            this.onProgress({
              walletsScanned,
              satoshisFound,
              status: 'complete',
              message: `Transaction sent! Funds recovered: ${satoshisFound} satoshis`,
              txHash
            });
            
            // Resolve the promise with the transaction hash
            resolve(txHash);
          }, 5000);
        } else if (walletsScanned >= totalWallets) {
          // Complete scan if we reached the end
          clearInterval(scanInterval);
          
          // If we got here without finding coins, report no funds
          this.onProgress({
            walletsScanned,
            satoshisFound: 0,
            status: 'complete',
            message: 'Scan complete. No funds were found.'
          });
          
          // Resolve with null to indicate no transaction was created
          resolve(null);
        }
      }, 1000);
    });
  }
  
  /**
   * Clean up temporary files
   */
  private cleanup(): void {
    try {
      // Remove temporary directory and files
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up recovery files:', error);
    }
  }
}