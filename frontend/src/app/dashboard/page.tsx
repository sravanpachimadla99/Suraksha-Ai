"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserProfile, getUserActivity, logoutUser } from "@/lib/auth";

const features = [
  {
    icon: "📞",
    label: "Scam Call Detector",
    desc: "Analyze calls & transcripts with NLP",
    href: "/scam-call-detector",
    gradient: "from-blue-500 to-indigo-600",
    glow: "shadow-blue-500/20",
    badge: "AI",
  },
  {
    icon: "🔗",
    label: "Website / URL Scanner",
    desc: "Detect phishing & fake sites instantly",
    href: "/website-detection",
    gradient: "from-purple-500 to-fuchsia-600",
    glow: "shadow-purple-500/20",
    badge: "Live",
  },
  {
    icon: "💵",
    label: "Currency Detector",
    desc: "Scan notes for counterfeits via camera",
    href: "/currency-detection",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    badge: "CV",
  },
  {
    icon: "📷",
    label: "QR Code Scanner",
    desc: "Expose malicious QR code payloads",
    href: "/qr-detection",
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
    badge: "Scan",
  },
  {
    icon: "🕸️",
    label: "Fraud Network Intel",
    desc: "Graph-based fraud network visualizer",
    href: "/fraud-intelligence",
    gradient: "from-indigo-500 to-purple-600",
    glow: "shadow-indigo-500/20",
    badge: "Graph",
  },
  {
    icon: "🗺️",
    label: "Crime Heatmap",
    desc: "Real-time geospatial fraud hotspots",
    href: "/geo-intelligence",
    gradient: "from-rose-500 to-red-600",
    glow: "shadow-rose-500/20",
    badge: "Geo",
  },
  {
    icon: "🤖",
    label: "AI Assistant",
    desc: "Chat with your personal Fraud Shield",
    href: "/citizen-assistant",
    gradient: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/20",
    badge: "GPT",
  },
  {
    icon: "🚨",
    label: "Emergency Report",
    desc: "Generate court-ready evidence reports",
    href: "/emergency-reporting",
    gradient: "from-red-500 to-rose-600",
    glow: "shadow-red-500/20",
    badge: "SOS",
  },
  {
    icon: "📊",
    label: "Threat Prediction",
    desc: "AI-based upcoming fraud trend alerts",
    href: "/threat-prediction",
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    badge: "ML",
  },
  {
    icon: "🏦",
    label: "Bank & Telecom Intel",
    desc: "Investigate suspicious financial entities",
    href: "/bank-telecom-intel",
    gradient: "from-cyan-500 to-teal-600",
    glow: "shadow-cyan-500/20",
    badge: "Intel",
  },
];

const statusColor: Record<string, string> = {
  "Critical Threat Detected": "bg-red-500/10 text-red-400 border-red-500/20",
  "Under Investigation":      "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Resolved:                   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function DashboardPage() {
  const [profile, setProfile]     = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUserProfile();
        setProfile(user);
        const activityData = await getUserActivity();
        setActivities(activityData.activities || []);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = () => {
    logoutUser();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-blue-500/30">
            S
          </div>
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const firstName = profile?.name?.split(" ")[0] || "User";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Background glow */}
      <div className="fixed top-[-20%] right-[-10%] w-[55%] h-[55%] bg-blue-600/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-700/8 blur-[140px] rounded-full pointer-events-none" />

      {/* ═══ Top Bar ═══ */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
                S
              </div>
            </Link>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              SurakshaAI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">{profile?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-white font-medium border border-slate-700 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">

        {/* ═══ Welcome Banner ═══ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-purple-900/30 border border-blue-500/20 rounded-3xl p-8 mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">👋</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {firstName}!
              </h1>
            </div>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Your Suraksha AI protection suite is fully active. Use any tool below to detect fraud, scan suspicious links, verify currency, and stay safe online.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                href="/citizen"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-0.5"
              >
                🛡️ Open Citizen Shield
              </Link>
              <Link
                href="/emergency-reporting"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-bold rounded-xl border border-red-500/30 transition-all hover:-translate-y-0.5"
              >
                🚨 Emergency Report
              </Link>
            </div>
          </div>
        </div>

        {/* ═══ Stats Row ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Reports Filed",    value: activities.filter((a) => a.type.includes("Report")).length, icon: "📋", color: "text-blue-400" },
            { label: "Phishing Scans",   value: activities.filter((a) => a.type.includes("Scan")).length,   icon: "🔍", color: "text-purple-400" },
            { label: "Investigating",    value: activities.filter((a) => a.status.includes("Investigation")).length, icon: "⚖️", color: "text-amber-400" },
            { label: "Threats Blocked",  value: activities.filter((a) => a.status.includes("Critical")).length, icon: "🛡️", color: "text-emerald-400" },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ═══ All Features ═══ */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <span className="text-blue-400">⚡</span> All Features
            <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              {features.length} tools
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <Link
                key={i}
                href={f.href}
                className={`group relative bg-slate-900/60 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:${f.glow} flex flex-col gap-3`}
              >
                {/* Badge */}
                <span className="absolute top-3 right-3 text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                  {f.badge}
                </span>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>

                {/* Text */}
                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">
                    {f.label}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>

                {/* Arrow */}
                <div className="mt-auto pt-2 flex items-center gap-1 text-xs text-slate-600 group-hover:text-blue-400 transition-colors font-medium">
                  Open <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ═══ Recent Activity ═══ */}
        <div>
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <span className="text-blue-400">🕐</span> Recent Activity
          </h2>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            {activities.length > 0 ? (
              <ul className="divide-y divide-slate-800/60">
                {activities.map((activity, idx) => {
                  const colorClass = statusColor[activity.status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
                  return (
                    <li key={idx} className="p-5 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-200">{activity.type}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-500">
                            {activity.id}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{activity.description}</p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-1 shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${colorClass}`}>
                          {activity.status}
                        </span>
                        <span className="text-xs text-slate-500">{activity.date}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-14 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-slate-400 font-medium mb-2">No activity yet</p>
                <p className="text-slate-500 text-sm mb-4">Use any feature above to get started</p>
                <Link href="/citizen" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  Open Citizen Shield →
                </Link>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
