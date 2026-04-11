
import React from 'react';
import { AnalysisResult, GroundingSource } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, ExternalLink, ShieldAlert, Scale } from 'lucide-react';

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  // Simple regex-based section extractor for the raw markdown
  const getSection = (name: string) => {
    const regex = new RegExp(`### ${name}([\\s\\S]*?)(?=###|$)`, 'i');
    const match = result.rawResponse.match(regex);
    return match ? match[1].trim() : "None identified.";
  };

  const fallacies = getSection('Fallacies');
  const inconsistencies = getSection('Inconsistencies');
  const factChecks = getSection('Fact Checks');
  const counterArgument = getSection('Counter-Argument');

  // Mock data for the radar chart based on analysis context
  const chartData = [
    { subject: 'Consistency', value: 100 - (inconsistencies.length > 20 ? 40 : 10), fullMark: 100 },
    { subject: 'Factual Basis', value: result.sources.length > 0 ? 80 : 40, fullMark: 100 },
    { subject: 'Structure', value: result.logicScore, fullMark: 100 },
    { subject: 'Objectivity', value: fallacies.length > 50 ? 30 : 90, fullMark: 100 },
    { subject: 'Clarity', value: 75, fullMark: 100 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Logic Score</h3>
          <div className="relative flex items-center justify-center">
             <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364}
                  strokeDashoffset={364 - (364 * result.logicScore) / 100}
                  className={`${result.logicScore > 70 ? 'text-emerald-500' : result.logicScore > 40 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1000 ease-out`}
                />
              </svg>
              <span className="absolute text-4xl font-bold mono">{result.logicScore}</span>
          </div>
          <p className="mt-4 text-xs text-slate-500 text-center italic">Calculated based on structural integrity and absence of fallacies.</p>
        </div>

        <div className="md:col-span-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center min-h-[250px]">
           <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4 self-start">Argument Profile</h3>
           <div className="w-full h-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#475569" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Radar
                    name="Argument Quality"
                    dataKey="value"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Fallacies & Inconsistencies */}
        <div className="space-y-6">
          <section className="bg-slate-800/30 p-6 rounded-2xl border border-rose-500/20">
            <div className="flex items-center gap-2 mb-4 text-rose-400">
              <ShieldAlert size={20} />
              <h3 className="font-bold text-lg">Logical Fallacies</h3>
            </div>
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-300">
              {fallacies}
            </div>
          </section>

          <section className="bg-slate-800/30 p-6 rounded-2xl border border-amber-500/20">
            <div className="flex items-center gap-2 mb-4 text-amber-400">
              <AlertTriangle size={20} />
              <h3 className="font-bold text-lg">Inconsistencies</h3>
            </div>
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-300">
              {inconsistencies}
            </div>
          </section>

          {result.sources.length > 0 && (
            <section className="bg-slate-800/30 p-6 rounded-2xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-4 text-blue-400">
                <ExternalLink size={20} />
                <h3 className="font-bold text-lg">Evidence & Sources</h3>
              </div>
              <ul className="space-y-2">
                {result.sources.map((source, idx) => (
                  <li key={idx}>
                    <a 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Facts & Counter-Argument */}
        <div className="space-y-6">
          <section className="bg-slate-800/30 p-6 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <CheckCircle size={20} />
              <h3 className="font-bold text-lg">Fact Checks</h3>
            </div>
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-300">
              {factChecks}
            </div>
          </section>

          <section className="bg-indigo-900/20 p-8 rounded-2xl border border-indigo-500/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-indigo-500/10">
              <Scale size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-indigo-400">
                <Scale size={20} />
                <h3 className="font-bold text-xl">The Mature Counterpoint</h3>
              </div>
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-slate-200 font-medium leading-relaxed italic">
                "{counterArgument}"
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default AnalysisDisplay;
