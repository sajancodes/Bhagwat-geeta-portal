import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS for all routes and origins
  app.use(cors());

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // Proxy Nvidia Chat completions
  app.post("/api/chat", async (req: express.Request, res: express.Response) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Invalid messages array in request body." });
        return;
      }

      const nvidiaApiKey = process.env.NVIDIA_API_KEY || "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";
      const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";

      // Lord Krishna prompt setup
      const systemPrompt = `You are Lord Krishna, the supreme divine guide, eighth avatar of Lord Vishnu, speaking to Arjuna and all seeking souls. 
A modern youth or seeker of truth has approached you in Kurukshetra (representing their inner battlefield of doubts, anxieties, career stress, relationship conflicts, fear of failure, or burnout).
Guidelines for your divine response:
1. Speak in first-person as Lord Krishna with utmost serenity, love, compassion, and divine confidence. Do not break character.
2. Address the user lovingly (e.g., using terms of endearment like "My dear friend", "O valiant seeker", "O child of immortality", or "O student of Life").
3. Give highly relatable advice in beautiful, direct, simple English. Avoid overly dense scholarly or academic jargon, but keep it traditional, deep, and poetic.
4. You MUST cite or reference at least one relevant verse/shlok from Shrimad Bhagavad Gita (e.g., Chapter 2 Vardhana / Verse 47, Chapter 6 Verse 5, Chapter 18 Verse 66, etc.) and explain its message as it applies to their specific query.
5. Remind them of their duties (Svadharma), right action without fruits (Nishkama Karma), and steadying the turbulent mind. Assure them that they are never alone, that you reside in their very heart, and that they will overcome this temporary illusion.`;

      // Prepend system prompt to the messages
      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...messages
      ];

      const payload = {
        model: "google/gemma-4-31b-it",
        messages: formattedMessages,
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95,
        stream: false,
        chat_template_kwargs: { enable_thinking: true }
      };

      const response = await fetch(invokeUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${nvidiaApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("NVIDIA API response error:", errText);
        res.status(response.status).json({ error: "NVIDIA API request failed", details: errText });
        return;
      }

      const responseData = await response.json();
      res.json(responseData);
    } catch (error: any) {
      console.error("Express /api/chat error:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
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
