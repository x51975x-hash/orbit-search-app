import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Camera, Search, Moon, Sun, QrCode, Upload, X, Circle } from 'lucide-react';
import Logo from '../components/Logo';
import VisionScanner from '../components/VisionScanner';
import AuthModal from '../components/AuthModal';
import Footer from '../components/Footer';
import UserMenu from '../components/UserMenu';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { playTick } from '../utils/sound';

// --- UPDATED SEARCH BRAIN ---
interface Result {
  title: string;
  link: string;
  snippet: string;
  source?: string;
}

async function fetchLiveResults(query: string): Promise<Result[]> {
  const API_KEY='30884403332f1465243be4f51505370605634560c33a408d'; 
  
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
    },
    body: JSON.stringify({ 
      q: query,
      gl: 'au',
      hl: 'en',
      num: 10 
    }),
  });

  if (!res.ok) throw new Error(`Server Error: ${res.status}`);
  const data = await res.json();
  
  // Safer mapping to prevent crashes if a link is weird
  return (data.organic || []).map((item: any) => {
    let host = 'link';
    try {
      host = new URL(item.link).hostname.replace('www.', '');
    } catch (e) { /* ignore bad urls */ }
    
    return {
      title: item.title || 'No Title',
      link: item.link || '#',
      snippet: item.snippet || '',
      source: host
    };
  });
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cameraMenuRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, soundEnabled } = useApp();
  const { user, logout } = useAuth();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      setQuery(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        handleSearch(transcript);
      }
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const handleSearch = async (q = query) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    
    try {
      const results = await fetchLiveResults(trimmed);
      navigate('/results', { state: { results, query: trimmed } });
    } catch (err: any) {
      console.error(err);
      // This will now show the EXACT error message
      alert(`Search Error: ${err.message}`);
    }
  };

  const handleMic = () => {
    if (soundEnabled) playTick();
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      setListening(true);
      recognitionRef.current?.start();
    }
  };

  useEffect(() => {
    if (!showCameraMenu) return;
    const handler = (e: MouseEvent) => {
      if (cameraMenuRef.current && !cameraMenuRef.current.contains(e.target as Node)) {
        setShowCameraMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCameraMenu]);

  useEffect(() => {
    if (!showCameraModal) return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [showCameraModal]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-[#f0f4f8]'}`}>
      <header className="flex justify-end items-center px-6 py-4 gap-2">
        <button onClick={toggleDarkMode} className="p-2 rounded-full text-slate-400">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <UserMenu user={user} logout={logout} onSignIn={() => setShowAuthModal(true)} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}><Logo size="lg" /></motion.div>
        <div className="w-full max-w-3xl">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className={`relative flex items-center w-full h-14 rounded-full border bg-white ${darkMode ? 'bg-white/10 border-white/15' : 'border-gray-200'}`}>
            <button type="submit" className="absolute left-3 p-1.5"><Search size={20} className="text-gray-400" /></button>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search or enter URL" className={`flex-1 h-full bg-transparent outline-none pl-14 pr-4 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
            <div className="flex items-center gap-1 mr-4">
              <button type="button" onClick={handleMic} className="p-1.5 text-blue-500"><Mic size={18} /></button>
              <button type="button" onClick={() => setShowCameraMenu(!showCameraMenu)} className="p-1.5 text-gray-400"><Camera size={18} /></button>
              <button type="button" onClick={handleQrScan} className="p-1.5 text-gray-400"><QrCode size={18} /></button>
            </div>
          </form>
        </div>
        <p className={`text-sm ${darkMode ? 'text-white/30' : 'text-slate-400'}`}>Search anything — or point your camera at the world</p>
      </main>

      {showAuthModal && <AuthModal darkMode={darkMode} onClose={() => setShowAuthModal(false)} />}
      <Footer />
    </div>
  );

  function handleQrScan() { setShowScanner(true); }
}