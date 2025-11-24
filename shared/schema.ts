import { z } from "zod";
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Session storage table (for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Document Schema
export const documentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  fileSize: z.number(),
  uploadedAt: z.string(),
  extractedText: z.string(),
  status: z.enum(["uploading", "processing", "completed", "failed"]),
  language: z.string().optional(),
});

export const documentAnalysisSchema = z.object({
  summary: z.string().optional(),
  citations: z.array(z.string()).optional(),
  paraphrase: z.string().optional(),
  plagiarismScore: z.number().min(0).max(100).optional(),
  processingTime: z.number().optional(),
  ttsAudioUrl: z.string().optional(),
});

export const insertDocumentSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  fileSize: z.number().positive(),
  extractedText: z.string(),
  language: z.string().default("en"),
});

export const analyzeDocumentSchema = z.object({
  documentId: z.string(),
  operations: z.array(z.enum(["summary", "citations", "paraphrase", "plagiarism"])),
});

export const generateTTSSchema = z.object({
  documentId: z.string(),
  text: z.string(),
});

// Types
export type Document = z.infer<typeof documentSchema>;
export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AnalyzeDocumentRequest = z.infer<typeof analyzeDocumentSchema>;
export type GenerateTTSRequest = z.infer<typeof generateTTSSchema>;

// Combined document with analysis
export type DocumentWithAnalysis = Document & { analysis?: DocumentAnalysis };

// User preferences (for theme and language)
export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark"]).default("light"),
  language: z.enum(["en", "es", "fr", "de", "zh"]).default("en"),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
