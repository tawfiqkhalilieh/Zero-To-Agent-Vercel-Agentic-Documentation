"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowUp,
  Command,
  RotateCcw,
  Cpu,
  Layers,
  Compass,
  Sparkles,
  Zap,
  Bot,
  Terminal,
  Code2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Chat() {
  const [isMounted, setIsMounted] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("chat-messages") || "[]") : [],
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("chat-messages", JSON.stringify(messages));
    }
  }, [messages, isMounted]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("chat-messages");
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-full w-full bg-transparent text-zinc-100 selection:bg-indigo-500/30">
      {/* Header */}
      <nav className="sticky top-0 flex items-center justify-between px-6 py-4 z-50 glass-panel border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <span className="text-xs font-black tracking-tighter text-white uppercase">Agentic Mentor</span>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] text-zinc-500 font-medium">Vercel AI SDK</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/5">
            <Zap size={12} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-zinc-400 tracking-tight">GEMINI 2.0 FLASH</span>
          </div>
          <button 

            onClick={clearChat}
            className="p-2 rounded-lg border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
            title="Clear Conversation"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </nav>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        <div className="max-w-3xl mx-auto w-full px-6 py-10 min-h-full flex flex-col">
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-12"
              >
                <div className="relative">
                  <div className="absolute -inset-8 bg-indigo-500/20 rounded-full blur-3xl" />
                  <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                    <Sparkles size={28} className="text-indigo-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl md:text-4xl font-black text-white">
                    How can I help you build?
                  </h1>
                  <p className="text-zinc-400 max-w-md mx-auto text-sm md:text-base">
                    I'm your guide for the Zero-to-Agent workshop. Ask me anything about Vercel's agentic stack.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                  {[
                    { label: "Workshop Stages", sub: "Explore the curriculum", icon: Layers },
                    { label: "Gemini CLI Setup", sub: "Installation & Auth", icon: Terminal },
                    { label: "RAG Implementation", sub: "Vector-less patterns", icon: Cpu },
                    { label: "Useful API Links", sub: "External resources", icon: Compass }
                  ].map((item, idx) => (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => {
                        const event = { target: { value: item.label } } as any;
                        handleInputChange(event);
                      }}
                      className="glass-card flex items-center gap-4 p-4 rounded-2xl text-left group"
                    >
                      <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                        <item.icon size={18} className="text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-200">{item.label}</div>
                        <div className="text-[10px] text-zinc-500">{item.sub}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-8 pb-32">
                {messages.filter(m => m.role !== 'assistant' || m.content.length > 0).map((m) => (
                  <motion.div 
                    key={m.id} 
                    initial={{ opacity: 0, y: 10 }}

                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex flex-col gap-3",
                      m.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-center gap-2 px-1">
                      {m.role === "assistant" ? (
                        <>
                          <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center shadow-sm">
                            <Bot size={12} className="text-white" />
                          </div>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Mentor</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">You</span>
                          <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center">
                            <Code2 size={12} className="text-zinc-400" />
                          </div>
                        </>
                      )}
                    </div>

                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed",
                      m.role === "user"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                        : "bg-zinc-900/50 border border-white/5 text-zinc-200"
                    )}>
                      <div className="prose prose-zinc prose-invert max-w-none text-sm md:text-base">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                            //@ts-ignore
                            code: ({ node, inline, className, children, ...props }) => {
                              return (
                                <code className={cn("bg-black/30 px-1 rounded text-indigo-300 before:content-none after:content-none", className)} {...props}>
                                  {children}
                                </code>
                              )
                            },
                            pre: ({ children }) => <pre className="bg-black/50 p-4 rounded-xl border border-white/5 overflow-x-auto my-4">{children}</pre>
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 text-zinc-500 px-1"
                  >
                    <div className="flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" />
                      <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Processing</span>
                  </motion.div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-6 bg-transparent">
        <div className="max-w-3xl mx-auto relative">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-indigo-500/50 transition-all"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800 text-zinc-500">
              <Command size={18} />
            </div>
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask the Mentor..."
              className="flex-1 bg-transparent py-3 px-4 text-sm md:text-base text-white placeholder-zinc-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                input.trim() && !isLoading
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-6 opacity-20 text-[8px] font-bold tracking-[0.3em] text-zinc-400 uppercase">
            <span>Neural RAG</span>
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Agentic Workflow</span>
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Vercel AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
