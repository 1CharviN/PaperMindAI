import type { Express } from "express";
import type { NextFunction, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

import { storage } from "./storage";
import { auth as firebaseAuth } from "./firebase";
import {
  insertDocumentSchema,
  analyzeDocumentSchema,
  generateTTSSchema,
} from "@shared/schema";
// Make sure this imports from ./openai
import {
  generateSummary,
  extractCitations,
  generateParaphrase,
  calculatePlagiarismScore,
  generateTTS,
} from "./openai";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

declare global {
  namespace Express {
    interface Request {
      firebaseUid?: string;
    }
  }
}

async function requireFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  if (!firebaseAuth) {
    return res.status(503).json({ error: "Firebase authentication is not configured." });
  }

  const token = req.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api", requireFirebaseAuth);

  app.post("/api/upload", upload.single("file"), async (req, res) => {
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
        language: "en",
      });

      const document = await storage.createDocument(validatedData, ownerId);
      res.json(document);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).send(error.message || "Failed to upload");
    }
  });

  app.post("/api/analyze", async (req, res) => {
    let documentId: string | undefined;
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
      const analysis: any = {};
      
      // Prepare two text chunks
      const textStart = document.extractedText.slice(0, 15000);
      const textEnd = document.extractedText.slice(-15000);

      const tasks: { name: string; run: () => Promise<Partial<import("@shared/schema").DocumentAnalysis>> }[] = [];

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
          run: async () => ({ plagiarismScore: await calculatePlagiarismScore(textStart) }),
        });
      }

      for (let index = 0; index < tasks.length; index += 2) {
        const batch = tasks.slice(index, index + 2);
        const results = await Promise.allSettled(batch.map((task) => task.run()));
        let batchFailed = false;
        let batchError: unknown;
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

      analysis.processingTime = (Date.now() - startTime) / 1000;
      await storage.saveAnalysis(validatedData.documentId, analysis, ownerId);
      await storage.updateDocumentStatus(validatedData.documentId, "completed", ownerId);

      const updatedDocument = await storage.getDocument(validatedData.documentId, ownerId);
      res.json(updatedDocument);
    } catch (error: any) {
      console.error("Analysis error:", error);
      if (documentId) {
        try {
          await storage.updateDocumentStatus(documentId, "failed", ownerId);
        } catch (statusError) {
          console.error("Failed to mark document analysis as failed:", statusError);
        }
      }
      const connectionCode = error?.code ?? error?.cause?.code;
      if (
        connectionCode === "ECONNREFUSED" ||
        connectionCode === "ECONNRESET"
      ) {
        return res.status(503).json({
          error: "Could not connect to the Gemini API. Check your internet connection and try again.",
        });
      }
      if (error?.status === 429) {
        return res.status(429).json({
          error: "Gemini is rate-limiting requests. Wait a moment, then retry the missing analysis.",
        });
      }
      if (error?.status === 503 || (error?.status >= 500 && error?.status <= 599)) {
        return res.status(503).json({
          error: "Gemini is temporarily unavailable. Completed results were saved; please retry the analysis shortly.",
        });
      }
      res.status(500).send(error.message || "Analysis failed");
    }
  });
  
  app.post("/api/tts", async (req, res) => {
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
    } catch (error: any) {
      console.error("TTS route error:", error);
      res.status(500).send("Failed to generate audio");
    }
  });

  app.get("/api/documents", async (req, res) => {
    const ownerId = req.firebaseUid;
    if (!ownerId) return res.status(401).send("Authentication required");
    const documents = await storage.getAllDocuments(ownerId);
    res.json(documents);
  });

  app.get("/api/documents/:id", async (req, res) => {
    const ownerId = req.firebaseUid;
    if (!ownerId) return res.status(401).send("Authentication required");
    const document = await storage.getDocument(req.params.id, ownerId);
    if (!document) return res.status(404).send("Document not found");
    res.json(document);
  });

  app.delete("/api/documents/:id", async (req, res) => {
    const ownerId = req.firebaseUid;
    if (!ownerId) return res.status(401).send("Authentication required");
    const deleted = await storage.deleteDocument(req.params.id, ownerId);
    if (!deleted) return res.status(404).send("Document not found");
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
