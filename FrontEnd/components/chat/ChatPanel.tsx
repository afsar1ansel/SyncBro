"use client";

import React, { useRef, useEffect, useState } from "react";
import { Send, X, Smile } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { ChatMessage } from "@/hooks/useChat";
import EmojiPicker, { Theme } from "emoji-picker-react";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  typingUsers: string[];
  handleTyping: () => void;
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  sendMessage,
  typingUsers,
  handleTyping,
}: ChatPanelProps) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
      setShowEmojiPicker(false);
    } else {
      handleTyping();
    }
  };

  const onEmojiClick = (emojiData: { emoji: string }) => {
    setInputValue((prev) => prev + emojiData.emoji);
  };

  return (
    <div
      className={`fixed right-0 top-12 bottom-0 w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <h3 className="font-semibold text-white">Room Chat</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.id;
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

          return (
            <div key={msg.id || idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && showAvatar && (
                <div className="flex items-center gap-2 mb-1 pl-1">
                  {msg.sender.avatarUrl ? (
                    <img src={msg.sender.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {msg.sender.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-zinc-400 font-medium">{msg.sender.name}</span>
                </div>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                }`}
                style={{ wordBreak: "break-word" }}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <div className="px-4 py-2 h-8 shrink-0 text-xs text-zinc-400 italic flex items-center">
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-1">
            {typingUsers.length === 1 ? `${typingUsers[0]} is typing` : "Multiple people are typing"}
            <span className="flex gap-0.5 ml-1">
              <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/5 shrink-0 bg-zinc-900 relative">
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-4 z-50">
            <div className="shadow-2xl rounded-2xl overflow-hidden border border-white/10">
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={onEmojiClick}
                width={300}
                height={400}
                skinTonesDisabled
                searchPlaceholder="Search emoji..."
              />
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-zinc-800 text-white text-sm rounded-xl pl-3 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none max-h-32 min-h-[44px]"
              rows={1}
              style={{
                height: inputValue ? 'auto' : '44px',
              }}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`absolute right-3 bottom-2.5 p-1 rounded-md transition-colors ${
                showEmojiPicker ? "text-blue-500 bg-blue-500/10" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Smile size={18} />
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
