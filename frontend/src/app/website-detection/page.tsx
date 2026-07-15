"use client";

// ─────────────────────────────────────────────────────────────────────────────
// frontend/src/app/website-detection/page.tsx
// CyberShield AI — Fake Website & Phishing Detection Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback, useRef } from "react";
import {
  analyzeWebsite,
  analyzeWebsiteScreenshot,
  getWebsiteHistory,
  deleteWebsiteAnalysis,
  WebsiteAnalysisResult,
  AnalysisHistoryItem,
  ThreatIndicator,
} from "../../lib/api";

// ── Utility helpers ────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  Critical: { bg: "bg-red-900/60", text: "text-red-300", border: "border-red-700", badge: "bg-red-600" },
  High:     { bg: "bg-orange-900/60", text: "text-orange-300", border: "border-orange-700", badge: "bg-orange-600" },
  Medium:   { bg: "bg-yellow-900/60", text: "text-yellow-300", border: "border-yellow-700", badge: "bg-yellow-600" },
  Low:      { bg: "bg-green-900/60", text: "text-green-300", border: "border-green-700", badge: "bg-green-600" },
} as const;

const PREDICTION_CONFIG = {
  Phishing:   { color: "text-red-400",    icon: "🚨", label: "PHISHING SITE"   },
  Suspicious: { color: "text-yellow-400", icon: "⚠️",  label: "SUSPICIOUS SITE" },
  Legitimate: { color: "text-green-400",  icon: "✅",  label: "LEGITIMATE SITE" },
} as const;

const SEVERITY_COLORS = {
  critical: "text-red-400 bg-red-900/40 border-red-700",
  high:     "text-orange-400 bg-orange-900/40 border-orange-700",
  medium:   "text-yellow-400 bg-yellow-900/40 border-yellow-700",
  low:      "text-green-400 bg-green-900/40 border-green-700",
} as const;

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res((reader.result as string).split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RiskMeter({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 75 ? "#ef4444"
    : pct >= 55 ? "#f97316"
    : pct >= 35 ? "#eab308"
    : "#22c55e";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={`${314 * (pct / 100)} 314`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-2xl font-black text-white">{pct}%</span>
          <span className="text-xs text-gray-400">Risk</span>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Confidence</span>
        <span className="font-bold text-white">{confidence.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${confidence}%`,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          }}
        />
      </div>
    </div>
  );
}

function SSLCard({ ssl }: { ssl: WebsiteAnalysisResult["ssl"] }) {
  return (
    <div className={`rounded-xl border p-4 ${ssl.valid ? "border-green-700 bg-green-900/20" : "border-red-700 bg-red-900/20"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{ssl.valid ? "🔒" : "🔓"}</span>
        <span className={`font-bold ${ssl.valid ? "text-green-400" : "text-red-400"}`}>
          SSL {ssl.valid ? "Valid" : "Invalid"}
        </span>
      </div>
      {ssl.issuer && <p className="text-xs text-gray-400">Issuer: <span className="text-white">{ssl.issuer}</span></p>}
      {ssl.subject && <p className="text-xs text-gray-400">Domain: <span className="text-white">{ssl.subject}</span></p>}
      {ssl.days_remaining !== undefined && (
        <p className="text-xs text-gray-400">
          Expires in: <span className={`font-bold ${ssl.days_remaining < 30 ? "text-red-400" : "text-white"}`}>
            {ssl.days_remaining} days
          </span>
        </p>
      )}
    </div>
  );
}

function WhoisCard({ whois }: { whois: WebsiteAnalysisResult["whois"] }) {
  const isNewDomain = (whois.domain_age_days ?? 999) < 90;
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌐</span>
        <span className="font-bold text-white">WHOIS Information</span>
        {isNewDomain && (
          <span className="ml-auto text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
            NEW DOMAIN
          </span>
        )}
      </div>
      <div className="space-y-1.5 text-xs">
        {whois.registrar && (
          <p className="text-gray-400">Registrar: <span className="text-white">{whois.registrar}</span></p>
        )}
        {whois.creation_date && (
          <p className="text-gray-400">
            Created: <span className="text-white">{new Date(whois.creation_date).toLocaleDateString()}</span>
          </p>
        )}
        {whois.expiration_date && (
          <p className="text-gray-400">
            Expires: <span className="text-white">{new Date(whois.expiration_date).toLocaleDateString()}</span>
          </p>
        )}
        {whois.domain_age_days !== undefined && (
          <p className="text-gray-400">
            Age: <span className={`font-bold ${isNewDomain ? "text-red-400" : "text-green-400"}`}>
              {whois.domain_age_days} days
            </span>
          </p>
        )}
        {whois.country && (
          <p className="text-gray-400">Country: <span className="text-white">{whois.country}</span></p>
        )}
        {!whois.registrar && !whois.creation_date && !whois.country && (
          <p className="text-gray-500 italic">WHOIS data unavailable</p>
        )}
      </div>
    </div>
  );
}

function ThreatList({ threats }: { threats: ThreatIndicator[] }) {
  const active = threats.filter((t) => t.detected);
  const inactive = threats.filter((t) => !t.detected);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-white mb-3">
        Threat Indicators
        <span className="ml-2 text-xs bg-red-600 text-white rounded-full px-2 py-0.5">
          {active.length} detected
        </span>
      </h4>
      {active.map((t) => (
        <div
          key={t.name}
          className={`rounded-lg border px-3 py-2 text-xs ${SEVERITY_COLORS[t.severity]}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold">⚡ {t.name}</span>
            <span className="uppercase text-[10px] font-bold opacity-80">{t.severity}</span>
          </div>
          <p className="opacity-80">{t.description}</p>
        </div>
      ))}
      {inactive.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
            {inactive.length} checks passed ✓
          </summary>
          <div className="mt-2 space-y-1">
            {inactive.map((t) => (
              <div key={t.name} className="text-xs text-gray-600 flex items-center gap-2">
                <span className="text-green-700">✓</span>
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function FeatureBreakdown({ features }: { features: WebsiteAnalysisResult["features"] }) {
  const rows = [
    { label: "URL Length", value: `${features.url_length} chars`, bad: features.url_length > 100 },
    { label: "HTTPS", value: features.has_https ? "Yes" : "No", bad: !features.has_https },
    { label: "IP in URL", value: features.has_ip_address ? "Yes" : "No", bad: features.has_ip_address },
    { label: "Suspicious TLD", value: features.uses_suspicious_tld ? "Yes" : "No", bad: features.uses_suspicious_tld },
    { label: "Subdomains", value: String(features.subdomain_count), bad: features.subdomain_count >= 3 },
    { label: "Special Chars", value: String(features.special_char_count), bad: features.special_char_count >= 3 },
    { label: "@ in URL", value: features.has_at_symbol ? "Yes" : "No", bad: features.has_at_symbol },
    { label: "Redirect", value: features.has_redirect ? "Yes" : "No", bad: features.has_redirect },
    { label: "Suspicious KWs", value: String(features.suspicious_keyword_count), bad: features.suspicious_keyword_count >= 2 },
    { label: "Typosquatting", value: `${(features.typosquatting_score * 100).toFixed(0)}%`, bad: features.typosquatting_score >= 0.5 },
    { label: "URL Entropy", value: features.url_entropy.toFixed(2), bad: features.url_entropy > 4 },
  ];

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
      <h4 className="text-sm font-bold text-white mb-3">Feature Breakdown</h4>
      <div className="grid grid-cols-2 gap-1.5">
        {rows.map(({ label, value, bad }) => (
          <div key={label} className="flex justify-between text-xs border border-gray-800 rounded-lg px-2 py-1.5 bg-gray-950/50">
            <span className="text-gray-400">{label}</span>
            <span className={`font-bold ${bad ? "text-red-400" : "text-green-400"}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTable({
  items,
  onDelete,
}: {
  items: AnalysisHistoryItem[];
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-3">🔍</div>
        <p>No analysis history yet. Submit a URL above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400 text-xs">
            <th className="text-left pb-2 pr-4">URL</th>
            <th className="text-left pb-2 pr-4">Prediction</th>
            <th className="text-left pb-2 pr-4">Risk</th>
            <th className="text-left pb-2 pr-4">Confidence</th>
            <th className="text-left pb-2 pr-4">Date</th>
            <th className="text-right pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const pred = PREDICTION_CONFIG[item.prediction as keyof typeof PREDICTION_CONFIG];
            const risk = RISK_CONFIG[item.risk_level as keyof typeof RISK_CONFIG];
            return (
              <tr key={item.analysis_id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="py-2 pr-4">
                  <span className="text-blue-400 text-xs font-mono truncate block max-w-[220px]">
                    {item.domain}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span className={`font-bold text-xs ${pred?.color || "text-gray-400"}`}>
                    {pred?.icon} {item.prediction}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${risk?.badge || "bg-gray-700"} text-white`}>
                    {item.risk_level}
                  </span>
                </td>
                <td className="py-2 pr-4 text-white">{item.confidence.toFixed(1)}%</td>
                <td className="py-2 pr-4 text-gray-500 text-xs">
                  {new Date(item.created_at).toLocaleString()}
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => onDelete(item.analysis_id)}
                    className="text-red-500 hover:text-red-400 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function WebsiteDetectionPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebsiteAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"url" | "screenshot">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (inputMode === "url") {
      if (!url.trim()) { setError("Please enter a URL to analyze."); return; }
      setLoading(true);
      setError(null);
      setResult(null);
      const res = await analyzeWebsite(url.trim());
      setLoading(false);
      if (res) setResult(res);
      else setError("Analysis failed. Please check the URL and try again.");
    } else {
      if (!screenshotFile) { setError("Please upload a screenshot first."); return; }
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const b64 = await toBase64(screenshotFile);
        const res = await analyzeWebsiteScreenshot(b64, screenshotFile.name);
        if (res) setResult(res);
        else setError("Could not extract a URL from the screenshot. Try submitting the URL directly.");
      } catch {
        setError("Screenshot processing failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFileChange(file);
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const res = await getWebsiteHistory(50);
    if (res) setHistory(res.items);
    setHistoryLoaded(true);
    setLoadingHistory(false);
  };

  const handleTabChange = (tab: "analyze" | "history") => {
    setActiveTab(tab);
    if (tab === "history" && !historyLoaded) loadHistory();
  };

  const handleDelete = async (id: string) => {
    await deleteWebsiteAnalysis(id);
    setHistory((h) => h.filter((item) => item.analysis_id !== id));
  };

  const pred = result ? PREDICTION_CONFIG[result.prediction] : null;
  const risk = result ? RISK_CONFIG[result.risk_level] : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-gray-900/60 border-b border-gray-800 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
            🌐
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Fake Website Detection</h1>
            <p className="text-sm text-gray-400">
              AI-powered phishing & counterfeit website analysis engine
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="text-xs bg-indigo-900/60 border border-indigo-700 text-indigo-300 rounded-full px-3 py-1">
              SSL Check
            </span>
            <span className="text-xs bg-purple-900/60 border border-purple-700 text-purple-300 rounded-full px-3 py-1">
              WHOIS
            </span>
            <span className="text-xs bg-blue-900/60 border border-blue-700 text-blue-300 rounded-full px-3 py-1">
              DNS
            </span>
            <span className="text-xs bg-pink-900/60 border border-pink-700 text-pink-300 rounded-full px-3 py-1">
              ML Risk
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-6">
          {(["analyze", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "analyze" ? "🔍 Analyze" : "📋 History"}
            </button>
          ))}
        </div>

        {/* ── Analyze Tab ── */}
        {activeTab === "analyze" && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* ── Input Panel ── */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-lg font-bold text-white mb-4">Submit for Analysis</h2>

                {/* Input mode toggle */}
                <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-4">
                  {(["url", "screenshot"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => { setInputMode(mode); setError(null); }}
                      className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                        inputMode === mode
                          ? "bg-indigo-600 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {mode === "url" ? "🔗 URL" : "📸 Screenshot"}
                    </button>
                  ))}
                </div>

                {/* URL Input */}
                {inputMode === "url" && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">
                      Enter website URL, QR code link, or SMS/email link
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="url-input"
                        type="text"
                        value={url}
                        onChange={(e) => { setUrl(e.target.value); setError(null); }}
                        onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                        placeholder="https://suspicious-site.com"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Screenshot Upload */}
                {inputMode === "screenshot" && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragOver
                        ? "border-indigo-500 bg-indigo-900/20"
                        : "border-gray-700 bg-gray-800/30 hover:border-gray-600"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    />
                    {screenshotPreview ? (
                      <div>
                        <img
                          src={screenshotPreview}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded-lg mb-2 object-contain"
                        />
                        <p className="text-xs text-indigo-400">{screenshotFile?.name}</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">📸</div>
                        <p className="text-sm text-gray-400">
                          Drop screenshot here or <span className="text-indigo-400">click to upload</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">PNG, JPG, WEBP · Max 20 MB</p>
                      </>
                    )}
                  </div>
                )}

                {error && (
                  <div className="mt-3 text-xs text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  id="analyze-btn"
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>"🔍 Analyze Website"</>
                  )}
                </button>
              </div>

              {/* What we analyze */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">What We Analyze</h3>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  {[
                    ["🔒", "SSL Certificate Validity"],
                    ["📋", "WHOIS & Domain Age"],
                    ["🌐", "DNS Records & IP"],
                    ["📄", "HTML Content & Forms"],
                    ["🤖", "JavaScript Obfuscation"],
                    ["🔤", "Typosquatting Detection"],
                    ["🏷️", "Suspicious Keywords"],
                    ["↩️",  "Redirect Chains"],
                    ["🎯", "ML Risk Scoring"],
                  ].map(([icon, label]) => (
                    <li key={label} className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Results Panel ── */}
            <div className="xl:col-span-3 space-y-4">
              {!result && !loading && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4 animate-pulse">🌐</div>
                  <h3 className="text-lg font-bold text-gray-400 mb-2">Enter a URL to begin</h3>
                  <p className="text-sm text-gray-600">
                    Submit any suspicious URL and we'll run a full AI-powered phishing analysis.
                  </p>
                </div>
              )}

              {loading && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white font-semibold">Running full analysis pipeline…</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Checking SSL · WHOIS · DNS · HTML · ML scoring
                  </p>
                </div>
              )}

              {result && pred && risk && (
                <>
                  {/* Prediction Banner */}
                  <div className={`rounded-2xl border p-5 ${risk.bg} ${risk.border}`}>
                    <div className="flex items-start gap-4">
                      <RiskMeter score={result.risk_score} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{pred.icon}</span>
                          <div>
                            <div className={`text-2xl font-black ${pred.color}`}>
                              {pred.label}
                            </div>
                            <div className="text-sm text-gray-400 font-mono">{result.domain}</div>
                          </div>
                          <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${risk.badge} text-white`}>
                            {result.risk_level} RISK
                          </span>
                        </div>
                        <ConfidenceBar confidence={result.confidence} />
                        <div className="mt-2 text-xs text-gray-400">
                          Analysis ID: <span className="font-mono text-gray-300">{result.analysis_id}</span>
                          <span className="mx-2">·</span>
                          Processed in <span className="text-white">{result.processing_time_ms.toFixed(0)}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white mb-3">💡 Recommendations</h3>
                    <ul className="space-y-2">
                      {result.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-gray-300 border border-gray-800 rounded-lg px-3 py-2">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 3-column info grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SSLCard ssl={result.ssl} />
                    <WhoisCard whois={result.whois} />
                  </div>

                  {/* DNS Info */}
                  {result.dns.ip_addresses.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-white mb-3">🌐 DNS Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="text-gray-500 mb-1">IP Addresses</p>
                          {result.dns.ip_addresses.map((ip) => (
                            <p key={ip} className="font-mono text-indigo-300">{ip}</p>
                          ))}
                        </div>
                        {result.dns.mx_records.length > 0 && (
                          <div>
                            <p className="text-gray-500 mb-1">MX Records</p>
                            {result.dns.mx_records.slice(0, 3).map((mx) => (
                              <p key={mx} className="font-mono text-gray-300">{mx}</p>
                            ))}
                          </div>
                        )}
                        {result.dns.ns_records.length > 0 && (
                          <div>
                            <p className="text-gray-500 mb-1">Name Servers</p>
                            {result.dns.ns_records.slice(0, 3).map((ns) => (
                              <p key={ns} className="font-mono text-gray-300">{ns}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      {result.dns.uses_ip_directly && (
                        <div className="mt-2 text-xs text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-1">
                          ⚠️ URL uses a raw IP address — high phishing risk
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detected Keywords */}
                  {result.detected_keywords.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-white mb-3">🏷️ Detected Suspicious Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.detected_keywords.map((kw) => (
                          <span
                            key={kw}
                            className="text-xs bg-red-900/40 border border-red-700 text-red-300 rounded-full px-3 py-1"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Threats & Feature Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <ThreatList threats={result.threats} />
                    </div>
                    <FeatureBreakdown features={result.features} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === "history" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                Analysis History
                <span className="ml-2 text-xs bg-gray-700 text-gray-300 rounded-full px-2 py-0.5">
                  {history.length} records
                </span>
              </h2>
              <button
                onClick={loadHistory}
                className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800 rounded-lg px-3 py-1.5"
              >
                {loadingHistory ? "Loading…" : "↻ Refresh"}
              </button>
            </div>
            <HistoryTable items={history} onDelete={handleDelete} />
          </div>
        )}

        {/* Footer spacer */}
        <div className="h-10" />
      </div>
    </div>
  );
}
