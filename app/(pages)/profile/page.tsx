"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EditProfileModal from "@/components/EditProfileModal";
import { useAuth } from "@/components/AuthContext";
import { getTripsByUserId, getFollowerCount, getFollowingCount, getJoinedTripsByUserId } from "@/components/FirebaseActions";
import { ExploreTripData } from "@/types/interface";
import FollowListModal from "@/components/FollowListModal";
import EditTripModal from "@/components/EditTripModal";
import { auth, db } from "@/utils/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
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
  Settings,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface UserProfile {
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);
  const [activeTab, setActiveTab] = useState<"myTrips" | "joinedTrips">("myTrips");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [myTrips, setMyTrips] = useState<ExploreTripData[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<ExploreTripData[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<"followers" | "following">("followers");
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ExploreTripData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching profile from users collection:", error);
      }

      try {
        const userTrips = await getTripsByUserId(user.uid);
        setMyTrips(userTrips);

        const joinedTripsList = await getJoinedTripsByUserId(user.uid);
        // Ensure we don't include user's own trips in joinedTrips if they happen to be in the members list
        setJoinedTrips(joinedTripsList.filter(t => t.authorId !== user.uid));

        const followers = await getFollowerCount(user.uid);
        const followings = await getFollowingCount(user.uid);
        setFollowerCount(followers);
        setFollowingCount(followings);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, isEditModalOpen]);

  const refreshTrips = async () => {
    if (!user) return;
    try {
      const userTrips = await getTripsByUserId(user.uid);
      setMyTrips(userTrips);
      const joinedTripsList = await getJoinedTripsByUserId(user.uid);
      setJoinedTrips(joinedTripsList.filter(t => t.authorId !== user.uid));
    } catch (error) {
      console.error("Error refreshing trips:", error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleShare = async (e: React.MouseEvent, title: string, description: string, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/trip/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
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



  const handleProfileShare = async () => {
    if (!user) return;
    const url = `${window.location.origin}/profile/${user.uid}`;
    const title = `${user.displayName}'s Travel Profile`;
    const text = `Check out my travel journals and upcoming expeditions on Explore with Unity!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        // Share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/explore");
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
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

  if (!user) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-secondary mb-4">Please log in to view your profile</h1>
        <Link 
          href="/login"
          className="px-6 py-2 bg-secondary text-white rounded-full font-medium hover:bg-secondary/90 transition-all"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-primary">
      {/* Profile Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Avatar & Basic Info */}
        <div className="relative  sm:pt-12 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <UserAvatar 
                src={user.photoURL} 
                name={user.displayName} 
                size="w-24 h-24 sm:w-32 sm:h-32" 
                className="border-4 border-white shadow-lg"
              />
            </div>

            {/* Name & Bio */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-secondary">
                    {user.displayName || "Traveler"}
                  </h1>
                  <p className="text-[#8b9aab] text-sm mt-0.5">@{profile?.username || user.email?.split('@')[0] || "traveler"}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-5 py-2 bg-secondary text-white text-sm font-bold rounded-full hover:bg-secondary/90 transition-colors shadow-sm uppercase tracking-widest text-[10px]"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 bg-white border border-border text-red-500 text-sm font-bold rounded-full hover:bg-red-50 transition-colors shadow-sm uppercase tracking-widest text-[10px]"
                  >
                    Sign Out
                  </button>
                  <button 
                    onClick={handleProfileShare}
                    className="p-2 border border-[#e0e4e8] rounded-full hover:bg-gray-50 transition-colors"
                    title="Share Profile"
                  >
                    <Share2 size={16} className="text-[#5a6b7a]" />
                  </button>
                </div>
              </div>

              <p className="text-[#5a6b7a] text-sm leading-relaxed mt-3 max-w-2xl">
                {profile?.bio || "No bio yet. Tell us about your travel style!"}
              </p>

              {/* Location & Social */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#8b9aab]">
                {profile?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile?.website && (
                  <div className="flex items-center gap-1">
                    <Globe size={12} />
                    <Link                                             
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-secondary transition-colors"
                    >
                      {profile.website.replace(/^https?:\/\//, '')}
                    </Link>
                  </div>
                )}
              </div>
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
              MY JOURNALS
            </div>
            {activeTab === "myTrips" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("joinedTrips")}
            className={`pb-3 px-1 text-sm font-medium transition-all relative ${
              activeTab === "joinedTrips"
                ? "text-secondary"
                : "text-[#8b9aab] hover:text-[#5a6b7a]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={16} />
              JOINED TRIPS
            </div>
            {activeTab === "joinedTrips" && (
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
              {/* Trip Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={trip.image || "/card-placeholder.jpg"}
                  alt={trip.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

                {/* Trip Duration Badge */}
                {/* Trip Duration Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                  <Calendar size={10} className="text-white" />
                  <span className="text-[9px] font-bold text-white tracking-tight">
                    {formatDate(trip.departureDate)} — {formatDate(trip.returnDate)}
                  </span>
                </div>

                {/* Draft Badge */}
                {!trip.isPublic && activeTab === "myTrips" && (
                  <div className="absolute top-10 left-3 flex items-center gap-1 px-2 py-1 bg-[#ffc107] backdrop-blur-sm rounded-full z-10 shadow-sm border border-white/20">
                    <span className="text-[9px] font-bold text-secondary uppercase tracking-tight">
                      Draft
                    </span>
                  </div>
                )}

                {/* Edit Button - Only for my trips */}
                {activeTab === "myTrips" && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedTrip(trip);
                      setIsEditTripModalOpen(true);
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-secondary hover:bg-white hover:scale-110 transition-all shadow-sm z-10"
                    title="Edit Journal"
                  >
                    <Settings size={14} />
                  </button>
                )}
              </div>

              {/* Trip Info */}
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
                    <button className="flex items-center gap-1 text-[#8b9aab] hover:text-[#e25c5c] transition-colors">
                      <Heart size={14} />
                      <span className="text-xs">{trip.likes || 0}</span>
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
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {user && (
        <FollowListModal
          isOpen={isFollowModalOpen}
          onClose={() => setIsFollowModalOpen(false)}
          userId={user.uid}
          type={followModalType}
        />
      )}

      <EditTripModal 
        isOpen={isEditTripModalOpen}
        onClose={() => {
          setIsEditTripModalOpen(false);
          setSelectedTrip(null);
        }}
        trip={selectedTrip}
        onUpdate={refreshTrips}
      />
    </main>
  );
}
