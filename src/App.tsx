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

  // Portal Modals States
  const [studyPortalOpen, setStudyPortalOpen] = useState<boolean>(false);
  const [activeStudyChapter, setActiveStudyChapter] = useState<number>(1);
  const [activeStudyVerses, setActiveStudyVerses] = useState<Verse[]>([]);
  const [activeVerseIndex, setActiveVerseIndex] = useState<number>(0);

  // Legends Portal State
  const [legendsPortalOpen, setLegendsPortalOpen] = useState<boolean>(false);
  const [activeLegendIndex, setActiveLegendIndex] = useState<number | null>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Accordion active FAQ index
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Verse of the Day state
  const [dailyVerse, setDailyVerse] = useState<Verse | null>(null);

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
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Dynamically load Google Translate Script
  useEffect(() => {
    const handleGoogleTranslateInit = () => {
      const w = window as any;
      if (w.google && w.google.translate) {
        new w.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'hi,en,sa,mr,gu,ta,te,kn,ml,es,fr,de',
          layout: w.google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
      }
    };

    if (!(window as any).googleTranslateElementInit) {
      (window as any).googleTranslateElementInit = handleGoogleTranslateInit;
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.type = "text/javascript";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    } else {
      handleGoogleTranslateInit();
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
    <div className={`min-h-screen font-sans antialiased text-gray-900 transition-colors duration-300 ${darkMode ? "dark bg-[#1b0f0a] text-stone-100" : "bg-[#fcf9f2] text-[#4a3628]"}`}>
      
      {/* 1. AUTHENTICATION MODULE */}
      {!showMainSite && (
        <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-12" id="auth-main">
          {/* Parallax Battlefield Atmosphere behind */}
          <div className="absolute inset-0 bg-cover bg-center brightness-[0.25] transition-transform duration-[20s] hover:scale-105" 
               style={{ backgroundImage: `url('https://images.unsplash.com/photo-1599733589046-9b8308b5b50d?auto=format&fit=crop&w=1500&q=80')` }} />
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
                      placeholder="Your Email" 
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
                      placeholder="Secret Password" 
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

                {/* Live Google Translate Element */}
                <div id="google_translate_element" className="hidden lg:block bg-stone-100 dark:bg-[#2c1b12]/60 px-2 py-1 rounded-md border border-amber-900/10 dark:border-amber-500/20 text-xs"></div>
              </div>

              {/* Centered Brand Title */}
              <div 
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="absolute left-1/2 transform -translate-x-1/2 font-serif font-black text-[#8b4513] dark:text-[#ffd700] md:text-2xl text-xl tracking-[3px] select-none cursor-pointer hover:opacity-90"
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
                  style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.7)), url('images/battlefield.jpg')` }}>
            <div className="max-w-4xl mx-auto space-y-6 px-4 z-10">
              <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-[#ffd700] drop-shadow-lg leading-tight uppercase tracking-wide">
                Shrimad Bhagavad Gita
              </h1>
              <h2 className="text-stone-300 text-lg sm:text-2xl md:text-3xl font-light tracking-[4px] uppercase select-none">
                The Divine Song of God
              </h2>
              <div className="h-[3px] w-[180px] bg-[#ffd700] mx-auto rounded-full shadow-lg" />
              <p className="text-stone-100 text-sm sm:text-lg leading-relaxed max-w-3xl mx-auto drop-shadow-md">
                The Bhagavad Gita is a 700-verse Hindu scripture that is part of the epic Mahabharata. 
                Set on the battlefield of Kurukshetra, it captures the timeless dialogue between 
                Prince Arjuna and Lord Krishna, offering profound wisdom on duty, righteousness (Dharma), 
                and the path to self-realization.
              </p>
              
              <div className="pt-6">
                <button 
                  onClick={() => {
                    const el = document.getElementById("chapters-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-8 py-4 bg-[#ffd700] text-stone-900 border-none rounded-full font-bold text-base cursor-pointer shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all"
                >
                  Begin the Journey &rarr;
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
            <div className="bg-white dark:bg-[#26160f] rounded-3xl border-3 border-[#b8860b] p-8 md:p-12 shadow-2xl relative transition-all duration-300 hover:shadow-orange-950/5 hover:border-amber-400">
              
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-[#8b4513] to-[#b8860b] text-[#ffd700] px-8 py-2.5 rounded-full font-serif text-sm font-bold uppercase tracking-widest shadow-md">
                  Verse Of The Day
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
                    "{dailyVerse.translation}"
                  </p>
                  
                  <div className="border-t border-gray-100 dark:border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="font-bold text-amber-800 dark:text-amber-400 tracking-wider">
                      Bhagavad Gita {dailyVerse.chapter}.{dailyVerse.verse}
                    </span>
                    <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase tracking-wider">
                      Tap to read full purport & commentary &rarr;
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-stone-500 py-8">Fetching dynamic verses...</p>
              )}
            </div>
          </section>

          {/* DIVINE AUTHORS SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="author-section">
            <h2 className="font-serif text-3xl sm:text-5xl text-center text-[#8b4513] dark:text-[#ffd700] uppercase tracking-wide">
              The Divine Authors
            </h2>
            <div className="h-[2px] w-36 bg-[#deb887] mx-auto my-4 mb-12" />

            {/* Main illustration placeholder box */}
            <div className="flex justify-center mb-12">
              <div className="p-4 bg-white dark:bg-[#26160f] border-2 border-[#deb887] dark:border-amber-700 rounded-2xl shadow-md overflow-hidden max-w-lg">
                <img 
                  src="images/authors.jpg" 
                  alt="Ancient Sacred Art Representing Divine Dictation" 
                  className="w-full h-auto max-h-[300px] object-cover rounded-xl grayscale-[20%] hover:grayscale-0 transition-all"
                  referrerPolicy="no-referrer"
                />
                <p className="text-center font-serif italic text-xs text-amber-800/80 dark:text-stone-400 mt-3">
                  Dictation of Mahabharata: Maharishi Ved Vyasa communicating the epic to Lord Ganesha
                </p>
              </div>
            </div>

            {/* Dual Authors Vertical Flex Card */}
            <div className="flex flex-col items-center gap-8">
              
              {/* Vyasa Card */}
              <div className="bg-white dark:bg-[#26160f] border-3 border-[#deb887] dark:border-amber-700 p-8 rounded-2xl shadow-lg w-full max-w-[850px] hover:border-amber-500 transition-all duration-300">
                <div className="text-center space-y-4">
                  <h3 className="font-serif text-2xl text-stone-800 dark:text-amber-200">Maharishi Ved Vyasa</h3>
                  <span className="inline-block text-xs uppercase text-[#8b4513] dark:text-amber-400 font-bold border-b-2 border-amber-400 pb-1">
                    The Compiler
                  </span>
                  <p className="text-justify leading-relaxed text-gray-700 dark:text-stone-300 text-sm sm:text-base">
                    Maharishi Ved Vyasa, born as <span className="text-amber-700 dark:text-amber-400 font-semibold">Krishna Dvaipayana</span>, 
                    was the son of Sage <span className="text-amber-700 dark:text-amber-400 font-semibold">Parashara</span> and 
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">Satyavati</span>. He is regarded as a 
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">Chiranjivi</span> (immortal) and the architect of Vedic knowledge. 
                    He classified the original Vedas into four and authored the cosmic Mahabharata. 
                    Uniquely, he was both the <span className="text-amber-700 dark:text-amber-400 font-semibold">grandfather</span> of the Pandavas and Kauravas 
                    and the narrator of their fateful lives. He granted the <span className="text-amber-700 dark:text-amber-400 font-semibold">divine vision</span> (divya-drishti) to Sanjaya.
                  </p>
                </div>
              </div>

              {/* Ganesha Card */}
              <div className="bg-white dark:bg-[#26160f] border-3 border-[#deb887] dark:border-amber-700 p-8 rounded-2xl shadow-lg w-full max-w-[850px] hover:border-amber-500 transition-all duration-300">
                <div className="text-center space-y-4">
                  <h3 className="font-serif text-2xl text-stone-800 dark:text-amber-200">Lord Ganesha</h3>
                  <span className="inline-block text-xs uppercase text-[#8b4513] dark:text-amber-400 font-bold border-b-2 border-amber-400 pb-1">
                    The Divine Scribe
                  </span>
                  <p className="text-justify leading-relaxed text-gray-700 dark:text-stone-300 text-sm sm:text-base">
                    Lord Ganesha, the son of <span className="text-amber-700 dark:text-amber-400 font-semibold">Lord Shiva</span> and 
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">Goddess Parvati</span>, is revered as the 
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">Vighnaharta</span> (remover of obstacles) and the patron of 
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">intellect and wisdom</span>. When Sage Ved Vyasa conceived the vast epic, 
                    he required a scribe capable of matching his conceptual depth. Lord Ganesha accepted on the condition that Vyasa would not pause the dictation. 
                    To maintain this pace, Ganesha broke his own <span className="text-amber-700 dark:text-amber-400 font-semibold">tusk</span> to use as a style, 
                    symbolizing sacrifice for sacred knowledge.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* BENEFIT SECTION: WHO IS THE GITA FOR? */}
          <section className="max-w-[1250px] mx-auto my-24 px-4 overflow-hidden" id="benefit-section">
            <h2 className="font-serif text-3xl sm:text-5xl text-center text-[#8b4513] dark:text-[#ffd700] uppercase tracking-wide">
              Who is the Gita For?
            </h2>
            <p className="text-center text-stone-600 dark:text-stone-300 italic text-sm sm:text-base mt-2 mb-8">
              A universal manual providing 5,000 years of wisdom for modern challenges.
            </p>

            {/* Swipeable Scroll container with custom cards */}
            <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-2 snap-x scrollbar-none scroll-smooth">
              {benefitCards.map((card, idx) => (
                <div 
                  key={idx}
                  className="bg-white dark:bg-[#26160f] w-[290px] shrink-0 border-2 border-[#deb887] dark:border-amber-700 p-6 rounded-2xl shadow-md hover:border-amber-500 hover:-translate-y-2 select-none snap-center transition-all duration-300 flex flex-col items-center justify-between text-center aspect-square"
                >
                  <div className="text-4xl mb-2">{card.icon}</div>
                  <h4 className="font-serif text-amber-900 dark:text-amber-200 text-lg font-bold">{card.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-stone-300 leading-relaxed max-w-[240px]">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Guide hint */}
            <div className="text-center text-xs text-amber-800/80 dark:text-stone-400/80 animate-pulse">
              &larr; Drag or scroll horizontally to see all profiles &rarr;
            </div>
          </section>

          {/* GLOBAL TRIBUTES SECTION */}
          <section className="max-w-[1250px] mx-auto my-24 px-4" id="global-section">
            <h2 className="font-serif text-3xl sm:text-5xl text-center text-[#8b4513] dark:text-[#ffd700] uppercase tracking-wide">
              Gita Around the World
            </h2>
            <p className="text-center text-stone-600 dark:text-stone-400 mt-2 mb-12 italic text-sm">
              How the world's greatest minds found inspiration in the Divine Song.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tributeCards.map((card, idx) => (
                <div 
                  key={idx}
                  className="bg-white dark:bg-[#26160f] p-8 rounded-2xl border-2 border-[#deb887] dark:border-amber-800 shadow-md flex flex-col justify-between hover:border-amber-500 transition-all duration-300"
                >
                  <p className="text-sm italic text-[#5d4037] dark:text-stone-200 leading-relaxed mb-6">
                    {card.quote}
                  </p>
                  <div className="border-t border-amber-900/10 dark:border-amber-500/10 pt-4 flex flex-col">
                    <span className="font-serif text-amber-900 dark:text-amber-200 font-bold text-base">{card.name}</span>
                    <span className="text-xs text-amber-700/80 dark:text-amber-400/80 uppercase font-semibold tracking-wider">{card.profession}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* LEGENDS OF MAHABHARAT DISPATCHER */}
          <section className="max-w-[1150px] mx-auto my-24 px-4 text-center" id="legends-section">
            <div className="bg-amber-100/40 dark:bg-[#26160f] rounded-3xl border-3 border-[#b8860b] p-10 md:p-14 shadow-xl space-y-6">
              <span className="inline-block px-4 py-1.5 bg-amber-800 text-stone-100 rounded-full font-serif text-xs uppercase tracking-widest font-bold">
                Chronicles of Dharma
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                Legends of Mahabharat
              </h2>
              <p className="text-gray-700 dark:text-stone-200 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
                Explore the profiles, origins, and critical roles of the 20 legendary souls who shaped the battle of Kurukshetra. Meet friends, foes, sages, and warriors under the divine guidance of Lord Krishna.
              </p>
              
              <div className="pt-4">
                <button 
                  onClick={() => {
                    setLegendsPortalOpen(true);
                    setActiveLegendIndex(0);
                    document.body.style.overflow = "hidden";
                  }}
                  className="px-8 py-3.5 bg-amber-800 text-amber-200 dark:bg-amber-700 hover:bg-[#8b4513] font-bold rounded-full cursor-pointer shadow-md transition-all uppercase tracking-widest text-sm"
                >
                  Enter the Legends Portal &rarr;
                </button>
              </div>
            </div>
          </section>

          {/* CHAPTERS OF THE GITA SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="chapters-section">
            <h2 className="font-serif text-3xl sm:text-5xl text-center text-[#8b4513] dark:text-[#ffd700] uppercase tracking-wide">
              The 18 Spiritual Chapters
            </h2>
            <p className="text-center text-[#a47148] dark:text-amber-400 mt-2 italic text-sm sm:text-base mb-8">
              Explore the 700 verses of divine conversation
            </p>

            {/* Direct verse finder search input */}
            <form onSubmit={handleDirectSearch} className="max-w-md mx-auto mb-12 flex gap-2 items-center justify-center bg-[#deb887]/20 dark:bg-amber-950/20 p-3 rounded-full border border-[#deb887]/40 dark:border-amber-700/40">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-amber-700 dark:text-amber-400" />
                <input 
                  type="text" 
                  placeholder="Seach chapter.verse (e.g. 2.47)" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#1b0f0a] pl-9 pr-4 py-2 border border-amber-900/10 rounded-full focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                />
              </div>
              <button 
                type="submit"
                className="px-5 py-2 bg-[#8b4513] hover:bg-[#5d4037] text-white hover:text-amber-200 font-bold rounded-full text-xs cursor-pointer transition-colors"
              >
                Study
              </button>
            </form>

            {/* Chapters list grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gitaChapters.map((chap) => (
                <div 
                  key={chap.num}
                  onClick={() => openChapterForStudy(chap.num)}
                  className="chapter-box bg-white dark:bg-[#26160f] border-2 border-[#deb887] dark:border-amber-800 p-6 rounded-2xl cursor-pointer hover:bg-[#8b4513] dark:hover:bg-amber-900 hover:border-[#ffd700] hover:scale-[1.02] group transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8b4513] dark:bg-amber-700 group-hover:bg-[#ffd700]" />
                  <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 group-hover:text-amber-300 font-semibold">
                    <span>CHAPTER {chap.num}</span>
                    <span>{chap.verses} VERSES</span>
                  </div>
                  <h3 className="font-serif text-lg text-[#8b4513] dark:text-[#ffd700] group-hover:text-white mt-3 font-extrabold">
                    {chap.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-stone-300 group-hover:text-stone-200 italic mt-1 font-medium">
                    {chap.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ESSENTIAL PIVOTAL VERSES SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="verses-section">
            <h2 className="font-serif text-3xl sm:text-5xl text-center text-[#8b4513] dark:text-[#ffd700] uppercase tracking-wide">
              Essential Verses
            </h2>
            <p className="text-center text-stone-500 dark:text-stone-400 mt-2 mb-12 italic text-sm">
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
                  className="bg-white dark:bg-[#26160f] rounded-2xl border-2 border-[#deb887] dark:border-amber-800 p-6 flex flex-col justify-between hover:border-amber-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-sm group"
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
          </section>

          {/* GITA IN DAILY LIFE SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="daily-section">
            <h2 className="font-serif text-3xl sm:text-5xl text-center text-[#8b4513] dark:text-[#ffd700] uppercase tracking-wide">
              Gita in Daily Life
            </h2>
            <p className="text-center text-stone-500 dark:text-stone-400 mt-2 mb-12 italic text-sm">
              Practical applications of ancient Vedic guidelines for modern scenarios.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "🧠", ref: "BG 6.5", shlok: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत् |", title: "Mastering the Mind", desc: "Uplift yourself through the power of your own mind; do not allow yourself to degrade." },
                { icon: "🌍", ref: "BG 5.18", shlok: "विद्याविनयसम्पन्ने ब्राह्मणे गवि हस्तिनि |", title: "Universal Compassion", desc: "The wise see with equal, non-judgmental vision a learned scholar, a cow, or an elephant." },
                { icon: "⚖️", ref: "BG 6.17", shlok: "युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु |", title: "Healthy & Balanced Living", desc: "Yoga destroys all pain for the one who maintains balance in eating, sleeping, and working." }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-white dark:bg-[#26160f] p-6 rounded-2xl border border-[#deb887] dark:border-amber-800 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-xs text-orange-900/60 dark:text-amber-400 tracking-wider font-semibold">{item.ref}</span>
                    </div>
                    <p className="font-devanagari text-sm font-semibold text-amber-700/80 dark:text-amber-300/80">{item.shlok}</p>
                    <h4 className="font-serif text-base font-bold text-amber-900 dark:text-amber-100">{item.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-stone-300 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AUDIO PODCASTS SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="podcast-section">
            <h2 className="font-serif text-3xl sm:text-5xl text-center text-[#8b4513] dark:text-[#ffd700] uppercase tracking-wide">
              Podcasts
            </h2>
            <p className="text-center text-stone-500 dark:text-stone-400 mt-2 mb-12 italic text-sm">
              Modern dialogues on ancient wisdom from world-renowned speakers and commentators.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {podcastCards.map((p, idx) => (
                <a 
                  key={idx}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white dark:bg-[#26160f] p-6 rounded-2xl border-2 border-stone-200 dark:border-amber-800 shadow-sm hover:border-[#ff0000] hover:scale-[1.03] transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded">YouTube</span>
                      <PlayCircle className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="font-serif text-sm text-[#8b4513] dark:text-[#ffd700] font-bold">{p.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-stone-300 line-clamp-3 leading-relaxed">
                      {p.title}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-widest pt-2 border-t border-stone-100 dark:border-amber-950 flex items-center gap-1">
                    Watch Video <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* SACRED LITERATURE/BOOKS SECTION */}
          <section className="max-w-[1150px] mx-auto my-24 px-4" id="books-section">
            <h2 className="font-serif text-3xl sm:text-5xl text-center text-[#8b4513] dark:text-[#ffd700] uppercase tracking-wide">
              Sacred Literature
            </h2>
            <p className="text-center text-stone-500 dark:text-stone-400 mt-2 mb-12 italic text-sm">
              Deepen your search with world-renowned commentaries and translations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookCards.map((b, idx) => (
                <div 
                  key={idx}
                  className="bg-white dark:bg-[#26160f] p-6 rounded-2xl border-2 border-[#deb887] dark:border-amber-800 flex gap-4 items-start shadow-xs hover:shadow-md transition-all duration-300"
                >
                  <div className="text-4xl px-4 py-6 bg-stone-100 dark:bg-stone-900 rounded-xl border-l-[6px] border-[#8b4513] shadow-inner select-none flex items-center justify-center shrink-0">
                    {b.cover}
                  </div>
                  <div className="space-y-2 flex-1">
                    <span className="text-[10px] tracking-wider uppercase text-amber-800 dark:text-amber-400 font-bold">{b.author}</span>
                    <h3 className="font-serif text-base text-[#8b4513] dark:text-[#ffd700] font-extrabold">{b.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-stone-300 leading-relaxed">
                      {b.desc}
                    </p>
                    <a 
                      href={b.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block pt-2 text-xs font-bold text-amber-800 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>Purchase Book</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FREQUENTLY ASKED QUESTIONS SECTION */}
          <section className="max-w-[850px] mx-auto my-24 px-4" id="faq-section">
            <h2 className="font-serif text-3xl sm:text-5xl text-center text-[#8b4513] dark:text-[#ffd700] uppercase tracking-wide">
              Frequently Asked Questions
            </h2>
            <p className="text-center text-stone-500 dark:text-stone-400 mt-2 mb-12 italic text-sm">
              Clearing common doubts and inquiries about the Shrimad Bhagavad Gita.
            </p>

            <div className="space-y-4">
              {faqItems.map((faq, idx) => (
                <div 
                  key={idx}
                  className="border border-[#deb887] dark:border-amber-800 rounded-xl overflow-hidden shadow-sm"
                >
                  <button 
                    onClick={() => setActiveFaqIndex(activeFaqIndex === idx ? null : idx)}
                    className="w-full text-left p-5 bg-[#fffdfa] dark:bg-[#26160f] flex justify-between items-center font-bold text-[#8b4513] dark:text-amber-300 font-serif focus:outline-none cursor-pointer hover:bg-stone-50"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-amber-600 dark:text-amber-400 transition-transform duration-250 ${activeFaqIndex === idx ? "rotate-180" : ""}`} />
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ${activeFaqIndex === idx ? "max-h-[300px]" : "max-h-0"}`}>
                    <div className="p-5 bg-white dark:bg-[#1b0f0a] border-t border-amber-900/5 text-gray-700 dark:text-stone-300 text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
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
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
              <div className="w-full max-w-4xl h-[90vh] bg-white dark:bg-[#1b0f0a] rounded-2xl border-2 border-[#d4af37] dark:border-amber-400 overflow-hidden flex flex-col shadow-2xl relative">
                
                {/* Header with escape actions */}
                <div className="p-5 border-b border-stone-200 dark:border-stone-800 bg-[#fffdf5] dark:bg-[#2c1b12]/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-amber-100 dark:bg-amber-950 rounded-lg">
                      <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                    </span>
                    <h2 className="font-serif text-lg font-bold text-amber-900 dark:text-amber-200">
                      Gita Study Center — Chapter {activeStudyChapter}
                    </h2>
                  </div>
                  <button 
                    onClick={closeStudyPortal}
                    className="p-1 px-3 rounded-full border border-amber-800 text-amber-950 dark:text-amber-200 bg-transparent hover:bg-amber-800 hover:text-white dark:hover:bg-amber-700 font-bold transition-all text-xs cursor-pointer"
                  >
                    ✕ Exit Study
                  </button>
                </div>

                {/* Main Scrollable Wisdom Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#fdfaf0] dark:bg-[#1b0f0a] scroll-smooth">
                  
                  {/* Active Shlok Devanagari Hero card */}
                  <div className="bg-[#fffdf5] dark:bg-[#2c1b12]/40 rounded-2xl border border-[#e0d5c0] dark:border-amber-700/40 p-8 text-center max-w-3xl mx-auto shadow-sm">
                    <div className="text-xl text-amber-600 dark:text-amber-400 mb-2">✨</div>
                    <p className="sanskrit-holy-text text-amber-900 dark:text-[#ffd700] text-3xl font-extrabold whitespace-pre-line tracking-wider leading-relaxed">
                      {activeStudyVerses[activeVerseIndex].sanskrit}
                    </p>
                  </div>

                  {/* Transliteration Box */}
                  <div className="relative bg-white dark:bg-[#26160f] p-6 pt-8 rounded-xl border border-[#deb887]/50 dark:border-amber-900/50 max-w-3xl mx-auto shadow-sm">
                    <span className="absolute -top-3 left-6 px-3 py-1 bg-amber-800 text-amber-100 rounded text-[10px] font-bold uppercase tracking-wider">
                      Transliteration
                    </span>
                    <p className="text-[#5d4037] dark:text-stone-300 italic text-base leading-relaxed">
                      {activeStudyVerses[activeVerseIndex].transliteration}
                    </p>
                  </div>

                  {/* English Translation Box */}
                  <div className="relative bg-white dark:bg-[#26160f] p-6 pt-8 rounded-xl border border-orange-950/20 dark:border-amber-900/50 max-w-3xl mx-auto shadow-sm">
                    <span className="absolute -top-3 left-6 px-3 py-1 bg-amber-800 text-amber-100 rounded text-[10px] font-bold uppercase tracking-wider">
                      English Translation
                    </span>
                    <p className="text-[#4a3628] dark:text-stone-100 text-base sm:text-lg font-medium leading-relaxed">
                      "{activeStudyVerses[activeVerseIndex].translation}"
                    </p>
                  </div>

                  {/* Detailed purports & commentary box */}
                  <div className="relative bg-white dark:bg-[#26160f] p-6 pt-8 rounded-xl border border-amber-950/20 dark:border-amber-900/50 max-w-3xl mx-auto shadow-sm">
                    <span className="absolute -top-3 left-6 px-3 py-1 bg-[#8b4513] text-[#ffd700] rounded text-[10px] font-bold uppercase tracking-wider">
                      Purport & Commentary Of Jyoti Pandey
                    </span>
                    <div 
                      className="text-stone-800 dark:text-stone-200 text-sm sm:text-base leading-relaxed space-y-4"
                      dangerouslySetInnerHTML={{ __html: activeStudyVerses[activeVerseIndex].purport }}
                    />
                  </div>

                </div>

                {/* Sticky Navigation Footer */}
                <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1b0f0a] flex items-center justify-between">
                  <button 
                    onClick={prevVerse}
                    disabled={activeVerseIndex === 0}
                    className="px-4 py-2 bg-[#8b4513] disabled:opacity-30 disabled:pointer-events-none text-[#ffd700] rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer hover:bg-[#5d4037]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span id="verseCounter" className="font-serif font-black text-amber-900 dark:text-amber-200 text-base sm:text-lg">
                    Verse {activeStudyVerses[activeVerseIndex].verse || (activeVerseIndex + 1)} of {activeStudyVerses.length}
                  </span>

                  <button 
                    onClick={nextVerse}
                    disabled={activeVerseIndex === activeStudyVerses.length - 1}
                    className="px-4 py-2 bg-[#8b4513] disabled:opacity-30 disabled:pointer-events-none text-[#ffd700] rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer hover:bg-[#5d4037]"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
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
              <div className="w-full max-w-5xl h-[92vh] bg-[#fffcf5] dark:bg-[#1b0f0a] rounded-2xl border-2 border-[#d4af37] overflow-hidden flex flex-col shadow-2xl relative">
                
                {/* Header */}
                <div className="p-4 bg-[#fff9e6] dark:bg-[#26160f] border-b-2 border-[#deb887] dark:border-amber-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏹</span>
                    <h2 className="font-serif text-[#8b4513] dark:text-[#ffd700] font-bold text-base sm:text-lg">
                      Mahabharat — The Great Souls
                    </h2>
                  </div>
                  <button 
                    onClick={closeLegendsPortal}
                    className="p-1 px-4 rounded-full bg-[#8b4513] text-[#ffd700] font-bold text-xs cursor-pointer border-none hover:bg-stone-800 transition-all active:scale-95"
                  >
                    ✕ Close Portal
                  </button>
                </div>

                {/* Main Split Screen Area */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  
                  {/* Left Sidebar Menu */}
                  <div className="w-full md:w-[280px] bg-[#fdf5e6] dark:bg-[#26160f] border-b md:border-b-0 md:border-r border-[#deb887] dark:border-amber-800 overflow-y-auto p-4 flex flex-row md:flex-col gap-2 shrink-0">
                    {mahabharatLegends.map((legend, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveLegendIndex(index);
                        }}
                        className={`py-2 px-3 text-left rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap md:whitespace-normal cursor-pointer select-none transition-all border shrink-0 ${activeLegendIndex === index ? "bg-[#8b4513] text-white border-transparent" : "bg-white dark:bg-[#1b0f0a] border-stone-200 dark:border-amber-950 text-stone-800 dark:text-stone-300 hover:bg-amber-100"}`}
                      >
                        {index + 1}. {legend.name}
                      </button>
                    ))}
                  </div>

                  {/* Right Detail Panel */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white dark:bg-[#1b0f0a] flex flex-col items-center justify-start text-center">
                    
                    {/* Character avatar frame */}
                    <div className="inline-block p-1.5 border-2 border-[#deb887] dark:border-amber-700/60 rounded-2xl bg-[#fffcf5] dark:bg-stone-900 shadow-sm max-w-[280px] mb-6">
                      <img 
                        src={mahabharatLegends[activeLegendIndex].img || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80"}
                        alt={mahabharatLegends[activeLegendIndex].name}
                        className="w-full h-auto max-h-[220px] object-cover rounded-xl shadow-inner"
                        onError={(e) => {
                          // Fallback to high-quality abstract spiritual background if fails
                          e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80";
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <h1 className="font-serif text-3xl font-bold text-[#8b4513] dark:text-[#ffd700] mb-2">
                      {mahabharatLegends[activeLegendIndex].name}
                    </h1>
                    <div className="h-[2px] w-24 bg-[#ffd700] mx-auto my-3" />

                    {/* Description with italic highlights */}
                    <p 
                      className="text-stone-700 dark:text-stone-200 text-sm sm:text-base leading-relaxed text-justify max-w-2xl mx-auto pt-2"
                      dangerouslySetInnerHTML={{ __html: mahabharatLegends[activeLegendIndex].desc }}
                    />
                  </div>

                </div>

                {/* Footer simple pagination */}
                <div className="p-4 bg-[#fff9e6] dark:bg-[#26160f] border-t border-[#deb887] dark:border-amber-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (activeLegendIndex > 0) setActiveLegendIndex(activeLegendIndex - 1);
                    }}
                    disabled={activeLegendIndex === 0}
                    className="px-4 py-2 bg-amber-800 text-amber-200 rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    &larr; Prev
                  </button>
                  <span className="font-serif font-black text-xs text-amber-900 dark:text-stone-200">
                    {activeLegendIndex + 1} of {mahabharatLegends.length}
                  </span>
                  <button
                    onClick={() => {
                      if (activeLegendIndex < mahabharatLegends.length - 1) setActiveLegendIndex(activeLegendIndex + 1);
                    }}
                    disabled={activeLegendIndex === mahabharatLegends.length - 1}
                    className="px-4 py-2 bg-amber-800 text-amber-200 rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                </div>

              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
