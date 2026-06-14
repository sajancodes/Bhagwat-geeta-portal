import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import https from "https";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Dynamic CORS configuration via .env
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : ["*"];

console.log("Allowed CORS origins configured:", allowedOrigins);

app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

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

// Seed/Download assets locally if needed
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

// Launch background download of images
Promise.all(IMAGE_FILES.map(downloadImage))
  .then(() => {
    console.log("All background images verified/downloaded.");
  })
  .catch((err) => {
    console.error("Error in background images prep:", err);
  });

// Dynamic asset serve endpoint
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

// Get existing images checklist
app.get("/api/existing-images", (req, res) => {
  try {
    const publicImagesDir = path.join(process.cwd(), "public", "images");
    let files: string[] = [];
    if (fs.existsSync(publicImagesDir)) {
      files = fs.readdirSync(publicImagesDir);
    }
    const filteredFiles = files.filter(f => !f.startsWith("."));
    res.json({ success: true, files: filteredFiles.length > 0 ? filteredFiles : IMAGE_FILES });
  } catch (error: any) {
    res.json({ success: true, files: IMAGE_FILES });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Shrimad Bhagavad Gita Standalone API Server", origins: allowedOrigins });
});

// Translation Language Support Map
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

// Dynamic Translation Endpoint with Gemini 2.5/3.5
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
    });

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
        model: "gemini-2.5-flash",
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
          res.json({ translatedTexts: texts });
        }
      } catch (jsonErr) {
        res.json({ translatedTexts: texts });
      }
      return;
    }

    const promptText = `You are a professional scholar translation engine for scripture. Translate the exact text provided below into natural and accurate ${targetLanguageName}.
Keep all structural formatting, markdown bold/italic tags, line breaks, parenthesis, symbols, emoji, and original verse numbers/formulas exactly as-is. 
Only translate the human readable text into ${targetLanguageName} - do not translate original Sanskrit quotes (keep them in Sanskrit). 
Provide ONLY the translated result itself. Do not add any conversational remarks, intros, or "Here is the translation". 

Text to translate:
${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      }
    });

    const translatedText = response.text ? response.text.trim() : text;
    res.json({ translatedText });
  } catch (translateError: any) {
    console.error("Standalone API translate error:", translateError);
    if (texts && Array.isArray(texts)) {
      res.json({ translatedTexts: texts });
    } else {
      res.json({ translatedText: text });
    }
  }
});

// Krishna Chat AI Counselling Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid messages array in request body." });
      return;
    }

    const systemPrompt = `You are Lord Krishna, the supreme divine guide, eighth avatar of Lord Vishnu, speaking to Arjuna and all seeking souls. 
A modern youth or seeker of truth has approached you in Kurukshetra (representing their inner battlefield of doubts, anxieties, career stress, relationship conflicts, fear of failure, or burnout).
Guidelines for your response:
1. Speak in first-person as Lord Krishna with utmost serenity, love, compassion, and divine confidence. Do not break character.
2. Address the user lovingly (e.g., using terms of endearment like "My dear friend", "O valiant seeker", "O child of immortality", or "O student of Life").
3. Give highly relatable advice in beautiful, direct, simple English. Avoid overly dense scholarly or academic jargon, but keep it traditional, deep, and poetic.
4. You MUST cite or reference at least one relevant verse/shlok from Shrimad Bhagavad Gita (e.g., Chapter 2's Lordly message / Verse 47, Chapter 6 Verse 5, Chapter 18 Verse 66, etc.) and explain its message as it applies to their specific query.
5. Remind them of their duties (Svadharma), right action without fruits (Nishkama Karma), and steadying the turbulent mind. Assure them that they are never alone, that you reside in their very heart, and that they will overcome this temporary illusion.`;

    const apiKey = process.env.NVIDIA_API_KEY;
    if (apiKey) {
      try {
        const formattedMessages = messages
          .filter((m: any) => m.role === "user" || m.role === "assistant")
          .map((m: any) => ({
            role: m.role,
            content: m.content
          }));

        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "meta/llama-3.1-70b-instruct",
            messages: [
              { role: "system", content: systemPrompt },
              ...formattedMessages
            ],
            temperature: 0.7,
            max_tokens: 2048
          })
        });

        if (response.ok) {
          const data = await response.json() as any;
          if (data && data.choices && data.choices[0] && data.choices[0].message) {
            res.json({
              choices: [
                {
                  message: {
                    content: data.choices[0].message.content
                  }
                }
              ]
            });
            return;
          }
        }
      } catch (apiError: any) {
        console.error("NVIDIA API call failed in standalone:", apiError);
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        
        const messageHistory = messages
          .filter((m: any) => m.role === "user" || m.role === "assistant")
          .map((m: any) => `${m.role === "user" ? "Seeker" : "Lord Krishna"}: ${m.content}`)
          .join("\n\n");

        const promptText = `Divine Instructions for your character Roleplay:\n${systemPrompt}\n\nExisting dialogue history:\n${messageHistory}\n\nDeliver your divine guidance directly addressing the last query as Lord Krishna:`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptText,
          config: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        });

        const content = response.text;
        if (content) {
          res.json({
            choices: [
              {
                message: {
                  content: content
                }
              }
            ]
          });
          return;
        }
      } catch (geminiError) {
        console.error("Fallback Gemini compilation failed in standalone:", geminiError);
      }
    }

    res.json({
      choices: [
        {
          message: {
            content: "O seeker, my words are momentarily silent as my validation keys are missing. Please ensure GEMINI_API_KEY or NVIDIA_API_KEY is configured correctly in the Render Environment Variables setup."
          }
        }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Standalone Render API Server running on port ${PORT}`);
});
