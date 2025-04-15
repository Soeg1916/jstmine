import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const recoveryRequests = pgTable("recovery_requests", {
  id: serial("id").primaryKey(),
  recoveryCode: text("recovery_code").notNull(),
  bitcoinAddress: text("bitcoin_address").notNull(),
  pdfFilename: text("pdf_filename").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRecoveryRequestSchema = createInsertSchema(recoveryRequests).pick({
  recoveryCode: true,
  bitcoinAddress: true,
  pdfFilename: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRecoveryRequest = z.infer<typeof insertRecoveryRequestSchema>;
export type RecoveryRequest = typeof recoveryRequests.$inferSelect;
