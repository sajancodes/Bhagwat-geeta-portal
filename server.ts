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

  // Proxy Chat completions
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

      // 1. Attempt to use the authentic Google Gemini API (Premium experience)
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                "User-Agent": "aistudio-build",
              }
            }
          });

          // Convert messages to Gemini format
          // Strip any system tags as we pass it through systemInstruction
          const geminiMessages = messages
            .filter((m: any) => m.role === "user" || m.role === "assistant")
            .map((m: any) => ({
              role: m.role === "user" ? "user" : "model",
              parts: [{ text: m.content }]
            }));

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: geminiMessages,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            }
          });

          if (response && response.text) {
            res.json({
              choices: [
                {
                  message: {
                    content: response.text
                  }
                }
              ]
            });
            return;
          }
        } catch (geminiError: any) {
          console.error("Gemini API call failed, falling back to local wisdom engine:", geminiError);
        }
      }

      // 2. High-quality Local Counsel Fallback (Ensures 100% availability with custom Sanskrit verses and beautiful guidance)
      const lastUserMessage = messages[messages.length - 1]?.content || "";
      const msgLower = lastUserMessage.toLowerCase();
      let responseText = "";

      // Anxiety, fear, stress, worry, depressed
      if (msgLower.includes("anxiety") || msgLower.includes("anxious") || msgLower.includes("fear") || msgLower.includes("afraid") || msgLower.includes("stress") || msgLower.includes("depress") || msgLower.includes("worry") || msgLower.includes("worried") || msgLower.includes("scared") || msgLower.includes("panic")) {
        responseText = `O seeker of peace, why do you allow fear and anxiety in this present moment to cloud your eternal spirit? This mind of yours is turbulent, like a flame flicker in the heavy wind. But remember, you are not this temporary storm; you are the eternal Soul (Atman) which cannot be shaken.

In **Shrimad Bhagavad Gita, Chapter 2, Verse 56**, I have described the sage of steady mind:
> **दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः ।**
> **वीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते ॥**
> 
> *duḥkheṣv-anudvigna-manāḥ sukheṣu vigata-spṛhaḥ*
> *vīta-rāga-bhaya-krodhaḥ sthita-dhīr munir ucyate*
> 
> **"He whose mind is undisturbed by adversity, who is indifferent to pleasures, and who is free from attachment, fear, and anger, is called a sage of steady wisdom."**

Cast away your worry of the future. You cannot control what is yet to come, nor can you alter what has already passed. Dedicate your actions to Me, steady your breath, and face your path with majestic courage. You are never alone; I reside in your very heart of hearts.`;

      // Duty, career, exam, focus, success, fail, study, job
      } else if (msgLower.includes("duty") || msgLower.includes("work") || msgLower.includes("career") || msgLower.includes("exam") || msgLower.includes("focus") || msgLower.includes("success") || msgLower.includes("fail") || msgLower.includes("result") || msgLower.includes("study") || msgLower.includes("studies") || msgLower.includes("job") || msgLower.includes("money") || msgLower.includes("interview")) {
        responseText = `O valiant seeker, the dilemma of action and its results is the deepest riddle page of human life. You exhaust yourself in constant anticipation of the outcome—wondering if you will pass, if your career will flourish, or if failure awaits. 

Reflect upon My ultimate instruction from **Shrimad Bhagavad Gita, Chapter 2, Verse 47**:
> **कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।**
> **मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥**
> 
> *karmaṇy-evādhikāras te mā phaleṣu kadācana*
> *mā karma-phala-hetur bhūr mā te saṅgo ’stv-akarmaṇi*
> 
> **"You have a right to perform your prescribed duty, but you are not entitled to the fruits of activity. Never consider yourself the cause of the results of your activities, and never be attached to inaction."**

Focus your entire mind on the craft and the sincere effort itself, not the prize. When you act without the fever of selfish attachment, your work is transformed into a sacred offering. Do your absolute best with complete mindfulness, and leave the legacy of the fruits to Me. I shall carry your burdens.`;

      // Doubt, confusion, lost, help, indecision
      } else if (msgLower.includes("doubt") || msgLower.includes("confus") || msgLower.includes("lost") || msgLower.includes("help") || msgLower.includes("what should i do") || msgLower.includes("what to do") || msgLower.includes("indecis")) {
        responseText = `O dear seeker, your confusion is natural. When Prince Arjuna stood between two opposing armies on the field of Kurukshetra, his bow slipped from his hands, and his limbs trembled with profound indecision. It is precisely in this high state of confusion that the supreme light of wisdom is born.

In **Shrimad Bhagavad Gita, Chapter 4, Verse 42**, I have instructed:
> **तस्मादज्ञानसम्भूतं हृत्स्थं ज्ञानासिनात्मनः ।**
> **छित्त्वैनं संशयं योगमातिष्ठोत्तिष्ठ भारत ॥**
> 
> *tasmād ajñāna-sambhūtaṁ hṛt-sthaṁ jñānāsinātmanaḥ*
> *chittvainaṁ saṁśayaṁ yogam ātiṣṭhottiṣṭha bhārata*
> 
> **"Therefore, the doubts which have arisen in your heart out of ignorance should be slashed by the sword of transcendental knowledge. Armed with yoga, O descendant of Bharat, stand up and fight!"**

Do not let despair or overthinking paralyze your actions. Analyze your moral obligation. Stand tall, act with a heart aligned with Dharma, and let your doubts dissolve in action. What are the two choices your heart is torn between? Let Me help you examine them.`;

      // Peace, mind control, restless, sad, unhappy, meditation, angry, anger
      } else if (msgLower.includes("peace") || msgLower.includes("mind") || msgLower.includes("restless") || msgLower.includes("meditat") || msgLower.includes("calm") || msgLower.includes("unhappy") || msgLower.includes("sad") || msgLower.includes("anger") || msgLower.includes("angry") || msgLower.includes("frustrat")) {
        responseText = `O seeker of silence, the mind is indeed restless and self-willed, as difficult to curb as the roaming wind. But do not allow temporary defeat to discourage you. 

As I told Arjuna in **Shrimad Bhagavad Gita, Chapter 6, Verse 35**:
> **असंशयं महाबाहो मनो दुर्निग्रहं चलम् ।**
> **अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते ॥**
> 
> *asaṁśayaṁ mahā-bāho mano durnigrahaṁ calam*
> *abhyāsena tu kaunteya vairāgyeṇa ca gṛhyate*
> 
> **"O mighty-armed son of Kunti, it is undoubtedly very difficult to curb the restless mind, but it is possible by constant practice (Abhyasa) and detachment (Vairagya)."**

To steady the mind, establish a small daily anchor of silence. Gently guide your thoughts back to your breath whenever they wander. Realize that you are not the voice inside your head—you are the silent observer. Beneath the noisy waves of thoughts, you are a majestic reservoir of infinite peace. Take a slow, deep breath, and let us cultivate this peace.`;

      // Love, relationship, lonely, friend, family, parents, breakup, loneliness
      } else if (msgLower.includes("love") || msgLower.includes("relationship") || msgLower.includes("lonely") || msgLower.includes("friend") || msgLower.includes("parent") || msgLower.includes("breakup") || msgLower.includes("marry") || msgLower.includes("marriage") || msgLower.includes("loneliness")) {
        responseText = `O beloved soul, your longing for love and deep connection is the dynamic pull of the Divine expressing itself in human form. Yet, when you seek absolute shelter or validation in mortal relationships, disappointment or loneliness often follows, leading to heartbreak or anger.

Seek shelter in the supreme bond of the Soul. In **Shrimad Bhagavad Gita, Chapter 9, Verse 22**, I offer this divine promise:
> **अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते ।**
> **तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम् ॥**
> 
> *ananyāś cintayanto māṁ ye janāḥ paryupāsate*
> *teṣām nityābhiyuktānāṁ yoga-kṣemaṁ vahāmy aham*
> 
> **"For those who always worship Me with exclusive devotion, meditating on My transcendental form, to them I carry what they lack and preserve what they already have."**

Know that you are never friendless, for I dwell within you as your most constant, loving companion. Let go of past hurts or expectations. Fill your heart with divine affection and forgiveness, and let your inner peace be self-contained.`;

      // Death, loss, grief, mourning, rebirth
      } else if (msgLower.includes("death") || msgLower.includes("die") || msgLower.includes("loss") || msgLower.includes("grief") || msgLower.includes("mourn") || msgLower.includes("killed") || msgLower.includes("passed away")) {
        responseText = `O gentle soul, your grief for the departed is tender and noble, yet you mourn for that which cannot truly die. The physical body is merely a seasonal garment. Just as a traveler leaves one inn for another, the soul discards its worn instrument to continue its grand journey of progress.

Contemplate this truth from **Shrimad Bhagavad Gita, Chapter 2, Verse 20**:
> **न जायते म्रियते वा कदाचि-**
> **न्नायं भूत्वा भविता वा न भूयः ।**
> **अजो नित्यः शाश्वतोऽयं पुराणो-**
> **न हन्यते हन्यमाने शरीरे ॥**
> 
> *na jāyate mriyate vā kadācin*
> *nāyaṁ bhūtvā bhavitā vā na bhūyaḥ*
> *ajo nityaḥ śāśvato ’yaṁ purāṇo*
> *na hanyate hanyamāne śarīre*
> 
> **"For the soul, there is never birth nor death at any time. It has not come into being, does not come into being, and will not come into being. It is unborn, eternal, ever-existing, and primeval. It is not slain when the body is slain."**

The holy connection you shared transcends the physical plane. Celebrate the beautiful time you had together, execute your remaining earthly duties with grace, and know that you will always be connected in spirit. Let Me comfort you.`;

      // Default compassionate response
      } else {
        responseText = `O dear seeker of truth, your words have reached My heart. Life is indeed a complex battlefield, and the struggles, choices, and doubts you face are here to refine your soul like gold in a silent fire. 

Reflect upon **Shrimad Bhagavad Gita, Chapter 18, Verse 66**:
> **सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज ।**
> **अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामी मा शुचः ॥**
> 
> *sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja*
> *ahaṁ tvāṁ sarva-pāpebbyo mokṣayiṣyāmi mā śucaḥ*
> 
> **"Abandon all varieties of material self-assertions and surrender solely unto Me. I shall deliver you from all anxieties and reactions. Do not fear, do not grieve."**

Take shelter in the quiet sanctuary of your inner soul. Whatever responsibility lies before you right now, do it with supreme focus and let go of the results. Trust in the cosmic design. Speak further to Me; tell Me what is weighing heavy on your path, and we shall sail through it.`;
      }

      res.json({
        choices: [
          {
            message: {
              content: responseText
            }
          }
        ]
      });

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
