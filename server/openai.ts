import OpenAI from "openai";
import { getAllAudioBase64 } from "google-tts-api";

const geminiClient = process.env.GEMINI_API_KEY
  ? new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    })
  : null;
const geminiModel = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

async function createChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionCreateParams["messages"],
) {
  if (!geminiClient) {
    throw new Error("Gemini is not configured. Set GEMINI_API_KEY in the server environment.");
  }

  return geminiClient.chat.completions.create({
    model: geminiModel,
    messages,
  });
}

// Helper: Truncate text to avoid rate limits
function truncateText(text: string, maxLength: number = 15000): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "... [Text truncated]";
}

// 2. EXPORTED FUNCTIONS

export async function generateSummary(text: string) {
  const response = await createChatCompletion([
    { role: "system", content: "You are a research assistant. Summarize the text concisely." },
    { role: "user", content: `Summarize this:\n\n${truncateText(text)}` }
  ]);
  return response.choices[0].message.content || "No summary generated.";
}

export async function extractCitations(text: string) {
  const response = await createChatCompletion([
    {
      role: "system",
      content: "You are a research assistant. Identify the 'References' or 'Bibliography' section in the text provided. Extract the full citations. Return them as a clean list separated by newlines. Do not number the lines."
    },
    {
      role: "user",
      content: `Extract the full references list from the end of this document:\n\n${truncateText(text)}`
    }
  ]);

  const content = response.choices[0].message.content || "";
  const citationsList = content.split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 5)
    .map(line => line.replace(/^\d+[\.\)]\s*/, ""));

  return citationsList.length > 0
    ? citationsList
    : ["No bibliography found in the scanned text."];
}

export async function generateParaphrase(text: string) {
  const response = await createChatCompletion([
    { role: "system", content: "Rewrite the text in an academic tone." },
    { role: "user", content: `Paraphrase this:\n\n${truncateText(text, 2000)}` }
  ]);
  return response.choices[0].message.content || "Paraphrase unavailable.";
}

export async function calculatePlagiarismScore(text: string) {
  const response = await createChatCompletion([
    { role: "system", content: "You are a plagiarism detector. Return ONLY a number between 0 and 100 representing the plagiarism risk. Do not write any words, just the number." },
    { role: "user", content: `Analyze this text:\n\n${truncateText(text, 2000)}` }
  ]);

  const content = response.choices[0].message.content || "";
  const match = content.match(/(\d+(\.\d+)?)/);
  if (!match) {
    throw new Error("The AI service returned an invalid plagiarism score.");
  }
  return Math.min(100, Math.max(0, parseFloat(match[0])));
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
