"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import EditProfileModal from "@/components/EditProfileModal";
import toast from "react-hot-toast";
import { getTripsByUserId, toggleFollowUser, getFollowStatus, toggleLikeTrip, getFollowerCount, getFollowingCount, getOrCreateConversation } from "@/components/FirebaseActions";
import { useAuth } from "@/components/AuthContext";
import { ExploreTripData } from "@/types/interface";
import FollowListModal from "@/components/FollowListModal";
import {
  MapPin,
  Calendar,
  Heart,
  Bookmark,
  Share2,
  Users,
  Map,
  Compass,
  ChevronRight,
  Globe,
  Loader2,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"myTrips" | "joinedTrips">("myTrips");
  const [myTrips, setMyTrips] = useState<ExploreTripData[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<ExploreTripData[]>([]);

  // Extracted user details from their trips
  const [profileName, setProfileName] = useState("Traveler");
  const [profileAvatar, setProfileAvatar] = useState("/default-avatar.png");
  
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<"followers" | "following">("followers");

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        // Only fetch public trips for visitors/guests to avoid rule violations
        const userTrips = await getTripsByUserId(userId, user?.uid !== userId);
        setMyTrips(userTrips);
        
        if (userTrips.length > 0) {
            setProfileName(userTrips[0].user.name);
            setProfileAvatar(userTrips[0].user.avatar || "/default-avatar.png");
        } else if (userId === user?.uid) {
            // It's the current user but they have no trips
            setProfileName(user.displayName || "Traveler");
            setProfileAvatar(user.photoURL || "/default-avatar.png");
        }

        const followers = await getFollowerCount(userId);
        const followings = await getFollowingCount(userId);
        setFollowerCount(followers);
        setFollowingCount(followings);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [userId]);

  const fetchFollowStatus = async () => {
      if (user && userId) {
          const status = await getFollowStatus(user.uid, userId);
          setIsFollowing(status);
      }
  };

  useEffect(() => {
    fetchFollowStatus();
  }, [user, userId]);

  useEffect(() => {
    if (user && myTrips.length > 0) {
        const initialLikedIds = myTrips.filter(t => t.likedBy?.includes(user.uid)).map(t => t.id);
        setLikedPosts(initialLikedIds);
    }
  }, [user, myTrips]);

  const handleToggleFollow = async () => {
      if (!user) {
          toast.error("Please log in to follow users!");
          return;
      }
      setIsFollowLoading(true);
      const currentlyFollowing = isFollowing;
      
      // Optimistic
      setIsFollowing(!currentlyFollowing);
      setFollowerCount(prev => currentlyFollowing ? Math.max(0, prev - 1) : prev + 1);
      
      try {
          await toggleFollowUser(user.uid, userId, currentlyFollowing);
          toast.success(currentlyFollowing ? "Unfollowed user" : "Following user!");
      } catch (error) {
          setIsFollowing(currentlyFollowing);
          setFollowerCount(prev => currentlyFollowing ? prev + 1 : Math.max(0, prev - 1));
          toast.error("Failed to update follow status");
      } finally {
          setIsFollowLoading(false);
      }
  };

  const handleShare = async (e: React.MouseEvent, title: string, text: string, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/trip/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        // Share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link.");
      }
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, postId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast.error("Please log in to like trips!");
            return;
        }

        const isCurrentlyLiked = likedPosts.includes(postId);
        setLikedPosts((prev) =>
            isCurrentlyLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
        );
        
        try {
            await toggleLikeTrip(postId, user.uid, !isCurrentlyLiked);
            toast.success(isCurrentlyLiked ? "Removed like" : "Post liked!");
        } catch (error) {
            setLikedPosts((prev) =>
                !isCurrentlyLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
            );
            toast.error("Failed to update like");
        }
  };

  const handleMessageClick = async () => {
    if (!user) {
        toast.error("Please log in to send messages!");
        return;
    }
    
    try {
        const chatId = await getOrCreateConversation(
            { 
                uid: user.uid, 
                name: user.displayName || "Traveler", 
                avatar: user.photoURL || "/default-avatar.png" 
            }, 
            userId
        );
        window.location.href = `/message?chatId=${chatId}`;
    } catch (error) {
        toast.error("Failed to start conversation");
    }
  };

  const stats = [
    { label: "TRIPS", value: myTrips.length.toString() },
    { label: "FOLLOWERS", value: followerCount.toString(), onClick: () => { setFollowModalType("followers"); setIsFollowModalOpen(true); } },
    { label: "FOLLOWING", value: followingCount.toString(), onClick: () => { setFollowModalType("following"); setIsFollowModalOpen(true); } },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-primary">
      {/* Profile Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Avatar & Basic Info */}
        <div className="relative pt-8 sm:pt-12 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <UserAvatar 
                src={profileAvatar} 
                name={profileName} 
                size="w-24 h-24 sm:w-32 sm:h-32" 
                className="border-4 border-white shadow-lg bg-secondary"
              />
            </div>

            {/* Name & Bio */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-secondary">
                    {profileName}
                  </h1>
                  <p className="text-[#8b9aab] text-sm mt-0.5">@{profileName.toLowerCase().replace(/\s+/g, '')}</p>
                </div>
                <div className="flex gap-2">
                  {(!user || user.uid !== userId) && (
                    <button 
                      onClick={handleToggleFollow}
                      disabled={isFollowLoading}
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed wrap-break-word shadow-sm ${isFollowing
                          ? "bg-[#e0e4e8] text-secondary hover:bg-[#d0d4d8]"
                          : "bg-secondary text-white hover:bg-[#1a2a3a]"}`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                  {(!user || user.uid !== userId) && (
                    <button 
                      onClick={handleMessageClick}
                      className="px-5 py-2 text-sm font-medium rounded-full bg-white border border-[#e0e4e8] text-secondary hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Message
                    </button>
                  )}
                  <button className="p-2 border border-[#e0e4e8] rounded-full hover:bg-gray-50 transition-colors">
                    <Share2 size={16} className="text-[#5a6b7a]" />
                  </button>
                </div>
              </div>

              <p className="text-[#5a6b7a] text-sm leading-relaxed mt-3 max-w-2xl">
                Exploring the world one trip at a time.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 sm:gap-8 py-4 border-y border-[#e8e6e4] mb-6">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`text-center ${stat.onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
              onClick={stat.onClick}
            >
              <p className="text-lg font-bold text-secondary">{stat.value}</p>
              <p className="text-[10px] font-semibold text-[#8b9aab] tracking-widest uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-[#e8e6e4]">
          <button
            onClick={() => setActiveTab("myTrips")}
            className={`pb-3 px-1 text-sm font-medium transition-all relative ${
              activeTab === "myTrips"
                ? "text-secondary"
                : "text-[#8b9aab] hover:text-[#5a6b7a]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Compass size={16} />
              JOURNALS
            </div>
            {activeTab === "myTrips" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />
            )}
          </button>
        </div>

        {/* Trip Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
          {(activeTab === "myTrips" ? myTrips : joinedTrips).map((trip) => (
            <div
              key={trip.id}
              className="group bg-white rounded-2xl border border-[#e8e6e4] overflow-hidden hover:shadow-md transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={trip.image && (trip.image.startsWith('/') || trip.image.startsWith('http')) ? trip.image : "/card-placeholder.jpg"}
                  alt={trip.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                  <Calendar size={10} className="text-white" />
                  <span className="text-[10px] font-medium text-white">
                    {trip.duration}
                  </span>
                </div>

                <button className="absolute top-3 right-3 p-1.5 bg-white/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40">
                  <Bookmark size={14} className="text-white" />
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-secondary leading-tight mb-1">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[#8b9aab] text-xs mb-2">
                      <MapPin size={12} />
                      <span>{trip.destination}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#f0f2f5] rounded-full">
                    <Map size={10} className="text-[#8b9aab]" />
                    <span className="text-[10px] font-medium text-[#5a6b7a]">
                      {trip.stops?.length || 0} locations
                    </span>
                  </div>
                </div>

                <p className="text-[#5a6b7a] text-sm leading-relaxed mt-2 line-clamp-2">
                  {trip.description}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0f2f5]">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => handleToggleLike(e, trip.id)}
                      className="flex items-center gap-1 text-[#8b9aab] hover:text-[#e25c5c] transition-colors"
                    >
                      <Heart 
                        size={14} 
                        className={likedPosts.includes(trip.id) ? "fill-[#e25c5c] text-[#e25c5c]" : "text-[#8b9aab]"} 
                      />
                      <span className={`text-xs ${likedPosts.includes(trip.id) ? "text-[#e25c5c]" : "text-[#8b9aab]"}`}>
                        {likedPosts.includes(trip.id) ? trip.likes + 1 : trip.likes}
                      </span>
                    </button>
                    <button 
                      onClick={(e) => handleShare(e, trip.title, trip.description, trip.slug)}
                      className="flex items-center gap-1 text-[#8b9aab] hover:text-secondary transition-colors"
                    >
                      <Share2 size={14} />
                      <span className="text-xs font-bold">Share</span>
                    </button>
                  </div>
                  <Link
                    href={`/trip/${trip.slug}`}
                    className="flex items-center gap-1 text-xs font-medium text-secondary hover:gap-2 transition-all"
                  >
                    View Journal
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {myTrips.length === 0 && (
             <div className="col-span-3 text-center py-12 text-[#8b9aab]">
                No journals published yet.
             </div>
          )}
        </div>
      </div>

      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        userId={userId}
        type={followModalType}
      />
    </main>
  );
}
