import Link from "next/link";

const features = [
  {
    icon: "🛡️",
    title: "Digital Arrest Prevention",
    desc: "Real-time NLP analysis detects impersonation, urgency manipulation, and authority spoofing in live calls and messages.",
    gradient: "from-blue-500 to-indigo-600",
    glow: "group-hover:shadow-blue-500/20",
  },
  {
    icon: "🕸️",
    title: "Fraud Network Intelligence",
    desc: "Graph-based visualization connecting scammers, mule accounts, and victim patterns to dismantle organized crime rings.",
    gradient: "from-indigo-500 to-purple-600",
    glow: "group-hover:shadow-indigo-500/20",
  },
  {
    icon: "💵",
    title: "Counterfeit Detection",
    desc: "Computer vision models scan physical currency in real-time, identifying fake security features and anomalies instantly.",
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-emerald-500/20",
  },
  {
    icon: "🔗",
    title: "Phishing URL Scanner",
    desc: "Instantly verify suspicious links and SMS messages for phishing patterns, malicious redirects, and social engineering.",
    gradient: "from-purple-500 to-fuchsia-600",
    glow: "group-hover:shadow-purple-500/20",
  },
  {
    icon: "🗺️",
    title: "Crime Heatmap Intelligence",
    desc: "Geospatial AI visualizes fraud hotspots in real-time, enabling preemptive deployment and resource allocation.",
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-500/20",
  },
  {
    icon: "🎙️",
    title: "Deepfake Voice Detection",
    desc: "AI-powered voice analysis identifies synthetic and cloned audio used in sophisticated impersonation scams.",
    gradient: "from-rose-500 to-red-600",
    glow: "group-hover:shadow-rose-500/20",
  },
];

const stats = [
  { value: "2.8L+", label: "Scam Calls Blocked", icon: "📞" },
  { value: "₹140Cr", label: "Fraud Prevented", icon: "💰" },
  { value: "98.7%", label: "Detection Accuracy", icon: "🎯" },
  { value: "15ms", label: "Response Time", icon: "⚡" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 overflow-hidden relative font-sans">
      {/* ═══ Background Orbs ═══ */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-blue-600/15 blur-[150px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/15 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* ═══ Navbar ═══ */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30 animate-pulse-glow">
            S
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400">
            SurakshaAI
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <a href="#features" className="text-slate-400 hover:text-white transition-colors hidden sm:block">
            Features
          </a>
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors hidden sm:block">
            Dashboard
          </Link>
          <Link href="/login" className="text-slate-400 hover:text-white transition-colors hidden sm:block">
            Login
          </Link>
          <Link
            href="/citizen"
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all text-xs font-bold"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-8 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          AI-Powered Public Safety Intelligence
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.95] animate-fade-in-up">
          Predict. Prevent.
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-gradient-shift">
            Protect.
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed animate-fade-in-up delay-200 opacity-0">
          Next-generation AI platform designed to proactively detect, prevent,
          and respond to digital fraud and organized cybercrime networks —
          before citizens become victims.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up delay-300 opacity-0">
          <Link
            href="/citizen"
            className="group relative px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold shadow-[0_0_50px_rgba(255,255,255,0.08)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative flex items-center justify-center gap-2">
              🛡️ Citizen Portal
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
          <Link
            href="/police"
            className="px-8 py-4 bg-slate-800/60 hover:bg-slate-700/60 text-white rounded-2xl font-bold border border-slate-700 backdrop-blur-md transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            🚔 Police Command Center
          </Link>
        </div>
      </main>

      {/* ═══ Stats Bar ═══ */}
      <section id="stats" className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-blue-500/30 transition-all group"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-3xl md:text-4xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Features Grid ═══ */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Six Modules.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              One Platform.
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            A comprehensive AI ecosystem protecting citizens and empowering law
            enforcement across every attack vector.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className={`group relative p-7 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/50 backdrop-blur-sm hover:border-slate-600 transition-all hover:-translate-y-1 hover:shadow-xl ${f.glow}`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform`}
              >
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA Banner ═══ */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 shadow-2xl shadow-blue-900/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 relative z-10">
            Ready to make your city safer?
          </h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto relative z-10">
            Join the AI-powered fight against digital fraud. Whether you&apos;re a
            citizen or law enforcement, SurakshaAI has you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link
              href="/citizen"
              className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Get Protected Now
            </Link>
            <Link
              href="/police"
              className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Access Command Center
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="relative z-10 border-t border-slate-800 py-10 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-bold text-sm text-slate-400">SurakshaAI</span>
          </div>
          <p className="text-xs text-slate-600">
            Built for India&apos;s safety. Powered by AI. © 2026 SurakshaAI
          </p>
        </div>
      </footer>
    </div>
  );
}
