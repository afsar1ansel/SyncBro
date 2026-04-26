"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Save, User, Mail, Lock, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Build update object only with filled fields
      const updatePayload: any = {
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl,
      };
      
      if (formData.password) {
        updatePayload.password = formData.password;
      }

      const data = await api.put<{ success: boolean; message: string; user: any }>(
        "/api/users/profile",
        updatePayload
      );

      if (data.success) {
        setSuccess("Profile updated successfully!");
        await refreshUser(); // Update global auth state
        setFormData(prev => ({ ...prev, password: "" })); // Clear password field
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 pt-24">
      <div className="max-w-2xl mx-auto">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-zinc-500 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-zinc-400">Update your profile information and account security.</p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-2 border-blue-500/30 overflow-hidden bg-zinc-800 flex items-center justify-center shadow-2xl">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-zinc-600" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <ImageIcon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 uppercase font-bold tracking-widest">Profile Picture</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-950/50 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-950/50 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Avatar URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="text"
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleChange}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-950/50 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <p className="text-[10px] text-zinc-600 ml-1">Use a direct link to an image file.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="h-px bg-zinc-800 my-4" />
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-950/50 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Leave empty to keep current password"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                {success}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
              Save Changes
            </Button>
          </form>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
