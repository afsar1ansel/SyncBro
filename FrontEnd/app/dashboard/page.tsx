"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Plus, Layout, Users, ChevronRight, Loader2 } from "lucide-react";

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
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isPublic, setIsPublic] = useState(false);

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
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setCreating(false);
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
            <p className="text-zinc-400">Manage your collaborative rooms and sync in real-time.</p>
          </div>
          
          <form onSubmit={handleCreateRoom} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="New room name..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full md:w-64"
            />
            {/* Public / Private toggle */}
            <button
              type="button"
              onClick={() => setIsPublic((p) => !p)}
              className={`h-12 px-4 rounded-xl border text-sm font-semibold transition-all ${
                isPublic
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {isPublic ? "🌐 Public" : "🔒 Private"}
            </button>
            <Button type="submit" disabled={creating} className="h-12 px-6">
              {creating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} className="mr-2" />}
              Create
            </Button>
          </form>
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

      {/* Background decoration */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
