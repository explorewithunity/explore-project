"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Send, ArrowLeft, Check, CheckCheck, Users, X, Loader2, Menu } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/utils/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, Timestamp } from "firebase/firestore";
import { ChatConversation, ChatMessage } from "@/types/interface";
import { sendMessage, markConversationAsRead } from "@/components/FirebaseActions";
import UserAvatar from "@/components/UserAvatar";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtTime(ts: any) {
    if (!ts) return "";
    const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(ts: any) {
    if (!ts) return "";
    const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    const t = new Date(), y = new Date(t); 
    y.setDate(t.getDate() - 1);
    
    if (d.toDateString() === t.toDateString()) return "Today";
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function StatusIcon({ status }: { status: ChatMessage["status"] }) {
    if (status === "read") return <CheckCheck size={12} className="text-secondary" />;
    return <Check size={12} className="text-gray-400" />;
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ 
    conversations, 
    selected, 
    onSelect, 
    currentUserId,
    loading 
}: { 
    conversations: ChatConversation[]; 
    selected: string | null; 
    onSelect: (id: string) => void;
    currentUserId: string;
    loading: boolean;
}) {
    const [q, setQ] = useState("");
    
    const filtered = conversations.filter((c) => {
        const otherUid = c.participantIds.find(id => id !== currentUserId);
        const otherName = c.participantDetails[otherUid || ""]?.name || "Traveler";
        return otherName.toLowerCase().includes(q.toLowerCase());
    });

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold text-gray-800">Chats</h1>
                    <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <Users size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text" placeholder="Search" value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 border-none"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">
                        {q ? "No matches" : "No conversations"}
                    </div>
                ) : (
                    filtered.map((conv) => {
                        const otherUid = conv.participantIds.find(id => id !== currentUserId);
                        const otherDetails = conv.participantDetails[otherUid || ""] || { name: "Traveler", avatar: "" };
                        const unread = conv.unreadCount?.[currentUserId] || 0;

                        return (
                            <button key={conv.id} onClick={() => onSelect(conv.id)}
                                className={`w-full flex items-center gap-3 p-4 border-b border-gray-50 transition-colors text-left ${selected === conv.id ? "bg-gray-50" : "hover:bg-gray-50/50"}`}
                            >
                                <div className="relative shrink-0">
                                    <UserAvatar src={otherDetails.avatar} name={otherDetails.name} size="w-10 h-10" />
                                    {unread > 0 && (
                                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-secondary text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                                            {unread}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`truncate text-sm ${unread > 0 ? "font-semibold text-gray-800" : "font-medium text-gray-700"}`}>
                                            {otherDetails.name}
                                        </h3>
                                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                            {fmtDate(conv.lastMessageTime)}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                                        {conv.lastMessage || "Say hello!"}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ─── CHAT PANEL ───────────────────────────────────────────────────────────────
function ChatPanel({ 
    conv, 
    currentUserId,
    onBack, 
}: { 
    conv: ChatConversation; 
    currentUserId: string;
    onBack: () => void;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [otherUserPresence, setOtherUserPresence] = useState<any>(null);
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    const otherUid = conv.participantIds.find(id => id !== currentUserId);

    // Subscribe to other user presence
    useEffect(() => {
        if (!otherUid) return;
        
        const userRef = doc(db, "users", otherUid);
        const unsubscribe = onSnapshot(userRef, 
            (doc) => {
                if (doc.exists()) {
                    setOtherUserPresence(doc.data().lastSeen);
                }
            },
            (error) => {
                if (error.code !== "permission-denied") {
                    console.error("Presence listener error:", error);
                }
            }
        );
        
        return () => unsubscribe();
    }, [otherUid]);

    const isOnline = () => {
        if (!otherUserPresence) return false;
        const lastSeen = otherUserPresence instanceof Timestamp ? otherUserPresence.toDate() : new Date(otherUserPresence);
        const now = new Date();
        const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
        return diffSeconds < 120; // 2 minutes window for heartbeat
    };

    const fmtLastSeen = () => {
        if (!otherUserPresence) return "Offline";
        if (isOnline()) return "Online";
        
        const lastSeen = otherUserPresence instanceof Timestamp ? otherUserPresence.toDate() : new Date(otherUserPresence);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);
        
        if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;
        if (diffMinutes < 1440) return `Last seen ${Math.floor(diffMinutes / 60)}h ago`;
        return `Last seen ${fmtDate(otherUserPresence)}`;
    };

    // Subscribe to messages
    useEffect(() => {
        if (!conv.id) return;
        
        setLoading(true);
        const q = query(
            collection(db, "conversations", conv.id, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ChatMessage));
                setMessages(msgs);
                setLoading(false);
                
                // Mark as read when messages load/change while open
                markConversationAsRead(conv.id, currentUserId);
            },
            (error) => {
                if (error.code !== "permission-denied") {
                    console.error("Messages listener error:", error);
                }
            }
        );

        return () => unsubscribe();
    }, [conv.id, currentUserId]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const text = input.trim();
        setInput("");
        try {
            await sendMessage(conv.id, currentUserId, text);
        } catch (error) {
            console.error("Failed to send:", error);
        }
    };

    const otherDetails = conv.participantDetails[otherUid || ""] || { name: "Traveler", avatar: "" };

    return (
        <div className="flex flex-col h-full w-full bg-white relative">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
                <button onClick={onBack} aria-label="Back" className="md:hidden p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <UserAvatar src={otherDetails.avatar} name={otherDetails.name} size="w-9 h-9" />
                    <div className="min-w-0">
                        <h2 className="font-semibold text-gray-800 truncate text-sm">{otherDetails.name}</h2>
                        <p className={`text-[10px] ${isOnline() ? "text-green-500 font-medium" : "text-gray-400"}`}>
                            {fmtLastSeen()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-500">
                        <Users size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mb-2" />
                        <p className="text-xs text-gray-400">Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                            <Send size={20} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-800 font-medium text-sm">Start a conversation</h3>
                        <p className="text-xs text-gray-400 mt-1">Say hello to {otherDetails.name}</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.senderId === currentUserId;
                        const prev = messages[i - 1];
                        const showDate = i === 0 || fmtDate(msg.createdAt) !== fmtDate(prev?.createdAt);

                        return (
                            <div key={msg.id}>
                                {showDate && (
                                    <div className="flex justify-center my-4">
                                        <span className="text-[10px] font-medium text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">
                                            {fmtDate(msg.createdAt)}
                                        </span>
                                    </div>
                                )}
                                <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                    <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                                        <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed wrap-break-word shadow-sm ${isMe
                                            ? "bg-secondary text-white rounded-br-none"
                                            : "bg-white text-gray-700 rounded-bl-none border border-gray-100"}`}>
                                            {msg.text}
                                        </div>
                                        <div className={`flex items-center gap-1 mt-0.5 text-[9px] text-gray-400 ${isMe ? "flex-row-reverse" : ""}`}>
                                            <span>{fmtTime(msg.createdAt)}</span>
                                            {isMe && <StatusIcon status={msg.status} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0 sticky bottom-0">
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text" value={input} onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Message..."
                            className="w-full px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-secondary/20 border-border"
                        />
                    </div>
                    <button onClick={handleSend} disabled={!input.trim()}
                        className={`p-2 rounded-full shrink-0 transition-all ${input.trim() ? "bg-secondary text-white shadow-sm hover:scale-105 active:scale-95" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full text-center p-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Send size={24} className="text-gray-300" />
            </div>
            <h3 className="text-gray-800 font-medium">Your messages</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Select a conversation to start chatting</p>
        </div>
    );
}

// ─── ROOT PAGE ────────────────────────────────────────────────────────────────
function MessagesContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect guest to login
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const chatIdFromUrl = searchParams.get("chatId");

    // Handle URL chatId
    useEffect(() => {
        if (chatIdFromUrl) {
            setSelectedId(chatIdFromUrl);
        }
    }, [chatIdFromUrl]);

    // Subscribe to conversations
    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const q = query(
            collection(db, "conversations"),
            where("participantIds", "array-contains", user.uid)
        );

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const list = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ChatConversation));
                
                // Client-side sort by updatedAt descending
                list.sort((a, b) => {
                    const tA = a.updatedAt?.toMillis?.() || 0;
                    const tB = b.updatedAt?.toMillis?.() || 0;
                    return tB - tA;
                });

                setConversations(list);
                setLoading(false);
            },
            (error) => {
                if (error.code !== "permission-denied") {
                    console.error("Conversations list listener error:", error);
                }
            }
        );

        return () => unsubscribe();
    }, [user]);

    const activeConv = conversations.find(c => c.id === selectedId);

    if (!user) {
        return (
            <div className="h-dvh flex items-center justify-center p-6 bg-gray-50">
                 <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">Access Denied</h2>
                    <p className="text-sm text-gray-500">Please log in to view your messages.</p>
                 </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex h-[750px] max-h-[calc(100vh-160px)]">
            {/* Sidebar - Hidden on mobile if a chat is selected */}
            <div className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-gray-100 flex-col ${selectedId ? "hidden md:flex" : "flex"}`}>
                <Sidebar 
                    conversations={conversations} 
                    selected={selectedId} 
                    onSelect={setSelectedId} 
                    currentUserId={user.uid}
                    loading={loading}
                />
            </div>

            {/* Chat Area - Occupies full space on mobile if selected */}
            <div className={`flex-1 h-full overflow-hidden ${!selectedId ? "hidden md:flex" : "flex"}`}>
                {activeConv ? (
                    <ChatPanel 
                        conv={activeConv} 
                        currentUserId={user.uid} 
                        onBack={() => setSelectedId(null)} 
                    />
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="h-dvh flex items-center justify-center bg-gray-50">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    );
}