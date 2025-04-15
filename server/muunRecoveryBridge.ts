import { exec } from 'child_process';
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
  private recoveryToolPath: string;
  private keysFile: string;
  private onProgress: (progress: RecoveryProgress) => void;

  constructor(onProgressCallback: (progress: RecoveryProgress) => void) {
    this.recoveryToolPath = path.resolve('./recovery-master/recovery-tool');
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
   * Execute the actual recovery tool with all required parameters
   */
  public async executeRecovery(options: RecoveryOptions): Promise<string | null> {
    try {
      // Set up temporary files
      await this.setupTempFiles(options.encryptionKey1, options.encryptionKey2);

      // Build command to execute the recovery tool
      // Note: In a real implementation, we'd need to handle many edge cases and security considerations
      const recoveryProcess = exec(`
        cd ${path.dirname(this.recoveryToolPath)} && 
        echo "${options.recoveryCode}" | ./recovery-tool --only-scan=true
      `, { maxBuffer: 10 * 1024 * 1024 }); // 10MB buffer for output
      
      if (!recoveryProcess.stdout || !recoveryProcess.stderr) {
        throw new Error('Failed to start recovery process');
      }
      
      // Track scanning progress 
      let scanningComplete = false;
      let foundSatoshis = 0;
      let walletsScanned = 0;
      let txHash: string | undefined;

      // Parse stdout for progress updates
      recoveryProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log('Recovery tool output:', output);
        
        // Parse scanning progress from the output
        const scanMatch = output.match(/Scanned addresses: (\d+)/i);
        if (scanMatch && scanMatch[1]) {
          walletsScanned = parseInt(scanMatch[1], 10);
          this.onProgress({
            walletsScanned,
            satoshisFound: foundSatoshis > 0 ? foundSatoshis : null,
            status: 'scanning',
            message: `Scanning wallets: ${walletsScanned} addresses checked`
          });
        }
        
        // Check for found funds
        const foundMatch = output.match(/(\d+) sats total/i);
        if (foundMatch && foundMatch[1]) {
          foundSatoshis = parseInt(foundMatch[1], 10);
          
          if (foundSatoshis > 0) {
            this.onProgress({
              walletsScanned,
              satoshisFound: foundSatoshis,
              status: 'scanning',
              message: `Found ${foundSatoshis} satoshis! Continuing scan...`
            });
          }
        }
        
        // Check for scan completion
        if (output.includes('Scan complete')) {
          scanningComplete = true;
          
          // If funds were found, proceed with the actual transaction
          if (foundSatoshis > 0) {
            this.proceedWithTransaction(options, foundSatoshis);
          } else {
            this.onProgress({
              walletsScanned,
              satoshisFound: 0,
              status: 'complete',
              message: 'Scan complete. No funds were found.'
            });
          }
        }
        
        // Check for transaction hash after broadcast
        const txHashMatch = output.match(/Transaction sent!.*?([a-f0-9]{64})/i);
        if (txHashMatch && txHashMatch[1]) {
          txHash = txHashMatch[1];
          this.onProgress({
            walletsScanned,
            satoshisFound: foundSatoshis,
            status: 'complete',
            message: `Transaction sent! Funds recovered: ${foundSatoshis} satoshis`,
            txHash
          });
        }
      });
      
      // Handle errors
      recoveryProcess.stderr.on('data', (data: Buffer) => {
        console.error('Recovery tool error:', data.toString());
        this.onProgress({
          walletsScanned,
          satoshisFound: null,
          status: 'error',
          message: `Error: ${data.toString()}`
        });
      });
      
      // Return a promise that resolves when the process completes
      return new Promise((resolve, reject) => {
        recoveryProcess.on('exit', (code) => {
          if (code === 0) {
            resolve(txHash || null);
          } else {
            reject(new Error(`Recovery process exited with code ${code}`));
          }
          this.cleanup();
        });
      });
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
   * Once scanning is complete and funds are found, proceed with transaction creation and broadcast
   */
  private async proceedWithTransaction(options: RecoveryOptions, satoshisFound: number): Promise<void> {
    try {
      // Update progress
      this.onProgress({
        walletsScanned: 0, // Not applicable at this stage
        satoshisFound,
        status: 'scanning',
        message: `Preparing transaction with ${options.feeLevel} fee level...`
      });
      
      // Get the appropriate fee rate based on user selection
      const feeRate = this.getFeeRate(options.feeLevel);
      
      // Execute the recovery tool again, this time with actual transaction creation
      const sweepProcess = exec(`
        cd ${path.dirname(this.recoveryToolPath)} && 
        echo "${options.recoveryCode}" | ./recovery-tool &&
        echo "${options.bitcoinAddress}" | 
        echo "${feeRate}"
      `, { maxBuffer: 10 * 1024 * 1024 }); // 10MB buffer
      
      if (!sweepProcess.stdout || !sweepProcess.stderr) {
        throw new Error('Failed to start transaction creation process');
      }
      
      // Parse stdout for transaction updates
      sweepProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log('Sweep tool output:', output);
        
        // Look for transaction hash in output
        const txHashMatch = output.match(/Transaction sent!.*?([a-f0-9]{64})/i);
        if (txHashMatch && txHashMatch[1]) {
          const txHash = txHashMatch[1];
          this.onProgress({
            walletsScanned: 0, // Not relevant at this stage
            satoshisFound,
            status: 'complete',
            message: `Transaction sent! Your funds are on the way.`,
            txHash
          });
        }
      });
      
      // Handle errors
      sweepProcess.stderr.on('data', (data: Buffer) => {
        console.error('Sweep tool error:', data.toString());
        this.onProgress({
          walletsScanned: 0,
          satoshisFound,
          status: 'error',
          message: `Error creating transaction: ${data.toString()}`
        });
      });
    } catch (error) {
      console.error('Error in transaction creation:', error);
      this.onProgress({
        walletsScanned: 0,
        satoshisFound,
        status: 'error',
        message: `Error creating transaction: ${error instanceof Error ? error.message : String(error)}`
      });
    }
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