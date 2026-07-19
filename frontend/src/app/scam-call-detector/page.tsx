"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { analyzeCall, AnalyzeCallResult } from "../../lib/api";

export default function ScamCallDetectorPage() {
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeCallResult | null>(null);

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    const res = await analyzeCall(transcript);
    setResult(res);
    setIsAnalyzing(false);
  };

  const handleClear = () => {
    setTranscript("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500">📞</span> Scam Call Detector
            </h1>
            <p className="text-sm text-slate-400">Analyze phone call transcripts for fraud patterns.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <label className="block text-sm font-bold text-slate-300 mb-2">Call Transcript</label>
            <p className="text-xs text-slate-500 mb-4">Paste the text of a suspicious phone call here to analyze it using NLP.</p>
            
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full h-48 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none mb-4 placeholder:text-slate-700"
              placeholder="e.g. This is the police. Your Aadhaar is linked to money laundering. We are freezing your account immediately..."
            />

            <div className="flex gap-3">
              <button 
                onClick={handleClear}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !transcript.trim()}
                className={`flex-1 py-3 ${isAnalyzing || !transcript.trim() ? "bg-blue-600/50 text-blue-200 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"} rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2`}
              >
                {isAnalyzing ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <><span>⚡</span> Analyze</>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Analysis Result</h3>
            
            {!result && !isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                <div className="text-4xl mb-3 opacity-50">🤖</div>
                <p className="text-sm text-slate-400">Enter a transcript and click analyze to see results.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
                <p className="text-sm text-blue-400 font-medium animate-pulse">Running NLP analysis...</p>
              </div>
            )}

            {result && (
              <div className="flex-1 flex flex-col gap-4 animate-fade-in">
                <div className={`p-5 rounded-xl border ${result.risk_percentage > 50 ? "bg-red-900/20 border-red-500/30" : "bg-green-900/20 border-green-500/30"}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className={`text-lg font-black ${result.risk_percentage > 50 ? "text-red-400" : "text-green-400"}`}>
                        {result.risk_percentage > 50 ? "⚠️ Scam Detected" : "✅ Appears Safe"}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">Confidence: {result.confidence_score}%</p>
                    </div>
                    <div className={`text-2xl font-black ${result.risk_percentage > 50 ? "text-red-500" : "text-green-500"}`}>
                      {result.risk_percentage}%
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detected Flags</h5>
                      <ul className="text-sm text-slate-300 space-y-2">
                        {result.reasons?.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${result.risk_percentage > 50 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"}`}>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${result.risk_percentage > 50 ? "text-red-400" : "text-green-400"}`}>Recommendation</h5>
                  <p className="text-sm text-white font-medium leading-relaxed">{result.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
