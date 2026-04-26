"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Gamepad2, 
  Zap, 
  CheckCircle2, 
  Users,
  ChevronRight,
  MonitorPlay
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            SyncBro
          </span>
        </div>
        <div className="flex items-center gap-4">
          {!loading && user ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Dashboard
              </Link>
              <div className="h-8 w-8 rounded-full border border-zinc-800 overflow-hidden bg-blue-600 flex items-center justify-center text-xs font-bold">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/register">
                <button className="px-5 py-2 rounded-full bg-zinc-800/50 border border-white/10 text-sm font-semibold hover:bg-zinc-700 transition-all active:scale-95 backdrop-blur-md">
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 md:px-12 pt-12 pb-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] md:text-xs font-bold text-cyan-400 uppercase tracking-widest mb-8">
              Chat • Call • Stream • Hangout
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black leading-[1.1] tracking-tight mb-8">
              Your Crew. <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                One Place.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-lg mb-10 leading-relaxed">
              Meet friends instantly with seamless chat, crystal-clear calls, watch parties, and private spaces built for real connection.
            </p>

            <div className="flex flex-wrap gap-4">
              {loading ? (
                <div className="h-14 w-32 rounded-2xl bg-zinc-900 animate-pulse" />
              ) : user ? (
                <>
                  <Link href="/dashboard">
                    <button className="h-14 px-8 rounded-2xl bg-cyan-400 text-black font-bold text-lg hover:bg-cyan-300 transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-95">
                      Enter Workspace
                    </button>
                  </Link>
                  <button className="h-14 px-8 rounded-2xl bg-zinc-900/50 border border-white/10 text-white font-bold text-lg hover:bg-zinc-800 transition-all backdrop-blur-md active:scale-95">
                    View Rooms
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <button className="h-14 px-8 rounded-2xl bg-cyan-400 text-black font-bold text-lg hover:bg-cyan-300 transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-95">
                      Start Free
                    </button>
                  </Link>
                  <button className="h-14 px-8 rounded-2xl bg-zinc-900/50 border border-white/10 text-white font-bold text-lg hover:bg-zinc-800 transition-all backdrop-blur-md active:scale-95">
                    Live Demo
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Right Side Feature Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 p-6 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5" />
            
            <FeatureCard 
              icon={<MessageSquare size={24} className="text-zinc-400" />} 
              title="Group Chat" 
              color="bg-white/5"
            />
            <FeatureCard 
              icon={<Phone size={24} className="text-pink-500" />} 
              title="HD Calls" 
              color="bg-pink-500/10"
            />
            <FeatureCard 
              icon={<MonitorPlay size={24} className="text-purple-500" />} 
              title="Watch Party" 
              color="bg-purple-500/10"
            />
            <FeatureCard 
              icon={<Gamepad2 size={24} className="text-indigo-500" />} 
              title="Fun Rooms" 
              color="bg-indigo-500/10"
            />
          </motion.div>
        </div>

        {/* Bottom Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mt-32"
        >
          <BottomCard 
            title="Instant Rooms"
            desc="Create private spaces in seconds."
          />
          <BottomCard 
            title="Zero Friction"
            desc="Join with one tap. No hassle."
          />
          <BottomCard 
            title="Built for Friends"
            desc="Designed for fun, not meetings."
          />
        </motion.div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 px-6 py-12 text-center text-zinc-600 text-sm border-t border-white/5">
        &copy; {new Date().getFullYear()} SyncBro. Premium Collaborative Workspace.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, color }: { icon: React.ReactNode, title: string, color: string }) {
  return (
    <div className={`aspect-square md:aspect-video rounded-3xl ${color} border border-white/5 p-6 flex flex-col justify-center gap-4 hover:border-white/20 transition-all group`}>
      <div className="w-12 h-12 rounded-2xl bg-zinc-900/50 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-bold text-zinc-300 tracking-tight">{title}</h3>
    </div>
  );
}

function BottomCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 hover:bg-zinc-900/50 transition-all backdrop-blur-sm group">
      <h4 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{title}</h4>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
