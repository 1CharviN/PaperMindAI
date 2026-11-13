import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

import { storage } from "./storage";
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// THIS IS THE MISSING EXPORT
export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
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

      const document = await storage.createDocument(validatedData);
      res.json(document);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).send(error.message || "Failed to upload");
    }
  });

  // ... inside server/routes.ts ...

  app.post("/api/analyze", async (req, res) => {
    let documentId: string | undefined;
    try {
      const validatedData = analyzeDocumentSchema.parse(req.body);
      documentId = validatedData.documentId;
      const document = await storage.getDocument(validatedData.documentId);

      if (!document) return res.status(404).send("Document not found");

      await storage.updateDocumentStatus(validatedData.documentId, "processing");

      const startTime = Date.now();
      const operations = validatedData.operations;
      const analysis: any = {};
      
      // Prepare two text chunks
      const textStart = document.extractedText.slice(0, 15000);
      const textEnd = document.extractedText.slice(-15000);

      const tasks: Promise<void>[] = [];

      if (operations.includes("summary")) {
        console.log("Generating summary...");
        tasks.push(
          generateSummary(textStart)
            .then((result) => {
              analysis.summary = result;
            }),
        );
      }

      if (operations.includes("citations")) {
        console.log("Extracting citations...");
        tasks.push(
          extractCitations(textEnd)
            .then((result) => {
              analysis.citations = result;
            }),
        );
      }

      if (operations.includes("paraphrase")) {
        console.log("Generating paraphrase...");
        tasks.push(
          generateParaphrase(textStart)
            .then((result) => {
              analysis.paraphrase = result;
            }),
        );
      }

      if (operations.includes("plagiarism")) {
        console.log("Calculating plagiarism...");
        tasks.push(
          calculatePlagiarismScore(textStart)
            .then((result) => {
              analysis.plagiarismScore = result;
            }),
        );
      }

      await Promise.all(tasks);

      analysis.processingTime = (Date.now() - startTime) / 1000;
      await storage.saveAnalysis(validatedData.documentId, analysis);
      await storage.updateDocumentStatus(validatedData.documentId, "completed");

      const updatedDocument = await storage.getDocument(validatedData.documentId);
      res.json(updatedDocument);
    } catch (error: any) {
      console.error("Analysis error:", error);
      if (documentId) {
        try {
          await storage.updateDocumentStatus(documentId, "failed");
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
         return res.status(429).json({ error: "AI Service Busy. Please wait a moment." });
      }
      res.status(500).send(error.message || "Analysis failed");
    }
  });
  
  app.post("/api/tts", async (req, res) => {
    try {
      const validatedData = generateTTSSchema.parse(req.body);
      const document = await storage.getDocument(validatedData.documentId);
      if (!document) return res.status(404).send("Document not found");

      const audioBuffer = await generateTTS(validatedData.text);
      const base64Audio = audioBuffer.toString("base64");
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

      await storage.saveTTSAudio(validatedData.documentId, audioUrl);
      const updatedDocument = await storage.getDocument(validatedData.documentId);
      res.json(updatedDocument);
    } catch (error: any) {
      console.error("TTS route error:", error);
      res.status(500).send("Failed to generate audio");
    }
  });

  app.get("/api/documents", async (req, res) => {
    const documents = await storage.getAllDocuments();
    res.json(documents);
  });

  app.get("/api/documents/:id", async (req, res) => {
    const document = await storage.getDocument(req.params.id);
    if (!document) return res.status(404).send("Document not found");
    res.json(document);
  });

  app.delete("/api/documents/:id", async (req, res) => {
    await storage.deleteDocument(req.params.id);
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
