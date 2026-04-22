"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { getJoinRequestsForOwner, respondToJoinRequest } from "@/components/FirebaseActions";
import { db } from "@/utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Check, X, User, Calendar, MapPin, MessageCircle, ArrowRight, Loader2, Info, ArrowLeft } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function RequestsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        if (!user) return;
        setIsLoading(true);
        // Remove orderBy to avoid index requirement
        const q = query(collection(db, "joinRequests"), 
            where("ownerId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            // Helper for sorting
            timestamp: doc.data().createdAt?.toDate()?.getTime() || 0
        }));

        // Manual sort in frontend
        data.sort((a, b) => b.timestamp - a.timestamp);
        
        setRequests(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const handleResponse = async (requestId: string, status: "accepted" | "rejected") => {
        setProcessingId(requestId);
        try {
            await respondToJoinRequest(requestId, status);
            toast.success(status === "accepted" ? "Member added to trip!" : "Request declined.");
            await fetchRequests(); // Refresh
        } catch (error: any) {
            toast.error(error.message || "Failed to respond.");
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-20 flex justify-center items-center">
                <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const pendingRequests = requests.filter(r => r.status === "pending");
    const historyRequests = requests.filter(r => r.status !== "pending");

    return (
        <div className="min-h-screen bg-primary pt-10  px-4 pb-20">
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => router.back()}
                    className="group mb-8 flex items-center gap-3 text-secondary/50 hover:text-secondary transition-all duration-300 font-black text-[10px] tracking-[0.2em]"
                >
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-border flex items-center justify-center group-hover:scale-110 group-hover:border-secondary transition-all">
                        <ArrowLeft size={16} />
                    </div>
                    BACK TO PREVIOUS
                </button>

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-secondary tracking-tight mb-2">Join Requests</h1>
                        <p className="text-text font-medium ">Manage who joins your expeditions</p>
                    </div>
                </div>

                {/* Pending Requests Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-secondary/10 rounded-2xl flex items-center justify-center">
                            <User className="text-secondary" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-secondary">Pending ({pendingRequests.length})</h2>
                    </div>

                    {pendingRequests.length === 0 ? (
                        <div className="bg-white rounded-[32px] p-12 text-center shadow-sm border border-border border-dashed">
                            <p className="text-text/50 font-medium">No pending requests at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {pendingRequests.map((req) => (
                                <div key={req.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-border group hover:shadow-xl hover:border-secondary/20 transition-all duration-300">
                                    <div className="p-8 flex flex-col md:flex-row gap-8">
                                        {/* Requester Info */}
                                        <div className="shrink-0 flex flex-col items-center text-center">
                                            <UserAvatar src={req.senderAvatar} name={req.senderName} size="w-20 h-20" />
                                            <h3 className="mt-4 font-bold text-secondary">{req.senderName}</h3>
                                            <Link 
                                                href={`/profile/${req.senderId}`}
                                                className="text-[10px] font-black text-secondary tracking-widest mt-2 hover:opacity-70 transition-opacity"
                                            >
                                                VIEW PROFILE
                                            </Link>
                                        </div>

                                        {/* Request Details */}
                                        <div className="flex-1">
                                            <div className="flex flex-wrap gap-4 mb-4">
                                                <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-100">
                                                    <Info size={14} className="text-secondary/40" />
                                                    <span className="text-xs font-bold text-secondary">{req.tripTitle}</span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50/50 rounded-2xl p-6 border border-dashed border-gray-200 relative">
                                                <MessageCircle className="absolute -top-3 left-6 text-secondary/10" size={32} />
                                                <p className="text-sm text-secondary leading-relaxed italic">
                                                    "{req.message}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-row md:flex-col gap-3 justify-center">
                                            <button
                                                onClick={() => handleResponse(req.id, "accepted")}
                                                disabled={!!processingId}
                                                className="flex-1 md:flex-none w-full h-12 md:w-16 md:h-16 bg-secondary text-white rounded-2xl md:rounded-3xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-secondary/20 disabled:opacity-50"
                                                title="Accept"
                                            >
                                                {processingId === req.id ? <Loader2 className="animate-spin" /> : <Check size={24} />}
                                            </button>
                                            <button
                                                onClick={() => handleResponse(req.id, "rejected")}
                                                disabled={!!processingId}
                                                className="flex-1 md:flex-none w-full h-12 md:w-16 md:h-16 bg-gray-50 text-gray-400 rounded-2xl md:rounded-3xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                                title="Decline"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* History Section */}
                {historyRequests.length > 0 && (
                    <div className="opacity-60">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-xl font-bold text-secondary">Past Decisions</h2>
                        </div>
                        <div className="space-y-3">
                            {historyRequests.map((req) => (
                                <div key={req.id} className="bg-white/50 rounded-2xl p-4 flex items-center justify-between border border-border">
                                    <div className="flex items-center gap-4">
                                        <UserAvatar src={req.senderAvatar} name={req.senderName} size="w-10 h-10" />
                                        <div>
                                            <h4 className="text-sm font-bold text-secondary">{req.senderName}</h4>
                                            <p className="text-[10px] font-medium text-text/50">{req.tripTitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${req.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
