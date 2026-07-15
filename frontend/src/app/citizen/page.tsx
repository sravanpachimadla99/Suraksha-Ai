"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Link from "next/link";
import {
  analyzeCall,
  checkText,
  submitReport,
  type AnalyzeCallResult,
  type TextCheckResult,
  type FraudReportResult,
} from "@/lib/api";

// ── Tabs ──────────────────────────────────────────────────
type Tab = "shield" | "reports" | "education";
const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: "shield", icon: "🛡️", label: "Shield" },
  { id: "reports", icon: "📋", label: "Reports" },
  { id: "education", icon: "📚", label: "Tips" },
];

// ── Mock reports ──────────────────────────────────────────
const mockReports = [
  {
    status: "Under Investigation",
    statusColor: "bg-amber-100 text-amber-700",
    date: "Jul 10, 2026",
    title: "Suspicious WhatsApp Call",
    summary:
      "Received a video call from an unknown international number claiming to be Mumbai Police Cyber Crime Unit...",
  },
  {
    status: "Resolved",
    statusColor: "bg-emerald-100 text-emerald-700",
    date: "Jun 22, 2026",
    title: "Phishing SMS — KYC Update",
    summary:
      'Received SMS asking to "update KYC" via a suspicious link mimicking SBI banking portal...',
  },
  {
    status: "Submitted",
    statusColor: "bg-blue-100 text-blue-700",
    date: "Jul 12, 2026",
    title: "Counterfeit ₹500 Note",
    summary:
      "Received a suspicious ₹500 note at local shop. Missing security thread and watermark appears blurred...",
  },
];

// ── Safety Tips ──────────────────────────────────────────
const safetyTips = [
  {
    icon: "🚫",
    title: "Police Never Ask for Money",
    body: "Real police officers will NEVER ask you to transfer money to any account, buy gift cards, or share OTPs. If someone claims to be police and demands money, hang up immediately.",
    severity: "critical",
  },
  {
    icon: "🔒",
    title: "Verify Before You Click",
    body: "Always check URLs carefully. Official bank websites use HTTPS and their registered domain. Never click links from unsolicited SMS or WhatsApp messages.",
    severity: "high",
  },
  {
    icon: "📞",
    title: "\"Digital Arrest\" is Fake",
    body: "There is NO legal concept of 'digital arrest' in India. If someone threatens you with it, they are a scammer. Report to Cyber Crime helpline 1930.",
    severity: "critical",
  },
  {
    icon: "💳",
    title: "Never Share OTP/CVV",
    body: "Your OTP, CVV, and PIN are confidential. No bank, government agency, or delivery service will ever ask for these details over phone or message.",
    severity: "high",
  },
  {
    icon: "🔍",
    title: "Check Currency Security Features",
    body: "Genuine notes have a security thread, watermark, color-shifting ink, and microprinting. Use SurakshaAI's scanner to verify suspicious notes.",
    severity: "medium",
  },
  {
    icon: "📱",
    title: "Report Immediately",
    body: "If you suspect fraud, report to the National Cyber Crime Reporting Portal (cybercrime.gov.in) or dial 1930 within 24 hours for fastest action.",
    severity: "medium",
  },
];

export default function CitizenApp() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("shield");

  // ── Scam call modal ──
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callResult, setCallResult] = useState<AnalyzeCallResult | null>(null);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);

  // ── URL check modal ──
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [urlResult, setUrlResult] = useState<TextCheckResult | null>(null);
  const urlInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Report modal ──
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportResult, setReportResult] = useState<FraudReportResult | null>(null);
  const reportCategoryRef = useRef<HTMLSelectElement>(null);
  const reportDescRef = useRef<HTMLTextAreaElement>(null);
  const reportContactRef = useRef<HTMLInputElement>(null);

  // ── Handlers ──
  const handleAnalyze = async () => {
    if (!transcriptRef.current) return;
    setIsAnalyzing(true);
    setCallResult(null);
    const result = await analyzeCall(transcriptRef.current.value);
    setCallResult(result);
    setIsAnalyzing(false);
  };

  const handleCheckUrl = async () => {
    if (!urlInputRef.current) return;
    setIsCheckingUrl(true);
    setUrlResult(null);
    const result = await checkText(urlInputRef.current.value);
    setUrlResult(result);
    setIsCheckingUrl(false);
  };

  const handleReport = async () => {
    if (!reportCategoryRef.current || !reportDescRef.current) return;
    setIsReporting(true);
    setReportResult(null);
    const result = await submitReport(
      reportCategoryRef.current.value,
      reportDescRef.current.value,
      reportContactRef.current?.value
    );
    setReportResult(result);
    setIsReporting(false);
  };

  const closeModal = (setter: (v: boolean) => void, resultSetter: (v: any) => void) => () => {
    setter(false);
    resultSetter(null);
  };

  // ── Action buttons config ──
  const actions = [
    {
      icon: "📸",
      label: "Scan Currency",
      desc: "Check fake notes",
      gradient: "from-green-500 to-emerald-600",
      shadow: "shadow-green-500/10",
      onClick: () => router.push("/currency-detection"),
    },
    {
      icon: "🔗",
      label: "Check URL/SMS",
      desc: "Verify links & texts",
      gradient: "from-purple-500 to-fuchsia-600",
      shadow: "shadow-purple-500/10",
      onClick: () => router.push("/website-detection"),
    },
    {
      icon: "🤖",
      label: "AI Assistant",
      desc: "Chat with Fraud Shield",
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/10",
      onClick: () => router.push("/citizen-assistant"),
    },
    {
      icon: "🚨",
      label: "Emergency Report",
      desc: "Generate court evidence",
      gradient: "from-red-500 to-rose-600",
      shadow: "shadow-red-500/10",
      onClick: () => router.push("/emergency-reporting"),
    },
  ];

  const playSiren = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.0);
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.error("Audio Context not supported", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* ═══ Gradient Header Background ═══ */}
      <div className="absolute top-0 w-full h-72 bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 rounded-b-[50px] -z-10" />

      {/* ═══ Header ═══ */}
      <header className="text-white p-5 pt-8 sticky top-0 z-20 flex justify-between items-center backdrop-blur-md bg-blue-600/10">
        <div>
          <Link href="/" className="block">
            <h1 className="text-2xl font-extrabold tracking-tight">SurakshaAI</h1>
          </Link>
          <p className="text-sm text-blue-200 font-medium">Citizen Fraud Shield</p>
        </div>
        <button 
          onClick={playSiren}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-red-500/40 transition-all active:scale-95 flex items-center gap-2 hover:-translate-y-0.5"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          SOS
        </button>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 p-5 overflow-y-auto pb-28 z-0 scrollbar-hide">
        {/* ──── Shield Tab ──── */}
        {activeTab === "shield" && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Status Card */}
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-white/50 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent" />
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 relative animate-pulse-glow">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-extrabold text-slate-800 mb-1">Shield Active</h2>
                <p className="text-sm text-slate-500 font-medium">Monitoring calls & messages securely.</p>
                <button
                  onClick={() => setCallModalOpen(true)}
                  className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 active:scale-95"
                >
                  ⚡ Test AI Detection
                </button>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              {actions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className={`bg-white p-5 rounded-3xl shadow-lg ${item.shadow} border border-slate-100 flex flex-col items-start gap-3 hover:-translate-y-1 transition-all active:scale-95 group`}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md`}>
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.label}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Live Alert */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
              <h3 className="text-red-700 font-bold mb-1.5 flex items-center gap-2 text-sm pl-2">
                <span className="bg-red-100 text-red-600 p-1 rounded-md text-xs">⚠️ Alert</span>
                Trending in your area
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed pl-2">
                &quot;FedEx Customs&quot; digital arrest scams are surging. Police will NEVER ask you to transfer money to &quot;secure accounts&quot;. Report to 1930.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Threats Blocked", value: "24", color: "text-red-600" },
                { label: "Scans Today", value: "12", color: "text-blue-600" },
                { label: "Safety Score", value: "96%", color: "text-emerald-600" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
                  <div className={`text-2xl font-black ${s.color} mb-0.5`}>{s.value}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──── Reports Tab ──── */}
        {activeTab === "reports" && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-extrabold text-xl text-slate-800">My Reports</h2>
              <button
                onClick={() => setReportModalOpen(true)}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full font-bold shadow-sm hover:bg-blue-700 transition-colors"
              >
                + New Report
              </button>
            </div>
            {mockReports.map((r, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.statusColor}`}>{r.status}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{r.date}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{r.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{r.summary}</p>
              </div>
            ))}
          </div>
        )}

        {/* ──── Education / Tips Tab ──── */}
        {activeTab === "education" && (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="font-extrabold text-xl text-slate-800 mb-2">Safety Tips</h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">Stay informed. Stay safe. Learn how to protect yourself from common scams.</p>
            {safetyTips.map((tip, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-shadow hover:shadow-md ${
                  tip.severity === "critical"
                    ? "border-red-200 bg-gradient-to-r from-red-50/50 to-white"
                    : tip.severity === "high"
                    ? "border-amber-200 bg-gradient-to-r from-amber-50/50 to-white"
                    : "border-slate-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      tip.severity === "critical"
                        ? "bg-red-100"
                        : tip.severity === "high"
                        ? "bg-amber-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {tip.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 mb-1">{tip.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{tip.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ═══ Bottom Navigation ═══ */}
      <nav className="bg-white/90 backdrop-blur-xl border-t border-slate-200/50 flex justify-around p-2 pb-safe sticky bottom-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-3 w-20 rounded-2xl transition-all ${
              activeTab === tab.id
                ? "bg-blue-50 text-blue-600 scale-105"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className={`text-xl mb-1 ${activeTab === tab.id ? "animate-bounce" : ""}`}>{tab.icon}</span>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ═══════════════════════════════════════════════════
           MODALS
         ═══════════════════════════════════════════════════ */}

      {/* ── Call Analysis Modal ── */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white text-center shrink-0">
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="font-bold text-lg">AI Call Analyzer</h3>
              <p className="text-blue-200 text-xs">Paste a suspicious call transcript</p>
            </div>
            <div className="p-5 overflow-y-auto">
              <label className="block text-sm font-bold text-slate-700 mb-2">Call Transcript</label>
              <textarea
                ref={transcriptRef}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                rows={4}
                defaultValue="This is the police. Your Aadhaar is linked to money laundering. We are freezing your account immediately. Transfer ₹2 lakh to this secure account."
              />

              {callResult && (
                <div className={`mt-4 p-4 rounded-xl border animate-fade-in-up ${callResult.risk_percentage > 50 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`font-bold text-sm ${callResult.risk_percentage > 50 ? "text-red-700" : "text-green-700"}`}>
                      {callResult.risk_percentage > 50 ? "⚠️ SCAM DETECTED" : "✅ Looks Safe"}
                    </span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${callResult.risk_percentage > 50 ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}>
                      {callResult.risk_percentage}% Risk
                    </span>
                  </div>
                  {callResult.reasons && (
                    <ul className="text-xs text-slate-600 list-disc pl-4 mb-3 space-y-1">
                      {callResult.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                  <div className="text-xs font-medium text-slate-800 bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold block mb-1">💡 Recommendation:</span>
                    {callResult.recommendation}
                  </div>
                </div>
              )}

              <div className="mt-5 flex gap-3 shrink-0">
                <button onClick={closeModal(setCallModalOpen, setCallResult)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                  Close
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`flex-1 py-3 ${isAnalyzing ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"} text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition-colors flex justify-center items-center`}
                >
                  {isAnalyzing ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : "⚡ Analyze"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── URL/SMS Check Modal ── */}
      {urlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-5 text-white text-center shrink-0">
              <div className="text-3xl mb-2">🔗</div>
              <h3 className="font-bold text-lg">URL / SMS Checker</h3>
              <p className="text-purple-200 text-xs">Paste a suspicious link or message</p>
            </div>
            <div className="p-5 overflow-y-auto">
              <label className="block text-sm font-bold text-slate-700 mb-2">Suspicious Text / URL</label>
              <textarea
                ref={urlInputRef}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-none"
                rows={3}
                defaultValue="Dear customer, your SBI account has been blocked. Update KYC immediately: http://sbi-secure-update.tk/kyc"
              />

              {urlResult && (
                <div className={`mt-4 p-4 rounded-xl border animate-fade-in-up ${!urlResult.is_safe ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-bold text-sm ${!urlResult.is_safe ? "text-red-700" : "text-green-700"}`}>
                      {!urlResult.is_safe ? "🚨 PHISHING DETECTED" : "✅ Appears Safe"}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${!urlResult.is_safe ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}>
                      {urlResult.risk_level} Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{urlResult.analysis}</p>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button onClick={closeModal(setUrlModalOpen, setUrlResult)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                  Close
                </button>
                <button
                  onClick={handleCheckUrl}
                  disabled={isCheckingUrl}
                  className={`flex-1 py-3 ${isCheckingUrl ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700"} text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/30 transition-colors flex justify-center items-center`}
                >
                  {isCheckingUrl ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : "🔍 Scan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Fraud Modal ── */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white text-center shrink-0">
              <div className="text-3xl mb-2">🚨</div>
              <h3 className="font-bold text-lg">Report Fraud</h3>
              <p className="text-red-200 text-xs">File a complaint — we&apos;ll investigate</p>
            </div>
            <div className="p-5 overflow-y-auto">
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <select
                ref={reportCategoryRef}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option>Digital Arrest / Impersonation</option>
                <option>UPI / Banking Fraud</option>
                <option>Phishing SMS / Email</option>
                <option>Counterfeit Currency</option>
                <option>Job / Loan Scam</option>
                <option>Other</option>
              </select>

              <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
              <textarea
                ref={reportDescRef}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
                placeholder="Describe what happened..."
              />

              <label className="block text-sm font-bold text-slate-700 mb-1">Contact (optional)</label>
              <input
                ref={reportContactRef}
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Phone or email"
              />

              {reportResult && (
                <div className="mt-2 p-4 rounded-xl border bg-emerald-50 border-emerald-200 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-700 font-bold text-sm">✅ {reportResult.status}</span>
                  </div>
                  <p className="text-xs text-slate-600">{reportResult.message}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">ID: {reportResult.report_id}</p>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button onClick={closeModal(setReportModalOpen, setReportResult)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={isReporting}
                  className={`flex-1 py-3 ${isReporting ? "bg-red-400" : "bg-red-600 hover:bg-red-700"} text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/30 transition-colors flex justify-center items-center`}
                >
                  {isReporting ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : "📤 Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
