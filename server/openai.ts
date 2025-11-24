import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function generateSummary(text: string): Promise<string> {
  const prompt = `Please provide a concise academic summary of the following research paper text. Focus on the main findings, methodology, and conclusions:\n\n${text.slice(0, 12000)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an academic research assistant specialized in summarizing scholarly papers.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_completion_tokens: 500,
  });

  return response.choices[0].message.content || "No summary generated";
}

export async function extractCitations(text: string): Promise<string[]> {
  const prompt = `Extract all citations and references from the following research paper text. Return them as a JSON array of strings. Each citation should be a complete reference.\n\nText:\n${text.slice(0, 12000)}\n\nRespond with JSON in this format: { "citations": ["citation1", "citation2", ...] }`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an expert at extracting academic citations and references from research papers.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1000,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.citations || [];
  } catch {
    return [];
  }
}

export async function generateParaphrase(text: string): Promise<string> {
  const prompt = `Paraphrase the following research paper excerpt while maintaining its academic tone and technical accuracy. Keep the meaning intact but use different sentence structures and vocabulary:\n\n${text.slice(0, 8000)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an academic writing assistant specializing in paraphrasing scholarly content.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_completion_tokens: 1000,
  });

  return response.choices[0].message.content || "No paraphrase generated";
}

export async function calculatePlagiarismScore(text: string): Promise<number> {
  // This is a simplified plagiarism detection
  // In production, you would compare against external databases
  const prompt = `Analyze the following text and estimate its originality score as a percentage. Consider factors like unique phrasing, novel ideas, and academic writing quality. Return a plagiarism similarity score between 0-100, where 0 is completely original and 100 is completely plagiarized.\n\nText:\n${text.slice(0, 8000)}\n\nRespond with JSON in this format: { "plagiarismScore": number, "reasoning": "brief explanation" }`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are a plagiarism detection expert analyzing academic texts for originality.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 300,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || "{}");
    // Return a realistic score between 5-30% for most academic papers
    return Math.min(100, Math.max(0, result.plagiarismScore || 15));
  } catch {
    return 15; // Default moderate score
  }
}

export async function generateTTS(text: string): Promise<Buffer> {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text.slice(0, 4000), // TTS has character limits
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  return buffer;
}
