"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ShieldAlert, 
  QrCode,
  ScanLine,
  Activity,
  ClipboardPaste,
  Shield,
  CreditCard,
  Link as LinkIcon
} from "lucide-react";

import { 
  analyzeQRImage, 
  analyzeQRScan, 
  QRAnalysisResult 
} from "@/lib/api";

const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function QRDetectionPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "camera">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QRAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(ms);
      if (videoRef.current) {
        videoRef.current.srcObject = ms;
      }
    } catch (err) {
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab]);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (activeTab !== "upload") return;
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        const blob = item.getAsFile();
        if (blob) {
          setFile(blob);
          setPreview(URL.createObjectURL(blob));
          setError(null);
          setResult(null);
        }
      }
    }
  };

  useEffect(() => {
    document.addEventListener("paste", handlePaste as any);
    return () => document.removeEventListener("paste", handlePaste as any);
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type.startsWith("image/")) {
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setError(null);
        setResult(null);
      }
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeQRScan(dataUrl);
      if (res) setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze QR from camera");
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const b64 = await toBase64(file);
      const res = await analyzeQRImage(b64, file.name);
      if (res) setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze uploaded image");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <QrCode className="w-8 h-8 text-indigo-400" />
          QR Code Fraud Detection
        </h1>
        <p className="text-gray-400 max-w-3xl">
          Scan or upload a QR code to decode its payload and analyze it for potential threats, including fake UPI IDs and phishing URLs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveTab("upload")}
                className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "upload" 
                  ? "bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500" 
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                Upload Image
              </button>
              <button
                onClick={() => setActiveTab("camera")}
                className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "camera" 
                  ? "bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500" 
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <Camera className="w-4 h-4" />
                Scan Camera
              </button>
            </div>

            <div className="p-6">
              {activeTab === "upload" && (
                <div className="space-y-6">
                  {!preview ? (
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-colors cursor-pointer relative group"
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8 text-indigo-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-200 mb-1">Click or drag image here</p>
                      <p className="text-xs text-slate-500 mb-4">PNG, JPG, WEBP up to 20MB</p>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full">
                        <ClipboardPaste className="w-3 h-3" />
                        You can also paste from clipboard
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center min-h-[300px]">
                        <img src={preview} alt="Preview" className="max-h-[400px] object-contain" />
                        {loading && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                            <ScanLine className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
                            <p className="text-sm font-medium text-indigo-200 animate-pulse">Analyzing Payload...</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={reset}
                          disabled={loading}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          Clear
                        </button>
                        <button 
                          onClick={analyzeImage}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loading ? (
                            <Activity className="w-4 h-4 animate-spin" />
                          ) : (
                            <QrCode className="w-4 h-4" />
                          )}
                          Analyze Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "camera" && (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center min-h-[300px]">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full max-h-[400px] object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Scanner overlay */}
                    <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
                      <div className="w-full h-full border-2 border-indigo-500/50 relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1"></div>
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                      </div>
                    </div>

                    {loading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                        <Activity className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                        <p className="text-sm font-medium text-indigo-200">Processing frame...</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={captureAndAnalyze}
                    disabled={loading || !stream}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ScanLine className="w-5 h-5" />
                    Capture & Analyze
                  </button>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 border border-slate-800 rounded-xl bg-slate-900/50 min-h-[400px]"
              >
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                  <Shield className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-medium text-slate-300 mb-2">No QR Analyzed Yet</h3>
                <p className="text-slate-500 max-w-sm">
                  Upload an image or scan a code to decode its payload and assess its security risk.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Status Header */}
                <div className={`p-6 rounded-xl border ${
                  result.prediction === "Safe" ? "bg-emerald-500/10 border-emerald-500/20" :
                  result.prediction === "Suspicious" ? "bg-amber-500/10 border-amber-500/20" :
                  result.prediction === "Malicious" ? "bg-red-500/10 border-red-500/20" :
                  "bg-slate-800/50 border-slate-700"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {result.prediction === "Safe" && <CheckCircle className="w-10 h-10 text-emerald-500" />}
                      {result.prediction === "Suspicious" && <AlertTriangle className="w-10 h-10 text-amber-500" />}
                      {result.prediction === "Malicious" && <ShieldAlert className="w-10 h-10 text-red-500" />}
                      {result.prediction === "Unreadable" && <Info className="w-10 h-10 text-slate-500" />}
                      
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {result.prediction}
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-medium text-slate-400">
                            Confidence: <span className="text-slate-300">{result.confidence.toFixed(1)}%</span>
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                          <span className="text-sm font-medium text-slate-400">
                            Risk Level: <span className={
                              result.risk_level === "Critical" ? "text-red-400" :
                              result.risk_level === "High" ? "text-amber-400" :
                              result.risk_level === "Medium" ? "text-yellow-400" :
                              "text-emerald-400"
                            }>{result.risk_level}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-300">{result.recommendation}</p>
                </div>

                {/* Content Card */}
                {result.decoded_content && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      Decoded Payload
                    </h3>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-slate-800 text-indigo-400 rounded-full text-xs font-semibold">
                        {result.qr_type}
                      </span>
                      <span className="text-xs text-slate-500">{result.processing_time_ms}ms</span>
                    </div>

                    <div className="bg-black/50 p-4 rounded-lg border border-slate-800 break-all">
                      <code className="text-sm text-slate-300 font-mono">
                        {result.decoded_content}
                      </code>
                    </div>

                    {/* Specific Info (UPI / URL) */}
                    {(result.upi_id || result.merchant_name) && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-lg flex items-start gap-3">
                          <CreditCard className="w-5 h-5 text-indigo-400 shrink-0" />
                          <div>
                            <p className="text-xs text-slate-500 mb-1">UPI ID</p>
                            <p className="text-sm text-slate-200 font-medium">{result.upi_id || "Unknown"}</p>
                          </div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg flex items-start gap-3">
                          <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Merchant Name</p>
                            <p className="text-sm text-slate-200 font-medium">{result.merchant_name || "Unknown"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Threats List */}
                {result.threats && result.threats.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Threat Indicators
                    </h3>
                    <div className="space-y-3">
                      {result.threats.map((threat, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                          <div className={`mt-0.5 shrink-0 ${
                            threat.severity === 'critical' ? 'text-red-500' :
                            threat.severity === 'high' ? 'text-orange-500' :
                            threat.severity === 'medium' ? 'text-yellow-500' :
                            'text-slate-400'
                          }`}>
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-200">{threat.name}</h4>
                            <p className="text-sm text-slate-400 mt-1">{threat.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
