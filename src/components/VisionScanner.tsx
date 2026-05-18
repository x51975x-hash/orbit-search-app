import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { useApp } from '../context/AppContext';
import { playBeep } from '../utils/sound';

interface VisionScannerProps {
  onClose: () => void;
}

type Phase = 'scanning' | 'found' | 'denied';

export default function VisionScanner({ onClose }: VisionScannerProps) {
  const [phase, setPhase] = useState<Phase>('scanning');
  const [scannedText, setScannedText] = useState('');
  const navigate = useNavigate();
  const { soundEnabled } = useApp();

  const handleScan = useCallback((codes: IDetectedBarcode[]) => {
    if (phase !== 'scanning' || codes.length === 0) return;
    const text = codes[0].rawValue;
    if (!text) return;
    if (soundEnabled) playBeep();
    setScannedText(text);
    setPhase('found');
    setTimeout(() => {
      navigate('/results', { state: { query: text, visual: false } });
    }, 900);
  }, [phase, soundEnabled, navigate]);

  const handleError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.toLowerCase().includes('permission') ||
      msg.toLowerCase().includes('notallowed') ||
      msg.toLowerCase().includes('denied')
    ) {
      setPhase('denied');
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-10"
      >
        <X size={28} />
      </button>

      <p className="text-white/50 text-sm uppercase tracking-widest mb-8 font-medium select-none">
        Vision Scanner
      </p>

      {/* Viewfinder */}
      <div className="relative w-72 h-72">
        {/* Glowing corners */}
        {(['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 right-0 rotate-180', 'bottom-0 left-0 -rotate-90'] as const).map(
          (pos, i) => (
            <span
              key={i}
              className={`absolute ${pos} w-8 h-8 border-t-2 border-l-2 border-cyan-400 z-10 pointer-events-none`}
              style={{ boxShadow: '0 0 8px #22d3ee' }}
            />
          )
        )}

        {/* Scanner or error states */}
        <div className="absolute inset-0 overflow-hidden rounded-sm bg-black">
          {phase === 'denied' ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/60 text-sm text-center px-6">
              <AlertCircle size={32} className="text-red-400 opacity-70" />
              <p className="text-white/70 font-medium">Camera access denied</p>
              <p className="text-white/40 text-xs leading-relaxed">
                Allow camera access in your browser settings and try again.
              </p>
            </div>
          ) : phase === 'found' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full gap-3 bg-black/80 px-4"
            >
              <CheckCircle2 size={36} className="text-cyan-400" />
              <p className="text-cyan-400 text-xs uppercase tracking-widest font-mono">Code detected</p>
              <p className="text-white/60 text-[11px] text-center break-all line-clamp-3 leading-relaxed">
                {scannedText}
              </p>
            </motion.div>
          ) : (
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={{ facingMode: 'environment' }}
              styles={{
                container: { width: '100%', height: '100%', position: 'relative' },
                video: { width: '100%', height: '100%', objectFit: 'cover' },
              }}
              components={{
                finder: false,
              }}
            />
          )}
        </div>

        {/* Laser line — only while actively scanning */}
        <AnimatePresence>
          {phase === 'scanning' && (
            <motion.div
              className="absolute left-0 right-0 h-px bg-cyan-400 z-10 pointer-events-none"
              style={{ boxShadow: '0 0 6px 2px #22d3ee' }}
              initial={{ top: 0, opacity: 0 }}
              animate={{ top: ['0%', '100%', '0%'], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Status text */}
      <p className="mt-6 text-white/30 text-xs text-center tracking-wide select-none">
        {phase === 'scanning' && 'Point at a QR code to scan automatically'}
        {phase === 'found' && 'Navigating to results…'}
        {phase === 'denied' && (
          <button
            onClick={onClose}
            className="text-white/50 underline underline-offset-2 hover:text-white/80 transition-colors"
          >
            Close
          </button>
        )}
      </p>
    </motion.div>
  );
}
