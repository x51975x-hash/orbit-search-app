import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Moon, Sun, Grid, Bookmark, Layers, 
  Share2, RotateCcw, ExternalLink, Trash2, 
  Plus, SlidersHorizontal, FolderPlus
} from 'lucide-react';
import Logo from '../components/Logo';
import { useApp } from '../context/AppContext';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useApp();
  const { results: initialResults, query } = location.state || { results: [], query: '' };
  
  const [deck, setDeck] = useState(initialResults);
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- BUTTON LOGIC ---
  const handleDismiss = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      alert("You've reached the end of the deck!");
    }
  };

  const handleShare = async () => {
    if (!currentCard) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentCard.title,
          text: currentCard.snippet,
          url: currentCard.link,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      navigator.clipboard.writeText(currentCard.link);
      alert("Link copied to clipboard!");
    }
  };

  const handleComingSoon = (feature: string) => {
    alert(`${feature} feature coming soon!`);
  };
  // ------------------------

  const currentCard = deck[currentIndex];

  if (!currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] dark:bg-slate-900">
        <button onClick={() => navigate('/')} className="text-blue-500 underline font-medium">No results. Back to home.</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-hidden flex flex-col transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-[#f0f4f8] text-gray-800'}`}>
      
      {/* 1. TOP NAV BAR */}
      <header className="px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Logo size="sm" />
        </div>
        
        <div className="flex-1 text-center cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-sm text-gray-400 hover:text-blue-500 transition-colors font-medium">"{query}"</span>
        </div>

        <div className="flex items-center gap-4 text-gray-400">
          <Grid size={18} className="cursor-pointer hover:text-blue-500" onClick={() => handleComingSoon('Grid View')} />
          <div className="relative">
             <Bookmark size={18} className="cursor-pointer hover:text-blue-500" onClick={() => handleComingSoon('Saved Bookmarks')} />
             <span className="absolute -top-2 -right-2 bg-green-500 text-[10px] text-white px-1 rounded-full border-2 border-[#f0f4f8] dark:border-slate-900">2</span>
          </div>
          <div className="relative">
            <Layers size={18} className="cursor-pointer hover:text-blue-500" onClick={() => handleComingSoon('Decks')} />
            <span className="absolute -top-2 -right-2 bg-blue-500 text-[10px] text-white px-1 rounded-full border-2 border-[#f0f4f8] dark:border-slate-900">1</span>
          </div>
          <Search size={18} className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/')} />
          <button onClick={toggleDarkMode} className="hover:text-blue-500 transition-colors">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-105 transition-transform shadow-sm">U</div>
        </div>
      </header>

      {/* 2. SUB-MENU ACTIONS */}
      <div className="flex justify-center gap-6 py-2 text-[11px] font-bold uppercase tracking-widest text-red-400/80 z-10">
        <button onClick={handleDismiss} className="flex items-center gap-1 hover:text-red-500 transition-colors"><X size={12} /> Skip</button>
        <button onClick={handleShare} className="flex items-center gap-1 text-blue-400 hover:text-blue-500 transition-colors"><Share2 size={12} /> Share</button>
        <button onClick={() => handleComingSoon('Save')} className="flex items-center gap-1 text-green-500 hover:text-green-600 transition-colors"><Bookmark size={12} /> Save</button>
        <button onClick={() => handleComingSoon('Grid View')} className="flex items-center gap-1 text-orange-400 hover:text-orange-500 transition-colors">Grid <Layers size={12} /></button>
      </div>

      {/* 3. MAIN CARD DECK */}
      <main className="flex-1 relative flex items-center justify-center p-4">
        
        {/* BACKGROUND FLOATING BUTTONS (Share / Bin) */}
        <div className="absolute bottom-10 left-10 flex flex-col items-center text-gray-400 hover:text-blue-500 cursor-pointer z-0 transition-colors" onClick={handleShare}>
          <Share2 size={24} strokeWidth={1.5} />
          <span className="text-[10px] font-bold uppercase mt-2">Share</span>
        </div>
        <div className="absolute bottom-10 right-10 flex flex-col items-center text-gray-400 hover:text-red-500 cursor-pointer z-0 transition-colors" onClick={() => handleComingSoon('Move to Bin')}>
          <Trash2 size={24} strokeWidth={1.5} />
          <span className="text-[10px] font-bold uppercase mt-2">Bin</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 100) handleDismiss();
            }}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ x: info => info.offset?.x > 0 ? 500 : -500, opacity: 0, rotate: 5 }}
            className="relative w-full max-w-[400px] bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden cursor-grab active:cursor-grabbing z-10"
            style={{ height: '580px' }}
          >
            {/* Top Right Card Icons */}
            <div className="absolute top-6 right-6 flex gap-4 text-gray-300">
               <FolderPlus size={18} className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleComingSoon('Add to Deck')} />
               <Bookmark size={18} className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleComingSoon('Bookmark Card')} />
               <RotateCcw size={18} className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => setCurrentIndex(0)} title="Restart Deck" />
            </div>

            {/* QR Code */}
            <div className="flex justify-center mt-14 mb-6">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentCard.link)}`} 
                alt="QR Code"
                className="w-48 h-48 mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:p-2 dark:rounded-xl"
              />
            </div>

            {/* Content Text */}
            <div className="px-8 flex-1 flex flex-col">
              <p className="text-[11px] text-gray-400 mb-2 truncate">{currentCard.source}</p>
              <h2 className="text-xl font-bold text-[#1a40b3] dark:text-blue-400 leading-snug mb-3 line-clamp-2">
                {currentCard.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                {currentCard.snippet}
              </p>
            </div>

            {/* Bottom Card Actions (Edit, Add To, External Link) */}
            <div className="relative px-8 pb-6 pt-4 flex items-center justify-between text-gray-300 mt-auto">
              <div className="flex flex-col items-center cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleComingSoon('Edit')}>
                <SlidersHorizontal size={20} strokeWidth={1.5} />
                <span className="text-[9px] font-bold uppercase mt-1 text-gray-400">Edit</span>
              </div>
              
              <p className="text-[9px] uppercase tracking-widest text-gray-300 dark:text-gray-500 text-center flex-1">
                tap to see more · drag to interact
              </p>

              <div className="flex flex-col items-center cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleComingSoon('Add to')}>
                <Plus size={20} strokeWidth={1.5} />
                <span className="text-[9px] font-bold uppercase mt-1 text-gray-400">Add to</span>
              </div>

              {/* Floating External Link Icon */}
              <a href={currentCard.link} target="_blank" rel="noreferrer" className="absolute right-8 -top-8 text-gray-400 hover:text-blue-500 transition-colors">
                 <ExternalLink size={18} />
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Pagination Dots */}
      <footer className="pb-8 flex justify-center gap-2 z-10">
        {deck.slice(0, 10).map((_, i) => (
          <div 
            key={i} 
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-gray-400' : 'bg-gray-200 dark:bg-white/10'}`} 
          />
        ))}
      </footer>
    </div>
  );
}

// Helper X icon
function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}