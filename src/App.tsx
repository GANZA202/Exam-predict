/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { analyzeExamPaper, AnalysisResult } from './services/gemini';
import { FileUpload } from './components/FileUpload';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { ExamHistory } from './components/ExamHistory';
import { Brain, LogIn, LogOut, Sparkles, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * THIS IS THE MAIN APP COMPONENT
 * Think of this as the "Manager" of the whole screen. It decides what to show
 * based on whether you're logged in, if a paper is being analyzed, etc.
 */
export default function App() {
  // STATE: Variable that React "watches" for changes to update the UI
  const [user, setUser] = useState<User | null>(null);          // Who is logged in?
  const [isAuthReady, setIsAuthReady] = useState(false);        // Have we checked the login status yet?
  const [isAnalyzing, setIsAnalyzing] = useState(false);        // Are we currently processing?
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null); // The analysis result
  const [history, setHistory] = useState<any[]>([]);            // List of old uploads from database
  const [error, setError] = useState<string | null>(null);      // Any error message to show
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // STEP 0: Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // STEP 1: Check if the user is already logged in when the app starts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true); // Now we know if we're logged in or not
    });
    return () => unsubscribe();
  }, []);

  // STEP 2: Listen to the Database (Firestore) whenever the user changes
  // This updates our list of historical uploads in real-time.
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'exams'),
        where('userId', '==', user.uid),
        orderBy('uploadDate', 'desc')
      );
      // "onSnapshot" is like a walkie-talkie—it stays open and tells us when data changes
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHistory(items);
      }, (err) => {
        console.error("Database connection lost:", err);
      });
      return () => unsubscribe();
    } else {
      setHistory([]);
    }
  }, [user]);

  // LOGIN: Opens the Google popup
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("Failed to sign in. Check your internet connection.");
    }
  };

  const handleLogout = () => signOut(auth);

  // HELPER: Converts a raw computer file into a Base64 string that the AI can read
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // MAIN MAGIC: This handles the upload and analysis
  const handleFileSelect = async (files: File[]) => {
    if (!user) {
      setError("Please sign in to analyze papers.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCurrentResult(null);

    // Block analysis if offline
    if (!isOnline) {
      setError("You are offline. Analysis requires an internet connection.");
      setIsAnalyzing(false);
      return;
    }

    try {
      // 1. Check file sizes (Limit is 15MB total)
      const MAX_TOTAL_SIZE = 15 * 1024 * 1024; 
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        throw new Error("Total size is too big! Try fewer or smaller files.");
      }

      // 2. Prepare the files
      const fileData = await Promise.all(files.map(async (file) => ({
        base64: await fileToBase64(file),
        mimeType: file.type || 'application/pdf'
      })));

      // 3. Process and wait for the prediction
      const result = await analyzeExamPaper(fileData);
      setCurrentResult(result);

      // 4. Save a copy of the results to the database so we can see it later
      await addDoc(collection(db, 'exams'), {
        userId: user.uid,
        fileName: files.map(f => f.name).join(', '),
        subject: result.subject,
        uploadDate: Timestamp.now(),
        result: result
      });

    } catch (err: any) {
      console.error("Analysis hit a snag:", err);
      setError(err.message || "Something went wrong while reading the papers.");
    } finally {
      setIsAnalyzing(false); // Done analyzing
    }
  };

  // SHOW LOADING SCREEN until we know if the user is logged in
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-10 h-10 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // RENDER: This describes the actual look of the page
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      {/* HEADER SECTION */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        {!isOnline && (
          <div className="bg-zinc-900 text-white text-[10px] py-1 text-center font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <WifiOff className="w-3 h-3" />
            Offline Mode: You can view history, but analysis is disabled
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-zinc-900">ExamPredict</span>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-zinc-900">{user.displayName}</p>
                <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-red-500 transition-colors">Sign Out</button>
              </div>
              <img 
                src={user.photoURL || ''} 
                className="w-8 h-8 rounded-full border border-zinc-200"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-all shadow-sm"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT SPACE */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {!user ? (
          // WELCOME VIEW for visitors
          <div className="text-center py-20 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-6xl font-black text-zinc-900 leading-tight">
                Stop Guessing. <br />
                <span className="text-zinc-400">Start Predicting.</span>
              </h1>
              <p className="text-xl text-zinc-600 max-w-2xl mx-auto mt-6">
                Upload your past papers. Our system identifies patterns and tells you
                exactly what topics to focus on for your next exam.
              </p>
              <button 
                onClick={handleLogin}
                className="mt-10 bg-zinc-900 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl hover:scale-105 transition-all"
              >
                Join Now for Free
              </button>
            </motion.div>
          </div>
        ) : (
          // APP VIEW for logged-in users
          <div className="space-y-12">
            <section className="text-center space-y-6">
              <h2 className="text-4xl font-bold text-zinc-900">Analyze New Paper</h2>
              <p className="text-zinc-500">Upload multiple years of papers to get better probability scores.</p>
              <FileUpload onFilesSelect={handleFileSelect} isAnalyzing={isAnalyzing} isOnline={isOnline} />
            </section>

            {/* ERROR DISPLAY */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 max-w-2xl mx-auto"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RESULTS DASHBOARD */}
            <AnimatePresence mode="wait">
              {currentResult && (
                <motion.section key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-8 border-b pb-4">
                    <h2 className="text-3xl font-bold text-zinc-900">Analysis Result</h2>
                    <button onClick={() => setCurrentResult(null)} className="text-zinc-400 hover:text-zinc-900">Close</button>
                  </div>
                  <AnalysisDashboard result={currentResult} />
                </motion.section>
              )}
            </AnimatePresence>

            {/* PREVIOUS UPLOADS */}
            {!currentResult && !isAnalyzing && (
              <div className="pt-12 border-t">
                <ExamHistory history={history} onSelect={(item) => setCurrentResult(item.result)} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-zinc-200 py-16 text-center">
        <p className="text-zinc-400 text-sm italic">"Don't work harder, work smarter."</p>
        <p className="text-zinc-300 text-xs mt-4 uppercase tracking-widest font-bold">ExamPredict System 2026</p>
      </footer>
    </div>
  );
}
