"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { LogOut, LayoutDashboard, User, Globe } from "lucide-react";

export default function Home() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-zinc-50 font-sans">
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Next-Gen Collaboration
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent"
        >
          Sync Everything.<br />Everywhere.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl"
        >
          SyncBro is the ultimate platform for real-time synchronization and team collaboration. 
          Build, share, and stay connected with a premium experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {loading ? (
            <div className="h-12 w-32 animate-pulse rounded-xl bg-zinc-800" />
          ) : user ? (
            <>
              <Link href="/dashboard">
                <Button className="h-14 px-8 text-lg">
                  <LayoutDashboard size={20} className="mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              <Button variant="outline" onClick={logout} className="h-14 px-8 text-lg">
                <LogOut size={20} className="mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/register">
                <Button className="h-14 px-8 text-lg">Get Started Free</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="h-14 px-8 text-lg">Sign In</Button>
              </Link>
            </>
          )}
        </motion.div>
      </div>

      {/* Floating User Card if logged in */}
      {!loading && user && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-6 right-6 flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 backdrop-blur-md"
        >
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-white">{user.name}</span>
            <span className="text-xs text-zinc-500">{user.email}</span>
          </div>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-xl border border-zinc-800 object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>
      )}

      {/* Background decoration */}
      <div className="fixed inset-0 -z-50 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
