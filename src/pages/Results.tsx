import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, QrCode, Share2, Bookmark } from 'lucide-react';
import Logo from '../components/Logo';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  // Catch the results sent from the Home page
  const { results, query } = location.state || { results: [], query: '' };

  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="text-gray-600 dark:text-gray-400" />
          </button>
          <Logo size="sm" />
          <div className="flex-1 max-w-2xl">
            <div className="px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
              {query}
            </div>
          </div>
        </div>
      </header>

      {/* Results Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-white/5 rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {result.source}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><Bookmark size={16} /></button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><Share2 size={16} /></button>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {result.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3">
                {result.snippet}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Visit Site <ExternalLink size={14} />
                </a>
                <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg" title="Scan to open on phone">
                  <QrCode size={20} className="text-gray-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No results found for "{query}"</p>
            <button onClick={() => navigate('/')} className="mt-4 text-blue-500 underline">Try another search</button>
          </div>
        )}
      </main>
    </div>
  );
}