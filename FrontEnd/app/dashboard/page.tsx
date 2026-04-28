"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Layout, Users, ChevronRight, Loader2, Trash2, Settings, LogOut, X, Globe, Lock } from "lucide-react";

interface Room {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  ownerId: string;
  owner?: { name: string };
  onlineCount?: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRooms = async () => {
    try {
      const data = await api.get<{ success: boolean; rooms: Room[] }>("/api/rooms");
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      setCreating(true);
      const data = await api.post<{ success: boolean; room: Room }>("/api/rooms", {
        name: newRoomName,
        isPublic,
      });
      if (data.success) {
        setRooms([data.room, ...rooms]);
        setNewRoomName("");
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("Are you sure you want to delete this room? This action cannot be undone.")) return;

    try {
      const data = await api.delete<{ success: boolean }>(`/api/rooms/${roomId}`);
      if (data.success) {
        setRooms(rooms.filter(r => r.id !== roomId));
      }
    } catch (error) {
      console.error("Failed to delete room:", error);
      alert("Failed to delete room. Please try again.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              Welcome back, {user.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-zinc-400">Manage your collaborative rooms and sync in real-time.</p>
              <div className="h-4 w-px bg-zinc-800" />
              <Link 
                href="/settings" 
                className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-blue-400 transition-colors uppercase tracking-widest"
              >
                <Settings size={14} />
                Settings
              </Link>
              <button 
                onClick={() => logout()}
                className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)} className="h-12 px-6">
            <Plus size={20} className="mr-2" />
            Create Room
          </Button>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20">
            <Layout size={48} className="text-zinc-700 mb-4" />
            <h3 className="text-xl font-medium text-zinc-400 mb-2">No rooms yet</h3>
            <p className="text-zinc-500 mb-8">Create your first room to start collaborating.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline">
              <Plus size={20} className="mr-2" />
              Create Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col justify-between p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:border-blue-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600/10 text-blue-500">
                      <Layout size={20} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${room.isPublic ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {room.isPublic ? 'Public' : 'Private'}
                    </span>
                    
                    {room.ownerId === user.id && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteRoom(room.id);
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Room"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{room.name}</h3>
                  <p className="text-xs text-zinc-500 font-mono mb-4">/room/{room.slug}</p>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Users size={14} className="text-zinc-500" />
                      <span>{room.onlineCount || 0} online</span>
                      {(room.onlineCount || 0) > 0 && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-700/50">
                      By {room.owner?.name || "Unknown"}
                    </div>
                  </div>
                </div>

                <Link href={`/room/${room.slug}`}>
                  <Button variant="outline" className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    Enter Room
                    <ChevronRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Create Room</h2>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateRoom} className="space-y-6">
                  <Input
                    label="Room Name"
                    placeholder="Enter a cool name for your room..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    autoFocus
                  />

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-400 ml-1">Privacy</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPublic(false)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                          !isPublic 
                            ? "bg-blue-600/10 border-blue-500/50 text-blue-400" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        <Lock size={20} />
                        <span className="text-sm font-semibold">Private</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPublic(true)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                          isPublic 
                            ? "bg-green-500/10 border-green-500/30 text-green-400" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        <Globe size={20} />
                        <span className="text-sm font-semibold">Public</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg" 
                      isLoading={creating}
                      disabled={!newRoomName.trim()}
                    >
                      {!creating && <Plus size={20} className="mr-2" />}
                      Create Room
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
