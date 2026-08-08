import OpenAI from "openai";
import { getAllAudioBase64 } from "google-tts-api";

// 1. SETUP CLIENT (Uses Groq)
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key", 
  baseURL: "https://api.groq.com/openai/v1",
});

// Helper: Truncate text to avoid rate limits
function truncateText(text: string, maxLength: number = 15000): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "... [Text truncated]";
}

// 2. EXPORTED FUNCTIONS

export async function generateSummary(text: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a research assistant. Summarize the text concisely." },
        { role: "user", content: `Summarize this:\n\n${truncateText(text)}` }
      ],
    });
    return response.choices[0].message.content || "No summary generated.";
  } catch (error) {
    console.error("Groq Summary Error:", error);
    return "Summary unavailable.";
  }
}

// ... inside server/openai.ts ...

export async function extractCitations(text: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { 
          role: "system", 
          content: "You are a research assistant. Identify the 'References' or 'Bibliography' section in the text provided. Extract the full citations. Return them as a clean list separated by newlines. Do not number the lines." 
        },
        { 
          role: "user", 
          content: `Extract the full references list from the end of this document:\n\n${truncateText(text)}` 
        }
      ],
    });

    const content = response.choices[0].message.content || "";
    
    const citationsList = content.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 5) // Filter out short noise like "References" or "Page 2"
      .map(line => line.replace(/^\d+[\.\)]\s*/, '')); // 🟢 FIX: Remove "1." or "1)" from start

    if (citationsList.length === 0) {
      return ["No bibliography found in the scanned text."];
    }

    return citationsList;

  } catch (error) {
    console.error("Groq Citations Error:", error);
    return ["Error extracting citations."];
  }
}

export async function generateParaphrase(text: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Rewrite the text in an academic tone." },
        { role: "user", content: `Paraphrase this:\n\n${truncateText(text, 2000)}` }
      ],
    });
    return response.choices[0].message.content || "Paraphrase unavailable.";
  } catch (error) {
    console.error("Groq Paraphrase Error:", error);
    return "Error generating paraphrase.";
  }
}

// ⚠️ THIS IS THE FIX FOR YOUR CURRENT ERROR ⚠️
export async function calculatePlagiarismScore(text: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a plagiarism detector. Return ONLY a number between 0 and 100 representing the plagiarism risk. Do not write any words, just the number." },
        { role: "user", content: `Analyze this text:\n\n${truncateText(text, 2000)}` }
      ],
    });

    const content = response.choices[0].message.content || "0";
    
    // Parse the number from the string (e.g. "85%" -> 85)
    const match = content.match(/(\d+(\.\d+)?)/);
    const score = match ? parseFloat(match[0]) : 0;
    
    // Return a NUMBER (Fixes .toFixed error)
    return score;

  } catch (error) {
    console.error("Groq Plagiarism Error:", error);
    return 0; // Return 0 on error so the app doesn't crash
  }
}

export async function generateTTS(text: string): Promise<Buffer> {
  try {
    if (!text || !text.trim()) {
      throw new Error("Text must not be empty for TTS generation.");
    }

    const normalizedText = text.trim();
    const audioChunks = await getAllAudioBase64(normalizedText, {
      lang: "en",
      slow: false,
      splitPunct: ".",
      timeout: 20000,
    });

    if (!audioChunks || audioChunks.length === 0) {
      throw new Error("No audio chunks returned from TTS service.");
    }

    const buffers = audioChunks.map((chunk) =>
      Buffer.from(chunk.base64, "base64"),
    );

    return Buffer.concat(buffers);
  } catch (error) {
    console.error("TTS generation error:", error);
    throw error;
  }
}
