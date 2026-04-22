"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getUserLikedTrips, toggleLikeTrip } from "./FirebaseActions";
import { toast } from "react-hot-toast";

interface LikeContextType {
  likedTrips: Set<string>;
  pendingLikes: Set<string>;
  toggleLike: (tripId: string) => Promise<void>;
  isLiked: (tripId: string) => boolean;
  isPending: (tripId: string) => boolean;
  getLikesCount: (tripId: string, baseCount: number) => number;
}

const LikeContext = createContext<LikeContextType | undefined>(undefined);

export function LikeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [likedTrips, setLikedTrips] = useState<Set<string>>(new Set());
  const [initialLikes, setInitialLikes] = useState<Set<string>>(new Set());
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());

  // Load initial liked trips for the user
  useEffect(() => {
    if (user) {
      const loadLikes = async () => {
        try {
          const tripIds = await getUserLikedTrips(user.uid);
          const likesSet = new Set(tripIds);
          setLikedTrips(likesSet);
          setInitialLikes(likesSet);
        } catch (error) {
          console.error("Failed to load liked trips:", error);
        }
      };
      loadLikes();
    } else {
      setLikedTrips(new Set());
    }
  }, [user]);

  const toggleLike = useCallback(async (tripId: string) => {
    if (!user) {
      toast.error("Please log in to like trips!");
      return;
    }

    if (pendingLikes.has(tripId)) return;

    const isCurrentlyLiked = likedTrips.has(tripId);
    
    // Optimistic Update
    setLikedTrips(prev => {
      const next = new Set(prev);
      if (isCurrentlyLiked) next.delete(tripId);
      else next.add(tripId);
      return next;
    });

    setPendingLikes(prev => new Set(prev).add(tripId));

    try {
      await toggleLikeTrip(tripId, user.uid, !isCurrentlyLiked);
      // Success - no need to do much as we already updated likedTrips optimistically
    } catch (error) {
      // Rollback on error
      setLikedTrips(prev => {
        const next = new Set(prev);
        if (isCurrentlyLiked) next.add(tripId);
        else next.delete(tripId);
        return next;
      });
      toast.error("Failed to update like. Please try again.");
    } finally {
      setPendingLikes(prev => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  }, [user, likedTrips, pendingLikes]);

  const isLiked = useCallback((tripId: string) => likedTrips.has(tripId), [likedTrips]);
  const isPending = useCallback((tripId: string) => pendingLikes.has(tripId), [pendingLikes]);

  const getLikesCount = useCallback((tripId: string, baseCount: number) => {
    const initiallyLiked = initialLikes.has(tripId);
    const currentlyLiked = likedTrips.has(tripId);

    if (initiallyLiked && !currentlyLiked) return Math.max(0, baseCount - 1);
    if (!initiallyLiked && currentlyLiked) return baseCount + 1;
    return baseCount;
  }, [initialLikes, likedTrips]);

  return (
    <LikeContext.Provider value={{ likedTrips, pendingLikes, toggleLike, isLiked, isPending, getLikesCount }}>
      {children}
    </LikeContext.Provider>
  );
}

export function useLike() {
  const context = useContext(LikeContext);
  if (context === undefined) {
    throw new Error("useLike must be used within a LikeProvider");
  }
  return context;
}
