"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  Search,
  User,
  Users,
  Bookmark,
  MoreVertical,
  CheckCheck,
  Plus,
  Hash,
  Sparkles,
  Phone,
  Video,
  Info,
  Circle,
  FileText,
  Clock,
  Pin,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fullNameMap: Record<string, string> = {
  omprakash: "Omprakash Pandey",
  priyanka: "Priyanka Davhare",
  rahul: "Rahul Sharma",
  sneha: "Sneha Patil",
  guest: "Guest Visitor",
};

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
}

interface Chat {
  id: string;
  type: "personal" | "private" | "group";
  name: string;
  role?: string;
  avatarText: string;
  avatarBg?: string;
  isOnline?: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  membersCount?: number;
  messages: Message[];
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const username = user?.username || "Guest";
  const currentUserFullName = fullNameMap[username.toLowerCase()] || username;
  const userRole = user?.role || "USER";

  const [activeTab, setActiveTab] = useState<"all" | "personal" | "private" | "group">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial chat list seed
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "personal-space",
      type: "personal",
      name: `${currentUserFullName} (Personal Space)`,
      role: "Your Saved Notes",
      avatarText: "ME",
      avatarBg: "bg-red-600",
      isOnline: true,
      lastMessage: "Drafting lesson plan and assignment questions...",
      lastMessageTime: "10:45 AM",
      unreadCount: 0,
      messages: [
        {
          id: "m-p1",
          senderId: "self",
          senderName: currentUserFullName,
          text: "Welcome to your Personal Space! Use this private chat to jot down notes, save course draft links, or outline upcoming assignments.",
          timestamp: "Yesterday at 04:30 PM",
          isSelf: true,
        },
        {
          id: "m-p2",
          senderId: "self",
          senderName: currentUserFullName,
          text: "Drafting lesson plan and assignment questions for the upcoming Next.js & Prisma module...",
          timestamp: "10:45 AM",
          isSelf: true,
        },
      ],
    },
    {
      id: "private-priyanka",
      type: "private",
      name: "Priyanka Davhare",
      role: "Super Admin",
      avatarText: "PD",
      avatarBg: "bg-purple-600",
      isOnline: true,
      lastMessage: "The new course evaluation guidelines have been published on the portal.",
      lastMessageTime: "11:20 AM",
      unreadCount: 2,
      messages: [
        {
          id: "m-pr1",
          senderId: "priyanka",
          senderName: "Priyanka Davhare",
          text: "Hi! Did you get a chance to review the course catalog update for Q3?",
          timestamp: "11:15 AM",
          isSelf: false,
        },
        {
          id: "m-pr2",
          senderId: "priyanka",
          senderName: "Priyanka Davhare",
          text: "The new course evaluation guidelines have been published on the portal.",
          timestamp: "11:20 AM",
          isSelf: false,
        },
      ],
    },
    {
      id: "private-rahul",
      type: "private",
      name: "Rahul Sharma",
      role: "Admin",
      avatarText: "RS",
      avatarBg: "bg-blue-600",
      isOnline: false,
      lastMessage: "Audit log report export is completed.",
      lastMessageTime: "Yesterday",
      unreadCount: 0,
      messages: [
        {
          id: "m-r1",
          senderId: "rahul",
          senderName: "Rahul Sharma",
          text: "Audit log report export is completed. Let me know if you need any additional CSV filter exports.",
          timestamp: "Yesterday at 05:12 PM",
          isSelf: false,
        },
      ],
    },
    {
      id: "private-omprakash",
      type: "private",
      name: "Omprakash Pandey",
      role: "Full Stack Developer",
      avatarText: "OP",
      avatarBg: "bg-emerald-600",
      isOnline: true,
      lastMessage: "Updated the TopBar and navigation drawer components successfully.",
      lastMessageTime: "02:15 PM",
      unreadCount: 0,
      messages: [
        {
          id: "m-op1",
          senderId: "omprakash",
          senderName: "Omprakash Pandey",
          text: "Updated the TopBar and navigation drawer components successfully.",
          timestamp: "02:15 PM",
          isSelf: false,
        },
      ],
    },
    {
      id: "group-instructors",
      type: "group",
      name: "Harbinger Instructors Channel",
      role: "Group Chat",
      avatarText: "HI",
      avatarBg: "bg-indigo-600",
      membersCount: 14,
      lastMessage: "Sneha: Feedback form for Course #18 has been updated.",
      lastMessageTime: "01:05 PM",
      unreadCount: 1,
      messages: [
        {
          id: "m-gi1",
          senderId: "sneha",
          senderName: "Sneha Patil",
          text: "Hello team! Please make sure to submit course section prerequisites by Friday.",
          timestamp: "12:30 PM",
          isSelf: false,
        },
        {
          id: "m-gi2",
          senderId: "sneha",
          senderName: "Sneha Patil",
          text: "Feedback form for Course #18 has been updated.",
          timestamp: "01:05 PM",
          isSelf: false,
        },
      ],
    },
    {
      id: "group-lms-devs",
      type: "group",
      name: "Academy Platform Core Group",
      role: "Group Chat",
      avatarText: "AP",
      avatarBg: "bg-rose-600",
      membersCount: 8,
      lastMessage: "Next.js Turbopack migration tests are green.",
      lastMessageTime: "09:14 AM",
      unreadCount: 0,
      messages: [
        {
          id: "m-ap1",
          senderId: "dev",
          senderName: "Platform Team",
          text: "Next.js Turbopack migration tests are green.",
          timestamp: "09:14 AM",
          isSelf: false,
        },
      ],
    },
  ]);

  const [activeChatId, setActiveChatId] = useState<string>("personal-space");

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat.messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: "self",
      senderName: currentUserFullName,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSelf: true,
    };

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            lastMessage: inputText.trim(),
            lastMessageTime: "Just now",
            messages: [...chat.messages, newMsg],
          };
        }
        return chat;
      })
    );

    setInputText("");
  };

  const filteredChats = chats.filter((chat) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "personal" && chat.type === "personal") ||
      (activeTab === "private" && chat.type === "private") ||
      (activeTab === "group" && chat.type === "group");

    const matchesSearch =
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full bg-[#F8FAFC] text-slate-800 overflow-hidden">
      {/* ── Left Sidebar: Chat Conversations List ── */}
      <div className="w-80 md:w-96 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
        {/* Header & Title */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#C82333]" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Messages</h1>
            </div>
            <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
              {userRole.replace("_", " ")}
            </Badge>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs h-9 focus-visible:ring-[#C82333]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1 px-2 rounded text-center font-medium transition-all ${
                activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("personal")}
              className={`flex-1 py-1 px-2 rounded text-center font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === "personal" ? "bg-white text-[#C82333] font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Pin className="h-3 w-3" />
              Personal
            </button>
            <button
              onClick={() => setActiveTab("private")}
              className={`flex-1 py-1 px-2 rounded text-center font-medium transition-all ${
                activeTab === "private" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Private
            </button>
            <button
              onClick={() => setActiveTab("group")}
              className={`flex-1 py-1 px-2 rounded text-center font-medium transition-all ${
                activeTab === "group" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No conversations found.
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    // Mark as read when selected
                    setChats((prev) =>
                      prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
                    );
                  }}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${
                    isActive
                      ? "bg-slate-100 border-l-4 border-l-[#C82333]"
                      : "hover:bg-slate-50 border-l-4 border-l-transparent"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-slate-200">
                      <AvatarFallback className={`${chat.avatarBg || "bg-slate-700"} text-white text-xs font-bold`}>
                        {chat.type === "personal" ? (
                          <Bookmark className="h-4 w-4 text-white" />
                        ) : (
                          chat.avatarText
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {chat.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {chat.type === "personal" && (
                          <Pin className="h-3 w-3 text-[#C82333] shrink-0" />
                        )}
                        {chat.type === "group" && (
                          <Users className="h-3 w-3 text-indigo-500 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {chat.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {chat.lastMessageTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-slate-500 truncate pr-2">
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-[#C82333] text-[9px] font-bold text-white shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Content: Chat Window ── */}
      <div className="flex-1 flex flex-col h-full bg-[#F1F5F9]">
        {/* Chat Top Header */}
        <div className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarFallback className={`${activeChat.avatarBg || "bg-slate-700"} text-white text-xs font-bold`}>
                {activeChat.type === "personal" ? <Bookmark className="h-4 w-4" /> : activeChat.avatarText}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">{activeChat.name}</h2>
                {activeChat.type === "personal" && (
                  <Badge variant="outline" className="text-[9px] bg-red-50 text-[#C82333] border-red-200">
                    Personal Space
                  </Badge>
                )}
                {activeChat.type === "group" && (
                  <Badge variant="outline" className="text-[9px] bg-indigo-50 text-indigo-700 border-indigo-200">
                    Group Channel • {activeChat.membersCount} members
                  </Badge>
                )}
                {activeChat.type === "private" && (
                  <Badge variant="outline" className="text-[9px] bg-slate-100 text-slate-600 border-slate-200">
                    {activeChat.role}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {activeChat.type === "personal"
                  ? "Only visible to you • Private notes & saved content"
                  : activeChat.isOnline
                  ? "Active Now"
                  : "Offline"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {activeChat.type !== "personal" && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
                  <Video className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex justify-center">
            <span className="px-3 py-1 bg-slate-200/60 rounded-full text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              {activeChat.type === "personal" ? "Private Saved Space" : "Encrypted Chat Channel"}
            </span>
          </div>

          {activeChat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
            >
              <span className="text-[10px] text-slate-400 mb-1 px-1">
                {msg.senderName} • {msg.timestamp}
              </span>

              <div
                className={`max-w-md md:max-w-lg rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                  msg.isSelf
                    ? "bg-[#C82333] text-white rounded-tr-none"
                    : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box Area */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-400 hover:text-slate-600 shrink-0"
              title="Attach File"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Input
              type="text"
              placeholder={
                activeChat.type === "personal"
                  ? "Write a note or save a link in your personal space..."
                  : `Message ${activeChat.name}...`
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 border-slate-200 text-xs h-9 focus-visible:ring-[#C82333]"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-400 hover:text-slate-600 shrink-0"
              title="Add Emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={!inputText.trim()}
              className="bg-[#C82333] hover:bg-[#a71d2a] text-white h-9 px-4 text-xs font-semibold gap-1.5 shrink-0"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
