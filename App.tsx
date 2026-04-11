
import React, { useState, useCallback } from 'react';
import { GeminiService } from './services/geminiService';
import { AnalysisResult } from './types';
import AnalysisDisplay from './components/AnalysisDisplay';
import { Search, Info, RefreshCcw, ShieldCheck, Zap, Ghost } from 'lucide-react';

const gemini = new GeminiService();

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await gemini.analyzeText(inputText);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error(err);
      setError('Failed to analyze the text. Please ensure your API key is valid and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setAnalysisResult(null);
    setError(null);
  };

  const examplePrompts = [
    "The earth is actually flat because you can see the horizon is a straight line and if it were round water would fall off.",
    "Video games are the primary cause of violence in modern society and should be banned for everyone under 21.",
    "Economic growth is strictly impossible in a sustainable ecosystem because resources are finite and growth requires infinite resources."
  ];

  return (
    <div className="min-h-screen pb-20 selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-900/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="pt-12 pb-8 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
          <Ghost size={14} /> Contrarian Engine
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">Leave Me Alone</span> Engine
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          The intellectually mature antidote to unfounded claims. Analyze rhetoric for fallacies, verify facts, and generate rigorous counterpoints instantly.
        </p>
      </header>

      <main className="px-6 max-w-5xl mx-auto">
        {/* Input Area */}
        <div className="mb-12 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <form 
            onSubmit={handleAnalyze}
            className="relative bg-slate-900 border border-slate-700 p-2 rounded-2xl shadow-2xl overflow-hidden"
          >
            <textarea
              className="w-full bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 p-4 min-h-[180px] text-lg resize-none"
              placeholder="Paste the argument or 'spouting' text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isAnalyzing}
            />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Info size={16} />
                <span>Rigorously analyzed using Gemini & Google Search</span>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 transition font-semibold"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing || !inputText.trim()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCcw className="animate-spin" size={20} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Analyze
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
          
          {!analysisResult && !isAnalyzing && (
            <div className="mt-8">
              <p className="text-slate-500 text-sm font-semibold mb-4 text-center uppercase tracking-widest">Try an example</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {examplePrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(p)}
                    className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-indigo-300 transition-colors line-clamp-3 leading-relaxed"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading / Error States */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-indigo-500">
                <Search size={24} className="animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-200">Deconstructing Argument...</h3>
              <p className="text-slate-500 mt-1">Cross-referencing factual claims and checking logical validity.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-6 bg-rose-900/20 border border-rose-500/30 rounded-2xl flex items-start gap-4 animate-in fade-in zoom-in-95">
            <ShieldCheck className="text-rose-500 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-rose-400">Analysis Halted</h4>
              <p className="text-rose-200/70 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {analysisResult && <AnalysisDisplay result={analysisResult} />}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Ghost size={20} />
            <span>Built for intellectual rigor.</span>
          </div>
          <div className="flex gap-8 text-slate-500 text-sm font-medium">
            <a href="#" className="hover:text-indigo-400 transition">Methodology</a>
            <a href="#" className="hover:text-indigo-400 transition">Logic Engine</a>
            <a href="#" className="hover:text-indigo-400 transition">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
