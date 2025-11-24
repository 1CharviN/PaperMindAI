import type { Document, DocumentAnalysis, InsertDocument } from "@shared/schema";
import { nanoid } from "nanoid";
import { db, COLLECTIONS } from "./firebase";

export interface IStorage {
  // Document operations
  getDocument(id: string): Promise<(Document & { analysis?: DocumentAnalysis }) | undefined>;
  getAllDocuments(): Promise<(Document & { analysis?: DocumentAnalysis })[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocumentStatus(id: string, status: Document["status"]): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  
  // Analysis operations
  saveAnalysis(documentId: string, analysis: Partial<DocumentAnalysis>): Promise<void>;
  saveTTSAudio(documentId: string, audioUrl: string): Promise<void>;
}

// Firebase Firestore implementation
export class FirestoreStorage implements IStorage {
  async getDocument(id: string): Promise<(Document & { analysis?: DocumentAnalysis }) | undefined> {
    if (!db) return undefined;

    const docRef = db.collection(COLLECTIONS.DOCUMENTS).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;

    const docData = doc.data() as Document;

    // Get analysis if exists
    const analysisRef = db.collection(COLLECTIONS.ANALYSES).doc(id);
    const analysisDoc = await analysisRef.get();
    const analysis = analysisDoc.exists ? (analysisDoc.data() as DocumentAnalysis) : undefined;

    return { ...docData, analysis };
  }

  async getAllDocuments(): Promise<(Document & { analysis?: DocumentAnalysis })[]> {
    if (!db) return [];

    const snapshot = await db.collection(COLLECTIONS.DOCUMENTS)
      .orderBy("uploadedAt", "desc")
      .get();

    const documents = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const docData = doc.data() as Document;
        
        // Get analysis if exists
        const analysisRef = db.collection(COLLECTIONS.ANALYSES).doc(doc.id);
        const analysisDoc = await analysisRef.get();
        const analysis = analysisDoc.exists ? (analysisDoc.data() as DocumentAnalysis) : undefined;

        return { ...docData, analysis };
      })
    );

    return documents;
  }

  async createDocument(insertDoc: InsertDocument): Promise<Document> {
    if (!db) throw new Error("Firestore not initialized");

    const id = nanoid();
    const document: Document = {
      ...insertDoc,
      id,
      uploadedAt: new Date().toISOString(),
      status: "processing",
    };

    await db.collection(COLLECTIONS.DOCUMENTS).doc(id).set(document);
    return document;
  }

  async updateDocumentStatus(id: string, status: Document["status"]): Promise<void> {
    if (!db) return;

    await db.collection(COLLECTIONS.DOCUMENTS).doc(id).update({ status });
  }

  async deleteDocument(id: string): Promise<void> {
    if (!db) return;

    // Delete document
    await db.collection(COLLECTIONS.DOCUMENTS).doc(id).delete();
    
    // Delete analysis
    await db.collection(COLLECTIONS.ANALYSES).doc(id).delete();
  }

  async saveAnalysis(documentId: string, analysis: Partial<DocumentAnalysis>): Promise<void> {
    if (!db) return;

    const analysisRef = db.collection(COLLECTIONS.ANALYSES).doc(documentId);
    const existing = await analysisRef.get();

    if (existing.exists) {
      await analysisRef.update(analysis);
    } else {
      await analysisRef.set(analysis);
    }
  }

  async saveTTSAudio(documentId: string, audioUrl: string): Promise<void> {
    if (!db) return;

    await this.saveAnalysis(documentId, { ttsAudioUrl: audioUrl });
  }
}

// In-memory fallback for development
export class MemStorage implements IStorage {
  private documents: Map<string, Document>;
  private analyses: Map<string, DocumentAnalysis>;

  constructor() {
    this.documents = new Map();
    this.analyses = new Map();
  }

  async getDocument(id: string): Promise<(Document & { analysis?: DocumentAnalysis }) | undefined> {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    const analysis = this.analyses.get(id);
    return { ...doc, analysis };
  }

  async getAllDocuments(): Promise<(Document & { analysis?: DocumentAnalysis })[]> {
    const docs = Array.from(this.documents.values());
    return docs.map(doc => ({
      ...doc,
      analysis: this.analyses.get(doc.id),
    })).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async createDocument(insertDoc: InsertDocument): Promise<Document> {
    const id = nanoid();
    const document: Document = {
      ...insertDoc,
      id,
      uploadedAt: new Date().toISOString(),
      status: "processing",
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocumentStatus(id: string, status: Document["status"]): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) {
      this.documents.set(id, { ...doc, status });
    }
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
    this.analyses.delete(id);
  }

  async saveAnalysis(documentId: string, analysis: Partial<DocumentAnalysis>): Promise<void> {
    const existing = this.analyses.get(documentId) || {};
    this.analyses.set(documentId, { ...existing, ...analysis });
  }

  async saveTTSAudio(documentId: string, audioUrl: string): Promise<void> {
    const existing = this.analyses.get(documentId) || {};
    this.analyses.set(documentId, { ...existing, ttsAudioUrl: audioUrl });
  }
}

// Use Firestore if available, otherwise fallback to in-memory
export const storage: IStorage = db ? new FirestoreStorage() : new MemStorage();

if (!db) {
  console.log("📝 Using in-memory storage (data will be lost on restart)");
  console.log("💡 To enable persistence, set Firebase environment variables:");
  console.log("   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
}
