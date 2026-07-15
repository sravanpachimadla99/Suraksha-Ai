"use client";

// ─────────────────────────────────────────────────────────────────────────────
// frontend/src/app/currency-detection/page.tsx
// CyberShield AI — Counterfeit Currency Detection Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  analyzeCurrency,
  analyzeCurrencyCamera,
  getCurrencyHistory,
  deleteCurrencyAnalysis,
  CurrencyAnalysisResult,
  CurrencyHistoryItem,
  SecurityFeatureResult,
} from "../../lib/api";

// ── Constants ──────────────────────────────────────────────────────────────────

const DENOMINATIONS = [10, 20, 50, 100, 200, 500, 2000];

const PREDICTION_CONFIG = {
  Genuine:       { icon: "✅", color: "text-green-400",  bg: "bg-green-900/30",  border: "border-green-700",  badge: "bg-green-700"  },
  Counterfeit:   { icon: "🚨", color: "text-red-400",    bg: "bg-red-900/30",    border: "border-red-700",    badge: "bg-red-700"    },
  Suspicious:    { icon: "⚠️",  color: "text-yellow-400", bg: "bg-yellow-900/30", border: "border-yellow-700", badge: "bg-yellow-700" },
  Inconclusive:  { icon: "❓", color: "text-gray-400",   bg: "bg-gray-900/30",   border: "border-gray-700",   badge: "bg-gray-700"   },
} as const;

const SEVERITY_STYLE = {
  critical: "border-red-700 bg-red-900/30 text-red-300",
  high:     "border-orange-700 bg-orange-900/30 text-orange-300",
  medium:   "border-yellow-700 bg-yellow-900/30 text-yellow-300",
  low:      "border-green-700 bg-green-900/30 text-green-300",
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res((reader.result as string).split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RiskGauge({ value, label }: { value: number; label: string }) {
  const angle = -90 + (value / 100) * 180;
  const color = value >= 70 ? "#ef4444" : value >= 50 ? "#f97316" : value >= 30 ? "#eab308" : "#22c55e";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={`${Math.PI * 50 * value / 100} ${Math.PI * 50}`}
            strokeDashoffset={Math.PI * 50 * 0.5}
            strokeLinecap="round"
            style={{ transition: "all 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{value.toFixed(0)}%</span>
          <span className="text-[10px] text-gray-400">{label}</span>
        </div>
      </div>
    </div>
  );
}

function FeatureChecklist({ features }: { features: SecurityFeatureResult[] }) {
  const detected = features.filter(f => f.detected);
  const missing  = features.filter(f => !f.detected);

  return (
    <div className="space-y-3">
      {/* Passed */}
      <div>
        <h4 className="text-xs font-bold text-green-400 mb-2 flex items-center gap-2">
          <span className="w-4 h-4 bg-green-600 rounded-full inline-flex items-center justify-center text-[10px]">✓</span>
          Passed ({detected.length})
        </h4>
        <div className="grid grid-cols-1 gap-1">
          {detected.map(f => (
            <div key={f.feature_key} className="flex items-center gap-2 text-xs text-green-300 bg-green-900/20 border border-green-800 rounded-lg px-3 py-1.5">
              <span className="text-green-500">✓</span>
              <span className="flex-1">{f.feature_label}</span>
              <span className="text-green-600 font-mono">{(f.confidence * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
      {/* Failed */}
      {missing.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-red-600 rounded-full inline-flex items-center justify-center text-[10px]">✗</span>
            Failed ({missing.length})
          </h4>
          <div className="grid grid-cols-1 gap-1">
            {missing.map(f => (
              <div
                key={f.feature_key}
                className={`flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 border ${SEVERITY_STYLE[f.severity as keyof typeof SEVERITY_STYLE]}`}
              >
                <span>✗</span>
                <span className="flex-1">{f.feature_label}</span>
                <span className="uppercase text-[9px] font-bold opacity-70">{f.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BoundingBoxOverlay({
  result,
  imgSrc,
}: {
  result: CurrencyAnalysisResult;
  imgSrc: string;
}) {
  return (
    <div className="relative inline-block w-full">
      <img
        src={imgSrc}
        alt="Currency note"
        className="w-full rounded-xl border border-gray-700 object-contain max-h-60"
      />
      {/* Bounding box overlay (scaled to image element) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
      >
        {result.bounding_boxes.map((box, i) => {
          const isOk = box.label.startsWith("✓");
          return (
            <g key={i}>
              <rect
                x={box.x} y={box.y} width={box.width} height={box.height}
                fill="none"
                stroke={isOk ? "#22c55e" : "#ef4444"}
                strokeWidth="2"
                strokeDasharray={isOk ? "0" : "6,4"}
                opacity="0.85"
              />
              <rect x={box.x} y={box.y - 16} width={Math.min(200, box.label.length * 5.5)} height={14} fill={isOk ? "#16a34a" : "#dc2626"} opacity="0.85" rx="2" />
              <text x={box.x + 3} y={box.y - 5} fontSize="9" fill="white" fontFamily="monospace">
                {box.label.substring(0, 30)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HistoryTable({
  items,
  onDelete,
}: {
  items: CurrencyHistoryItem[];
  onDelete: (id: string) => void;
}) {
  if (!items.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-3">💴</div>
        <p>No analysis history yet. Upload a currency note above.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400 text-xs">
            <th className="text-left pb-2 pr-4">ID</th>
            <th className="text-left pb-2 pr-4">Denomination</th>
            <th className="text-left pb-2 pr-4">Prediction</th>
            <th className="text-left pb-2 pr-4">Confidence</th>
            <th className="text-left pb-2 pr-4">Features</th>
            <th className="text-left pb-2 pr-4">Date</th>
            <th className="text-right pb-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const cfg = PREDICTION_CONFIG[item.prediction as keyof typeof PREDICTION_CONFIG] ?? PREDICTION_CONFIG.Inconclusive;
            return (
              <tr key={item.analysis_id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="py-2 pr-4 font-mono text-xs text-gray-500">{item.analysis_id}</td>
                <td className="py-2 pr-4 text-white font-bold">
                  {item.denomination ? `₹${item.denomination}` : "—"}
                </td>
                <td className="py-2 pr-4">
                  <span className={`font-bold text-xs ${cfg.color}`}>{cfg.icon} {item.prediction}</span>
                </td>
                <td className="py-2 pr-4 text-white">{item.confidence.toFixed(1)}%</td>
                <td className="py-2 pr-4">
                  <span className="text-green-400 text-xs">{item.features_passed}✓</span>
                  <span className="text-gray-600 mx-1">/</span>
                  <span className="text-red-400 text-xs">{item.features_failed}✗</span>
                </td>
                <td className="py-2 pr-4 text-gray-500 text-xs">{new Date(item.created_at).toLocaleString()}</td>
                <td className="py-2 text-right">
                  <button onClick={() => onDelete(item.analysis_id)} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Camera component ────────────────────────────────────────────────────────────

function CameraCapture({
  onCapture,
}: {
  onCapture: (b64: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setCameraError] = useState<string | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions and retry.");
    }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.92);
    onCapture(dataUrl.split(",")[1]);
    stop();
  };

  const stop = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setStreaming(false);
  };

  useEffect(() => () => { stop(); }, []);

  return (
    <div className="space-y-3">
      {error && <div className="text-xs text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">{error}</div>}
      {streaming ? (
        <div className="relative">
          <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl border border-gray-700 max-h-48 object-contain bg-black" />
          <div className="flex gap-2 mt-2">
            <button onClick={capture} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-bold py-2 rounded-xl">
              📸 Capture
            </button>
            <button onClick={stop} className="px-4 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={start}
          className="w-full border-2 border-dashed border-gray-700 hover:border-indigo-600 rounded-xl py-6 text-center text-gray-400 hover:text-indigo-400 transition-all"
        >
          <div className="text-3xl mb-1">📷</div>
          <p className="text-sm">Open Camera</p>
        </button>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────

export default function CurrencyDetectionPage() {
  const [inputMode, setInputMode] = useState<"upload" | "camera">("upload");
  const [selectedDenom, setSelectedDenom] = useState<number | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CurrencyAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");
  const [history, setHistory] = useState<CurrencyHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ────────────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    const MAX = 20 * 1024 * 1024;
    if (file.size > MAX) { setError("File exceeds 20 MB limit."); return; }
    const b64 = await toBase64(file);
    setImageB64(b64);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, []);

  const handleCameraCapture = (b64: string) => {
    setImageB64(b64);
    setPreview(`data:image/jpeg;base64,${b64}`);
    setResult(null);
    setError(null);
  };

  // ── Analysis ─────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!imageB64) { setError("Please upload or capture a currency note image."); return; }
    setLoading(true);
    setError(null);
    const fn = inputMode === "camera" ? analyzeCurrencyCamera : analyzeCurrency;
    const res = await fn(imageB64, selectedDenom);
    setLoading(false);
    if (res) setResult(res);
    else setError("Analysis failed. Please try again with a clearer image.");
  };

  // ── History ──────────────────────────────────────────────────────────────────

  const loadHistory = async () => {
    const res = await getCurrencyHistory(50);
    if (res) setHistory(res.items);
    setHistoryLoaded(true);
  };

  const handleTabChange = (tab: "analyze" | "history") => {
    setActiveTab(tab);
    if (tab === "history" && !historyLoaded) loadHistory();
  };

  const handleDelete = async (id: string) => {
    await deleteCurrencyAnalysis(id);
    setHistory(h => h.filter(i => i.analysis_id !== id));
  };

  const pred = result ? (PREDICTION_CONFIG[result.prediction as keyof typeof PREDICTION_CONFIG] ?? PREDICTION_CONFIG.Inconclusive) : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900/50 via-yellow-900/30 to-gray-900/50 border-b border-gray-800 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
            💴
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Counterfeit Currency Detection</h1>
            <p className="text-sm text-gray-400">AI-powered Indian currency note authenticity analysis</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {["14 Security Features", "7 Denominations", "OpenCV", "< 2s Analysis"].map(tag => (
              <span key={tag} className="text-xs bg-amber-900/50 border border-amber-700 text-amber-300 rounded-full px-3 py-1">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-6">
          {(["analyze", "history"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab ? "bg-amber-600 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "analyze" ? "🔍 Analyze Note" : "📋 History"}
            </button>
          ))}
        </div>

        {/* ── Analyze Tab ── */}
        {activeTab === "analyze" && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Input Panel */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-lg font-bold text-white mb-4">Submit Currency Note</h2>

                {/* Mode toggle */}
                <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-4">
                  {(["upload", "camera"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setInputMode(mode); setError(null); }}
                      className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                        inputMode === mode ? "bg-amber-600 text-white" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {mode === "upload" ? "📁 Upload" : "📷 Camera"}
                    </button>
                  ))}
                </div>

                {/* Upload */}
                {inputMode === "upload" && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragOver ? "border-amber-500 bg-amber-900/20" : "border-gray-700 bg-gray-800/20 hover:border-gray-600"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                    {preview ? (
                      <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain" />
                    ) : (
                      <>
                        <div className="text-4xl mb-2">💴</div>
                        <p className="text-sm text-gray-400">
                          Drop currency note image or <span className="text-amber-400">click to upload</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">JPEG, PNG, WEBP · Max 20 MB</p>
                      </>
                    )}
                  </div>
                )}

                {/* Camera */}
                {inputMode === "camera" && (
                  <CameraCapture onCapture={handleCameraCapture} />
                )}

                {/* Denomination selector */}
                <div className="mt-4">
                  <label className="block text-xs text-gray-400 mb-2">
                    Denomination (optional — auto-detected if not set)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedDenom(undefined)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        selectedDenom === undefined
                          ? "border-amber-500 bg-amber-600 text-white"
                          : "border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      Auto
                    </button>
                    {DENOMINATIONS.map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDenom(d)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          selectedDenom === d
                            ? "border-amber-500 bg-amber-600 text-white"
                            : "border-gray-700 text-gray-400 hover:border-gray-600"
                        }`}
                      >
                        ₹{d}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mt-3 text-xs text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">{error}</div>
                )}

                <button
                  id="analyze-currency-btn"
                  onClick={handleAnalyze}
                  disabled={loading || !imageB64}
                  className="mt-4 w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing…</>
                  ) : "🔍 Analyze Currency Note"}
                </button>
              </div>

              {/* Security features list */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Security Features Checked</h3>
                <ul className="grid grid-cols-2 gap-1 text-xs text-gray-400">
                  {["Security Thread","Watermark","Latent Image","Micro Lettering","Color Shift Ink","Serial Number","See-Through Register","RBI Logo","Governor's Signature","Ashoka Pillar","OVI","Alignment Marks","Dimensions","Texture Pattern"].map(f => (
                    <li key={f} className="flex items-center gap-1.5">
                      <span className="text-amber-500">▸</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Results Panel */}
            <div className="xl:col-span-3 space-y-4">
              {!result && !loading && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4 animate-pulse">💴</div>
                  <h3 className="text-lg font-bold text-gray-400 mb-2">Upload a Currency Note</h3>
                  <p className="text-sm text-gray-600">
                    Upload or capture any Indian currency note for AI-powered authenticity analysis.
                  </p>
                </div>
              )}

              {loading && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white font-semibold">Analyzing currency note…</p>
                  <p className="text-xs text-gray-400 mt-2">Enhancing image · Detecting denomination · Checking 14 security features</p>
                </div>
              )}

              {result && pred && (
                <>
                  {/* Prediction Banner */}
                  <div className={`rounded-2xl border p-5 ${pred.bg} ${pred.border}`}>
                    <div className="flex items-start gap-5">
                      <div className="flex flex-col items-center gap-3">
                        <RiskGauge value={result.confidence} label="Confidence" />
                        <div className={`text-center font-black text-lg ${pred.color}`}>
                          {pred.icon} {result.prediction.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          {result.denomination && (
                            <span className="text-3xl font-black text-amber-400">₹{result.denomination}</span>
                          )}
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${pred.badge} text-white`}>
                            {result.risk_level} RISK
                          </span>
                          {result.denomination && (
                            <span className="text-xs text-gray-400">
                              Denom confidence: {result.denomination_confidence.toFixed(0)}%
                            </span>
                          )}
                        </div>

                        {/* Feature pass/fail bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{result.features_passed} passed</span>
                            <span>{result.features_failed} failed</span>
                          </div>
                          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden flex">
                            <div
                              className="bg-green-500 h-full transition-all duration-700"
                              style={{ width: `${(result.features_passed / result.total_features) * 100}%` }}
                            />
                            <div
                              className="bg-red-500 h-full transition-all duration-700"
                              style={{ width: `${(result.features_failed / result.total_features) * 100}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1 text-right">
                            {result.features_passed}/{result.total_features} features verified
                          </div>
                        </div>

                        {/* Image quality */}
                        <div className="flex gap-3 flex-wrap text-xs">
                          {[
                            { label: "Resolution", val: result.image_quality.resolution },
                            { label: "Blur",   val: result.image_quality.is_blurry ? "⚠️ Blurry" : "✓ Sharp" },
                            { label: "Light",  val: result.image_quality.brightness_ok ? "✓ OK" : "⚠️ Poor" },
                          ].map(({ label, val }) => (
                            <div key={label} className="bg-gray-800 rounded-lg px-2.5 py-1">
                              <span className="text-gray-500">{label}: </span>
                              <span className="text-white">{val}</span>
                            </div>
                          ))}
                          <div className="bg-gray-800 rounded-lg px-2.5 py-1">
                            <span className="text-gray-500">Time: </span>
                            <span className="text-white">{result.processing_time_ms.toFixed(0)}ms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className={`rounded-2xl border p-4 ${pred.bg} ${pred.border}`}>
                    <h3 className="text-sm font-bold text-white mb-2">💡 Recommendation</h3>
                    <p className="text-sm text-gray-200">{result.recommendation}</p>
                  </div>

                  {/* Explanation */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white mb-2">📋 Analysis Explanation</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{result.explanation}</p>
                    <div className="mt-2 text-xs text-gray-500 font-mono">ID: {result.analysis_id}</div>
                  </div>

                  {/* Bounding box overlay + feature checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                      <h3 className="text-sm font-bold text-white mb-3">🎯 Detected Regions</h3>
                      {preview && <BoundingBoxOverlay result={result} imgSrc={preview} />}
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 overflow-y-auto max-h-96">
                      <h3 className="text-sm font-bold text-white mb-3">✓ Security Feature Checklist</h3>
                      <FeatureChecklist features={result.security_features} />
                    </div>
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
                <span className="ml-2 text-xs bg-gray-700 text-gray-300 rounded-full px-2 py-0.5">{history.length} records</span>
              </h2>
              <button onClick={loadHistory} className="text-xs text-amber-400 hover:text-amber-300 border border-amber-800 rounded-lg px-3 py-1.5">
                ↻ Refresh
              </button>
            </div>
            <HistoryTable items={history} onDelete={handleDelete} />
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}
