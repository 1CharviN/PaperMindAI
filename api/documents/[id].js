var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel-api.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import { createRequire } from "module";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analyzeDocumentSchema: () => analyzeDocumentSchema,
  documentAnalysisSchema: () => documentAnalysisSchema,
  documentSchema: () => documentSchema,
  generateTTSSchema: () => generateTTSSchema,
  insertDocumentSchema: () => insertDocumentSchema,
  sessions: () => sessions,
  userPreferencesSchema: () => userPreferencesSchema,
  users: () => users
});
import { z } from "zod";
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar
} from "drizzle-orm/pg-core";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var documentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  fileSize: z.number(),
  uploadedAt: z.string(),
  extractedText: z.string(),
  status: z.enum(["uploading", "processing", "completed", "failed"]),
  language: z.string().optional()
});
var documentAnalysisSchema = z.object({
  summary: z.string().optional(),
  citations: z.array(z.string()).optional(),
  paraphrase: z.string().optional(),
  plagiarismScore: z.number().min(0).max(100).optional(),
  processingTime: z.number().optional(),
  ttsAudioUrl: z.string().optional()
});
var insertDocumentSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  fileSize: z.number().positive(),
  extractedText: z.string(),
  language: z.string().default("en")
});
var analyzeDocumentSchema = z.object({
  documentId: z.string(),
  operations: z.array(z.enum(["summary", "citations", "paraphrase", "plagiarism"]))
});
var generateTTSSchema = z.object({
  documentId: z.string(),
  text: z.string()
});
var userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark"]).default("light"),
  language: z.enum([
    "en",
    // English
    "hi",
    // Hindi
    "ta",
    // Tamil
    "te",
    // Telugu
    "kn",
    // Kannada
    "ml",
    // Malayalam
    "bn",
    // Bengali
    "gu",
    // Gujarati
    "mr",
    // Marathi
    "pa"
    // Punjabi
  ]).default("en")
});

// server/storage.ts
import { nanoid } from "nanoid";

// server/firebase.ts
import admin from "firebase-admin";
import { createPrivateKey } from "node:crypto";
var initializeFirebase = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"') || privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");
    try {
      createPrivateKey(privateKey);
    } catch (error) {
      throw new Error(
        "FIREBASE_PRIVATE_KEY is not a valid PEM private key. Copy the complete private_key value from your Firebase service-account JSON.",
        { cause: error }
      );
    }
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });
  }
  console.warn("\u26A0\uFE0F  Firebase credentials not found - using in-memory storage for development");
  return null;
};
var app = initializeFirebase();
var db = app ? admin.firestore() : null;
var auth = app ? admin.auth(app) : null;
var COLLECTIONS = {
  DOCUMENTS: "documents",
  ANALYSES: "analyses"
};

// server/db.ts
import dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
dotenv.config({ path: ".env.local" });
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db2 = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var HybridStorage = class {
  // User operations (PostgreSQL)
  async getUser(id) {
    const [user] = await db2.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async upsertUser(userData) {
    const [user] = await db2.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Document operations (Firebase Firestore)
  async getDocument(id, ownerId) {
    if (!db) return void 0;
    const docRef = db.collection(COLLECTIONS.DOCUMENTS).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return void 0;
    const storedDocument = doc.data();
    if (storedDocument.ownerId !== ownerId) return void 0;
    const analysisRef = db.collection(COLLECTIONS.ANALYSES).doc(id);
    const analysisDoc = await analysisRef.get();
    const analysis = analysisDoc.exists ? analysisDoc.data() : void 0;
    const { ownerId: _ownerId, ...docData } = storedDocument;
    return { ...docData, id: doc.id, analysis };
  }
  async getAllDocuments(ownerId) {
    if (!db) return [];
    const firestoreDb = db;
    const snapshot = await firestoreDb.collection(COLLECTIONS.DOCUMENTS).where("ownerId", "==", ownerId).get();
    const documents = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const { ownerId: _ownerId, ...docData } = doc.data();
        const analysisRef = firestoreDb.collection(COLLECTIONS.ANALYSES).doc(doc.id);
        const analysisDoc = await analysisRef.get();
        const analysis = analysisDoc.exists ? analysisDoc.data() : void 0;
        return { ...docData, id: doc.id, analysis };
      })
    );
    return documents.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }
  async createDocument(insertDoc, ownerId) {
    if (!db) throw new Error("Firestore not initialized");
    const id = nanoid();
    const document = {
      ...insertDoc,
      id,
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "processing"
    };
    await db.collection(COLLECTIONS.DOCUMENTS).doc(id).set({ ...document, ownerId });
    return document;
  }
  async updateDocumentStatus(id, status, ownerId) {
    if (!db) return;
    const documentRef = db.collection(COLLECTIONS.DOCUMENTS).doc(id);
    const document = await documentRef.get();
    if (document.data()?.ownerId === ownerId) {
      await documentRef.update({ status });
    }
  }
  async deleteDocument(id, ownerId) {
    if (!db) return false;
    const documentRef = db.collection(COLLECTIONS.DOCUMENTS).doc(id);
    const document = await documentRef.get();
    if (!document.exists || document.data()?.ownerId !== ownerId) return false;
    await documentRef.delete();
    await db.collection(COLLECTIONS.ANALYSES).doc(id).delete();
    return true;
  }
  async saveAnalysis(documentId, analysis, ownerId) {
    if (!db) return;
    if (!await this.getDocument(documentId, ownerId)) {
      throw new Error("Document not found");
    }
    const analysisRef = db.collection(COLLECTIONS.ANALYSES).doc(documentId);
    const existing = await analysisRef.get();
    if (existing.exists) {
      await analysisRef.update(analysis);
    } else {
      await analysisRef.set(analysis);
    }
  }
  async saveTTSAudio(documentId, audioUrl, ownerId) {
    if (!db) return;
    await this.saveAnalysis(documentId, { ttsAudioUrl: audioUrl }, ownerId);
  }
};
var MemStorage = class {
  documents;
  analyses;
  documentOwners;
  usersMap;
  constructor() {
    this.documents = /* @__PURE__ */ new Map();
    this.analyses = /* @__PURE__ */ new Map();
    this.documentOwners = /* @__PURE__ */ new Map();
    this.usersMap = /* @__PURE__ */ new Map();
  }
  // User operations (in-memory)
  async getUser(id) {
    return this.usersMap.get(id);
  }
  async upsertUser(userData) {
    const user = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: this.usersMap.get(userData.id)?.createdAt || /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.usersMap.set(user.id, user);
    return user;
  }
  async getDocument(id, ownerId) {
    const doc = this.documents.get(id);
    if (!doc || this.documentOwners.get(id) !== ownerId) return void 0;
    const analysis = this.analyses.get(id);
    return { ...doc, analysis };
  }
  async getAllDocuments(ownerId) {
    const docs = Array.from(this.documents.values()).filter(
      (doc) => this.documentOwners.get(doc.id) === ownerId
    );
    return docs.map((doc) => ({
      ...doc,
      analysis: this.analyses.get(doc.id)
    })).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }
  async createDocument(insertDoc, ownerId) {
    const id = nanoid();
    const document = {
      ...insertDoc,
      id,
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "processing"
    };
    this.documents.set(id, document);
    this.documentOwners.set(id, ownerId);
    return document;
  }
  async updateDocumentStatus(id, status, ownerId) {
    const doc = this.documents.get(id);
    if (doc && this.documentOwners.get(id) === ownerId) {
      this.documents.set(id, { ...doc, status });
    }
  }
  async deleteDocument(id, ownerId) {
    if (this.documentOwners.get(id) !== ownerId) return false;
    const deleted = this.documents.delete(id);
    this.documentOwners.delete(id);
    this.analyses.delete(id);
    return deleted;
  }
  async saveAnalysis(documentId, analysis, ownerId) {
    if (this.documentOwners.get(documentId) !== ownerId) {
      throw new Error("Document not found");
    }
    const existing = this.analyses.get(documentId) || {};
    this.analyses.set(documentId, { ...existing, ...analysis });
  }
  async saveTTSAudio(documentId, audioUrl, ownerId) {
    if (this.documentOwners.get(documentId) !== ownerId) {
      throw new Error("Document not found");
    }
    const existing = this.analyses.get(documentId) || {};
    this.analyses.set(documentId, { ...existing, ttsAudioUrl: audioUrl });
  }
};
var storage = db ? new HybridStorage() : new MemStorage();
if (!db) {
  console.log("\u{1F4DD} Using in-memory storage for documents (data will be lost on restart)");
  console.log("\u{1F4A1} To enable Firebase persistence, set environment variables:");
  console.log("   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
}
console.log("\u2705 PostgreSQL enabled for user authentication and sessions");

// server/openai.ts
import OpenAI from "openai";
import { getAllAudioBase64 } from "google-tts-api";
var geminiClient = process.env.GEMINI_API_KEY ? new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  maxRetries: 0,
  timeout: 25e3
}) : null;
var geminiModel = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
async function createChatCompletion(messages) {
  if (!geminiClient) {
    throw new Error("Gemini is not configured. Set GEMINI_API_KEY in the server environment.");
  }
  for (let attempt = 1; ; attempt++) {
    try {
      return await geminiClient.chat.completions.create({
        model: geminiModel,
        messages
      });
    } catch (error) {
      const status = typeof error === "object" && error !== null && "status" in error ? error.status : void 0;
      if (attempt !== 1 || status !== 503) {
        throw error;
      }
      console.warn("Gemini returned 503; retrying once after a short delay.");
      await new Promise((resolve) => setTimeout(resolve, 1e3));
    }
  }
}
function truncateText(text, maxLength = 15e3) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "... [Text truncated]";
}
async function generateSummary(text) {
  const response = await createChatCompletion([
    { role: "system", content: "You are a research assistant. Summarize the text concisely." },
    { role: "user", content: `Summarize this:

${truncateText(text)}` }
  ]);
  return response.choices[0].message.content || "No summary generated.";
}
async function extractCitations(text) {
  const response = await createChatCompletion([
    {
      role: "system",
      content: "You are a research assistant. Identify the 'References' or 'Bibliography' section in the text provided. Extract the full citations. Return them as a clean list separated by newlines. Do not number the lines."
    },
    {
      role: "user",
      content: `Extract the full references list from the end of this document:

${truncateText(text)}`
    }
  ]);
  const content = response.choices[0].message.content || "";
  const citationsList = content.split("\n").map((line) => line.trim()).filter((line) => line.length > 5).map((line) => line.replace(/^\d+[\.\)]\s*/, ""));
  return citationsList.length > 0 ? citationsList : ["No bibliography found in the scanned text."];
}
async function generateParaphrase(text) {
  const response = await createChatCompletion([
    { role: "system", content: "Rewrite the text in an academic tone." },
    { role: "user", content: `Paraphrase this:

${truncateText(text, 2e3)}` }
  ]);
  return response.choices[0].message.content || "Paraphrase unavailable.";
}
async function calculatePlagiarismScore(text) {
  const response = await createChatCompletion([
    { role: "system", content: "You are a plagiarism detector. Return ONLY a number between 0 and 100 representing the plagiarism risk. Do not write any words, just the number." },
    { role: "user", content: `Analyze this text:

${truncateText(text, 2e3)}` }
  ]);
  const content = response.choices[0].message.content || "";
  const match = content.match(/(\d+(\.\d+)?)/);
  if (!match) {
    throw new Error("The AI service returned an invalid plagiarism score.");
  }
  return Math.min(100, Math.max(0, parseFloat(match[0])));
}
async function generateTTS(text) {
  try {
    if (!text || !text.trim()) {
      throw new Error("Text must not be empty for TTS generation.");
    }
    const normalizedText = text.trim();
    const audioChunks = await getAllAudioBase64(normalizedText, {
      lang: "en",
      slow: false,
      splitPunct: ".",
      timeout: 2e4
    });
    if (!audioChunks || audioChunks.length === 0) {
      throw new Error("No audio chunks returned from TTS service.");
    }
    const buffers = audioChunks.map(
      (chunk) => Buffer.from(chunk.base64, "base64")
    );
    return Buffer.concat(buffers);
  } catch (error) {
    console.error("TTS generation error:", error);
    throw error;
  }
}

// server/routes.ts
var require2 = createRequire(import.meta.url);
var pdfParse = require2("pdf-parse");
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});
async function requireFirebaseAuth(req, res, next) {
  if (!auth) {
    return res.status(503).json({ error: "Firebase authentication is not configured." });
  }
  const token = req.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}
async function registerRoutes(app3) {
  app3.use("/api", requireFirebaseAuth);
  app3.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      const ownerId = req.firebaseUid;
      if (!ownerId) return res.status(401).send("Authentication required");
      if (!req.file) return res.status(400).send("No file uploaded");
      if (typeof pdfParse !== "function") throw new Error("pdf-parse library error");
      const pdfData = await pdfParse(req.file.buffer);
      const extractedText = pdfData.text;
      if (!extractedText?.trim()) return res.status(400).send("Could not extract text");
      const validatedData = insertDocumentSchema.parse({
        filename: req.file.originalname,
        fileSize: req.file.size,
        extractedText,
        language: "en"
      });
      const document = await storage.createDocument(validatedData, ownerId);
      res.json(document);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).send(error.message || "Failed to upload");
    }
  });
  app3.post("/api/analyze", async (req, res) => {
    let documentId;
    const ownerId = req.firebaseUid;
    if (!ownerId) return res.status(401).send("Authentication required");
    try {
      const validatedData = analyzeDocumentSchema.parse(req.body);
      documentId = validatedData.documentId;
      const document = await storage.getDocument(validatedData.documentId, ownerId);
      if (!document) return res.status(404).send("Document not found");
      await storage.updateDocumentStatus(validatedData.documentId, "processing", ownerId);
      const startTime = Date.now();
      const operations = validatedData.operations;
      const analysis = {};
      const textStart = document.extractedText.slice(0, 15e3);
      const textEnd = document.extractedText.slice(-15e3);
      const tasks = [];
      if (operations.includes("summary")) {
        console.log("Generating summary...");
        tasks.push({ name: "summary", run: async () => ({ summary: await generateSummary(textStart) }) });
      }
      if (operations.includes("citations")) {
        console.log("Extracting citations...");
        tasks.push({ name: "citations", run: async () => ({ citations: await extractCitations(textEnd) }) });
      }
      if (operations.includes("paraphrase")) {
        console.log("Generating paraphrase...");
        tasks.push({ name: "paraphrase", run: async () => ({ paraphrase: await generateParaphrase(textStart) }) });
      }
      if (operations.includes("plagiarism")) {
        console.log("Calculating plagiarism...");
        tasks.push({
          name: "plagiarism",
          run: async () => ({ plagiarismScore: await calculatePlagiarismScore(textStart) })
        });
      }
      for (let index2 = 0; index2 < tasks.length; index2 += 2) {
        const batch = tasks.slice(index2, index2 + 2);
        const results = await Promise.allSettled(batch.map((task) => task.run()));
        let batchFailed = false;
        let batchError;
        for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
          const result = results[resultIndex];
          if (result.status === "rejected") {
            console.error(`Gemini ${batch[resultIndex].name} operation failed:`, result.reason);
            batchFailed = true;
            batchError ??= result.reason;
            continue;
          }
          Object.assign(analysis, result.value);
          await storage.saveAnalysis(validatedData.documentId, result.value, ownerId);
        }
        if (batchFailed) throw batchError;
      }
      analysis.processingTime = (Date.now() - startTime) / 1e3;
      await storage.saveAnalysis(validatedData.documentId, analysis, ownerId);
      await storage.updateDocumentStatus(validatedData.documentId, "completed", ownerId);
      const updatedDocument = await storage.getDocument(validatedData.documentId, ownerId);
      res.json(updatedDocument);
    } catch (error) {
      console.error("Analysis error:", error);
      if (documentId) {
        try {
          await storage.updateDocumentStatus(documentId, "failed", ownerId);
        } catch (statusError) {
          console.error("Failed to mark document analysis as failed:", statusError);
        }
      }
      const connectionCode = error?.code ?? error?.cause?.code;
      if (connectionCode === "ECONNREFUSED" || connectionCode === "ECONNRESET") {
        return res.status(503).json({
          error: "Could not connect to the Gemini API. Check your internet connection and try again."
        });
      }
      if (error?.status === 429) {
        return res.status(429).json({
          error: "Gemini is rate-limiting requests. Wait a moment, then retry the missing analysis."
        });
      }
      if (error?.name === "APIConnectionTimeoutError" || error?.code === "ETIMEDOUT") {
        return res.status(504).json({
          error: "Gemini took too long to respond. Completed results were saved; retry the missing analysis."
        });
      }
      if (error?.status === 503 || error?.status >= 500 && error?.status <= 599) {
        return res.status(503).json({
          error: "Gemini is temporarily unavailable. Completed results were saved; please retry the analysis shortly."
        });
      }
      res.status(500).send(error.message || "Analysis failed");
    }
  });
  app3.post("/api/tts", async (req, res) => {
    try {
      const ownerId = req.firebaseUid;
      if (!ownerId) return res.status(401).send("Authentication required");
      const validatedData = generateTTSSchema.parse(req.body);
      const document = await storage.getDocument(validatedData.documentId, ownerId);
      if (!document) return res.status(404).send("Document not found");
      const audioBuffer = await generateTTS(validatedData.text);
      const base64Audio = audioBuffer.toString("base64");
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      await storage.saveTTSAudio(validatedData.documentId, audioUrl, ownerId);
      const updatedDocument = await storage.getDocument(validatedData.documentId, ownerId);
      res.json(updatedDocument);
    } catch (error) {
      console.error("TTS route error:", error);
      res.status(500).send("Failed to generate audio");
    }
  });
  app3.get("/api/documents", async (req, res) => {
    const ownerId = req.firebaseUid;
    if (!ownerId) return res.status(401).send("Authentication required");
    const documents = await storage.getAllDocuments(ownerId);
    res.json(documents);
  });
  app3.get("/api/documents/:id", async (req, res) => {
    const ownerId = req.firebaseUid;
    if (!ownerId) return res.status(401).send("Authentication required");
    const document = await storage.getDocument(req.params.id, ownerId);
    if (!document) return res.status(404).send("Document not found");
    res.json(document);
  });
  app3.delete("/api/documents/:id", async (req, res) => {
    const ownerId = req.firebaseUid;
    if (!ownerId) return res.status(401).send("Authentication required");
    const deleted = await storage.deleteDocument(req.params.id, ownerId);
    if (!deleted) return res.status(404).send("Document not found");
    res.json({ success: true });
  });
  const httpServer = createServer(app3);
  return httpServer;
}

// server/vercel-api.ts
var app2 = express();
app2.use(express.json());
app2.use(express.urlencoded({ extended: false }));
var initialization;
function initialize() {
  initialization ??= registerRoutes(app2).then(() => {
    app2.use(
      (error, _req, res, _next) => {
        console.error("API error:", error);
        if (!res.headersSent) {
          res.status(error.status || error.statusCode || 500).json({
            message: error.message || "Internal Server Error"
          });
        }
      }
    );
  });
  return initialization;
}
async function handler(req, res) {
  try {
    await initialize();
    if (req.url && !req.url.startsWith("/api")) {
      req.url = `/api${req.url}`;
    }
    app2(req, res);
  } catch (error) {
    console.error("Failed to initialize API routes:", error);
    res.status(500).json({ error: "API initialization failed" });
  }
}
export {
  handler as default
};
