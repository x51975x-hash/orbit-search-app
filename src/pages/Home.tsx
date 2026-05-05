import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Camera, Search, Moon, Sun, QrCode, Upload, X, Circle } from 'lucide-react';
import Logo from '../components/Logo';
import VisionScanner from '../components/VisionScanner';
import AuthModal from '../components/AuthModal';
import Footer from '../components/Footer';
import UserMenu from '../components/UserMenu';
import { Result } from '../data/results';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { playTick } from '../utils/sound';

// ✅ NEW: Serper-based search function
async function fetchLiveResults(query: string): Promise<Result[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
     'X-API-KEY':'308844e12d331a1f9cca47ca660165e1c33a408d',
    },
    body: JSON.stringify({
      q: query,
      gl: 'au',
      hl: 'en',
      num: 10,
    }),
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  const data = await res.json();

  // Map Serper response → your app's Result type
  const results: Result[] = (data.organic || []).map((item: any, index: number) => ({
    id: index.toString(),
    title: item.title,
    url: item.link,
    description: item.snippet,
  }));

  return results;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
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
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('');

      setQuery(transcript);

      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        void handleSearch(transcript);
      }
    };

    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const handleSearch = async (q = query) => {
    const trimmed = q.trim();
    if (!trimmed || searching) return;

    setSearching(true);
    setSearchError(null);

    try {
      const results = await fetchLiveResults(trimmed);
      navigate('/results', { state: { results, query: trimmed } });
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed. Please try again.');
    } finally {
      setSearching(false);
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

  // Close camera menu on outside click
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

  // Camera stream
  useEffect(() => {
    if (!showCameraModal) return;

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [showCameraModal]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleCameraClick = () => {
    if (soundEnabled) playTick();
    setShowCameraMenu((v) => !v);
  };

  const handleUploadImage = () => {
    setShowCameraMenu(false);
    cameraInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    setShowCameraMenu(false);
    setShowCameraModal(true);
  };

  const handleCapture = () => {
    stopStream();
    setShowCameraModal(false);
    navigate('/results', { state: { results: [], visual: true } });
  };

  const handleCloseCamera = () => {
    stopStream();
    setShowCameraModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    navigate('/results', { state: { results: [], visual: true } });
    e.target.value = '';
  };

  const handleQrScan = () => {
    if (soundEnabled) playTick();
    setShowScanner(true);
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <header className="flex justify-end p-4 gap-2">
        <button onClick={toggleDarkMode}>
          {darkMode ? <Sun /> : <Moon />}
        </button>
        <UserMenu user={user} logout={logout} onSignIn={() => setShowAuthModal(true)} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6">
        <Logo size="lg" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSearch();
          }}
          className="flex items-center border rounded-full px-4 py-2 w-full max-w-xl"
        >
          <button type="submit">
            <Search />
          </button>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 px-3 outline-none bg-transparent"
          />

          <button type="button" onClick={handleMic}>
            <Mic />
          </button>

          <button type="button" onClick={handleCameraClick}>
            <Camera />
          </button>

          <button type="button" onClick={handleQrScan}>
            <QrCode />
          </button>
        </form>

        {searchError && <p className="text-red-500">{searchError}</p>}
      </main>

      <Footer />

      {showScanner && <VisionScanner onClose={() => setShowScanner(false)} />}
      {showAuthModal && <AuthModal darkMode={darkMode} onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}