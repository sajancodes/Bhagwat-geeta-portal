import React, { useState, useEffect, useRef } from "react";
import { 
  auth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "./lib/firebase";
import { 
  gitaChapters 
} from "./data/chaptersMeta";
import { 
  chaptersCollection 
} from "./data/chaptersText";
import { 
  mahabharatLegends 
} from "./data/legends";
import { 
  benefitCards, 
  tributeCards, 
  podcastCards, 
  bookCards, 
  faqItems 
} from "./data/staticContent";
import { Verse } from "./types";
import { LegendAvatar } from "./components/LegendAvatar";
import { LanguageSelector } from "./components/LanguageSelector";
import { Translate, useTranslate } from "./components/Translate";
import { getApiUrl } from "./utils/api";
import { 
  BookOpen, 
  Search, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  LogOut, 
  Compass, 
  PlayCircle, 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  Lock, 
  Mail, 
  User, 
  Check, 
  ChevronDown, 
  BookMarked, 
  Heart, 
  Sparkles,
  Award,
  ChevronRight,
  UserCheck
} from "lucide-react";

export default function App() {
  const { translate } = useTranslate();
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // Auth States
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [authScreen, setAuthScreen] = useState<"landing" | "login">("landing");

  // Mobile menu and navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Introduction");
  const treeScrollRef = useRef<HTMLDivElement>(null);

  // Portal Modals States
  const [studyPortalOpen, setStudyPortalOpen] = useState<boolean>(false);
  const [activeStudyChapter, setActiveStudyChapter] = useState<number>(1);
  const [activeStudyVerses, setActiveStudyVerses] = useState<Verse[]>([]);
  const [activeVerseIndex, setActiveVerseIndex] = useState<number>(0);

  // Legends Portal State
  const [legendsPortalOpen, setLegendsPortalOpen] = useState<boolean>(false);
  const [activeLegendIndex, setActiveLegendIndex] = useState<number | null>(null);

  // Family Tree active tab ("flow" - Unified Map, "bento" - Generations list, "search" - Relation Finder)
  const [familyTreeTab, setFamilyTreeTab] = useState<"flow" | "bento" | "search">("bento");
  const [familyTreeSearchQuery, setFamilyTreeSearchQuery] = useState<string>("");
  const [existingLocalImages, setExistingLocalImages] = useState<string[]>([
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
  ]);
  const [imageInsertCounter, setImageInsertCounter] = useState<number>(0);

  const saveCustomImage = (charName: string, url: string) => {
    try {
      const saved = localStorage.getItem("gita_legend_images");
      const obj = saved ? JSON.parse(saved) : {};
      const key = charName.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (url) {
        obj[key] = url;
      } else {
        delete obj[key];
      }
      localStorage.setItem("gita_legend_images", JSON.stringify(obj));
      setImageInsertCounter(prev => prev + 1);
    } catch (e) {
      console.error("Failed to save custom image override:", e);
    }
  };

  const getLegendImg = (charName: string): string => {
    let query = charName.toLowerCase();
    if (query === "yudhishthira" || query === "yudhistra") query = "yudhisthira";
    const found = mahabharatLegends.find(l => l.name.toLowerCase() === query);
    return found?.img || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80";
  };

  const renderCharacterAvatar = (name: string, className: string = "w-full h-full") => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Direct known-character names to correct filenames mapping
    const getMappedFilename = (norm: string): string | null => {
      if (norm === "bhishma" || norm === "bhisma") return "bhisma.jpg";
      if (norm === "yudhistra" || norm === "yudhishthira" || norm === "yudhisthir" || norm === "yudhishthir" || norm === "yudhisthira") return "yudhisthira.jpg";
      if (norm === "bheem" || norm === "bhima" || norm === "bheema") return "bheema.jpg";
      if (norm === "arjun" || norm === "arjuna") return "arjuna.jpg";
      if (norm === "karn" || norm === "karna") return "karna.jpg";
      if (norm === "duryodhan" || norm === "duryodhana") return "duryodhana.jpg";
      if (norm === "dhritarashtra" || norm === "dhritrashthra" || norm === "dhritrastra") return "dhritrastra.jpg";
      if (norm === "sahadev" || norm === "sahadeva") return "sahadeva.jpg";
      if (norm === "vidur" || norm === "vidura") return "vidur.jpg";
      if (norm === "kaurava" || norm === "kauravas") return "kaurava.JPG";
      if (norm === "abhimanyu") return "abhimanyu.jpg";
      if (norm === "ashwathama") return "ashwathama.jpg";
      if (norm === "draupadi") return "draupadi.jpg";
      if (norm === "dronacharya") return "dronacharya.jpg";
      if (norm === "gandhari") return "gandhari.jpg";
      if (norm === "krishna") return "krishna.jpg";
      if (norm === "kunti") return "kunti.jpg";
      if (norm === "nakula") return "nakula.jpg";
      if (norm === "pandu") return "pandu.jpg";
      if (norm === "sanjaya") return "sanjaya.jpg";
      return null;
    };

    const mappedFile = getMappedFilename(cleanName);
    if (mappedFile) {
      return (
        <img 
          src={`/images/${mappedFile}`} 
          alt={name} 
          className={`${className} object-cover`}
          referrerPolicy="no-referrer"
        />
      );
    }

    const foundFile = existingLocalImages.find(f => {
      const dotIndex = f.lastIndexOf(".");
      const namePart = dotIndex !== -1 ? f.substring(0, dotIndex) : f;
      return namePart.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanName;
    });

    if (foundFile) {
      return (
        <img 
          src={`/images/${foundFile}`} 
          alt={name} 
          className={`${className} object-cover`}
          referrerPolicy="no-referrer"
        />
      );
    }

    // Classic FB-like "half-donut" default avatar silhouette
    return (
      <div className={`relative ${className} bg-stone-200 dark:bg-stone-830 text-stone-400 dark:text-stone-500 flex items-center justify-center overflow-hidden`}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head circle */}
          <circle cx="50" cy="38" r="18" fill="currentColor" />
          {/* Torso/Shoulders (half-donut shape) */}
          <path 
            d="M20,82 C20,60 32,50 50,50 C68,50 80,60 80,82 C80,84 80,85 80,85 L20,85 L20,82 Z" 
            fill="currentColor" 
          />
        </svg>
      </div>
    );
  };

  const openLegendByName = (name: string) => {
    let query = name.toLowerCase();
    if (query === "yudhishthira" || query === "yudhistra") query = "yudhisthira";
    const idx = mahabharatLegends.findIndex(l => l.name.toLowerCase() === query);
    if (idx !== -1) {
      setActiveLegendIndex(idx);
      setLegendsPortalOpen(true);
      document.body.style.overflow = "hidden";
    }
  };

  // Search States
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Accordion active FAQ index
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Verse of the Day state
  const [dailyVerse, setDailyVerse] = useState<Verse | null>(null);

  // --- NEW STATES FOR BOOKMARKS, HISTORY, TOPICS, AND AI ---
  const [bookmarks, setBookmarks] = useState<{ chapter: number, verse: number }[]>(() => {
    try {
      const saved = localStorage.getItem("gita_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [historyList, setHistoryList] = useState<{ chapter: number, verse: number, timestamp: number }[]>(() => {
    try {
      const saved = localStorage.getItem("gita_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [keywordQuery, setKeywordQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [searchTriggered, setSearchTriggered] = useState<boolean>(false);

  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark-mode", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark-mode", "dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Fetch list of local images
  useEffect(() => {
    fetch(getApiUrl("/api/existing-images"))
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.files)) {
          setExistingLocalImages(data.files);
        }
      })
      .catch(err => console.error("Could not fetch local images list:", err));
  }, []);

  // Dynamically load Google Translate Script lazily ONLY if saved user preference is non-English
  useEffect(() => {
    const saved = localStorage.getItem("gita_preferred_lang") || "en";
    if (saved !== "en") {
      import("./components/LanguageSelector").then(({ loadGoogleTranslate }) => {
        loadGoogleTranslate();
      });
    }
  }, []);

  // Select Verse of the Day based on the day of the year
  useEffect(() => {
    // We pick from all accumulated chapter 1 to 14 verses
    const versesPool: Verse[] = [];
    Object.values(chaptersCollection).forEach(vList => {
      vList.forEach(item => versesPool.push(item));
    });

    if (versesPool.length > 0) {
      const now = new Date();
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
      const index = dayOfYear % versesPool.length;
      setDailyVerse(versesPool[index]);
    }
  }, []);

  // Scroll to section helper
  const scrollToSection = (id: string, label: string) => {
    setActiveTab(label);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Auth Actions
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!email || !password) {
      setAuthError("Please fill in all email and password fields.");
      return;
    }
    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || "An authentication error occurred.");
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setAuthError(err.message || "Google Authentication failed.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsGuest(false);
      setAuthScreen("landing");
    } catch (err: any) {
      console.error("Sign Out error:", err);
    }
  };

  // Chapter study trigger
  const openChapterForStudy = (chapterNum: number) => {
    const verses = chaptersCollection[chapterNum] || [];
    if (verses.length > 0) {
      setActiveStudyChapter(chapterNum);
      setActiveStudyVerses(verses);
      setActiveVerseIndex(0);
      setStudyPortalOpen(true);
      document.body.style.overflow = "hidden";
    } else {
      alert(`Verses for Chapter ${chapterNum} are coming soon!`);
    }
  };

  // Direct verse search
  const handleDirectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      alert("Please enter a valid format class like '2.47' or '12.1'!");
      return;
    }
    const parts = query.split(".");
    if (parts.length !== 2) {
      alert("Format must be: chapter.verse (e.g. 2.47)");
      return;
    }
    const chNum = parseInt(parts[0]);
    const vsNum = parseInt(parts[1]);
    if (isNaN(chNum) || isNaN(vsNum)) {
      alert("Please enter integer numbers for chapter and verse!");
      return;
    }

    const chapterList = chaptersCollection[chNum];
    if (!chapterList) {
      alert(`Chapter ${chNum} dataset is currently offline or coming soon!`);
      return;
    }

    const foundIdx = chapterList.findIndex(item => item.verse === vsNum);
    if (foundIdx === -1) {
      alert(`Verse ${vsNum} was not found in Chapter ${chNum}. Try within its verse count!`);
      return;
    }

    setActiveStudyChapter(chNum);
    setActiveStudyVerses(chapterList);
    setActiveVerseIndex(foundIdx);
    setStudyPortalOpen(true);
    document.body.style.overflow = "hidden";
  };

  // Next and prev verse navigation
  const nextVerse = () => {
    if (activeVerseIndex < activeStudyVerses.length - 1) {
      setActiveVerseIndex(activeVerseIndex + 1);
    }
  };

  const prevVerse = () => {
    if (activeVerseIndex > 0) {
      setActiveVerseIndex(activeVerseIndex - 1);
    }
  };

  // Close modals
  const closeStudyPortal = () => {
    setStudyPortalOpen(false);
    document.body.style.overflow = "auto";
  };

  const closeLegendsPortal = () => {
    setLegendsPortalOpen(false);
    document.body.style.overflow = "auto";
  };

  // --- NEW PERSISTENT WISDOM HUB & AI METHODS ---
  const openSpecificVerseForStudy = (chapterNum: number, verseNum: number) => {
    const verses = chaptersCollection[chapterNum] || [];
    if (verses.length > 0) {
      const idx = verses.findIndex(v => v.verse === verseNum);
      if (idx !== -1) {
        setActiveStudyChapter(chapterNum);
        setActiveStudyVerses(verses);
        setActiveVerseIndex(idx);
        setStudyPortalOpen(true);
        document.body.style.overflow = "hidden";
      } else {
        alert(`Verse ${verseNum} was not found in Chapter ${chapterNum}.`);
      }
    } else {
      alert(`Chapter ${chapterNum} is coming soon!`);
    }
  };

  const addToHistory = (chapter: number, verse: number) => {
    const historyItem = { chapter, verse, timestamp: Date.now() };
    setHistoryList(prev => {
      const filtered = prev.filter(item => !(item.chapter === chapter && item.verse === verse));
      const updated = [historyItem, ...filtered].slice(0, 10);
      localStorage.setItem("gita_history", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (studyPortalOpen && activeStudyVerses.length > 0) {
      const currentVerse = activeStudyVerses[activeVerseIndex];
      if (currentVerse) {
        addToHistory(currentVerse.chapter, currentVerse.verse);
      }
    }
  }, [studyPortalOpen, activeStudyChapter, activeVerseIndex]);

  const isBookmarked = (chapter: number, verse: number) => {
    return bookmarks.some(b => b.chapter === chapter && b.verse === verse);
  };

  const toggleBookmark = (chapter: number, verse: number) => {
    setBookmarks(prev => {
      let updated;
      if (prev.some(b => b.chapter === chapter && b.verse === verse)) {
        updated = prev.filter(b => !(b.chapter === chapter && b.verse === verse));
      } else {
        updated = [...prev, { chapter, verse }];
      }
      localStorage.setItem("gita_bookmarks", JSON.stringify(updated));
      return updated;
    });
  };

  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = keywordQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      setSearchTriggered(false);
      return;
    }

    const matches: Verse[] = [];
    Object.entries(chaptersCollection).forEach(([chStr, vList]) => {
      const chNum = parseInt(chStr);
      vList.forEach(item => {
        if (
          item.translation.toLowerCase().includes(query) ||
          item.transliteration.toLowerCase().includes(query) ||
          item.sanskrit.toLowerCase().includes(query) ||
          item.purport.toLowerCase().includes(query)
        ) {
          matches.push(item);
        }
      });
    });

    setSearchResults(matches);
    setSearchTriggered(true);

    const el = document.getElementById("search-results-section");
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  };

  const sendMessageToKrishna = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    if (!textToSend) {
      setChatInput("");
    }

    const userMsg = { role: "user" as const, content: text };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const apiUrl = getApiUrl("/api/chat");

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedMessages
        })
      });

      if (!res.ok) {
        throw new Error("Krishna AI request failed");
      }

      const data = await res.json();
      const content = data.choices[0].message.content;
      setChatMessages(prev => [...prev, { role: "assistant", content }]);
    } catch (err) {
      console.error("Krishna AI Error:", err);
      
      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "I am unable to speak right now as My divine portal is temporarily offline or experiencing connection issues. O seeker, please verify that your `NVIDIA_API_KEY` is correctly set in your AI Studio environment settings, and try again in an instant."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Determine if we should show login/landing or portal
  const showMainSite = user || isGuest;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fcf9f2] dark:bg-[#1b0f0a] flex items-center justify-center flex-col transition-colors duration-300">
        <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-serif text-lg text-amber-900 dark:text-amber-200 animate-pulse">Loading Gita Portal...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased text-gray-900 transition-colors duration-300 ${darkMode ? "dark bg-[#1b0f0a] text-stone-100" : "bg-[#faf6ee] text-[#4a3628]"}`}>
      
      {/* 1. AUTHENTICATION MODULE */}
      {!showMainSite && (
        <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-12" id="auth-main">
          {/* Parallax Battlefield Atmosphere behind */}
          <div className="absolute inset-0 bg-cover bg-center brightness-[0.25] transition-transform duration-[20s] hover:scale-105" 
               style={{ backgroundImage: `url('/images/battlefield.jpg')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b0f0a] via-transparent to-[#1b0f0a]/30" />
          
          <div className="relative z-10 w-full max-w-md bg-[#fffdfa]/95 dark:bg-[#1b0f0a]/95 backdrop-blur-md rounded-2xl border-2 border-amber-600 dark:border-amber-400 p-8 shadow-2xl transition-all duration-300">
            {/* Header branding */}
            <div className="text-center mb-8">
              <span className="inline-block p-3 rounded-full bg-amber-100 dark:bg-amber-950/50 mb-3 border border-amber-500/20">
                <BookOpen className="w-8 h-8 text-amber-700 dark:text-amber-400" />
              </span>
              <h1 className="font-serif text-3xl font-bold text-amber-900 dark:text-amber-200 uppercase tracking-widest">
                Gita Portal
              </h1>
              <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto my-3" />
              <p className="text-sm italic text-amber-800/80 dark:text-amber-300/80">
                Timeless Wisdom of the Shrimad Bhagavad Gita
              </p>
            </div>

            {authScreen === "landing" ? (
              <div className="space-y-6 text-center">
                <p className="text-sm leading-relaxed text-gray-700 dark:text-stone-300">
                  Uncover supreme peace, clarity of duty, and detachment. Join millions across the globe studying the majestic dialogue between Prince Arjuna and Lord Krishna set in Kurukshetra.
                </p>
                <div className="space-y-3 pt-4">
                  <button 
                    onClick={() => setAuthScreen("login")}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-stone-900 text-amber-200 hover:text-white rounded-full font-semibold shadow-lg shadow-amber-900/30 transform hover:-translate-y-0.5 transition-all text-base cursor-pointer"
                  >
                    Gain Divine Entry
                  </button>
                  <button 
                    onClick={() => {
                      setIsGuest(true);
                      alert("Welcome as our esteemed Guest. You can experience the entire Gita Portal!");
                    }}
                    className="w-full py-3 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-600/50 text-amber-800 dark:text-amber-400 rounded-full font-semibold transition-all cursor-pointer text-sm"
                  >
                    Explore immediately as Guest
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-5">
                <h3 className="font-serif text-xl font-semibold text-center text-amber-900 dark:text-amber-300 mb-2">
                  {isSignUpMode ? "Create Spiritual Account" : "Sign In to Gita Portal"}
                </h3>

                {authError && (
                  <div className="p-3 bg-red-100/90 dark:bg-red-950/30 border border-red-500/20 text-red-700 dark:text-red-400 text-xs rounded-lg text-center font-medium">
                    {authError}
                  </div>
                )}

                 <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-amber-800/60 dark:text-amber-400/60" />
                    <input 
                      type="email" 
                      placeholder={translate("Your Email")} 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-3 pl-10 pr-4 bg-[#fcf9f2] dark:bg-[#2c1b12] text-gray-900 dark:text-stone-100 rounded-xl border border-amber-900/20 focus:outline-none focus:border-amber-500 text-sm"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-amber-800/60 dark:text-amber-400/60" />
                    <input 
                      type="password" 
                      placeholder={translate("Secret Password")} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full py-3 pl-10 pr-4 bg-[#fcf9f2] dark:bg-[#2c1b12] text-gray-900 dark:text-stone-100 rounded-xl border border-amber-900/20 focus:outline-none focus:border-amber-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-amber-800 hover:bg-amber-900 text-amber-100 dark:text-amber-200 font-semibold rounded-xl transition-all cursor-pointer shadow-md text-sm"
                  >
                    {isSignUpMode ? "Register Me" : "Step In & Learn"}
                  </button>
                  
                  <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-400">
                    <button 
                      type="button"
                      onClick={() => setIsSignUpMode(!isSignUpMode)}
                      className="hover:underline focus:outline-none cursor-pointer"
                    >
                      {isSignUpMode ? "Already registered? Sign In" : "Need an account? Sign Up"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsGuest(true);
                        alert("Proceeding as guest visitor!");
                      }}
                      className="font-medium hover:underline cursor-pointer text-amber-700 dark:text-amber-300"
                    >
                      Proceed as Guest instead
                    </button>
                  </div>
                </div>

                <div className="relative py-2 flex items-center justify-center text-xs text-amber-800/50 uppercase">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-amber-900/10"></span></div>
                  <span className="relative bg-[#fffdfa] dark:bg-[#1b0f0a] px-3">or continue with</span>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 bg-white text-gray-800 rounded-xl border border-stone-300/80 hover:bg-stone-50 transition-all flex items-center justify-center gap-3 shadow-sm font-semibold text-sm cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0  0  24  24" width="24" height="24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.714  5.714  0  0  1  8.277  12.8a5.714  5.714  0  0  1  5.714-5.714c2.43 0  4.524 1.543  5.378 3.737l3.963-3.077C21.054 4.17 17.88 2  13.99 2a9.99  9.99  0  0  0-9.99 9.99a9.99  9.99  0  0  0  9.99 9.99c5.688 0  9.96-4 9.96-9.99c0-.682-.082-1.32-.227-1.925l-11.48.01Z"></path>
                    <path fill="#4285F4" d="M23.733 10.285c.145.605.227 1.243.227 1.925c0 5.99-4.272 9.99-9.96 9.99a9.99  9.99  0  0  1-9.99-9.99a9.99  9.99  0  0  1  9.99-9.99c3.89 0  7.064 2.17  9.341 5.736l-3.963 3.077c-.854-2.194-2.948-3.737-5.378-3.737A5.714  5.714  0  0  0  8.277  12.8a5.714  5.714  0  0  0  5.714 5.714c2.617 0  4.488-1.704  5.136-4.114h-6.887V10.285Z"></path>
                    <path fill="#FBBC05" d="M13.991 22.8a9.99  9.99  0  0  1-9.99-9.99a9.99  9.99  0  0  1  9.99-9.99c3.89 0  7.064  2.17  9.341  5.736l-3.963  3.077c-.854-2.194-2.948-3.737-5.378-3.737a5.714  5.714  0  0  0-5.714  5.714a5.714  5.714  0  0  0  5.714  5.714c2.617  0  4.488-1.704  5.136-4.114h-6.887V10.285l11.48.01c.227.682.227 1.32.227 1.925c0 5.99-4.272 9.99-9.96 9.99Z"></path>
                    <path fill="#34A853" d="M13.991 2.82A5.714  5.714  0  0  0  8.277  12.8a5.714  5.714  0  0  0  5.714  5.714c2.617  0  4.488-1.704  5.136-4.114h-6.887V10.285l11.48.01c.227.682.227 1.32.227 1.925c0 5.99-4.272 9.99-9.96 9.99a9.99  9.99  0  0  1-9.99-9.99A9.99  9.99  0  0  1  13.99 2a9.99  9.99  0  0  1  9.341  5.736l-3.963  3.077c-.854-2.194-2.948-3.737-5.378-3.737Z"></path>
                  </svg>
                  Sign In with Google
                </button>

                <div 
                  onClick={() => setAuthScreen("landing")}
                  className="pt-2 text-center text-xs text-amber-800/80 dark:text-amber-400/85 hover:underline cursor-pointer"
                >
                  &larr; Back to Welcome Screen
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. MAIN SECURE WEBSITE CONTENT */}
      {showMainSite && (
        <>
          {/* NAVIGATION BAR */}
          <nav className="fixed top-0 left-0 w-full h-[75px] bg-[#ffffff]/90 dark:bg-[#1b0f0a]/90 backdrop-blur-md border-b-2 border-[#deb887] dark:border-amber-700 shadow-md z-[999] flex items-center transition-colors">
            <div className="w-[95%] max-w-[1400px] mx-auto flex items-center justify-between relative">
              
              {/* Left action - Hamburger Menu trigger */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:px-5 md:py-2.5 px-3 py-2 bg-[#8b4513] text-[#ffd700] border-none rounded-full font-bold cursor-pointer flex items-center gap-2 hover:scale-[1.03] hover:bg-[#5d4037] active:scale-[0.98] transition-all"
                >
                  <Menu className="w-5 h-5" />
                  <span className="hidden sm:inline">MENU</span>
                </button>

                {/* Custom layout language selector */}
                <LanguageSelector />
              </div>

              {/* Centered Brand Title */}
              <div 
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="absolute left-1/2 transform -translate-x-1/2 font-serif font-black text-[#8b4513] dark:text-[#ffd700] md:text-2xl text-xl tracking-[3px] select-none cursor-pointer hover:opacity-90 hidden md:block"
              >
                GITA PORTAL
              </div>

              {/* Right actions - Logout and Theme toggle */}
              <div className="flex items-center gap-2 md:gap-3">
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline text-xs italic text-gray-500 max-w-[120px] truncate" title={user.email}>
                      {user.displayName || user.email}
                    </span>
                    <button 
                      onClick={handleSignOut}
                      className="bg-[#8b4513] dark:bg-amber-950 hover:bg-[#5d4037] text-white border-none px-3.5 py-1.5 md:px-5 md:py-2 rounded-full cursor-pointer text-xs md:text-sm font-medium flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <span>Logout</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsGuest(false)}
                    className="bg-amber-800 text-stone-100 border-none px-4 py-2 rounded-full cursor-pointer text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all hover:bg-amber-900"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                )}

                <button 
                  id="themeToggle" 
                  onClick={() => setDarkMode(!darkMode)}
                  className="bg-[#8b4513] hover:bg-[#5d4037] text-amber-200 hover:text-[#ffd700] rounded-full p-2.5 flex items-center justify-center shadow-md border border-amber-500/10 cursor-pointer active:scale-95 transition-all"
                  title="Toggle Light/Dark Theme"
                >
                  {darkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </nav>

          {/* SIDE NAVIGATION MOBILE MENU (DRAWER) */}
          <div className={`fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-[9999] transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
            <div className={`absolute top-0 left-0 w-[280px] h-full bg-gradient-to-b from-[#2c1b12] to-[#1b0f0a] shadow-2xl p-6 flex flex-col z-[99999] transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
              
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-6">
                <span className="font-serif text-amber-400 font-bold tracking-widest text-lg">📜 NAVIGATION</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-full bg-amber-950 text-amber-300 border border-amber-500/20 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {[
                  { label: "🏹 Introduction", id: "hero-section" },
                  { label: "✨ Verse of the Day", id: "votd-section" },
                  { label: "🧠 Authors", id: "author-section" },
                  { label: "🎯 Who is Gita For", id: "benefit-section" },
                  { label: "🌍 Gita Around the World", id: "global-section" },
                  { label: "🏹 Legends of Mahabharat", id: "legends-section" },
                  { label: "🌳 Mahabharat Family Tree", id: "family-tree-section" },
                  { label: "📖 Chapters", id: "chapters-section" },
                  { label: "✨ Essential Verses", id: "verses-section" },
                  { label: "🧘 Gita in Daily Life", id: "daily-section" },
                  { label: "🎧 Podcasts", id: "podcast-section" },
                  { label: "📚 Books", id: "books-section" },
                  { label: "❓ FAQ", id: "faq-section" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id, item.label)}
                    className={`w-full text-left py-3 px-4 rounded-xl text-stone-200 transition-all font-medium text-sm border-l-4 cursor-pointer flex items-center justify-between ${activeTab === item.label ? "bg-amber-800 border-amber-400 text-[#ffd700] shadow-md" : "border-transparent hover:bg-amber-950/40 hover:border-amber-600/50"}`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-amber-500/10 text-center text-xs text-amber-500/60 italic">
                Shrimad Bhagavad Gita Platform
              </div>
            </div>
            
            {/* Click outside to close */}
            <div className="absolute inset-0 z-[-1]" onClick={() => setMobileMenuOpen(false)}></div>
          </div>

          {/* HERO GREETING BANNER WITH PARALLAX ATMOSPHERE */}
          <header className="relative w-full min-h-screen pt-[120px] pb-24 px-4 bg-cover bg-center flex flex-col justify-center items-center text-center overflow-hidden transition-all" id="hero-section"
                  style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.7)), url('/images/battlefield.jpg')` }}>
            <div className="max-w-4xl mx-auto space-y-6 px-4 z-10">
              <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-[#ffd700] drop-shadow-lg leading-tight uppercase tracking-wide">
                <Translate text="Shrimad Bhagavad Gita" />
              </h1>
              <h2 className="text-stone-300 text-lg sm:text-2xl md:text-3xl font-light tracking-[4px] uppercase select-none">
                <Translate text="The Divine Song of God" />
              </h2>
              <div className="h-[3px] w-[180px] bg-[#ffd700] mx-auto rounded-full shadow-lg" />
              <p className="text-stone-100 text-sm sm:text-lg leading-relaxed max-w-3xl mx-auto drop-shadow-md font-sans">
                <Translate text="The Bhagavad Gita is a 700-verse Hindu scripture that is part of the epic Mahabharata. Set on the battlefield of Kurukshetra, it captures the timeless dialogue between Prince Arjuna and Lord Krishna, offering profound wisdom on duty, righteousness (Dharma), and the path to self-realization." />
              </p>
              
              <div className="pt-6">
                <button 
                  onClick={() => {
                    const el = document.getElementById("chapters-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-8 py-4 bg-[#ffd700] text-stone-900 border-none rounded-full font-bold text-base cursor-pointer shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all"
                >
                  <Translate text="Begin the Journey" /> &rarr;
                </button>
              </div>
            </div>
            
            {/* Ambient golden particles decoration */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute top-[10%] left-[20%] w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
              <div className="absolute bottom-[20%] right-[15%] w-3 h-3 bg-amber-300 rounded-full animate-bounce"></div>
              <div className="absolute top-[60%] right-[30%] w-2 h-2 bg-yellow-400 rounded-full animate-ping duration-[4s]"></div>
            </div>
          </header>

          {/* SCROLLING WISDOM TICKER */}
          <div className="w-full overflow-hidden bg-[#8b4513] py-4 text-[#ffd700] font-serif tracking-widest text-sm flex items-center border-y border-amber-400 shadow-md">
            <div className="whitespace-nowrap flex gap-12 animate-ticker shrink-0">
              <span>✨ Yato Dharmastato Jayah (Where there is Dharma, there is Victory) ✨</span>
              <span>📜 Truth alone triumphs 📜</span>
              <span>🏹 Perform your Duty with Detachment 🏹</span>
              <span>🧘 Inner peace is the ultimate wealth 🧘</span>
              <span>✨ Yato Dharmastato Jayah (Where there is Dharma, there is Victory) ✨</span>
              <span>📜 Truth alone triumphs 📜</span>
              <span>🏹 Perform your Duty with Detachment 🏹</span>
              <span>🧘 Inner peace is the ultimate wealth 🧘</span>
            </div>
          </div>

          {/* DYNAMIC VERSE OF THE DAY SECTION */}
          <section className="max-w-[1150px] mx-auto my-16 px-4" id="votd-section">
            <div className="bg-white dark:bg-[#26160f] rounded-3xl border-2 border-amber-300 dark:border-amber-700/60 p-8 md:p-12 shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] relative transition-all duration-300 hover:border-amber-400">
              
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-[#8b4513] to-[#b8860b] text-[#ffd700] px-8 py-2.5 rounded-full font-serif text-sm font-bold uppercase tracking-widest shadow-md">
                  <Translate text="Verse Of The Day" />
                </span>
              </div>

              {dailyVerse ? (
                <div 
                  onClick={() => openChapterForStudy(dailyVerse.chapter)}
                  className="text-center space-y-6 pt-4 cursor-pointer group"
                >
                  <div className="shlok-ornament text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">✨</div>
                  <blockquote className="font-devanagari text-xl sm:text-2xl md:text-3xl leading-relaxed text-[#2c3e50] dark:text-[#ffd700] whitespace-pre-line tracking-wide font-bold">
                    {dailyVerse.sanskrit}
                  </blockquote>
                  <p className="text-gray-600 dark:text-stone-300 italic text-base sm:text-lg max-w-4xl mx-auto leading-relaxed">
                    "<Translate text={dailyVerse.translation} />"
                  </p>
                  
                  <div className="border-t border-gray-100 dark:border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="font-bold text-amber-800 dark:text-amber-400 tracking-wider">
                      <Translate text="Bhagavad Gita" /> {dailyVerse.chapter}.{dailyVerse.verse}
                    </span>
                    <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase tracking-wider">
                      <Translate text="Tap to read full purport & commentary" /> &rarr;
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-stone-500 py-8">
                  <Translate text="Fetching dynamic verses..." />
                </p>
              )}
            </div>
          </section>

          {/* DIVINE AUTHORS SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="author-section">
            <div className="p-6 sm:p-12 md:p-16 bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 rounded-3xl shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
              
              <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-[3px] mb-8 select-none">
                <Translate text="THE DIVINE AUTHORS" />
              </h2>

              {/* Main illustration placeholder box */}
              <div className="flex justify-center mb-10 w-full">
                <div className="p-3 bg-white dark:bg-[#1b0f0a] border border-[#deb887] dark:border-amber-700/60 rounded-2xl shadow-md overflow-hidden max-w-sm w-full">
                  <img 
                    src="/images/authors.jpg" 
                    alt="Ancient Sacred Art Representing Divine Dictation" 
                    className="w-full h-auto object-cover rounded-xl transition-all"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Dual Authors Vertical Flex Card */}
              <div className="flex flex-col items-center gap-7 w-full font-sans">
                
                {/* Vyasa Card */}
                <div className="bg-white dark:bg-[#1b0f0a]/50 border border-amber-200 dark:border-amber-800/60 p-6 sm:p-10 rounded-2xl shadow-sm w-full hover:border-amber-400 transition-all duration-300">
                  <div className="text-center space-y-3">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#8b4513] dark:text-amber-200 uppercase tracking-widest">
                      <Translate text="MAHARISHI VED VYASA" />
                    </h3>
                    <div className="text-[10px] uppercase font-bold text-[#8b4513] dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 border border-[#deb887] rounded-sm px-3 py-0.5 tracking-widest inline-block">
                      <Translate text="THE COMPILER" />
                    </div>
                    <p className="text-center leading-relaxed text-stone-700 dark:text-stone-300 text-xs sm:text-sm">
                      <Translate text="Maharishi Ved Vyasa, born as Krishna Dvaipayana, was the son of Sage Parashara and Satyavati. He is regarded as a Chiranjivi and the architect of Vedic knowledge. He classified the Vedas into four and authored the Mahabharata. Uniquely, he was both the grandfather of the Pandavas and Kauravas and the narrator of their story. He dictated the epic to Lord Ganesha and granted divine vision to Sanjaya. His presence ensured the preservation of Dharma for future generations." />
                    </p>
                  </div>
                </div>

                {/* Ganesha Card */}
                <div className="bg-white dark:bg-[#1b0f0a]/50 border border-amber-200 dark:border-amber-800/60 p-6 sm:p-10 rounded-2xl shadow-sm w-full hover:border-amber-400 transition-all duration-300">
                  <div className="text-center space-y-3">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#8b4513] dark:text-amber-200 uppercase tracking-widest">
                      <Translate text="LORD GANESHA" />
                    </h3>
                    <div className="text-[10px] uppercase font-bold text-[#8b4513] dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 border border-[#deb887] rounded-sm px-3 py-0.5 tracking-widest inline-block">
                      <Translate text="THE DIVINE SCRIBE" />
                    </div>
                    <p className="text-center leading-relaxed text-stone-700 dark:text-stone-300 text-xs sm:text-sm">
                      <Translate text="Lord Ganesha, the son of Lord Shiva and Goddess Parvati, is revered as the Vighnaharta or remover of obstacles and the patron of Intellect and wisdom. In the context of the Mahabharata, he played the indispensable role of the divine scribe. When Sage Ved Vyasa conceived the vast epic, he required a writer capable of matching his depth. Ganesha accepted on the condition that Vyasa would not pause. To fulfill this, he broke his own tusk to use as a stylus, symbolizing sacrifice for sacred knowledge. His role transformed the epic from oral tradition into a timeless written masterpiece." />
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* BENEFIT SECTION: WHO IS THE GITA FOR? */}
          <section className="max-w-[1150px] mx-auto my-24 px-4 overflow-hidden" id="benefit-section">
            <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 sm:p-12 md:p-16 rounded-3xl shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-400">
              <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-[3px] mb-2 select-none">
                <Translate text="Who is the Gita For?" />
              </h2>
              <p className="text-center text-stone-600 dark:text-stone-300 italic text-sm sm:text-base mb-8">
                <Translate text="A universal manual providing 5,000 years of wisdom for modern challenges." />
              </p>

              {/* Swipeable Scroll container with custom cards */}
              <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-2 snap-x scrollbar-none scroll-smooth">
                {benefitCards.map((card, idx) => (
                  <div 
                    key={idx}
                    className="bg-white dark:bg-[#1b0f0a]/50 w-[270px] shrink-0 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl shadow-sm hover:border-amber-400 hover:-translate-y-2 select-none snap-center transition-all duration-300 flex flex-col items-center justify-between text-center aspect-square"
                  >
                    <div className="text-4xl mb-2">{card.icon}</div>
                    <h4 className="font-serif text-amber-900 dark:text-amber-200 text-base font-bold">
                      <Translate text={card.title} />
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-stone-300 leading-relaxed max-w-[240px]">
                      <Translate text={card.desc} />
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Guide hint */}
              <div className="text-center text-xs text-amber-800/80 dark:text-stone-400/80 animate-pulse mt-4">
                &larr; <Translate text="Drag or scroll horizontally to see all profiles" /> &rarr;
              </div>
            </div>
          </section>

          {/* GLOBAL TRIBUTES SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="global-section">
            <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 sm:p-12 md:p-16 rounded-3xl shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-400">
              <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-[3px] mb-2 select-none">
                <Translate text="Gita Around the World" />
              </h2>
              <p className="text-center text-stone-600 dark:text-stone-400 mb-12 italic text-sm">
                <Translate text="How the world's greatest minds found inspiration in the Divine Song." />
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tributeCards.map((card, idx) => (
                  <div 
                    key={idx}
                    className="bg-white dark:bg-[#1b0f0a]/50 p-8 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-all duration-300"
                  >
                    <p className="text-sm italic text-[#5d4037] dark:text-stone-200 leading-relaxed mb-6">
                      <Translate text={card.quote} />
                    </p>
                    <div className="border-t border-amber-900/10 dark:border-amber-500/10 pt-4 flex flex-col">
                      <span className="font-serif text-amber-900 dark:text-amber-200 font-bold text-base">
                        <Translate text={card.name} />
                      </span>
                      <span className="text-xs text-amber-700/80 dark:text-amber-400/80 uppercase font-semibold tracking-wider">
                        <Translate text={card.profession} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* LEGENDS OF MAHABHARAT DISPATCHER */}
          <section className="max-w-[1150px] mx-auto my-24 px-4 text-center" id="legends-section">
            <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 rounded-3xl p-10 md:p-14 shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-400 space-y-6">
              <span className="inline-block px-4 py-1.5 bg-amber-800 text-stone-100 rounded-full font-serif text-xs uppercase tracking-widest font-bold">
                <Translate text="Chronicles of Dharma" />
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-[3px] select-none">
                <Translate text="Legends of Mahabharat" />
              </h2>
              <p className="text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
                <Translate text="Explore the profiles, origins, and critical roles of the 20 legendary souls who shaped the battle of Kurukshetra. Meet friends, foes, sages, and warriors under the divine guidance of Lord Krishna." />
              </p>
              
              <div className="pt-4">
                <button 
                  onClick={() => {
                    setLegendsPortalOpen(true);
                    setActiveLegendIndex(0);
                    document.body.style.overflow = "hidden";
                  }}
                  className="px-8 py-3.5 bg-[#8b4513] text-amber-200 dark:bg-amber-700 hover:bg-[#5d4037] hover:text-white font-bold rounded-full cursor-pointer shadow-md transition-all uppercase tracking-widest text-sm"
                >
                  <Translate text="Enter the Legends Portal" /> &rarr;
                </button>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* MAHABHARAT KURU DYNASTY FAMILY TREE SECTION */}
          {/* ================================================== */}
          <section id="family-tree-section" className="max-w-[1150px] mx-auto my-24 px-4 scroll-mt-[90px]">
            <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 rounded-3xl p-6 sm:p-10 shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-400">
              
              {/* Header block */}
              <div className="text-center space-y-4 mb-8">
                <span className="inline-block px-4 py-1.5 bg-amber-800 text-stone-100 rounded-full font-serif text-xs uppercase tracking-widest font-bold">
                  <Translate text="Genealogy of Dharma" />
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-wide">
                  <Translate text="The Mahabharat Family Tree" />
                </h2>
                <p className="text-stone-600 dark:text-stone-300 max-w-3xl mx-auto leading-relaxed text-xs sm:text-sm">
                  <Translate text="Trace the sacred lineage of Hastinapura from the grand patriarchs down to Pandavas, Kauravas, and the continuing seed of the cosmic dynasty. Click any character card to open their detailed biography inside the Legends Portal." />
                </p>
                
                {/* View Switcher Tabs */}
                <div className="flex flex-wrap justify-center gap-2 pt-4">
                  {[
                    // { id: "flow", label: "🌳 Family Tree Diagram", icon: "💎" },
                    { id: "bento", label: "🗂️ Generational Bento Rows", icon: "📑" },
                    { id: "search", label: "🔍 Character Relation Finder", icon: "🔎" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFamilyTreeTab(tab.id as any)}
                      className={`px-4 sm:px-6 py-2 rounded-full text-xs font-semibold cursor-pointer select-none transition-all flex items-center gap-2 ${
                        familyTreeTab === tab.id
                          ? "bg-amber-800 text-white shadow-md border-transparent scale-102"
                          : "bg-stone-50 dark:bg-[#150d0a] border border-amber-905/10 dark:border-amber-800/40 text-stone-700 dark:text-stone-300 hover:bg-amber-100/30"
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Rendering Helper Injector */}
              {(() => {
                const renderTreeCard = (name: string, role: React.ReactNode, subtitle: React.ReactNode, highlight: boolean = false) => {
                  return (
                    <div 
                      onClick={() => openLegendByName(name)}
                      className={`w-28 sm:w-32 hover:scale-105 active:scale-95 transition-all text-center cursor-pointer shadow-xs relative z-10 group rounded-xl border flex flex-col justify-between h-[135px] shrink-0 overflow-hidden ${
                        highlight 
                          ? "bg-[#fffdf9] dark:bg-[#2c150c] border-amber-500 dark:border-amber-500 text-amber-955 dark:text-amber-100" 
                          : "bg-white dark:bg-[#1a100c] border-[#deb887]/60 dark:border-amber-900/60 text-stone-800 dark:text-stone-200"
                      } hover:border-[#ffd700] hover:shadow-md`}
                    >
                      <div className="relative w-full h-12 sm:h-14 overflow-hidden border-b border-stone-200/40 dark:border-stone-850/40">
                        <LegendAvatar 
                          name={name} 
                          className="w-full h-full"
                          imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center p-1.5 pt-0.5">
                        <h5 className="font-serif text-[10px] sm:text-xs font-black text-amber-955 dark:text-amber-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 capitalize transition-colors truncate">
                          <Translate text={name} />
                        </h5>
                        <div className="text-[8px] sm:text-[9px] text-[#8b4513] dark:text-amber-400/90 font-semibold truncate leading-tight">
                          {typeof role === "string" ? <Translate text={role} /> : role}
                        </div>
                        <div className="text-[7px] sm:text-[8px] text-stone-400 dark:text-stone-500 truncate leading-none mt-0.5">
                          {typeof subtitle === "string" ? <Translate text={subtitle} /> : subtitle}
                        </div>
                      </div>
                    </div>
                  );
                };

                const renderConnector = (label: string) => {
                  return (
                    <div className="flex flex-col items-center justify-center min-w-[20px] select-none text-[8px] text-[#8b4513]/60 dark:text-amber-500/50 font-serif italic font-bold">
                      <span className="leading-none mb-0.5">❤️</span>
                      <div className="h-0.5 w-6 bg-[#deb887]/60 dark:bg-amber-900/40 flex items-center justify-center"></div>
                      <span className="leading-none mt-0.5"><Translate text={label} /></span>
                    </div>
                  );
                };

                // DICTIONARY OF SPATIAL RELATIONS (RELATION FINDER DATABASE)
                const familyRelations = [
                  {
                    name: "Shantanu",
                    father: "Pratipa",
                    mother: "Sunanda",
                    spouses: ["Ganga", "Satyavati"],
                    children: ["Bhishma", "Chitrangada", "Vichitravirya", "7 Others"],
                    desc: "Sovereign King of Hastinapura who set the epic wheel in motion."
                  },
                  {
                    name: "Satyavati",
                    father: "Uparichara Vasu",
                    mother: "Adrika (Apsara)",
                    spouses: ["Shantanu", "Parashara"],
                    children: ["Vyasa", "Chitrangada", "Vichitravirya"],
                    desc: "Wise queen-mother who determined the royal succession."
                  },
                  {
                    name: "Ganga",
                    father: "Jahnu",
                    mother: "Mena",
                    spouses: ["Shantanu"],
                    children: ["Bhishma", "7 Others"],
                    desc: "The celestial river goddess whose son became the ultimate protector."
                  },
                  {
                    name: "Parashara",
                    father: "Shakti",
                    mother: "Adrishyanti",
                    spouses: ["Satyavati"],
                    children: ["Vyasa"],
                    desc: "Legendary rishi who fathered Sage Vyasa."
                  },
                  {
                    name: "Vyasa",
                    father: "Parashara",
                    mother: "Satyavati",
                    spouses: ["Ambika", "Ambalika"],
                    children: ["Dhritarashtra", "Pandu", "Vidura"],
                    desc: "Sage who recorded the Mahabharata and fathered the royal lines via Niyoga."
                  },
                  {
                    name: "Chitrangada",
                    father: "Shantanu",
                    mother: "Satyavati",
                    spouses: [],
                    children: [],
                    desc: "Valiant eldest son of Shantanu, killed early by an equal-named Gandharva."
                  },
                  {
                    name: "Vichitravirya",
                    father: "Shantanu",
                    mother: "Satyavati",
                    spouses: ["Ambika", "Ambalika"],
                    children: ["Dhritarashtra", "Pandu"],
                    desc: "Hastinapura king whose early childless death led to the spiritual Niyoga invocation."
                  },
                  {
                    name: "Bhishma",
                    father: "Shantanu",
                    mother: "Ganga",
                    spouses: [],
                    children: [],
                    desc: "Hastinapura grand elder who renounced his throne and took a terrible vow of celibacy."
                  },
                  {
                    name: "Ambika",
                    father: "King of Kashi",
                    mother: "Queen of Kashi",
                    spouses: ["Vichitravirya", "Vyasa"],
                    children: ["Dhritarashtra"],
                    desc: "Kashi princess whose closed eyes during Vyasa's sight led to blind Dhritarashtra."
                  },
                  {
                    name: "Ambalika",
                    father: "King of Kashi",
                    mother: "Queen of Kashi",
                    spouses: ["Vichitravirya", "Vyasa"],
                    children: ["Pandu"],
                    desc: "Younger princess of Kashi whose pale shock led to Pandu's light complexion."
                  },
                  {
                    name: "Dhritarashtra",
                    father: "Vyasa",
                    mother: "Ambika",
                    spouses: ["Gandhari"],
                    children: ["Duryodhana", "Vikarna", "Dushasana", "Duhsala"],
                    desc: "Blind king whose sensory blind attachment to Duryodhana brought about the war."
                  },
                  {
                    name: "Gandhari",
                    father: "Subala of Gandhara",
                    mother: "Sudharma",
                    spouses: ["Dhritarashtra"],
                    children: ["Duryodhana", "Vikarna", "Dushasana", "Duhsala"],
                    desc: "Righteous queen who blindfolded herself out of ultimate devotion."
                  },
                  {
                    name: "Pandu",
                    father: "Vyasa",
                    mother: "Ambalika",
                    spouses: ["Kunti", "Madri"],
                    children: ["Yudhishthira", "Bheema", "Arjuna", "Nakula", "Sahadeva"],
                    desc: "Noble pale king who renounced kingdom to seek hermit solitude."
                  },
                  {
                    name: "Kunti",
                    father: "Shurasena",
                    mother: "Marisha",
                    spouses: ["Pandu", "Surya"],
                    children: ["Karna", "Yudhishthira", "Bheema", "Arjuna"],
                    desc: "Stately mother of the eldest Pandavas, blessed with celestial invocation mantras."
                  },
                  {
                    name: "Madri",
                    father: "Shalya's Father",
                    mother: "Madra Queen",
                    spouses: ["Pandu"],
                    children: ["Nakula", "Sahadeva"],
                    desc: "Second consort of Pandu who invoked the Twin Ashwini Physicians."
                  },
                  {
                    name: "Karna",
                    father: "Surya",
                    mother: "Kunti",
                    spouses: [],
                    children: [],
                    desc: "Tragic solar archer abandoned at birth who sided with Duryodhana out of supreme friendship."
                  },
                  {
                    name: "Yudhisthira",
                    father: "Pandu (Spiritual Dharma)",
                    mother: "Kunti",
                    spouses: ["Draupadi"],
                    children: [],
                    desc: "The Dharmaraja who championed truth and righteousness."
                  },
                  {
                    name: "Bheema",
                    father: "Pandu (Spiritual Vayu)",
                    mother: "Kunti",
                    spouses: ["Hidimbi", "Draupadi"],
                    children: ["Ghatotkacha"],
                    desc: "Undefeatable colossus who crushed Duryodhana and Dushasana in sacred oaths."
                  },
                  {
                    name: "Hidimbi",
                    father: "Forest Native",
                    mother: "Native Mother",
                    spouses: ["Bheema"],
                    children: ["Ghatotkacha"],
                    desc: "Forest native princess and wife of Bheema."
                  },
                  {
                    name: "Arjuna",
                    father: "Pandu (Spiritual Indra)",
                    mother: "Kunti",
                    spouses: ["Subhadra", "Draupadi"],
                    children: ["Abhimanyu"],
                    desc: "The supreme Gandiva archer who accepted the Gita from Lord Krishna."
                  },
                  {
                    name: "Subhadra",
                    father: "Vasudeva",
                    mother: "Rohini",
                    spouses: ["Arjuna"],
                    children: ["Abhimanyu"],
                    desc: "Loving sister of Lord Krishna and mother of Abhimanyu."
                  },
                  {
                    name: "Abhimanyu",
                    father: "Arjuna",
                    mother: "Subhadra",
                    spouses: ["Uttara"],
                    children: ["Parikshit"],
                    desc: "The youthful martyr who entered the terrifying Chakravyuha alone."
                  },
                  {
                    name: "Uttara",
                    father: "Virat of Matsya",
                    mother: "Sudeshna",
                    spouses: ["Abhimanyu"],
                    children: ["Parikshit"],
                    desc: "Princess of Matsya whose child Parikshit became the survivor of the Kuru seed."
                  },
                  {
                    name: "Nakula",
                    father: "Pandu (Spiritual Ashwini)",
                    mother: "Madri",
                    spouses: ["Draupadi"],
                    children: [],
                    desc: "Fourth Pandava, master swordsman, and animal scholar."
                  },
                  {
                    name: "Sahadeva",
                    father: "Pandu (Spiritual Ashwini)",
                    mother: "Madri",
                    spouses: ["Draupadi"],
                    children: [],
                    desc: "Youngest Pandava, all-knowing sage and astrologer of cosmic futures."
                  },
                  {
                    name: "Duryodhana",
                    father: "Dhritarashtra",
                    mother: "Gandhari",
                    spouses: ["Bhanumati"],
                    children: ["Lakshman", "Lakshmana"],
                    desc: "Chief Kaurava antagonist whose pride brought Hastinapura to its knees."
                  },
                  {
                    name: "Bhanumati",
                    father: "Chitrangada of Kalinga",
                    mother: "Kalinga Queen",
                    spouses: ["Duryodhana"],
                    children: ["Lakshman", "Lakshmana"],
                    desc: "Venerated chief queen of Duryodhana, known for her devotion and integrity."
                  },
                  {
                    name: "Vikarna",
                    father: "Dhritarashtra",
                    mother: "Gandhari",
                    spouses: [],
                    children: [],
                    desc: "The rare Kaurava who protested Draupadi's disrobing on basic dharmic principles."
                  },
                  {
                    name: "Dushasana",
                    father: "Dhritarashtra",
                    mother: "Gandhari",
                    spouses: [],
                    children: [],
                    desc: "Arrogant second Kaurava brother who dragged Draupadi in public disgrace."
                  },
                  {
                    name: "Duhsala",
                    father: "Dhritarashtra",
                    mother: "Gandhari",
                    spouses: ["Jayadratha"],
                    children: [],
                    desc: "Beloved single sister of the Kaurava army, wed to Sindhu."
                  },
                  {
                    name: "Sambha",
                    father: "Krishna",
                    mother: "Jambavati",
                    spouses: ["Lakshmana"],
                    children: [],
                    desc: "Lord Krishna's rebellious prince son who held a deep romance for Kaurava-born Lakshmana."
                  },
                  {
                    name: "Lakshman",
                    father: "Duryodhana",
                    mother: "Bhanumati",
                    spouses: [],
                    children: [],
                    desc: "Kaurava crown prince who fought bravely but fell to Abhimanyu."
                  },
                  {
                    name: "Lakshmana",
                    father: "Duryodhana",
                    mother: "Bhanumati",
                    spouses: ["Sambha"],
                    children: [],
                    desc: "Duryodhana's daughter who wed Krishna's son Sambha, merging Yadavas and Kurus."
                  }
                ];

                // FIND CURRENT MATCH FOR SEARCH ENGINE
                const activeRelation = familyRelations.find(item => 
                  item.name.toLowerCase() === familyTreeSearchQuery.toLowerCase()
                ) || familyRelations[0];

                return (
                  <>
                    {/* TAB 1: VISUAL FAMILY TREE DIAGRAM */}
                    {familyTreeTab === "flow" && (
                      <div className="relative w-full">
                        {/* Scroll Navigation Controls for Mobile/Desktop */}
                        <div className="flex justify-between items-center gap-2 mb-3 bg-stone-50 dark:bg-[#1a110d]/40 p-3 rounded-2xl border border-amber-900/10 dark:border-amber-900/30">
                          <span className="text-xs text-stone-600 dark:text-stone-300 font-serif">
                            ← Swipe or use controls to browse the ancient genealogy canvas →
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                if (treeScrollRef.current) {
                                  treeScrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
                                }
                              }}
                              className="px-3 py-1.5 bg-amber-50 dark:bg-[#1a110d] hover:bg-amber-100 dark:hover:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-800/15 rounded-lg text-[11px] font-sans font-bold flex items-center gap-1 cursor-pointer select-none shadow-xs active:scale-95"
                              title="Scroll Left"
                            >
                              ← Scroll Left
                            </button>
                            <button
                              onClick={() => {
                                if (treeScrollRef.current) {
                                  treeScrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
                                }
                              }}
                              className="px-3 py-1.5 bg-amber-50 dark:bg-[#1a110d] hover:bg-amber-100 dark:hover:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-800/15 rounded-lg text-[11px] font-sans font-bold flex items-center gap-1 cursor-pointer select-none shadow-xs active:scale-95"
                              title="Scroll Right"
                            >
                              Scroll Right →
                            </button>
                          </div>
                        </div>

                        <div 
                          ref={treeScrollRef}
                          className="relative w-full overflow-x-auto pb-12 pt-4 scrollbar-thin scrollbar-thumb-amber-800 scrollbar-track-stone-100/50"
                        >
                          {/* Antique Parchment Manuscript Map Area */}
                          <div className="min-w-[1640px] max-w-[1750px] mx-auto bg-[#faf6ee] dark:bg-[#1a110a] border-4 border-double border-amber-600/40 dark:border-amber-700/50 rounded-3xl p-8 sm:p-11 shadow-[0_15px_45px_rgba(139,69,19,0.08)] relative flex flex-col gap-10">
                          
                          {/* Top Decorative Title Plate */}
                          <div className="text-center relative pb-2 border-b border-dashed border-amber-900/15 dark:border-amber-900/30">
                            <span className="text-[10px] font-sans text-[#8b4513] dark:text-amber-400 uppercase tracking-[4px] font-black bg-amber-100 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200">
                              📜 KURU DYNASTIC MANUSCRIPT
                            </span>
                            <h3 className="font-serif text-2xl text-[#6b3111] dark:text-[#ffd700] uppercase tracking-widest mt-2 font-black">
                              The Authentic Mahabharat Family Tree Flows
                            </h3>
                            <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 italic max-w-3xl mx-auto">
                              Replicated exactly from the classical genealogical charts, displaying structural unions, pre-marital branches, spiritual Niyoga adoptions, and cross-faction alliances.
                            </p>
                          </div>

                          {/* =================================================== */}
                          {/* GENERATION 1: ANCIENT FOUNDERS & COSMIC ANCESTORS */}
                          {/* =================================================== */}
                          <div className="relative">
                            
                            {/* Horizontal Layout of 4 Grand Characters */}
                            <div className="grid grid-cols-[112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px] items-start pt-4">
                              
                              {/* Col 1, 2: Empty Spacer */}
                              <div></div>
                              <div></div>

                              {/* Col 3: Sage Parashara */}
                              <div className="flex flex-col items-center">
                                {renderTreeCard("Parashara", "Vedic Sage", "Father of Vyasa")}
                              </div>

                              {/* Col 4 Union Line 1: Parashara -> Satyavati */}
                              <div className="relative w-full h-[135px]">
                                {/* Horizontal line aligned exactly with the center of the photo */}
                                <div className="absolute top-6 sm:top-7 -left-[56px] -right-[56px] sm:-left-[64px] sm:-right-[64px] h-0.5 bg-amber-500/70 z-0"></div>
                                {/* Arrow pointing to Satyavati --> */}
                                <div className="absolute top-6 sm:top-7 -right-[30px] sm:-right-[40px] -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-amber-500/70 z-10"></div>
                                <div className="absolute top-6 sm:top-7 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 border border-[#faf6ee] dark:border-[#1a110a] z-10 shadow-xs"></div>
                                {/* Descent Line running all the way down to Vyasa */}
                                <div className="absolute top-6 sm:top-7 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-amber-500/70 z-0"></div>
                                {/* Arrow pointing down */}
                                <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                              </div>

                              {/* Col 5: Queen Satyavati */}
                              <div className="flex flex-col items-center relative z-10">
                                {renderTreeCard("Satyavati", "Grand Mother", "Lineage Anchor", true)}
                              </div>

                              {/* Col 6 Union Line 2: Satyavati <-> Shantanu */}
                              <div className="relative w-full h-[135px]">
                                {/* Horizontal line aligned exactly with the center of the photo */}
                                <div className="absolute top-6 sm:top-7 -left-[56px] -right-[56px] sm:-left-[64px] sm:-right-[64px] h-0.5 bg-amber-500/70 z-0"></div>
                                {/* Arrow pointing to Satyavati <-- */}
                                <div className="absolute top-6 sm:top-7 -left-[30px] sm:-left-[40px] -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-r-[6px] border-r-amber-500/70 z-10"></div>
                                <div className="absolute top-6 sm:top-7 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 border border-[#faf6ee] dark:border-[#1a110a] z-10 shadow-xs"></div>
                                {/* Descent Line running all the way down to Vichitravirya / Chitrangada */}
                                <div className="absolute top-6 sm:top-7 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-amber-500/70 z-0"></div>
                                {/* Arrow pointing down */}
                                <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                              </div>

                              {/* Col 7: King Shantanu */}
                              <div className="flex flex-col items-center relative z-10">
                                {renderTreeCard("Shantanu", "Dynastic Ruler", "Hastinapura Crown")}
                              </div>

                              {/* Col 8 Union Line 3: Shantanu <-> Ganga */}
                              <div className="relative w-full h-[135px]">
                                {/* Horizontal line aligned exactly with the center of the photo */}
                                <div className="absolute top-6 sm:top-7 -left-[56px] -right-[56px] sm:-left-[64px] sm:-right-[64px] h-0.5 bg-amber-500/70 z-0"></div>
                                {/* Arrow pointing to Shantanu <-- */}
                                <div className="absolute top-6 sm:top-7 -left-[30px] sm:-left-[40px] -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-r-[6px] border-r-amber-500/70 z-10"></div>
                                <div className="absolute top-6 sm:top-7 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 border border-[#faf6ee] dark:border-[#1a110a] z-10 shadow-xs"></div>
                                {/* Descent Line running all the way down to Bhishma */}
                                <div className="absolute top-6 sm:top-7 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-amber-500/70 z-0"></div>
                                {/* Arrow pointing down */}
                                <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                              </div>

                              {/* Col 9: Goddess Ganga */}
                              <div className="flex flex-col items-center">
                                {renderTreeCard("Ganga", "River Divinity", "Mother of Bhishma")}
                              </div>

                            </div>
                          </div>

                          {/* =================================================== */}
                          {/* GEN I TO GEN II CONNECTIVE DESCENT PATHS */}
                          {/* =================================================== */}
                          <div className="grid grid-cols-[112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px] -my-4 h-8 relative">
                            
                            {/* Drop 1: Parashara & Satyavati -> Vyasa */}
                            <div className="col-start-4 flex justify-center h-full">
                              <div className="w-0.5 bg-amber-500/70 h-full"></div>
                            </div>

                            {/* Drop 2: Satyavati & Shantanu -> Chitrangada & Vichitravirya */}
                            <div className="col-start-5 col-span-3 grid grid-cols-[112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px] h-full">
                              {/* Left side: drops down to Vichitravirya */}
                              <div className="flex flex-col items-center">
                                <div className="w-full h-0.5 bg-amber-500/70 mt-0"></div>
                                <div className="w-0.5 bg-amber-500/70 h-full"></div>
                              </div>
                              {/* Central column: drops down from top */}
                              <div className="relative w-full h-full">
                                <div className="absolute left-0 right-0 top-0 h-0.5 bg-amber-500/70"></div>
                                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-amber-500/70"></div>
                              </div>
                              {/* Right side: drops down to Chitrangada */}
                              <div className="flex flex-col items-center">
                                <div className="w-full h-0.5 bg-amber-500/70 mt-0"></div>
                                <div className="w-0.5 bg-amber-500/70 h-full"></div>
                              </div>
                            </div>

                            {/* Drop 3: Shantanu & Ganga -> Bhishma */}
                            <div className="col-start-8 flex justify-center h-full">
                              <div className="w-0.5 bg-amber-500/70 h-full"></div>
                            </div>

                          </div>

                          {/* =================================================== */}
                          {/* GENERATION 2: SAGES, HEIRS & CELIBATE GUARDIANS */}
                          {/* =================================================== */}
                          <div className="relative pt-2">

                            <div className="grid grid-cols-[112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px] items-start pt-2 text-center">
                              
                              {/* Col 1, 2, 3 space */}
                              <div></div>
                              <div></div>
                              <div></div>

                              {/* 1. Sage Vyasa */}
                              <div className="flex flex-col items-center justify-center">
                                {renderTreeCard("Vyasa", "Sage-Composer", "Son of Parashara & Satyavati", true)}
                              </div>

                              {/* 2. Vichitravirya */}
                              <div className="flex flex-col items-center justify-center relative">
                                {renderTreeCard("Vichitravirya", "Late Successor", "Died of Sickness", true)}
                              </div>

                              {/* Col 6 Spacer Column */}
                              <div></div>

                              {/* 3. Chitrangada */}
                              <div className="flex flex-col items-center justify-center">
                                {renderTreeCard("Chitrangada", "Kuru King Successor", "Fell Early in Battle")}
                              </div>

                              {/* 4. Grand Bhishma */}
                              <div className="flex flex-col items-center justify-center">
                                {renderTreeCard("Bhishma", "Grand Elder", "Tragic Vow Guardian")}
                              </div>

                              {/* 5. 7 Others */}
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-28 sm:w-32 bg-stone-50 dark:bg-[#120a07] border border-stone-200 dark:border-stone-850 rounded-xl p-2 pb-3 text-center opacity-70 shrink-0 flex flex-col justify-center items-center h-[135px] relative z-10">
                                  <span className="text-xl">✨</span>
                                  <h5 className="font-serif text-[10px] sm:text-xs font-semibold text-stone-500 mt-2">7 Others</h5>
                                  <p className="text-[8.5px] text-stone-400 leading-none mt-1">Returned to Skies</p>
                                </div>
                              </div>

                            </div>
                          </div>

                          {/* =================================================== */}
                          {/* GEN II TO GEN III NIYOGA BRIDGES & QUEENS (VYASA + VICHITRAVIRYA) */}
                          {/* =================================================== */}
                          
                          <div className="grid grid-cols-[112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px] -my-2 h-12 relative z-0">
                            
                            {/* Col 3, 4, 5, 6, 7: Ambika, Vyasa, Vichitravirya, Gap, Ambalika */}
                            <div className="col-span-5 col-start-3 relative h-12">
                              {/* Use subgrid to get exact centers for each column */}
                              <div className="grid grid-cols-[112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px] h-full text-center">
                                
                                {/* Subgrid Col 1: Ambika vertical descent ending in arrow */}
                                <div className="flex flex-col items-center relative h-full">
                                  <div className="w-full h-0.5 bg-amber-500/70 absolute top-6"></div>
                                  <div className="w-0.5 bg-amber-500/70 h-6 mt-6 relative">
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                                  </div>
                                </div>

                                {/* Subgrid Col 2: Vyasa vertical drop down from Col 4 */}
                                <div className="flex flex-col items-center relative h-full">
                                  <div className="w-0.5 bg-amber-500/70 h-6"></div>
                                  <div className="w-full h-0.5 bg-amber-500/70 absolute top-6"></div>
                                </div>

                                {/* Subgrid Col 3: Vichitravirya vertical drop down with up arrow */}
                                <div className="flex flex-col items-center relative h-full">
                                  <div className="w-0.5 bg-amber-500/70 h-6"></div>
                                  <div className="w-full h-0.5 bg-amber-500/70 absolute top-6"></div>
                                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-b-[6px] border-b-amber-500/70 z-10"></div>
                                </div>

                                {/* Subgrid Col 4: Gap with horizontal line */}
                                <div className="relative h-full">
                                  <div className="w-full h-0.5 bg-amber-500/70 absolute top-6"></div>
                                </div>

                                {/* Subgrid Col 5: Ambalika vertical descent ending in arrow */}
                                <div className="flex flex-col items-center relative h-full">
                                  <div className="w-full h-0.5 bg-amber-500/70 absolute top-6"></div>
                                  <div className="w-0.5 bg-amber-500/70 h-6 mt-6 relative">
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                                  </div>
                                </div>

                              </div>
                            </div>
                            
                          </div>

                          {/* =================================================== */}
                          {/* GENERATION 3: ROYAL QUEENS */}
                          {/* =================================================== */}
                          <div className="relative pt-2">
                            <div className="grid grid-cols-[112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px] items-start pt-2 text-center">
                              
                              {/* Col 1, 2 Empty */}
                              <div></div>
                              <div></div>

                              {/* Col 3: Ambika */}
                              <div className="flex flex-col items-center justify-center relative z-10">
                                {renderTreeCard("Ambika", "Princess of Kashi", "Closed eyes in fear")}
                              </div>

                              {/* Col 4, 5, 6 Empty */}
                              <div></div>
                              <div></div>
                              <div></div>

                              {/* Col 7: Ambalika */}
                              <div className="flex flex-col items-center justify-center relative z-10">
                                {renderTreeCard("Ambalika", "Princess of Kashi", "Turned pale in shock")}
                              </div>

                              {/* Col 8, 9 Empty */}
                              <div></div>
                              <div></div>
                            </div>
                          </div>

                          {/* Descent from Ambika and Ambalika down to Dhritarashtra and Pandu */}
                          <div className="grid grid-cols-[112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px] -my-2 h-12 relative z-0">
                            {/* Descent from Ambika (Col 3) */}
                            <div className="col-start-3 relative">
                              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-amber-500/70"></div>
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                            </div>
                            {/* Descent from Ambalika (Col 7) */}
                            <div className="col-start-7 relative">
                              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-amber-500/70"></div>
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                            </div>
                          </div>

                          {/* Sub-row 3B / GEN 4: The Core Households */}
                          <div className="grid grid-cols-[112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px] items-start text-center pt-2">
                            
                            {/* Col 1: Gandhari */}
                                <div className="flex flex-col items-center justify-center relative z-10">
                                  {renderTreeCard("Gandhari", "Queen Empress", "Blindfolded out of devotion")}
                                </div>

                                {/* Col 2 Gap: Gandhari & Dhritarashtra */}
                                <div className="relative w-full h-[135px]">
                                  <div className="absolute top-6 sm:top-7 -left-[56px] -right-[56px] sm:-left-[64px] sm:-right-[64px] h-0.5 bg-amber-500/70 z-0"></div>
                                  <div className="absolute top-6 sm:top-7 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 border border-[#faf6ee] dark:border-[#1a110a] z-10 shadow-xs"></div>
                                  <div className="absolute top-6 sm:top-7 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-amber-500/70"></div>
                                </div>

                                {/* Col 3: Dhritarashtra */}
                                <div className="flex flex-col items-center justify-center relative z-10">
                                  {renderTreeCard("Dhritarashtra", "The King Regent", "Eldest son born of Ambika")}
                                </div>

                                {/* Col 4: Empty space between Dhritarashtra and Kunti */}
                                <div></div>

                                {/* Col 5: Kunti */}
                                <div className="flex flex-col items-center justify-center relative z-10">
                                  {renderTreeCard("Kunti", "Empress Dowager", "First Consort of Pandu", true)}
                                </div>

                                {/* Col 6 Gap: Kunti & Pandu */}
                                <div className="relative w-full h-[135px]">
                                  <div className="absolute top-6 sm:top-7 -left-[56px] -right-[56px] sm:-left-[64px] sm:-right-[64px] h-0.5 bg-amber-500/70 z-0"></div>
                                  {/* Arrows pointing FROM Pandu to Kunti and Madri */}
                                  <div className="absolute top-6 sm:top-7 -right-[30px] sm:-right-[40px] -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-r-[6px] border-r-amber-500/70 z-10"></div>
                                  <div className="absolute top-6 sm:top-7 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 border border-[#faf6ee] dark:border-[#1a110a] z-10 shadow-xs"></div>
                                  <div className="absolute top-6 sm:top-7 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-amber-500/70"></div>
                                </div>

                                {/* Col 7: Pandu */}
                                <div className="flex flex-col items-center justify-center relative z-10">
                                  {renderTreeCard("Pandu", "The Pale Sovereign", "Second son born of Ambalika")}
                                </div>

                                {/* Col 8 Gap: Pandu & Madri */}
                                <div className="relative w-full h-[135px]">
                                  <div className="absolute top-6 sm:top-7 -left-[56px] -right-[56px] sm:-left-[64px] sm:-right-[64px] h-0.5 bg-amber-500/70 z-0"></div>
                                  {/* Arrow pointing FROM Pandu to Madri */}
                                  <div className="absolute top-6 sm:top-7 -left-[30px] sm:-left-[40px] -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-amber-500/70 z-10"></div>
                                  <div className="absolute top-6 sm:top-7 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 border border-[#faf6ee] dark:border-[#1a110a] z-10 shadow-xs"></div>
                                  <div className="absolute top-6 sm:top-7 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-amber-500/70"></div>
                                </div>

                                {/* Col 9: Madri */}
                                <div className="flex flex-col items-center justify-center relative z-10">
                                  {renderTreeCard("Madri", "Second Consort", "Mother of handsome twins")}
                                </div>
                              </div>

                          {/* =================================================== */}
                          {/* GEN IV TO GEN V: DESCENT PATHS */}
                          {/* =================================================== */}
                          <div className="grid grid-cols-[112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px] items-start justify-center text-center -my-2 h-12 relative z-0">
                            {/* 1. Kaurava faction drop */}
                            <div className="relative h-full col-start-2">
                              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-amber-500/70"></div>
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                            </div>

                            {/* 2. Kunti premarital solar line to Karna */}
                            <div className="relative h-full col-start-5">
                              {/* Karna drop directly from Kunti */}
                              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-amber-500/70 border-l border-dashed border-amber-500"></div>
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                            </div>

                            {/* 3. Kunti-Pandu union drop to 3 Pandavas */}
                            <div className="relative h-full col-start-6">
                              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-amber-500/70"></div>
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                            </div>

                            {/* 4. Pandu-Madri union drop to Twin Pandavas */}
                            <div className="relative h-full col-start-8">
                              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-amber-500/70"></div>
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                            </div>
                          </div>

                          {/* =================================================== */}
                          {/* GENERATION 5: THE EPIC HEROES & WARRIORS */}
                          {/* =================================================== */}
                          <div className="relative pt-4">

                            <div className="grid grid-cols-[112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px_minmax(180px,1fr)_112px] sm:grid-cols-[128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px_minmax(200px,1fr)_128px] items-start pt-2">
                              
                              {/* Group A: The Kaurava Brothers Block (Columns 1-3) */}
                              <div className="col-start-2 justify-self-center w-max max-w-[340px] bg-[#fff3f0]/60 dark:bg-red-950/10 p-3 rounded-2xl border border-red-500/15 flex flex-col items-center z-10">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 justify-items-center">
                                  {renderTreeCard("Duryodhan", "Eldest Kaurava", "Highly Ambitious", true)}
                                  {renderTreeCard("Duhsala", "Beloved Sister", "Hastinapura Princess")}
                                  <div className="w-24 bg-stone-50 dark:bg-[#120a07] border border-stone-200 dark:border-stone-850 rounded-xl p-2 text-center opacity-65 shrink-0 flex flex-col justify-center items-center h-[135px]">
                                    <span className="text-lg">🤝</span>
                                    <span className="font-serif text-[10px] font-black text-stone-500 mt-1">96 Others</span>
                                    <span className="text-[7.5px] text-stone-400 mt-0.5">Kaurava Heirs</span>
                                  </div>
                                  {renderTreeCard("Vikarna", "The Righteous", "Defended Draupadi")}
                                  {renderTreeCard("Dushasana", "Second Brother", "Aggressive General")}
                                </div>
                              </div>

                              {/* Group B: Karna under Kunti (Column 5) */}
                              <div className="col-start-5 flex flex-col items-center justify-center p-2 z-10">
                                {renderTreeCard("Karn", "Solar Archer", "Kunti's Hidden Gem", true)}
                              </div>

                              {/* Group C: 3 Elder Pandavas via Kunti (Column 6) */}
                              <div className="col-start-6 justify-self-center w-max max-w-[340px] bg-[#f0faf2]/60 dark:bg-emerald-950/10 p-3 rounded-2xl border border-emerald-500/15 flex flex-col items-center z-10">
                                <div className="flex gap-2 justify-center flex-wrap">
                                  {renderTreeCard("Yudhistra", "Dharmaraja King", "Eldest Truth-Champion")}
                                  {renderTreeCard("Bheem", "Fierce Mighty", "Strongest Warrior", true)}
                                  {renderTreeCard("Arjun", "Master Archer", "Hero of the Gita", true)}
                                </div>
                              </div>

                              {/* Group D: 2 Twin Pandavas via Madri (Column 8) */}
                              <div className="col-start-8 justify-self-center w-max max-w-[240px] bg-[#f0f5fa]/60 dark:bg-blue-950/10 p-3 rounded-2xl border border-blue-500/15 flex flex-col items-center z-10">
                                <div className="flex gap-2 justify-center flex-wrap">
                                  {renderTreeCard("Nakula", "Master Sword", "Elegance & Horse Seer")}
                                  {renderTreeCard("Sahadev", "Divine Seer", "Astrology strategist")}
                                </div>
                              </div>

                            </div>
                          </div>

                          {/* =================================================== */}
                          {/* GEN IV TO GEN V: MATRIMONIAL ALLIANCES & MATOR DESCENTS */}
                          {/* =================================================== */}
                          <div className="bg-[#f0eae1] dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-900/10 grid grid-cols-3 gap-8 my-4 mt-8 relative">
                            
                            {/* 1. Duryodhana Line */}
                            <div className="flex flex-col items-center">
                              {/* Duryodhan <-> Bhanumati Union Row */}
                              <div className="flex items-center justify-center gap-4 relative w-full">
                                {renderTreeCard("Duryodhan", "Eldest Kaurava", "")}
                                {renderConnector("Union")}
                                {renderTreeCard("Bhanumati", "Chief Queen", "")}
                              </div>
                              
                              {/* Vertical descent line */}
                              <div className="w-0.5 h-12 bg-amber-500/70 relative">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                              </div>
                              
                              {/* Descendants: Lakshman, Lakshmana ↕ Sambha */}
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="bg-white/80 dark:bg-[#1f1611]/80 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 text-center shadow-xs">
                                  <strong className="text-xs text-[#8b4513] font-serif">Lakshman, Lakshmana</strong>
                                </div>
                                <div className="h-6 w-0.5 bg-amber-500/70 relative">
                                  {/* Double Arrow Up/Down */}
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[3px] border-x-transparent border-b-[5px] border-b-amber-500/70 z-10"></div>
                                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[3px] border-x-transparent border-t-[5px] border-t-amber-500/70 z-10"></div>
                                </div>
                                <div className="bg-white/80 dark:bg-[#1f1611]/80 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 text-center shadow-xs">
                                  <span className="text-[10px] text-stone-500">Krishna's son</span>
                                  <br/>
                                  <strong className="text-xs text-[#8b4513] font-serif">Sambha</strong>
                                </div>
                              </div>
                            </div>

                            {/* 2. Bheem Line */}
                            <div className="flex flex-col items-center">
                              {/* Bheem <-> Hidimbi Union Row */}
                              <div className="flex items-center justify-center gap-4 relative w-full">
                                {renderTreeCard("Bheem", "Pandava", "")}
                                {renderConnector("Union")}
                                {renderTreeCard("Hidimbi", "Demoness", "")}
                              </div>
                              
                              {/* Vertical descent line */}
                              <div className="w-0.5 h-12 bg-amber-500/70 relative">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                              </div>
                              
                              {/* Custom Note/Descriptor */}
                              <div className="bg-white/80 dark:bg-[#1a100c]/80 border border-stone-200 dark:border-stone-800 p-3 rounded-xl flex flex-col items-center text-center max-w-[180px] shadow-xs">
                                <span className="text-[9px] text-[#8b4513] dark:text-amber-400 font-bold uppercase tracking-wider">Parents of</span>
                                <p className="font-serif text-xs font-black text-stone-800 dark:text-stone-200 mt-0.5">Ghatotkacha</p>
                                <p className="text-[8px] text-stone-400 leading-tight mt-0.5">The giant hero of the Kurukshetra war.</p>
                              </div>
                            </div>

                            {/* 3. Arjun Line */}
                            <div className="flex flex-col items-center">
                              {/* Arjun <-> Subadhra Row */}
                              <div className="flex items-center justify-center gap-4 relative w-full">
                                {renderTreeCard("Arjun", "Pandava", "")}
                                {renderConnector("Union")}
                                {renderTreeCard("Subadhra", "Yadava", "")}
                              </div>
                              
                              {/* Vertical descent line */}
                              <div className="w-0.5 h-12 bg-amber-500/70 relative">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-500/70 z-10"></div>
                              </div>

                              {/* Descendants: Abhimanyu ↕ Uttara */}
                              <div className="flex flex-col items-center relative gap-0">
                                {renderTreeCard("Abhimanyu", "Warrior", "")}
                                <div className="h-6 w-0.5 bg-amber-500/70 relative">
                                  {/* Double arrow */}
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[3px] border-x-transparent border-b-[5px] border-b-amber-500/70 z-10"></div>
                                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[3px] border-x-transparent border-t-[5px] border-t-amber-500/70 z-10"></div>
                                </div>
                                {renderTreeCard("Uttara", "Princess", "")}
                              </div>
                            </div>
                            
                          </div>

                          {/* =================================================== */}
                          {/* GEN VII LEVEL: ULTIMATE SURVING HEIR & DYNASTIC SEED */}
                          {/* =================================================== */}
                          <div className="border-t border-dashed border-amber-900/20 pt-8 mt-6 flex flex-col items-center">
                            <h4 className="text-xs font-serif font-black tracking-[4px] text-amber-850 dark:text-amber-300 uppercase mb-4">
                              👑 SEED CONTINUATION
                            </h4>
                            
                            <div className="flex flex-col items-center">
                              
                              <div className="flex flex-col items-center justify-center relative w-full h-8">
                                <span className="text-stone-500 text-[10px] lowercase italic font-serif">Descent from Abhimanyu & Uttara</span>
                              </div>

                              {/* Downward Connector Line */}
                              <div className="h-6 w-0.5 bg-amber-600 relative">
                                <div className="absolute bottom-[-1px] left-[50%] -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-600 z-10"></div>
                              </div>

                              <div className="bg-[#fffdf2] dark:bg-amber-950/20 p-4 rounded-3xl border-2 border-amber-600 max-w-[200px] text-center shadow-[0_10px_25px_rgba(217,119,6,0.06)] hover:scale-105 transition-transform duration-300 mt-2">
                                <h4 className="font-serif text-[#8b4513] dark:text-amber-300 text-xs font-black uppercase tracking-widest mt-1">PARIKSHIT</h4>
                              </div>

                              {/* Downward Connector Line */}
                              <div className="h-8 w-0.5 bg-amber-600 relative">
                                <div className="absolute bottom-[-1px] left-[50%] -translate-x-1/2 w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-amber-600 z-10"></div>
                              </div>

                              <div className="bg-stone-50 dark:bg-[#1f1611]/80 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-[200px] text-center shadow-xs hover:scale-105 transition-transform duration-300 mt-0">
                                <h4 className="font-serif text-stone-700 dark:text-stone-300 text-[11px] font-black uppercase tracking-widest mt-1">Janamejaya</h4>
                              </div>
                              
                              {/* Last horizontal gold/amber line to complete the manuscript's layout */}
                              <div className="w-56 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mt-8 mb-4"></div>
                              
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                    {/* TAB 2: GENERATIONAL BENTO CLUSTERS */}
                    {familyTreeTab === "bento" && (
                      <div className="space-y-6 pt-2">
                        {[
                          {
                            title: "Generation I: Ancient Ancestors & Sacred Founders",
                            desc: "The celestial foundational beings whose unions initiated the Hastinapura crown dynasty story.",
                            members: ["Parashara", "Satyavati", "Shantanu", "Ganga"]
                          },
                          {
                            title: "Generation II: The Sages, Grand Protector & Heirs",
                            desc: "Princes and scribes who shaped the laws, morals, and preserved the royal seed during early dynastic crises.",
                            members: ["Vyasa", "Chitrangada", "Vichitravirya", "Bhishma"]
                          },
                          {
                            title: "Generation III: Queens, Regents & Sovereigns",
                            desc: "Empresses and blind or pale kings who held the crown in tension before the epic war.",
                            members: ["Ambika", "Ambalika", "Dhritarashtra", "Gandhari", "Pandu", "Kunti", "Madri"]
                          },
                          {
                            title: "Generation IV: Heroes & Antagonists of Kurukshetra",
                            desc: "The major battlefield contestants, archers, and spouses whose actions took Hastinapura to Kurukshetra.",
                            members: ["Karna", "Duryodhana", "Bhanumati", "Vikarna", "Dushasana", "Duhsala", "Yudhisthira", "Bheema", "Arjuna", "Hidimbi", "Subhadra", "Nakula", "Sahadeva"]
                          },
                          {
                            title: "Generation V: The Seeds, Allies & Future Crown Heirs",
                            desc: "Young martyrs and loving alliance seekers who carried the surviving seed of humanity across the war.",
                            members: ["Abhimanyu", "Uttara", "Lakshman", "Lakshmana", "Sambha"]
                          }
                        ].map((gen, idx) => (
                          <div key={idx} className="bg-stone-50 dark:bg-[#1a110d]/40 p-4 sm:p-6 rounded-2xl border border-amber-900/5 dark:border-amber-900/30 flex flex-col md:flex-row gap-4 items-start">
                            <div className="md:w-[220px] shrink-0 space-y-1">
                              <h4 className="font-serif font-black text-amber-900 dark:text-amber-300 text-sm">
                                <Translate text={gen.title} />
                              </h4>
                              <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed">
                                <Translate text={gen.desc} />
                              </p>
                            </div>
                            <div className="flex-1 flex flex-wrap gap-3">
                              {gen.members.map(member => (
                                <div key={member} className="hover:-translate-y-1 transition-transform">
                                  {renderTreeCard(
                                    member, 
                                    member === "Vyasa" || member === "Parashara" ? <Translate text="Sage" /> : member === "Bhishma" ? <Translate text="Grand patriarch" /> : <Translate text="Kuru Dynast" />,
                                    <Translate text="Click to view bio" />,
                                    member === "Satyavati" || member === "Arjuna" || member === "Duryodhana"
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TAB 3: CHARACTER RELATION REFINERY */}
                    {familyTreeTab === "search" && (
                      <div className="pt-2 max-w-4xl mx-auto space-y-6">
                        
                        {/* Search & Suggestions selector */}
                        <div className="bg-stone-50 dark:bg-[#1a110d]/50 p-6 rounded-2xl border border-amber-900/10">
                          <h4 className="text-xs font-serif font-black uppercase text-amber-905 dark:text-amber-300 mb-3 text-center tracking-wider"><Translate text="Select a Soul of Hastinapura to Map Relations" /></h4>
                          <div className="flex flex-wrap gap-2 justify-center max-h-[140px] overflow-y-auto p-1 bg-white dark:bg-[#110906] rounded-xl border border-amber-950/10">
                            {familyRelations.map((char) => (
                              <button
                                key={char.name}
                                onClick={() => setFamilyTreeSearchQuery(char.name)}
                                className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-lg cursor-pointer transition-all ${
                                  familyTreeSearchQuery.toLowerCase() === char.name.toLowerCase()
                                    ? "bg-[#8b4513] text-white"
                                    : "bg-amber-50 dark:bg-amber-955/20 hover:bg-amber-100 text-[#8b4513] dark:text-amber-300 border border-amber-900/5"
                                }`}
                              >
                                <Translate text={char.name} />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Visual Relational Display Node Network */}
                        <div className="bg-white dark:bg-[#1b100b] border border-amber-400/20 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center justify-center">
                          
                          {/* Centered Primary character profile details */}
                          <div className="text-center space-y-2 border-b md:border-b-0 md:border-r border-[#deb887]/30 pb-6 md:pb-0 md:pr-8 md:w-[240px] shrink-0">
                            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest leading-none block">SELECTED CHARACTER</span>
                            <div className="relative w-28 h-28 mx-auto overflow-hidden rounded-full border-4 border-amber-500 shadow-md">
                              <LegendAvatar 
                                name={activeRelation.name} 
                                className="w-full h-full"
                                imgClassName="w-full h-full object-cover"
                              />
                            </div>
                            <h4 className="text-lg font-serif font-black text-[#5d3011] dark:text-[#ffd700] uppercase tracking-wide leading-tight">
                              <Translate text={activeRelation.name} />
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic leading-snug">
                              <Translate text={activeRelation.desc} />
                            </p>
                            
                            <button
                              onClick={() => openLegendByName(activeRelation.name)}
                              className="px-4 py-1.5 bg-[#8b4513] text-[#ffd700] rounded-full text-[10.5px] font-bold uppercase tracking-wider block mx-auto cursor-pointer hover:bg-stone-850"
                            >
                              <Translate text="Open Portal Biography" /> →
                            </button>
                          </div>

                          {/* Connected kinfolk tree row arrays */}
                          <div className="flex-1 w-full space-y-4">
                            
                            {/* Mother and Father */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-[#fffefd] dark:bg-stone-900/20 border border-stone-200/50 dark:border-stone-800 rounded-xl">
                                <span className="text-[9px] uppercase font-bold text-stone-400 block mb-1">
                                  <Translate text="Father" />
                                </span>
                                {activeRelation.father && activeRelation.father !== "Pratipa" && activeRelation.father !== "Pratipa" && familyRelations.some(c => c.name.toLowerCase() === activeRelation.father.split(" ")[0].toLowerCase()) ? (
                                  <button 
                                    onClick={() => setFamilyTreeSearchQuery(activeRelation.father.split(" ")[0])}
                                    className="text-xs font-serif font-black text-[#8b4513] dark:text-amber-300 hover:underline hover:opacity-80 text-left block"
                                  >
                                    👴 {activeRelation.father} ➜
                                  </button>
                                ) : (
                                  <span className="text-xs text-stone-550 dark:text-stone-400 font-serif italic">👴 {activeRelation.father || "Unknown / Astral Form"}</span>
                                )}
                              </div>

                              <div className="p-3 bg-[#fffefd] dark:bg-stone-900/20 border border-stone-200/50 dark:border-stone-800 rounded-xl">
                                <span className="text-[9px] uppercase font-bold text-stone-400 block mb-1">
                                  <Translate text="Mother" />
                                </span>
                                {activeRelation.mother && familyRelations.some(c => c.name.toLowerCase() === activeRelation.mother.split(" ")[0].toLowerCase()) ? (
                                  <button 
                                    onClick={() => setFamilyTreeSearchQuery(activeRelation.mother.split(" ")[0])}
                                    className="text-xs font-serif font-black text-[#8b4513] dark:text-amber-300 hover:underline hover:opacity-80 text-left block"
                                  >
                                    👵 {activeRelation.mother} ➜
                                  </button>
                                ) : (
                                  <span className="text-xs text-stone-550 dark:text-stone-400 font-serif italic">👵 {activeRelation.mother || "Unknown / Astral Form"}</span>
                                )}
                              </div>
                            </div>

                            {/* Spouses List */}
                            <div className="p-3 bg-[#fffefd] dark:bg-stone-900/20 border border-stone-200/50 dark:border-stone-800 rounded-xl">
                              <span className="text-[9px] uppercase font-bold text-stone-400 block mb-2">
                                <Translate text="Spouse(s) / Partners" />
                              </span>
                              {activeRelation.spouses.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {activeRelation.spouses.map((spouse) => (
                                    <button
                                      key={spouse}
                                      onClick={() => {
                                        const cleanName = spouse.split(" ")[0];
                                        if (familyRelations.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
                                          setFamilyTreeSearchQuery(cleanName);
                                        }
                                      }}
                                      className="px-2 py-1 bg-amber-50 dark:bg-amber-955/30 border border-amber-950/10 text-[#8b4513] dark:text-amber-250 rounded-lg text-xs font-black cursor-pointer hover:bg-amber-100"
                                    >
                                      ❤️ <Translate text={spouse} /> ➜
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs italic text-stone-400 block pb-1">
                                  <Translate text="Unmarried / Solitary Journey" />
                                </span>
                              )}
                            </div>

                            {/* Children List */}
                            <div className="p-3 bg-[#fffefd] dark:bg-stone-900/20 border border-stone-200/50 dark:border-stone-800 rounded-xl">
                              <span className="text-[9px] uppercase font-bold text-stone-400 block mb-2">
                                <Translate text="Children / Successor Seeds" />
                              </span>
                              {activeRelation.children.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {activeRelation.children.map((child) => (
                                    <button
                                      key={child}
                                      onClick={() => {
                                        const cleanName = child.split(" ")[0];
                                        if (familyRelations.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
                                          setFamilyTreeSearchQuery(cleanName);
                                        }
                                      }}
                                      className="px-2 py-1 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-990/10 text-emerald-800 dark:text-emerald-400 rounded-lg text-xs font-black cursor-pointer hover:bg-emerald-100"
                                    >
                                      🌱 <Translate text={child} /> ➜
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs italic text-stone-450 block pb-1">
                                  <Translate text="No biological heirs recorded on primary chart" />
                                </span>
                              )}
                            </div>

                          </div>

                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

            </div>
          </section>

          {/* ================================================== */}
          {/* WISDOM HUB: BOOKMARKS, HISTORY & TOPIC KEYWORD SEARCH */}
          {/* ================================================== */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="wisdom-hub">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Column 1 & 2: Divine Topic Search & Keyword Search results */}
              <div className="lg:col-span-2 bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 sm:p-10 rounded-3xl shadow-lg hover:border-amber-400 transition-all duration-300">
                <span className="inline-block px-3 py-1 bg-amber-950 text-amber-200 rounded-full font-serif text-[10px] uppercase tracking-widest font-bold mb-3">
                  <Translate text="Topic Explorer" />
                </span>
                <h3 className="font-serif text-2xl text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-wide mb-2">
                  <Translate text="Divine Keyword Explorer" />
                </h3>
                <p className="text-stone-600 dark:text-stone-300 text-sm mb-6">
                  <Translate text="Search across all 700 verses of the Bhagavad Gita by keyword (e.g. 'peace', 'anger', 'mind', 'soul', 'duty', 'food') to find relevant spiritual shloks." />
                </p>

                <form onSubmit={handleKeywordSearch} className="flex gap-2 items-center bg-[#deb887]/20 dark:bg-amber-950/20 p-2.5 rounded-full border border-[#deb887]/40 dark:border-amber-700/40 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-3 w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <input 
                      type="text" 
                      placeholder={translate("Type a topic: peace, anger, mind, yoga, soul...")} 
                      value={keywordQuery}
                      onChange={(e) => setKeywordQuery(e.target.value)}
                      className="w-full bg-white dark:bg-[#1b0f0a] pl-10 pr-4 py-2.5 border border-amber-900/10 rounded-full focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-[#8b4513] hover:bg-[#5d4037] text-white hover:text-amber-200 font-bold rounded-full text-xs cursor-pointer transition-colors"
                  >
                    Explore
                  </button>
                </form>

                {/* Keyword Search Results */}
                {searchTriggered && (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin" id="search-results-section">
                    <div className="flex justify-between items-center pb-2 border-b border-stone-100 dark:border-stone-800">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                        Found {searchResults.length} verses
                      </span>
                      {searchResults.length > 0 && (
                        <button 
                          onClick={() => { setKeywordQuery(""); setSearchResults([]); setSearchTriggered(false); }} 
                          className="text-[10px] text-stone-400 hover:text-amber-750 font-bold"
                        >
                          Clear Results
                        </button>
                      )}
                    </div>

                    {searchResults.length === 0 ? (
                      <p className="text-center text-stone-500 py-8 text-sm italic">
                        No matches found for "{keywordQuery}". Try other common keywords like "peace", "duty", "anger", "yoga", "mind", or "fear".
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {searchResults.map((verseItem) => (
                          <div 
                            key={`${verseItem.chapter}-${verseItem.verse}`}
                            onClick={() => openSpecificVerseForStudy(verseItem.chapter, verseItem.verse)}
                            className="p-4 bg-stone-50 hover:bg-amber-50/50 dark:bg-[#1b0f0a]/40 dark:hover:bg-amber-950/20 rounded-xl border border-stone-200/50 dark:border-stone-800 cursor-pointer transition-all hover:scale-[1.01] flex flex-col gap-2"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 font-serif">
                                Verse {verseItem.chapter}.{verseItem.verse}
                              </span>
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded text-amber-900 dark:text-amber-200 font-semibold uppercase">
                                Read Shlok &rarr;
                              </span>
                            </div>
                            <p className="font-devanagari text-[#8b4513] dark:text-amber-400 text-sm font-semibold truncate">
                              {verseItem.sanskrit}
                            </p>
                            <p className="text-stone-600 dark:text-stone-300 text-xs line-clamp-2">
                              {verseItem.translation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Default helpful suggestion pills if no results */}
                {!searchTriggered && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest block mb-1">
                      Popular Search Topics
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {["peace", "anger", "mind", "yoga", "soul", "duty", "fear", "food", "work", "desire"].map((word) => (
                        <button
                          key={word}
                          type="button"
                          onClick={() => {
                            setKeywordQuery(word);
                            const matches: Verse[] = [];
                            Object.entries(chaptersCollection).forEach(([chStr, vList]) => {
                              const chNum = parseInt(chStr);
                              vList.forEach(item => {
                                if (
                                  item.translation.toLowerCase().includes(word) ||
                                  item.transliteration.toLowerCase().includes(word) ||
                                  item.sanskrit.toLowerCase().includes(word) ||
                                  item.purport.toLowerCase().includes(word)
                                ) {
                                  matches.push(item);
                                }
                              });
                            });
                            setSearchResults(matches);
                            setSearchTriggered(true);
                          }}
                          className="px-3.5 py-1.5 bg-stone-100 dark:bg-[#1b0f0a]/60 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 rounded-full text-xs font-medium cursor-pointer transition-colors"
                        >
                          #{word}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Column 3: Bookmarks & Live History */}
              <div className="flex flex-col gap-6 lg:col-span-1">
                
                {/* Bookmarks Card */}
                <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 rounded-3xl shadow-lg flex-1 flex flex-col justify-between hover:border-amber-400 transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-serif text-base text-amber-900 dark:text-amber-200 font-bold flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        Saved Wisdom
                      </h4>
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {bookmarks.length} Saved
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                      {bookmarks.length === 0 ? (
                        <p className="text-xs text-stone-500 italic py-6 leading-relaxed">
                          No bookmarks yet. Bookmark your favorite verses during study to keep them saved here for reflection!
                        </p>
                      ) : (
                        bookmarks.map((b) => {
                          const chapList = chaptersCollection[b.chapter] || [];
                          const vObj = chapList.find(v => v.verse === b.verse);
                          return (
                            <div 
                              key={`${b.chapter}-${b.verse}`}
                              className="p-3 bg-stone-50 dark:bg-[#1b0f0a]/40 border border-stone-200 dark:border-stone-850 rounded-xl relative group"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <button 
                                  onClick={() => openSpecificVerseForStudy(b.chapter, b.verse)}
                                  className="text-xs font-bold text-[#8b4513] dark:text-amber-300 hover:underline text-left"
                                >
                                  Verse {b.chapter}.{b.verse}
                                </button>
                                <button 
                                  onClick={() => toggleBookmark(b.chapter, b.verse)}
                                  className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                              {vObj && (
                                <p className="text-stone-600 dark:text-stone-300 text-[10px] line-clamp-1 pb-1 text-ellipsis overflow-hidden">
                                  {vObj.translation}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* History Card (Continue Reading) */}
                <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 rounded-3xl shadow-lg flex-1 flex flex-col justify-between hover:border-amber-400 transition-all duration-300">
                  <div>
                    <h4 className="font-serif text-base text-amber-900 dark:text-amber-200 font-bold flex items-center gap-2 mb-4">
                      {/* Using BookOpen as History representation */}
                      <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400 text-stone-600 dark:text-stone-300" />
                      Reading History
                    </h4>

                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                      {historyList.length === 0 ? (
                        <p className="text-xs text-stone-500 italic py-6 leading-relaxed">
                          Your read path is clear. Begin reading any chapter of the Shrimad Bhagavad Gita to trace your sequence here!
                        </p>
                      ) : (
                        historyList.map((h, i) => {
                          const chapList = chaptersCollection[h.chapter] || [];
                          const vObj = chapList.find(v => v.verse === h.verse);
                          return (
                            <div 
                              key={`${h.chapter}-${h.verse}-${h.timestamp}`}
                              onClick={() => openSpecificVerseForStudy(h.chapter, h.verse)}
                              className="p-3 bg-stone-50 hover:bg-amber-50/40 dark:bg-[#1b0f0a]/40 dark:hover:bg-amber-950/25 border border-stone-200 dark:border-stone-850 rounded-xl cursor-pointer flex gap-3 items-center"
                            >
                              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-[10px] font-bold text-amber-900 dark:text-amber-200 shrink-0">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-[#8b4513] dark:text-amber-300">
                                  Chapter {h.chapter}, Verse {h.verse}
                                </div>
                                {vObj && (
                                  <p className="text-stone-500 dark:text-stone-400 text-[10px] truncate text-ellipsis overflow-hidden">
                                    {vObj.translation}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  {historyList.length > 0 && (
                    <div className="pt-4 mt-2 border-t border-stone-100 dark:border-stone-800 text-center">
                      <button 
                        onClick={() => openSpecificVerseForStudy(historyList[0].chapter, historyList[0].verse)}
                        className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:underline uppercase tracking-wide cursor-pointer flex items-center gap-1 justify-center mx-auto"
                      >
                        ⚡ Continue Reading &rarr;
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </section>

          {/* CHAPTERS OF THE GITA SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="chapters-section">
            <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 sm:p-12 md:p-16 rounded-3xl shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-400">
              <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-[3px] mb-2 select-none">
                <Translate text="The 18 Spiritual Chapters" />
              </h2>
              <p className="text-center text-stone-600 dark:text-stone-300 mt-2 italic text-sm sm:text-base mb-8 font-sans">
                <Translate text="Explore the 700 verses of divine conversation" />
              </p>

              {/* Direct verse finder search input */}
              <form onSubmit={handleDirectSearch} className="max-w-md mx-auto mb-12 flex gap-2 items-center justify-center bg-[#deb887]/20 dark:bg-amber-950/20 p-3 rounded-full border border-[#deb887]/40 dark:border-amber-700/40 font-sans">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <input 
                    type="text" 
                    placeholder={translate("Search chapter.verse (e.g. 2.47)")} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-[#1b0f0a] pl-9 pr-4 py-2 border border-amber-900/10 rounded-full focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                  />
                </div>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#8b4513] hover:bg-[#5d4037] text-white hover:text-amber-200 font-bold rounded-full text-xs cursor-pointer transition-colors"
                >
                  <Translate text="Study" />
                </button>
              </form>

              {/* Chapters list grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                {gitaChapters.map((chap) => (
                  <div 
                    key={chap.num}
                    onClick={() => openChapterForStudy(chap.num)}
                    className="chapter-box bg-white dark:bg-[#1b0f0a]/50 border-2 border-amber-200 dark:border-amber-800 p-6 rounded-2xl cursor-pointer hover:bg-[#8b4513] dark:hover:bg-amber-900 hover:border-amber-400 hover:scale-[1.02] group transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8b4513] dark:bg-amber-700 group-hover:bg-[#ffd700]" />
                    <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 group-hover:text-amber-300 font-semibold">
                      <span><Translate text="Chapter" /> {chap.num}</span>
                      <span>{chap.verses} <Translate text="Verses" /></span>
                    </div>
                    <h3 className="font-serif text-lg text-[#8b4513] dark:text-[#ffd700] group-hover:text-white mt-3 font-extrabold">
                      <Translate text={chap.name} />
                    </h3>
                    <p className="text-xs text-gray-650 dark:text-stone-300 group-hover:text-stone-200 italic mt-1 font-medium">
                      <Translate text={chap.subtitle} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ESSENTIAL PIVOTAL VERSES SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="verses-section">
            <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 sm:p-12 md:p-16 rounded-3xl shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-400">
              <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-[3px] mb-2 select-none">
                Essential Verses
              </h2>
              <p className="text-center text-stone-600 dark:text-stone-300 mt-2 mb-12 italic text-sm">
                Pivotal shloks that define the essence of the Bhagavad Gita study.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { ref: "2.47", chapter: 2, verse: 47, category: "Karma Yoga", title: "Law of Detached Duty", desc: "Perform your duty without attachment to the results; remain equanimous in success and failure." },
                  { ref: "4.7", chapter: 4, verse: 7, category: "Avatara", title: "Divine Descent", desc: "Whenever righteousness declines and evil prevails, the Divine manifests on Earth." },
                  { ref: "2.20", chapter: 2, verse: 20, category: "Sankhya Yoga", title: "Eternity of the Soul", desc: "The soul is never born, nor does it ever die. It is ancient, eternal, and indestructible." },
                  { ref: "18.66", chapter: 18, verse: 66, category: "Moksha Yoga", title: "Final Surrender", desc: "Abandon all varieties of systemized duties and surrender to the Supreme. Fear not." },
                  { ref: "9.22", chapter: 9, verse: 22, category: "Bhakti Yoga", title: "Divine Protection", desc: "For those who worship with exclusive devotion, the Lord carries and secures their needs." },
                  { ref: "15.7", chapter: 15, verse: 7, category: "Purushottama", title: "The Eternal Fragment", desc: "The living entities are eternal fragments of the Divine, struggling with material senses." }
                ].map((vItem, idx) => (
                  <div 
                    key={idx}
                    onClick={() => openChapterForStudy(vItem.chapter)}
                    className="bg-white dark:bg-[#1b0f0a]/50 rounded-2xl border-2 border-amber-200 dark:border-amber-800 p-6 flex flex-col justify-between hover:border-amber-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-sm group"
                  >
                    <div>
                      <span className="inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 mb-4">
                        {vItem.category}
                      </span>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-amber-700 font-bold dark:text-amber-400">BG {vItem.ref}</span>
                        <Sparkles className="w-4 h-4 text-[#ffd700] opacity-60" />
                      </div>
                      <h3 className="font-serif text-lg text-[#8b4513] dark:text-[#ffd700] mb-2">{vItem.title}</h3>
                      <p className="text-gray-700 dark:text-stone-300 text-sm leading-relaxed">
                        {vItem.desc}
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-amber-900/5 mt-4 flex justify-between items-center text-xs font-bold text-amber-800 dark:text-amber-400 group-hover:text-amber-500">
                      <span>Read Verse</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* GITA IN DAILY LIFE SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="daily-section">
            <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 sm:p-12 md:p-16 rounded-3xl shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-400">
              <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-[3px] mb-2 select-none">
                <Translate text="Gita in Daily Life" />
              </h2>
              <p className="text-center text-stone-600 dark:text-stone-300 mt-2 mb-12 italic text-sm">
                <Translate text="Practical applications of ancient Vedic guidelines for modern scenarios." />
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: "🧠", ref: "BG 6.5", shlok: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत् |", title: "Mastering the Mind", desc: "Uplift yourself through the power of your own mind; do not allow yourself to degrade." },
                  { icon: "🌍", ref: "BG 5.18", shlok: "विद्याविनयसम्पन्ने ब्राह्मणे गवि हस्तिनि |", title: "Universal Compassion", desc: "The wise see with equal, non-judgmental vision a learned scholar, a cow, or an elephant." },
                  { icon: "⚖️", ref: "BG 6.17", shlok: "युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु |", title: "Healthy & Balanced Living", desc: "Yoga destroys all pain for the one who maintains balance in eating, sleeping, and working." }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="bg-white dark:bg-[#1b0f0a]/50 p-6 rounded-2xl border border-amber-200 dark:border-amber-800 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-xs text-orange-900/60 dark:text-amber-400 tracking-wider font-semibold">{item.ref}</span>
                      </div>
                      <p className="font-devanagari text-sm font-semibold text-amber-700/80 dark:text-amber-300/80">{item.shlok}</p>
                      <h4 className="font-serif text-base font-bold text-amber-900 dark:text-amber-100">
                        <Translate text={item.title} />
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-stone-300 leading-relaxed">
                        <Translate text={item.desc} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* AUDIO PODCASTS SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="podcast-section">
            <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 sm:p-12 md:p-16 rounded-3xl shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-400">
              <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-[3px] mb-2 select-none">
                <Translate text="Podcasts" />
              </h2>
              <p className="text-center text-stone-600 dark:text-stone-300 mt-2 mb-12 italic text-sm">
                <Translate text="Modern dialogues on ancient wisdom from world-renowned speakers and commentators." />
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {podcastCards.map((p, idx) => (
                  <a 
                    key={idx}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white dark:bg-[#1b0f0a]/50 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-800 shadow-sm hover:border-amber-400 hover:scale-[1.03] transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-red-605 uppercase tracking-widest bg-red-105 dark:bg-red-950/50 px-2 py-0.5 rounded">
                          <Translate text="YouTube" />
                        </span>
                        <PlayCircle className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <h3 className="font-serif text-sm text-[#8b4513] dark:text-[#ffd700] font-bold">
                        <Translate text={p.name} />
                      </h3>
                      <p className="text-xs text-gray-650 dark:text-stone-300 line-clamp-3 leading-relaxed">
                        <Translate text={p.title} />
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#8b4513] dark:text-amber-400 uppercase tracking-widest pt-2 border-t border-amber-100 dark:border-amber-955 flex items-center gap-1">
                      <Translate text="Watch Video" /> <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* SACRED LITERATURE/BOOKS SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="books-section">
            <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 sm:p-12 md:p-16 rounded-3xl shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-400">
              <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-[3px] mb-2 select-none">
                <Translate text="Sacred Literature" />
              </h2>
              <p className="text-center text-stone-600 dark:text-stone-300 mt-2 mb-12 italic text-sm">
                <Translate text="Deepen your search with world-renowned commentaries and translations." />
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookCards.map((b, idx) => (
                  <div 
                    key={idx}
                    className="bg-white dark:bg-[#1b0f0a]/50 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-800 flex gap-4 items-start shadow-xs hover:shadow-md transition-all duration-300"
                  >
                    <div className="text-4xl px-4 py-6 bg-stone-100 dark:bg-stone-900 rounded-xl border-l-[6px] border-[#8b4513] shadow-inner select-none flex items-center justify-center shrink-0">
                      {b.cover}
                    </div>
                    <div className="space-y-2 flex-1">
                      <span className="text-[10px] tracking-wider uppercase text-amber-800 dark:text-amber-400 font-bold">
                        <Translate text={b.author} />
                      </span>
                      <h3 className="font-serif text-base text-[#8b4513] dark:text-[#ffd700] font-extrabold">
                        <Translate text={b.title} />
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-stone-300 leading-relaxed">
                        <Translate text={b.desc} />
                      </p>
                      <a 
                        href={b.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block pt-2 text-xs font-bold text-amber-800 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <span><Translate text="Purchase Book" /></span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FREQUENTLY ASKED QUESTIONS SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="faq-section">
            <div className="bg-white dark:bg-[#26160f] border-2 border-amber-300/80 dark:border-amber-700/60 p-6 sm:p-12 md:p-16 rounded-3xl shadow-[0_15px_50px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-400">
              <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#7c2d12] dark:text-[#ffd700] uppercase tracking-[3px] mb-2 select-none">
                <Translate text="Frequently Asked Questions" />
              </h2>
              <p className="text-center text-stone-600 dark:text-stone-300 mt-2 mb-12 italic text-sm">
                <Translate text="Clearing common doubts and inquiries about the Shrimad Bhagavad Gita." />
              </p>

              <div className="space-y-4 max-w-4xl mx-auto">
                {faqItems.map((faq, idx) => (
                  <div 
                    key={idx}
                    className="border border-[#deb887] dark:border-amber-800 rounded-xl overflow-hidden shadow-sm"
                  >
                    <button 
                      onClick={() => setActiveFaqIndex(activeFaqIndex === idx ? null : idx)}
                      className="w-full text-left p-5 bg-white dark:bg-[#26160f] flex justify-between items-center font-bold text-[#8b4513] dark:text-amber-300 font-serif focus:outline-none cursor-pointer hover:bg-stone-100"
                    >
                      <span><Translate text={faq.question} /></span>
                      <ChevronDown className={`w-5 h-5 text-amber-600 dark:text-amber-400 transition-transform duration-250 ${activeFaqIndex === idx ? "rotate-180" : ""}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ${activeFaqIndex === idx ? "max-h-[300px]" : "max-h-0"}`}>
                      <div className="p-5 bg-white dark:bg-[#1b0f0a] border-t border-amber-900/5 text-gray-700 dark:text-stone-300 text-sm leading-relaxed">
                        <Translate text={faq.answer} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="bg-[#fdf5e6] dark:bg-[#110906] py-12 px-4 text-center border-t-3 border-[#8b4513] text-stone-600 dark:text-stone-400 transition-colors">
            <div className="max-w-4xl mx-auto space-y-4">
              <p className="text-sm">
                Designed and Developed by:{" "}
                <a href="#auth-main" className="text-[#8b4513] dark:text-[#ffd700] hover:underline font-bold font-serif">
                  Jyoti Pandey
                </a>
              </p>
              <p className="text-xs">
                Send your feedback to:{" "}
                <a href="mailto:jyoti1210486@gmail.com" className="text-[#8b4513] dark:text-[#ffd700] hover:underline font-semibold">
                  jyoti1210486@gmail.com
                </a>
              </p>
              <div className="h-[1px] w-24 bg-amber-900/10 dark:bg-amber-500/10 mx-auto my-4" />
              <p className="text-xs opacity-75">
                &copy; {new Date().getFullYear()} Gita Portal. All rights reserved. Built with love in React and TypeScript.
              </p>
            </div>
          </footer>

          {/* ================================================== */}
          {/* VERSE STUDY PORTAL OVERLAY */}
          {/* ================================================== */}
          {studyPortalOpen && activeStudyVerses.length > 0 && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-2 sm:p-4 animate-fade-in">
              <div className="w-full max-w-4xl h-[95vh] sm:h-[90vh] bg-white dark:bg-[#1b0f0a] rounded-2xl border-2 border-[#d4af37] dark:border-amber-400 overflow-hidden flex flex-col shadow-2xl relative">
                
                {/* Header with escape actions */}
                <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-[#2c1b12]/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-amber-100 dark:bg-amber-950 rounded-lg">
                      <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                    </span>
                    <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold text-amber-900 dark:text-amber-200 leading-tight">
                      Gita Study Center — Chapter {activeStudyChapter}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button 
                      onClick={() => toggleBookmark(activeStudyChapter, activeStudyVerses[activeVerseIndex].verse)}
                      className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-all text-[10px] sm:text-xs cursor-pointer font-bold ${
                        isBookmarked(activeStudyChapter, activeStudyVerses[activeVerseIndex].verse)
                          ? "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-200"
                          : "border-stone-300 dark:border-stone-700 bg-transparent text-[#8b4513] dark:text-amber-300 hover:bg-stone-50 dark:hover:bg-amber-950/20"
                      }`}
                      title="Bookmark this verse"
                    >
                      <BookMarked className={`w-3.5 h-3.5 ${isBookmarked(activeStudyChapter, activeStudyVerses[activeVerseIndex].verse) ? "fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400" : ""}`} />
                      <span>{isBookmarked(activeStudyChapter, activeStudyVerses[activeVerseIndex].verse) ? "Bookmarked" : "Bookmark"}</span>
                    </button>
                    <button 
                      onClick={closeStudyPortal}
                      className="p-1 px-3 py-1.5 sm:px-3.5 rounded-full border border-amber-800 text-amber-950 dark:text-amber-200 bg-transparent hover:bg-amber-800 hover:text-white dark:hover:bg-amber-700 font-bold transition-all text-[10px] sm:text-xs cursor-pointer"
                    >
                      ✕ Exit
                    </button>
                  </div>
                </div>

                {/* Main Scrollable Wisdom Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 bg-white dark:bg-[#1b0f0a] scroll-smooth">
                  
                  {/* Active Shlok Devanagari Hero card */}
                  <div className="bg-white dark:bg-[#2c1b12]/40 rounded-2xl border border-[#e0d5c0] dark:border-amber-700/40 p-5 sm:p-8 text-center max-w-3xl mx-auto shadow-sm">
                    <div className="text-xl text-amber-600 dark:text-amber-400 mb-2">✨</div>
                    <p className="sanskrit-holy-text text-amber-900 dark:text-[#ffd700] whitespace-pre-line tracking-wider leading-relaxed">
                      {activeStudyVerses[activeVerseIndex].sanskrit}
                    </p>
                  </div>

                  {/* Transliteration Box */}
                  <div className="relative bg-white dark:bg-[#26160f] p-4 sm:p-6 pt-6 sm:pt-8 rounded-xl border border-[#deb887]/50 dark:border-amber-900/50 max-w-3xl mx-auto shadow-sm">
                    <span className="absolute -top-3 left-6 px-3 py-1 bg-amber-800 text-amber-100 rounded text-[10px] font-bold uppercase tracking-wider">
                      Transliteration
                    </span>
                    <p className="text-[#5d4037] dark:text-stone-300 italic text-sm sm:text-base leading-relaxed">
                      {activeStudyVerses[activeVerseIndex].transliteration}
                    </p>
                  </div>

                  {/* English Translation Box */}
                  <div className="relative bg-white dark:bg-[#26160f] p-4 sm:p-6 pt-6 sm:pt-8 rounded-xl border border-orange-950/20 dark:border-amber-900/50 max-w-3xl mx-auto shadow-sm animate-fade-in font-sans">
                    <span className="absolute -top-3 left-6 px-3 py-1 bg-amber-800 text-amber-100 rounded text-[10px] font-bold uppercase tracking-wider">
                      <Translate text="Translation" />
                    </span>
                    <p className="text-[#4a3628] dark:text-stone-100 text-sm sm:text-base md:text-lg font-medium leading-relaxed">
                      "<Translate text={activeStudyVerses[activeVerseIndex].translation} />"
                    </p>
                  </div>

                  {/* Detailed purports & commentary box */}
                  <div className="relative bg-white dark:bg-[#26160f] p-4 sm:p-6 pt-6 sm:pt-8 rounded-xl border border-amber-950/20 dark:border-amber-900/50 max-w-3xl mx-auto shadow-sm animate-fade-in font-sans">
                    <span className="absolute -top-3 left-6 px-3 py-1 bg-[#8b4513] text-[#ffd700] rounded text-[10px] font-bold uppercase tracking-wider">
                      <Translate text="Purport" /> & <Translate text="Commentary" />
                    </span>
                    <Translate 
                      html={true} 
                      text={activeStudyVerses[activeVerseIndex].purport} 
                      className="text-stone-800 dark:text-stone-200 text-xs sm:text-sm md:text-base leading-relaxed space-y-4" 
                      as="div" 
                    />
                  </div>

                </div>

                {/* Sticky Navigation Footer */}
                <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1b0f0a] flex items-center justify-between">
                  <button 
                    onClick={prevVerse}
                    disabled={activeVerseIndex === 0}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#8b4513] disabled:opacity-30 disabled:pointer-events-none text-[#ffd700] rounded-full font-bold text-[10px] sm:text-xs md:text-sm flex items-center gap-1 cursor-pointer hover:bg-[#5d4037]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <span id="verseCounter" className="font-serif font-black text-amber-900 dark:text-amber-200 text-xs sm:text-base md:text-lg">
                    Verse {activeStudyVerses[activeVerseIndex].verse || (activeVerseIndex + 1)} of {activeStudyVerses.length}
                  </span>

                  <button 
                    onClick={nextVerse}
                    disabled={activeVerseIndex === activeStudyVerses.length - 1}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#8b4513] disabled:opacity-30 disabled:pointer-events-none text-[#ffd700] rounded-full font-bold text-[10px] sm:text-xs md:text-sm flex items-center gap-1 cursor-pointer hover:bg-[#5d4037]"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* MAHABHARAT LEGENDS PORTAL OVERLAY */}
          {/* ================================================== */}
          {legendsPortalOpen && activeLegendIndex !== null && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
              <div className="w-full max-w-5xl h-[92vh] bg-white dark:bg-[#1b0f0a] rounded-2xl border-2 border-[#d4af37] overflow-hidden flex flex-col shadow-2xl relative">
                
                {/* Header */}
                <div className="p-4 bg-white dark:bg-[#26160f] border-b-2 border-[#deb887] dark:border-amber-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏹</span>
                    <h2 className="font-serif text-[#8b4513] dark:text-[#ffd700] font-bold text-base sm:text-lg">
                      Mahabharat — <Translate text="The Great Souls" />
                    </h2>
                  </div>
                  <button 
                    onClick={closeLegendsPortal}
                    className="p-1 px-4 rounded-full bg-[#8b4513] text-[#ffd700] font-bold text-xs cursor-pointer border-none hover:bg-stone-800 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    ✕ <Translate text="Close Portal" />
                  </button>
                </div>

                {/* Main Split Screen Area */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  
                  {/* Left Sidebar Menu */}
                  <div className="w-full md:w-[280px] bg-white dark:bg-[#26160f] border-b md:border-b-0 md:border-r border-[#deb887] dark:border-amber-800 overflow-x-auto md:overflow-y-auto p-4 flex flex-row md:flex-col gap-2 shrink-0">
                    {mahabharatLegends.map((legend, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveLegendIndex(index);
                        }}
                        className={`py-2 px-3 text-left rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap md:whitespace-normal cursor-pointer select-none transition-all border shrink-0 ${activeLegendIndex === index ? "bg-[#8b4513] text-white border-transparent" : "bg-white dark:bg-[#1b0f0a] border-stone-200 dark:border-amber-100 text-stone-800 dark:text-stone-300 hover:bg-amber-100"}`}
                      >
                        {index + 1}. <Translate text={legend.name} />
                      </button>
                    ))}
                  </div>

                  {/* Right Detail Panel */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white dark:bg-[#1b0f0a] flex flex-col items-center justify-start text-center">
                    
                    {/* Character avatar frame */}
                    <div className="flex flex-col items-center gap-3 mb-6">
                      <div className="inline-block p-1.5 border-2 border-[#deb887] dark:border-amber-700/60 rounded-2xl bg-white dark:bg-stone-900 shadow-sm w-36 h-36 overflow-hidden">
                        <LegendAvatar 
                          key={`${mahabharatLegends[activeLegendIndex].name}-${imageInsertCounter}`}
                          name={mahabharatLegends[activeLegendIndex].name}
                          className="w-full h-full rounded-xl"
                          imgClassName="w-full h-full object-cover rounded-xl shadow-inner"
                        />
                      </div>
                      
                      {/* Image Insertion Form */}
                      <div className="w-full max-w-xs flex flex-col gap-1 items-center">
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                          <Translate text="Portrait image override:" />
                        </div>
                        <div className="flex w-full gap-1">
                          <input 
                            type="text"
                            placeholder={translate("Paste custom image URL here...")}
                            id="custom-legend-img-input"
                            defaultValue={(() => {
                              try {
                                const saved = localStorage.getItem("gita_legend_images");
                                if (saved) {
                                  const parsed = JSON.parse(saved);
                                  const k = mahabharatLegends[activeLegendIndex].name.toLowerCase().replace(/[^a-z0-9]/g, "");
                                  return parsed[k] || "";
                                }
                              } catch {}
                              return "";
                            })()}
                            key={`input-${mahabharatLegends[activeLegendIndex].name}-${imageInsertCounter}`}
                            className="flex-grow text-[11px] px-2 py-1 bg-[#faf6ee] dark:bg-[#150d0a] border border-stone-250 dark:border-amber-955/30 rounded-lg text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.currentTarget as HTMLInputElement).value.trim();
                                saveCustomImage(mahabharatLegends[activeLegendIndex].name, val);
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const inputEl = e.currentTarget.previousElementSibling as HTMLInputElement;
                              if (inputEl) {
                                saveCustomImage(mahabharatLegends[activeLegendIndex].name, inputEl.value.trim());
                              }
                            }}
                            className="bg-amber-850 text-amber-200 hover:bg-amber-800 border border-amber-600/30 px-3 py-1 rounded-lg text-[11px] font-sans font-bold cursor-pointer transition-colors active:scale-95 whitespace-nowrap"
                          >
                            <Translate text="Set URL" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <h1 className="font-serif text-3xl font-bold text-[#8b4513] dark:text-[#ffd700] mb-2">
                      <Translate text={mahabharatLegends[activeLegendIndex].name} />
                    </h1>
                    <div className="h-[2px] w-24 bg-[#ffd700] mx-auto my-3" />

                    {/* Description with italic highlights */}
                    <Translate 
                      html={true}
                      text={mahabharatLegends[activeLegendIndex].desc}
                      className="text-stone-700 dark:text-stone-200 text-sm sm:text-base leading-relaxed text-justify max-w-2xl mx-auto pt-2 animate-fade-in font-sans"
                      as="div"
                    />
                  </div>

                </div>

                {/* Footer simple pagination */}
                <div className="p-4 bg-white dark:bg-[#26160f] border-t border-[#deb887] dark:border-amber-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (activeLegendIndex > 0) setActiveLegendIndex(activeLegendIndex - 1);
                    }}
                    disabled={activeLegendIndex === 0}
                    className="px-4 py-2 bg-amber-800 text-amber-200 rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    &larr; <Translate text="Prev" />
                  </button>
                  <span className="font-serif font-black text-xs text-amber-900 dark:text-stone-200">
                    {activeLegendIndex + 1} <Translate text="of" /> {mahabharatLegends.length}
                  </span>
                  <button
                    onClick={() => {
                      if (activeLegendIndex < mahabharatLegends.length - 1) setActiveLegendIndex(activeLegendIndex + 1);
                    }}
                    disabled={activeLegendIndex === mahabharatLegends.length - 1}
                    className="px-4 py-2 bg-amber-800 text-amber-200 rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Translate text="Next" /> &rarr;
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* LORD KRISHNA DIVINE AI COUNSEL CHATBOT */}
          {/* ================================================== */}
          <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            
            {/* Expanded Conversation Drawer */}
            {chatOpen && (
              <div className="w-[calc(100vw-2rem)] sm:w-[400px] h-[520px] max-h-[80vh] bg-[#fdfaf2] dark:bg-[#190e0a] border-2 border-[#d4af37] rounded-3xl shadow-3xl flex flex-col overflow-hidden mb-4 transition-all duration-300 animate-slide-up">
                
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-[#8b4513] to-[#5d3011] p-4 text-stone-100 flex items-center justify-between border-b border-[#d4af37]/40 shadow-sm shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl animate-pulse">👑</span>
                    <div>
                      <h4 className="font-serif font-black tracking-wide text-sm text-[#ffd700]">
                        <Translate text="DIVINE AI COUNSEL" />
                      </h4>
                      <p className="text-[10px] text-amber-200 opacity-90 font-medium">
                        <Translate text="Lord Sri Krishna's Guide" />
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setChatOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-amber-300 cursor-pointer"
                    title="Close Counsel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages Panel Panel */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[220px] text-center p-6 space-y-4">
                      <div className="w-14 h-14 rounded-full bg-amber-600/10 dark:bg-amber-400/10 flex items-center justify-center text-3xl">👑</div>
                      <h4 className="font-serif font-semibold text-stone-800 dark:text-amber-100 text-sm">
                        <Translate text="Divine Dialogue Initiate" />
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs leading-relaxed">
                        <Translate text="Welcome, O seeker. Reach past the boundaries of the mundane world. Ask Lord Krishna for guidance on confusion, duties, stress, or your path." />
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div 
                        key={index}
                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start animate-fade-in"}`}
                      >
                        <div 
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            msg.role === "user" 
                              ? "bg-amber-800 text-amber-50 rounded-br-none max-w-[85%] shadow-sm"
                              : "bg-white dark:bg-[#2c1b12]/50 text-stone-800 dark:text-stone-100 border border-amber-200/50 dark:border-amber-900/30 rounded-bl-none max-w-[85%] shadow-2xs whitespace-pre-line"
                          }`}
                        >
                          {msg.role === "user" ? msg.content : <Translate text={msg.content} />}
                        </div>
                        <span className="text-[9px] text-stone-400 dark:text-stone-500 mt-1 px-1 font-serif">
                          {msg.role === "user" ? <Translate text="You (Seeker)" /> : <Translate text="Lord Krishna" />}
                        </span>
                      </div>
                    ))
                  )}

                  {chatLoading && (
                    <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400 font-serif italic animate-pulse">
                      <span>👑</span>
                      <span>
                        <Translate text="The Lord is channeling divine consciousness..." />
                      </span>
                    </div>
                  )}
                </div>

                {/* Preset Suggestions Row */}
                <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/40 border-t border-stone-200/40 dark:border-stone-850 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2 shrink-0">
                  {[
                    "How do I control my overthinking?",
                    "I feel extremely stressed about my studies and career.",
                    "What advice is there for handling emotional pain?",
                    "Tell Me how to act when I feel demotivated."
                  ].map((pill, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessageToKrishna(pill)}
                      disabled={chatLoading}
                      className="px-3 py-1.5 bg-[#f5ebe0] hover:bg-amber-100 dark:bg-[#1b0f0a] dark:hover:bg-amber-950/20 text-[#8b4513] dark:text-amber-300 border border-amber-900/10 rounded-full text-[11px] font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                    >
                      <Translate text={pill} />
                    </button>
                  ))}
                </div>

                {/* Input Controls */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); sendMessageToKrishna(); }}
                  className="p-3 bg-white dark:bg-[#1c110a] border-t border-stone-100 dark:border-stone-850 flex gap-2 items-center shrink-0"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    placeholder={translate("Speak your mind, seeker...")}
                    className="flex-1 bg-stone-50 dark:bg-[#100906] border border-stone-200 dark:border-amber-955 rounded-full px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading}
                    className="p-2.5 bg-amber-800 hover:bg-amber-700 text-white rounded-full cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-md border-none"
                    title="Send to Krishna"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                  </button>
                </form>

              </div>
            )}

            {/* Glowing Saffron Floating Launcher Button */}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="bg-gradient-to-r from-[#ff4500] via-[#8b4513] to-[#ff8c00] hover:scale-105 active:scale-95 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full flex items-center gap-2 shadow-[0_4px_15px_rgba(255,140,0,0.4)] border border-[#ffd700]/30 hover:border-[#ffd700] transition-all cursor-pointer select-none group"
            >
              <Sparkles className="w-5 h-5 text-amber-200 animate-spin-slow" />
              <span className="font-serif font-black tracking-widest text-xs hidden sm:inline uppercase text-amber-100">
                {chatOpen ? <Translate text="Close Counsel" /> : <Translate text="Krishna AI Counsel" />}
              </span>
            </button>

          </div>
        </>
      )}

    </div>
  );
}
