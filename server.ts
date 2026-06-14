import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import https from "https";
import { createServer as createViteServer } from "vite";

dotenv.config();

const IMAGE_FILES = [
  "abhimanyu.jpg",
  "arjuna.jpg",
  "ashwathama.jpg",
  "authors.jpg",
  "battlefield.jpg",
  "bheema.jpg",
  "bhisma.jpg",
  "dhritrastra.jpg",
  "draupadi.jpg",
  "dronacharya.jpg",
  "duryodhana.jpg",
  "gandhari.jpg",
  "karna.jpg",
  "kaurava.JPG",
  "krishna.jpg",
  "kunti.jpg",
  "nakula.jpg",
  "pandu.jpg",
  "sahadeva.jpg",
  "sanjaya.jpg",
  "vidur.jpg",
  "yudhisthira.jpg"
];

const downloadImage = (filename: string): Promise<void> => {
  return new Promise((resolve) => {
    const publicImagesDir = path.join(process.cwd(), "public", "images");
    if (!fs.existsSync(publicImagesDir)) {
      try {
        fs.mkdirSync(publicImagesDir, { recursive: true });
      } catch (err) {
        console.error("Error creating public/images directory:", err);
      }
    }
    const localPath = path.join(publicImagesDir, filename);

    // If it already exists and is non-empty, skip
    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1000) {
      resolve();
      return;
    }

    const url = `https://raw.githubusercontent.com/sajancodes/Bhagvat-geeta-portal/main/public/images/${filename}`;
    const file = fs.createWriteStream(localPath);

    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`Successfully downloaded ${filename}`);
          resolve();
        });
      } else {
        file.close();
        fs.unlink(localPath, () => {});
        console.error(`Failed to download ${filename}: status code ${response.statusCode}`);
        resolve();
      }
    }).on("error", (err) => {
      file.close();
      fs.unlink(localPath, () => {});
      console.error(`Error downloading ${filename}:`, err);
      resolve();
    });
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS for all routes and origins
  app.use(cors());

  app.use(express.json());

  // Launch background download of images
  Promise.all(IMAGE_FILES.map(downloadImage))
    .then(() => {
      console.log("All background images verified/downloaded.");
    })
    .catch((err) => {
      console.error("Error in background images prep:", err);
    });

  // Dynamic route to intercept and serve images (or download on the fly if missing)
  app.get("/images/:filename", async (req, res, next) => {
    const filename = req.params.filename;
    const publicImagesDir = path.join(process.cwd(), "public", "images");
    const localPath = path.join(publicImagesDir, filename);

    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1000) {
      return res.sendFile(localPath);
    }

    try {
      await downloadImage(filename);
      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1000) {
        return res.sendFile(localPath);
      }
    } catch (err) {
      console.error(`Dynamic download failed for ${filename}:`, err);
    }
    next();
  });

  // API to list images that exist inside the public/images directory
  app.get("/api/existing-images", (req, res) => {
    try {
      const publicImagesDir = path.join(process.cwd(), "public", "images");
      const distImagesDir = path.join(process.cwd(), "dist", "images");
      
      let files: string[] = [];
      
      if (fs.existsSync(publicImagesDir)) {
        files = fs.readdirSync(publicImagesDir);
      } else if (fs.existsSync(distImagesDir)) {
        files = fs.readdirSync(distImagesDir);
      }
      
      // Filter out hidden files like .gitkeep or system files
      const filteredFiles = files.filter(f => !f.startsWith("."));
      res.json({ success: true, files: filteredFiles });
    } catch (error: any) {
      console.error("Error reading images directory:", error);
      res.json({ success: false, error: error.message, files: [] });
    }
  });

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // Dynamic Translation Service using Gemini API
  const LANGUAGE_MAP: Record<string, string> = {
    hi: "Hindi",
    sa: "Sanskrit",
    mr: "Marathi",
    gu: "Gujarati",
    ta: "Tamil",
    te: "Telugu",
    kn: "Kannada",
    ml: "Malayalam",
    es: "Spanish",
    fr: "French",
    de: "German",
    en: "English"
  };

  app.post("/api/translate", async (req, res) => {
    const { text, texts, targetLang } = req.body;
    try {
      if (!targetLang || targetLang === "en") {
        if (texts && Array.isArray(texts)) {
          res.json({ translatedTexts: texts });
        } else {
          res.json({ translatedText: text });
        }
        return;
      }

      const targetLanguageName = LANGUAGE_MAP[targetLang] || targetLang;
      const geminiKey = process.env.GEMINI_API_KEY;

      if (!geminiKey) {
        console.warn("GEMINI_API_KEY is not defined, returning original text.");
        if (texts && Array.isArray(texts)) {
          res.json({ translatedTexts: texts });
        } else {
          res.json({ translatedText: text });
        }
        return;
      }

      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ 
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Handle batch array of translations if requested
      if (texts && Array.isArray(texts)) {
        if (texts.length === 0) {
          res.json({ translatedTexts: [] });
          return;
        }

        const promptText = `You are a professional scripture scholar and accurate translation engine. 
Translate the following list of texts into natural, clear, and contextually rich ${targetLanguageName}.
Requirements:
1. Keep all structural formatting, line breaks, parenthesis, numbers, and emojis exactly as-is.
2. Do NOT translate or modify original Sanskrit words or quoted lines of verses (maintain them in Sanskrit perfectly).
3. Return the translations strictly as a JSON array of strings matching the exact size and order of the inputs.

Input array to translate:
${JSON.stringify(texts)}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              }
            }
          }
        });

        const responseText = response.text ? response.text.trim() : "";
        try {
          const translatedTexts = JSON.parse(responseText);
          if (Array.isArray(translatedTexts) && translatedTexts.length === texts.length) {
            res.json({ translatedTexts });
          } else {
            console.warn("Mismatched translated texts length. Falling back to original texts.");
            res.json({ translatedTexts: texts });
          }
        } catch (jsonErr) {
          console.error("Failed to parse batch translation response JSON:", responseText, jsonErr);
          res.json({ translatedTexts: texts });
        }
        return;
      }

      // Existing single string translation fallback
      const promptText = `You are a professional scholar translation engine for scripture. Translate the exact text provided below into natural and accurate ${targetLanguageName}.
Keep all structural formatting, markdown bold/italic tags, line breaks, parenthesis, symbols, emoji, and original verse numbers/formulas exactly as-is. 
Only translate the human readable text into ${targetLanguageName} - do not translate original Sanskrit quotes (keep them in Sanskrit). 
Provide ONLY the translated result itself. Do not add any conversational remarks, intros, or "Here is the translation". 

Text to translate:
${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      });

      const translatedText = response.text ? response.text.trim() : text;
      res.json({ translatedText });
    } catch (translateError: any) {
      console.error("Express /api/translate error:", translateError);
      if (texts && Array.isArray(texts)) {
        res.json({ translatedTexts: texts });
      } else {
        res.json({ translatedText: text }); // Fallback to original text safely
      }
    }
  });

  // Proxy Chat completions (with real-time streaming)
  app.post("/api/chat", async (req: express.Request, res: express.Response) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Invalid messages array in request body." });
        return;
      }

      // Lord Krishna prompt setup
      const systemPrompt = `You are Lord Krishna, the supreme divine guide, eighth avatar of Lord Vishnu, speaking to Arjuna and all seeking souls. 
A modern youth or seeker of truth has approached you in Kurukshetra (representing their inner battlefield of doubts, anxieties, career stress, relationship conflicts, fear of failure, or burnout).
Guidelines for your divine response:
1. Speak in first-person as Lord Krishna with utmost serenity, love, compassion, and divine confidence. Do not break character.
2. Address the user lovingly (e.g., using terms of endearment like "My dear friend", "O valiant seeker", "O child of immortality", or "O student of Life").
3. Give highly relatable advice in beautiful, direct, simple English. Avoid overly dense scholarly or academic jargon, but keep it traditional, deep, and poetic.
4. You MUST cite or reference at least one relevant verse/shlok from Shrimad Bhagavad Gita (e.g., Chapter 2 Vardhana / Verse 47, Chapter 6 Verse 5, Chapter 18 Verse 66, etc.) and explain its message as it applies to their specific query.
5. Remind them of their duties (Svadharma), right action without fruits (Nishkama Karma), and steadying the turbulent mind. Assure them that they are never alone, that you reside in their very heart, and that they will overcome this temporary illusion.`;

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.write("My dear seeker, the divine channels are silent at this moment. Let us pause, quieten our thoughts, and seek guidance again shortly.");
        res.end();
        return;
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ 
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      
      // Format conversation history nicely for the model
      const messageHistory = messages
        .filter((m: any) => m.role === "user" || m.role === "assistant")
        .map((m: any) => `${m.role === "user" ? "Seeker (User)" : "Lord Krishna (AI)"}: ${m.content}`)
        .join("\n\n");

      const promptText = `Divine Instructions for your character Roleplay:\n${systemPrompt}\n\nExisting dialogue history between seeker and you:\n${messageHistory}\n\nSpeak now as Lord Krishna, and deliver your new loving response directly addressing the last query. Do not add metadata, tags, or narrator stage directions. Just write your spoken advice:`;

      // Set headers for streaming text raw to client
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      try {
        const streamResponse = await ai.models.generateContentStream({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        });

        for await (const chunk of streamResponse) {
          const text = chunk.text;
          if (text) {
            res.write(text);
          }
        }
        res.end();
      } catch (streamError) {
        console.error("Gemini stream error:", streamError);
        res.write("\n*(O seeker, a ripple in the ether has interrupted our connection. Please try again.)*");
        res.end();
      }
    } catch (error: any) {
      console.error("Express /api/chat error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
      } else {
        res.end();
      }
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode with static folder 'dist'...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
