"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Bot,
  Send,
  X,
  RefreshCw,
  User,
  HelpCircle,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { sendCourseChatMessage, ChatMessage } from "@/services/api/ai.service";
import toast from "react-hot-toast";

interface CourseAiChatbotProps {
  courseId: number | string;
  courseTitle?: string;
}

function parseInlineMarkdown(text: string) {
  if (!text) return null;
  // Replace **bold** syntax with strong elements
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedAiMessage({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0.5" />;

        // Highlight Source Attribution Lines
        if (trimmed.startsWith("📌") || trimmed.toLowerCase().includes("source:")) {
          return (
            <div
              key={idx}
              className="mt-2.5 p-2 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200 font-semibold text-[11px] flex items-start gap-1.5 shadow-sm"
            >
              <span className="shrink-0 text-amber-600 dark:text-amber-400">📌</span>
              <span>{parseInlineMarkdown(trimmed.replace(/^📌\s*/, ""))}</span>
            </div>
          );
        }

        // Clean Bullet Point Lines (* item or - item or • item)
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          const content = trimmed.replace(/^[*•-]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-red-500 font-bold text-sm leading-none mt-0.5">•</span>
              <span className="flex-1">{parseInlineMarkdown(content)}</span>
            </div>
          );
        }

        // Markdown Headers (### or ##)
        if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
          const headerText = trimmed.replace(/^#{2,3}\s*/, "");
          return (
            <h4
              key={idx}
              className="font-extrabold text-slate-900 dark:text-slate-100 text-xs mt-2.5 mb-1 border-b border-slate-200 dark:border-slate-800 pb-0.5"
            >
              {parseInlineMarkdown(headerText)}
            </h4>
          );
        }

        return <p key={idx}>{parseInlineMarkdown(trimmed)}</p>;
      })}
    </div>
  );
}

export default function CourseAiChatbot({ courseId, courseTitle }: CourseAiChatbotProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "Summarize the key learning outcomes of this course.",
    "What core topics are covered in the first module?",
    "Give me 3 practice quiz questions based on this course.",
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = { role: "user", text: textToSend };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-6);
      const res = await sendCourseChatMessage(courseId, textToSend, historyPayload);

      if (res.success && res.data) {
        const aiMessage: ChatMessage = {
          role: "model",
          text: res.data.answer || "No response text received.",
        };
        setMessages((prev) => [...prev, aiMessage]);

        if (res.data.suggestedQuestions && res.data.suggestedQuestions.length > 0) {
          setSuggestedQuestions(res.data.suggestedQuestions);
        }
      } else {
        const errMessage: ChatMessage = {
          role: "model",
          text: `⚠️ ${res.message || "Failed to generate AI response. Please check backend API key."}`,
        };
        setMessages((prev) => [...prev, errMessage]);
      }
    } catch (err: any) {
      toast.error("Error communicating with AI Assistant.");
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "⚠️ Network error while contacting AI Assistant." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setSuggestedQuestions([
      "Summarize the key learning outcomes of this course.",
      "What core topics are covered in the first module?",
      "Give me 3 practice quiz questions based on this course.",
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-full shadow-2xl hover:shadow-red-500/25 hover:scale-105 transition-all duration-300 group border border-white/20"
        >
          <div className="relative">
            <Sparkles className="h-5 w-5 text-amber-200 animate-pulse" />
          </div>
          <span className="font-semibold text-sm tracking-wide">Ask Course AI</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
          </span>
        </button>
      )}

      {/* Chatbot Window Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[100] w-[92vw] max-w-[420px] h-[580px] max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>AI Course Assistant</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-mono">
                    Groq Llama 70B
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  {courseTitle || "Course Tutor"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  title="Clear Chat"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200">
            {/* Welcome banner if no messages */}
            {messages.length === 0 && (
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs">
                  <Sparkles className="h-4 w-4" />
                  <span>Hi! I am your AI Study Companion</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Ask me anything about <strong>{courseTitle || "this course"}</strong>. I can summarize modules, explain complex concepts, or generate practice questions for you.
                </p>
              </div>
            )}

            {/* Conversation list */}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "model" && (
                  <div className="p-1.5 h-7 w-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    msg.role === "user"
                      ? "bg-red-600 text-white rounded-tr-none font-medium shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <FormattedAiMessage text={msg.text} />
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="p-1.5 h-7 w-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-center justify-start">
                <div className="p-1.5 h-7 w-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-red-600 animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">Analyzing course context...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions Chips */}
          {suggestedQuestions.length > 0 && !isLoading && (
            <div className="p-2.5 bg-slate-100/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                <Lightbulb className="h-3 w-3 text-amber-500" />
                <span>Suggested Questions</span>
              </div>
              <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-left text-[11px] px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 rounded-lg transition truncate flex items-center justify-between group"
                  >
                    <span className="truncate">{q}</span>
                    <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-red-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a question about this course..."
              disabled={isLoading}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition text-slate-800 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl transition shadow-sm flex items-center justify-center shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
