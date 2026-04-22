"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/utils/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Bell, Check, Trash2, Calendar, User, Info, ArrowRight, MessageCircle } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { markNotificationRead, deleteNotification } from "@/components/FirebaseActions";
import { toast } from "react-hot-toast";

export default function NotificationsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    time: doc.data().createdAt?.toDate() ? formatDistanceToNow(doc.data().createdAt.toDate(), { addSuffix: true }) : "Just now",
                    // Helper for sorting
                    timestamp: doc.data().createdAt?.toDate()?.getTime() || 0
                }));
                
                // Sort manually in frontend to avoid index requirement
                data.sort((a, b) => b.timestamp - a.timestamp);
                
                setNotifications(data);
                setIsLoading(false);
            },
            (error) => {
                if (error.code !== "permission-denied") {
                    console.error("Notifications list error:", error);
                }
            }
        );

        return () => unsubscribe();
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        await markNotificationRead(id);
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
        toast.success("Notification deleted");
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "join_request": return <User className="text-blue-500" size={18} />;
            case "request_accepted": return <Check className="text-green-500" size={18} />;
            case "request_rejected": return <Info className="text-red-500" size={18} />;
            default: return <Bell className="text-gray-500" size={18} />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen  flex justify-center items-center">
                <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary pt-10 pb-20 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-secondary tracking-tight mb-2">Notifications</h1>
                        <p className="text-text font-medium ">Updates from your travel network</p>
                    </div>
                    {notifications.length > 0 && (
                        <div className="bg-secondary/5 px-4 py-2 rounded-full border border-secondary/10">
                           <span className="text-secondary font-bold text-sm tracking-wider">
                            {notifications.filter(n => !n.isRead).length} UNREAD
                           </span>
                        </div>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-16 text-center shadow-sm border border-border flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Bell size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-secondary mb-2">Stay tuned!</h3>
                        <p className="text-text/50 max-w-xs mx-auto">
                            You're all caught up. New notifications will appear here as the community interacts with your trips.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id}
                                className={`group relative bg-white rounded-3xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md hover:border-secondary/20 ${notif.isRead ? 'border-border' : 'border-secondary/30 ring-1 ring-secondary/5 bg-secondary/1'}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notif.isRead ? 'bg-gray-50' : 'bg-secondary/10'}`}>
                                        {notif.senderAvatar ? (
                                            <UserAvatar src={notif.senderAvatar} name={notif.senderName} size="w-12 h-12" />
                                        ) : (
                                            getIcon(notif.type)
                                        )}
                                    </div>
                                    <div className="flex-1 pr-12">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`font-bold text-secondary ${notif.isRead ? 'opacity-70' : ''}`}>
                                                {notif.title}
                                            </h4>
                                            {!notif.isRead && (
                                                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-text/70 mb-3 leading-relaxed">
                                            {notif.message}
                                        </p>
                                        
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <span>{notif.time}</span>
                                            {notif.tripId && (
                                                <Link 
                                                    href={`/trip/${notif.tripId}`}
                                                    className="flex items-center gap-1 text-secondary hover:underline"
                                                >
                                                    View Trip <ArrowRight size={10} />
                                                </Link>
                                            )}
                                            {notif.type === "join_request" && (
                                                <Link 
                                                    href="/requests"
                                                    className="flex items-center gap-1 text-secondary hover:underline"
                                                >
                                                    Manage Requests <ArrowRight size={10} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notif.isRead && (
                                            <button 
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(notif.id)}
                                            className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
