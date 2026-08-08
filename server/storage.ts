import type { Document, DocumentAnalysis, InsertDocument, User, UpsertUser } from "@shared/schema";
import { users } from "@shared/schema";
import { nanoid } from "nanoid";
import { db as firebaseDb, COLLECTIONS } from "./firebase";
import { db as postgresDb } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations (for Replit Auth - uses PostgreSQL)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Document operations (uses Firebase Firestore)
  getDocument(id: string): Promise<(Document & { analysis?: DocumentAnalysis }) | undefined>;
  getAllDocuments(): Promise<(Document & { analysis?: DocumentAnalysis })[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocumentStatus(id: string, status: Document["status"]): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  
  // Analysis operations (uses Firebase Firestore)
  saveAnalysis(documentId: string, analysis: Partial<DocumentAnalysis>): Promise<void>;
  saveTTSAudio(documentId: string, audioUrl: string): Promise<void>;
}

// Hybrid storage implementation (PostgreSQL for users, Firebase for documents)
export class HybridStorage implements IStorage {
  // User operations (PostgreSQL)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await postgresDb.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await postgresDb
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Document operations (Firebase Firestore)
  async getDocument(id: string): Promise<(Document & { analysis?: DocumentAnalysis }) | undefined> {
    if (!firebaseDb) return undefined;

    const docRef = firebaseDb.collection(COLLECTIONS.DOCUMENTS).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;

    const docData = doc.data() as Document;

    // Get analysis if exists
    const analysisRef = firebaseDb.collection(COLLECTIONS.ANALYSES).doc(id);
    const analysisDoc = await analysisRef.get();
    const analysis = analysisDoc.exists ? (analysisDoc.data() as DocumentAnalysis) : undefined;

    return { ...docData, analysis };
  }

  async getAllDocuments(): Promise<(Document & { analysis?: DocumentAnalysis })[]> {
    if (!firebaseDb) return [];

    const firestoreDb = firebaseDb;
    const snapshot = await firestoreDb.collection(COLLECTIONS.DOCUMENTS)
      .orderBy("uploadedAt", "desc")
      .get();

    const documents = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const docData = doc.data() as Document;
        
        // Get analysis if exists
        const analysisRef = firestoreDb.collection(COLLECTIONS.ANALYSES).doc(doc.id);
        const analysisDoc = await analysisRef.get();
        const analysis = analysisDoc.exists ? (analysisDoc.data() as DocumentAnalysis) : undefined;

        return { ...docData, analysis };
      })
    );

    return documents;
  }

  async createDocument(insertDoc: InsertDocument): Promise<Document> {
    if (!firebaseDb) throw new Error("Firestore not initialized");

    const id = nanoid();
    const document: Document = {
      ...insertDoc,
      id,
      uploadedAt: new Date().toISOString(),
      status: "processing",
    };

    await firebaseDb.collection(COLLECTIONS.DOCUMENTS).doc(id).set(document);
    return document;
  }

  async updateDocumentStatus(id: string, status: Document["status"]): Promise<void> {
    if (!firebaseDb) return;

    await firebaseDb.collection(COLLECTIONS.DOCUMENTS).doc(id).update({ status });
  }

  async deleteDocument(id: string): Promise<void> {
    if (!firebaseDb) return;

    // Delete document
    await firebaseDb.collection(COLLECTIONS.DOCUMENTS).doc(id).delete();
    
    // Delete analysis
    await firebaseDb.collection(COLLECTIONS.ANALYSES).doc(id).delete();
  }

  async saveAnalysis(documentId: string, analysis: Partial<DocumentAnalysis>): Promise<void> {
    if (!firebaseDb) return;

    const analysisRef = firebaseDb.collection(COLLECTIONS.ANALYSES).doc(documentId);
    const existing = await analysisRef.get();

    if (existing.exists) {
      await analysisRef.update(analysis);
    } else {
      await analysisRef.set(analysis);
    }
  }

  async saveTTSAudio(documentId: string, audioUrl: string): Promise<void> {
    if (!firebaseDb) return;

    await this.saveAnalysis(documentId, { ttsAudioUrl: audioUrl });
  }
}

// In-memory fallback for development
export class MemStorage implements IStorage {
  private documents: Map<string, Document>;
  private analyses: Map<string, DocumentAnalysis>;
  private usersMap: Map<string, User>;

  constructor() {
    this.documents = new Map();
    this.analyses = new Map();
    this.usersMap = new Map();
  }

  // User operations (in-memory)
  async getUser(id: string): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id!,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: this.usersMap.get(userData.id!)?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.usersMap.set(user.id, user);
    return user;
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

// Use HybridStorage (PostgreSQL for users + Firebase for documents) or in-memory fallback
export const storage: IStorage = firebaseDb ? new HybridStorage() : new MemStorage();

if (!firebaseDb) {
  console.log("📝 Using in-memory storage for documents (data will be lost on restart)");
  console.log("💡 To enable Firebase persistence, set environment variables:");
  console.log("   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
}

console.log("✅ PostgreSQL enabled for user authentication and sessions");
