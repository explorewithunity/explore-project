"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Calendar, MapPin, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { useAuth } from "./AuthContext";
import { sendJoinRequest } from "./FirebaseActions";
import { toast } from "react-hot-toast";

interface JoinTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: any;
}

export default function JoinTripModal({ isOpen, onClose, trip }: JoinTripModalProps) {
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [alreadyRequested, setAlreadyRequested] = useState(false);
    const [existingStatus, setExistingStatus] = useState<string | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        
        const checkStatus = async () => {
            if (isOpen && user && trip) {
                setIsLoadingStatus(true);
                try {
                    const { hasExistingJoinRequest } = await import("./FirebaseActions");
                    const { exists, status } = await hasExistingJoinRequest(trip.id, user.uid);
                    if (exists) {
                        setAlreadyRequested(true);
                        setExistingStatus(status);
                    } else {
                        setAlreadyRequested(false);
                        setExistingStatus(null);
                    }
                } catch (error) {
                    console.error("Error checking request status:", error);
                } finally {
                    setIsLoadingStatus(false);
                }
            } else {
                setIsLoadingStatus(false);
            }
        };

        checkStatus();

        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen, user, trip]);

    if (!isOpen || !trip) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { toast.error("Please log in to join trips."); return; }
        if (trip.authorId === user.uid) { toast.error("You cannot join your own trip."); return; }

        if (alreadyRequested) {
            toast.error("You have already sent a request for this trip.");
            return;
        }

        setIsSubmitting(true);
        try {
            await sendJoinRequest(
                trip,
                { uid: user.uid, name: user.displayName || "Traveler", avatar: user.photoURL || "" },
                message
            );
            setIsSuccess(true);
            toast.success("Join request sent!");
            setTimeout(handleClose, 3000);
        } catch (error: any) {
            toast.error(error.message || "Failed to send request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsSuccess(false);
        setMessage("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={handleClose} />

            <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h2 className="font-bold text-lg text-secondary">Join Trip</h2>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                    {isLoadingStatus ? (
                        <div className="flex flex-col items-center justify-center p-12 gap-3">
                            <Loader2 size={24} className="animate-spin text-secondary" />
                            <p className="text-xs text-text">Checking status...</p>
                        </div>
                    ) : isSuccess || alreadyRequested ? (
                        /* Success or Already Requested state */
                        <div className="flex flex-col items-center justify-center text-center px-8 py-14 gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                                alreadyRequested && existingStatus === 'rejected' ? 'bg-red-500 shadow-red-500/20' : 'bg-green-500 shadow-green-500/20'
                            }`}>
                                {alreadyRequested && existingStatus === 'rejected' ? (
                                    <X size={32} className="text-white" />
                                ) : (
                                    <CheckCircle2 size={32} className="text-white" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-secondary">
                                    {isSuccess ? "Request Sent!" : 
                                     existingStatus === 'accepted' ? "Already Joined" :
                                     existingStatus === 'rejected' ? "Request Declined" :
                                     "Request Already Sent"}
                                </h3>
                                <p className="text-sm text-text mt-1 leading-relaxed max-w-[260px]">
                                    {isSuccess ? "The trip organizer will be notified and review your request." :
                                     existingStatus === 'accepted' ? "You are already a member of this trip." :
                                     existingStatus === 'rejected' ? "Your request to join this trip was declined by the organizer." :
                                     "You have already sent a request to join this trip. Please wait for the organizer's response."}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="mt-2 px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">

                            {/* Trip card */}
                            <div className="bg-gray-50 border border-border rounded-xl p-4">
                                <p className="text-[10px] font-semibold text-text/50 uppercase tracking-wider mb-1">Trip</p>
                                <h4 className="font-bold text-secondary text-base leading-snug">{trip.title}</h4>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={13} className="text-text shrink-0" />
                                        <span className="text-xs text-secondary font-medium truncate max-w-[140px]">{trip.destination}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={13} className="text-text shrink-0" />
                                        <span className="text-xs text-secondary font-medium whitespace-nowrap">{trip.dates || trip.duration}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Applicant */}
                            <div>
                                <p className="text-[10px] font-semibold text-text/50 uppercase tracking-wider mb-2">You</p>
                                <div className="flex items-center gap-3 bg-gray-50 border border-border rounded-xl p-3">
                                    <div className="relative shrink-0">
                                        <UserAvatar src={user?.photoURL} name={user?.displayName} size="w-11 h-11" />
                                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-secondary truncate">{user?.displayName || "Traveler"}</p>
                                        <p className="text-xs text-text truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <p className="text-[10px] font-semibold text-text/50 uppercase tracking-wider mb-2">
                                    Message <span className="normal-case italic opacity-60">(optional)</span>
                                </p>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Introduce yourself to the trip organizer…"
                                    rows={4}
                                    className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-secondary placeholder-text/40 focus:outline-none focus:border-secondary/40 focus:bg-white transition-all resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 pt-1">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 flex items-center justify-center gap-2 bg-secondary text-white font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <span>Send Request</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="w-full py-2.5 text-xs font-medium text-text hover:text-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
