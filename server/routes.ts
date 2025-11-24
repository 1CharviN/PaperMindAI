import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as pdfParse from "pdf-parse";
import { storage } from "./storage";
import {
  insertDocumentSchema,
  analyzeDocumentSchema,
  generateTTSSchema,
} from "@shared/schema";
import {
  generateSummary,
  extractCitations,
  generateParaphrase,
  calculatePlagiarismScore,
  generateTTS,
} from "./openai";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is not set. AI features will not work.");
  }

  // Upload PDF and extract text
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }

      // Extract text from PDF
      const pdfData = await pdfParse(req.file.buffer);
      const extractedText = pdfData.text;

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).send("Could not extract text from PDF");
      }

      // Validate data
      const validatedData = insertDocumentSchema.parse({
        filename: req.file.originalname,
        fileSize: req.file.size,
        extractedText,
        language: "en",
      });

      // Create document record
      const document = await storage.createDocument(validatedData);

      res.json(document);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).send(error.message || "Failed to upload document");
    }
  });

  // Analyze document with AI
  app.post("/api/analyze", async (req, res) => {
    try {
      const validatedData = analyzeDocumentSchema.parse(req.body);
      const document = await storage.getDocument(validatedData.documentId);

      if (!document) {
        return res.status(404).send("Document not found");
      }

      await storage.updateDocumentStatus(validatedData.documentId, "processing");

      const startTime = Date.now();
      const operations = validatedData.operations;
      const analysis: any = {};

      // Run AI operations in parallel where possible
      const promises: Promise<void>[] = [];

      if (operations.includes("summary")) {
        promises.push(
          generateSummary(document.extractedText).then((summary) => {
            analysis.summary = summary;
          })
        );
      }

      if (operations.includes("citations")) {
        promises.push(
          extractCitations(document.extractedText).then((citations) => {
            analysis.citations = citations;
          })
        );
      }

      if (operations.includes("paraphrase")) {
        promises.push(
          generateParaphrase(document.extractedText).then((paraphrase) => {
            analysis.paraphrase = paraphrase;
          })
        );
      }

      if (operations.includes("plagiarism")) {
        promises.push(
          calculatePlagiarismScore(document.extractedText).then((score) => {
            analysis.plagiarismScore = score;
          })
        );
      }

      await Promise.all(promises);

      const processingTime = (Date.now() - startTime) / 1000;
      analysis.processingTime = processingTime;

      await storage.saveAnalysis(validatedData.documentId, analysis);
      await storage.updateDocumentStatus(validatedData.documentId, "completed");

      const updatedDocument = await storage.getDocument(validatedData.documentId);
      res.json(updatedDocument);
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).send(error.message || "Failed to analyze document");
    }
  });

  // Generate text-to-speech
  app.post("/api/tts", async (req, res) => {
    try {
      const validatedData = generateTTSSchema.parse(req.body);
      const document = await storage.getDocument(validatedData.documentId);

      if (!document) {
        return res.status(404).send("Document not found");
      }

      // Generate audio
      const audioBuffer = await generateTTS(validatedData.text);

      // Convert to base64 data URL
      const base64Audio = audioBuffer.toString("base64");
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

      await storage.saveTTSAudio(validatedData.documentId, audioUrl);

      const updatedDocument = await storage.getDocument(validatedData.documentId);
      res.json(updatedDocument);
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).send(error.message || "Failed to generate audio");
    }
  });

  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error: any) {
      console.error("Get documents error:", error);
      res.status(500).send("Failed to fetch documents");
    }
  });

  // Get single document
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).send("Document not found");
      }
      res.json(document);
    } catch (error: any) {
      console.error("Get document error:", error);
      res.status(500).send("Failed to fetch document");
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete error:", error);
      res.status(500).send("Failed to delete document");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
