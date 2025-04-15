import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecoveryRequestSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { initBot } from "./telegramBot";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Health check endpoint for Koyeb
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });
  
  // Recovery request endpoint
  app.post("/api/recovery", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertRecoveryRequestSchema.parse(req.body);
      
      // In a real application, we would process the recovery request
      // For this demo, we'll just return a success response
      
      // Simulate a delay for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.status(200).json({
        success: true,
        message: "Recovery request submitted successfully",
        data: {
          status: "pending",
          recoveryCode: validatedData.recoveryCode,
          bitcoinAddress: validatedData.bitcoinAddress,
          totalWalletsToScan: 250, // Adding the total number of wallets to scan
          estimatedTimeMinutes: 3 // Adding estimated time in minutes
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: validationError.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
    }
  });

  // Add endpoint to get scanning status (for a real application)
  app.get("/api/recovery/status/:recoveryCode", (req, res) => {
    const { recoveryCode } = req.params;
    
    // In a real application, we would check the status in the database
    // For this demo, we'll just return mock data
    
    // Generate a random number to determine if we've found satoshis yet
    const progress = Math.random();
    const walletsScanned = Math.floor(Math.random() * 5000); // Up to 5000 wallets scanned
    const totalWallets = 20000; // Maximum wallets we could potentially scan
    
    let status = "scanning";
    let satoshisFound = null;
    let txHash = null;
    
    // If we're far enough in the process, simulate finding satoshis
    if (progress > 0.7) {
      status = "funds_found";
      satoshisFound = Math.floor(Math.random() * 1000000) + 500000; // 0.5 to 1.5 BTC in sats
      
      // If we're even further, simulate having broadcast a transaction
      if (progress > 0.9) {
        status = "transaction_sent";
        txHash = "b5d7c5e9f60f1a30f1a6dc9fef5e05ca9d4d90fa6988f3c6bc7e68449ca58cb3";
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        status,
        recoveryCode,
        walletsScanned,
        totalWallets,
        satoshisFound,
        txHash,
        estimatedTimeRemaining: status === "scanning" ? "2 minutes" : null
      }
    });
  });
  
  // Add endpoint to set or update Telegram Bot Token
  app.post("/api/admin/telegram-bot-token", async (req, res) => {
    const { token } = req.body;
    
    if (!token || typeof token !== 'string' || token.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Invalid token format. Please provide a valid Telegram Bot Token."
      });
    }
    
    try {
      // In a real application, we would securely store this token
      // For this demo, we'll just update the environment variable
      process.env.TELEGRAM_BOT_TOKEN = token;
      
      // Restart the bot with the new token (now async)
      const bot = await initBot();
      
      if (bot) {
        return res.status(200).json({
          success: true,
          message: "Telegram Bot Token updated successfully. The bot has been restarted."
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to initialize the bot with the provided token."
        });
      }
    } catch (error) {
      console.error("Error updating Telegram Bot Token:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update Telegram Bot Token."
      });
    }
  });

  return httpServer;
}
