"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTrips, toggleLikeTrip } from "@/components/FirebaseActions";
import { useAuth } from "@/components/AuthContext";
import { useLike } from "@/components/LikeContext";
import { ExploreTripData } from "@/types/interface";
import UserAvatar from "@/components/UserAvatar";
import {
    MapPin,
    Calendar,
    Heart,
    MessageCircle,
    Bookmark,
    Share2,
    Search,
    Grid3x3,
    LayoutGrid,
    Compass,
    TrendingUp,
    Filter,
    X,
    Users,
    Star,
    Clock,
    ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ExplorePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { isLiked, toggleLike, getLikesCount, isPending } = useLike();
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
    const [searchFocused, setSearchFocused] = useState(false);

    const [exploreTrips, setExploreTrips] = useState<ExploreTripData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrips = async () => {
            setIsLoading(true);
            try {
                // Data is now enriched directly in getTrips using the caching layer
                const data = await getTrips();
                setExploreTrips(data);
            } catch (err) {
                console.error("Failed to fetch explore trips:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrips();
    }, []);

    const filteredTrips = exploreTrips
        .filter((trip) => {
            const matchesSearch =
                trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trip.user.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        })
        .sort((a, b) => {
            // Use optional parsing for timestamps if sorting by ID fails
            return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        });

    const handleToggleLike = async (postId: string) => {
        await toggleLike(postId);
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

    const formatNumber = (num: number) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + "k";
        return num.toString();
    };



    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <>


            <main className="min-h-screen bg-primary  ">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 lg:pt-4 pt-0">

                    {/* ── Header ─────────────────────────────────────────────── */}
                    <div className="mb-4 sm:mb-6">

                        {/* Title row */}
                        <div className="flex items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
                            <div className="min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold text-secondary leading-tight">Explore</h1>
                                <p className="text-text text-xs sm:text-sm mt-0.5 hidden xs:block">
                                    Discover amazing trips from travelers around the world
                                </p>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2 shrink-0">
                                {/* View toggle — hide on smallest screens */}
                                <div className="hidden sm:flex bg-white rounded-lg border border-border p-1">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-1.5 sm:p-2 rounded transition-colors ${viewMode === "grid" ? "bg-secondary text-white" : "text-text hover:bg-primary"}`}
                                        aria-label="Grid view"
                                    >
                                        <Grid3x3 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("compact")}
                                        className={`p-1.5 sm:p-2 rounded transition-colors ${viewMode === "compact" ? "bg-secondary text-white" : "text-text hover:bg-primary"}`}
                                        aria-label="Compact view"
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-3">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text pointer-events-none"
                                size={18}
                            />
                            <input
                                type="search"
                                inputMode="search"
                                placeholder="Search destinations, trips, travelers…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                className="w-full pl-9 pr-4 py-2.5 sm:py-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text hover:text-secondary touch-manipulation"
                                    aria-label="Clear search"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                    </div>

                    {/* ── Stats bar ──────────────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-border px-3 sm:px-4 py-3 mb-4 sm:mb-6 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-lg sm:text-2xl font-bold text-secondary">{filteredTrips.length}</span>
                                <span className="text-text text-xs sm:text-sm">trips</span>
                            </div>
                            <div className="h-5 w-px bg-border hidden xs:block" />
                            <div className="hidden xs:flex items-center gap-2">
                                <TrendingUp size={15} className="text-secondary shrink-0" />
                                <span className="text-xs sm:text-sm text-text truncate">
                                    Latest trips
                                </span>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredTrips.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={40} className="text-text/30" />
                            </div>
                            <h3 className="text-xl font-bold text-secondary mb-2">No matching trips found</h3>
                            <p className="text-text max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                                We couldn't find any trips matching your current search or filters. Try adjusting your keywords or browse all public journals.
                            </p>
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="px-6 py-2.5 bg-secondary text-white rounded-full font-bold text-sm hover:shadow-lg transition-all"
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-4 md:gap-5 lg:gap-6">
                            {filteredTrips.map((trip) => (
                                <Link
                                    key={trip.id}
                                    href={`/trip/${trip.slug}`}
                                    className="block group bg-white rounded-xl sm:rounded-2xl border border-border overflow-hidden  transition-all duration-300 cursor-pointer active:scale-[0.98]"
                                >
                                    {/* Image */}
                                    <div className="relative h-[220px] sm:h-[180px] overflow-hidden">
                                        <Image
                                            src={trip.image && (trip.image.startsWith('/') || trip.image.startsWith('http')) ? trip.image : "/card-placeholder.jpg"}
                                            alt={trip.title}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            className="object-cover"
                                        />
                                        {/* Badges */}
                                     
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <button 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/profile/${trip.authorId}`); }}
                                            className="flex items-center gap-1.5 mb-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                                        >
                                            <UserAvatar src={trip.user.avatar} name={trip.user.name} size="w-5 h-5 sm:w-6 sm:h-6" />
                                            <span className="text-[10px] sm:text-xs text-text truncate">{trip.user.name}</span>
                                        </button>
                                        <h3 className="font-semibold text-secondary text-xs sm:text-sm mb-1 line-clamp-1 leading-snug  truncate">
                                            {trip.title}
                                        </h3>
                                        <div className="flex items-center gap-1 text-text text-[10px] sm:text-xs mb-0 sm:mb-1">
                                            <MapPin size={10} className="shrink-0" />
                                            <span className="truncate">{trip.destination}</span>
                                        </div>
                                        {/* Action Bar */}
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    className={`flex items-center gap-1.5 transition-all ${isPending(trip.id) ? "opacity-50 cursor-not-allowed" : "hover:text-[#e0245e]"}`}
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleLike(trip.id); }}
                                                    disabled={isPending(trip.id)}
                                                >
                                                    <Heart 
                                                        size={16} 
                                                        className={`transition-colors ${isLiked(trip.id) ? "fill-[#e0245e] text-[#e0245e]" : "text-text"}`} 
                                                    />
                                                    <span className={`text-xs font-medium ${isLiked(trip.id) ? "text-[#e0245e]" : "text-text"}`}>
                                                        {formatNumber(getLikesCount(trip.id, trip.likes))}
                                                    </span>
                                                </button>

                                                <div className="flex items-center gap-1.5 text-text">
                                                    <Users size={14} />
                                                    <span className="text-xs font-medium">{trip.travelers}</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={(e) => handleShare(e, trip.title, trip.description, trip.slug)}
                                                className="p-1.5 hover:bg-primary rounded-full transition-colors text-text hover:text-secondary"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {filteredTrips.map((trip) => (
                                <Link
                                    key={trip.id}
                                    href={`/trip/${trip.slug}`}
                                    className="block bg-white rounded-xl sm:rounded-2xl border border-border overflow-hidden cursor-pointer active:scale-[0.99]"
                                >
                                    <div className="flex flex-col xs:flex-row">
                                        {/* Thumbnail */}
                                        <div className="relative h-48 xs:h-auto xs:w-32 sm:w-40 md:w-48 shrink-0">
                                            <Image
                                                src={trip.image && (trip.image.startsWith('/') || trip.image.startsWith('http')) ? trip.image : "/card-placeholder.jpg"}
                                                alt={trip.title}
                                                fill
                                                sizes="(max-width: 500px) 128px, 192px"
                                                className="object-cover"
                                            />
                                           
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-2.5 sm:p-4 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    {/* User + category */}
                                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                        <button 
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/profile/${trip.authorId}`); }}
                                                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                                                        >
                                                            <UserAvatar src={trip.user.avatar} name={trip.user.name} size="w-5 h-5" />
                                                            <span className="text-[10px] sm:text-xs text-text truncate max-w-[80px] sm:max-w-none">{trip.user.name}</span>
                                                        </button>
                                                      
                                                    </div>

                                                    <h3 className="font-semibold text-secondary text-xs sm:text-base md:text-lg mb-1 line-clamp-2 leading-snug">
                                                        {trip.title}
                                                    </h3>

                                                    {/* Meta details */}
                                                    <div className="flex flex-col xs:flex-row flex-wrap gap-x-3 gap-y-0.5 text-text text-[10px] sm:text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <MapPin size={11} className="shrink-0" />
                                                            <span className="truncate max-w-[100px] xs:max-w-none">{trip.destination}</span>
                                                        </div>
                                                        <div className="hidden sm:flex items-center gap-1">
                                                            <Calendar size={11} />
                                                            <span>{trip.dates}</span>
                                                        </div>
                                                        <div className="hidden xs:flex items-center gap-1">
                                                            <Clock size={11} />
                                                            <span>{trip.duration}</span>
                                                        </div>
                                                        <div className="hidden md:flex items-center gap-1">
                                                            <Users size={11} />
                                                            <span>{trip.travelers} travelers</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Like / bookmark */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleLike(trip.id); }}
                                                        disabled={isPending(trip.id)}
                                                        className={`flex items-center gap-1 transition-colors ${isLiked(trip.id) ? "text-[#e0245e]" : "text-text hover:text-[#e0245e]"} ${isPending(trip.id) ? "opacity-50 cursor-not-allowed" : ""}`}
                                                        aria-label="Like"
                                                    >
                                                        <Heart
                                                            size={16}
                                                            className={isLiked(trip.id) ? "fill-[#e0245e] text-[#e0245e]" : ""}
                                                        />
                                                        <span className="text-xs hidden xs:inline">{formatNumber(getLikesCount(trip.id, trip.likes))}</span>
                                                    </button>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={(e) => handleShare(e, trip.title, trip.description, trip.slug)}
                                                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-text hover:text-secondary flex items-center gap-1"
                                                        >
                                                            <Share2 size={16} />
                                                            <Users className="text-[#8b9aab] shrink-0" size={14} />
                                                        </button>
                                                        <div className="flex items-center gap-1 text-text text-xs">
                                                            <MessageCircle size={11} />
                                                            <span>{formatNumber(trip.comments)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* ── Empty state ─────────────────────────────────────────── */}
                    {!isLoading && filteredTrips.length === 0 && (
                        <div className="text-center py-16 sm:py-20">
                            <Compass size={48} className="mx-auto text-text mb-4 sm:w-16 sm:h-16" />
                            <h3 className="text-lg sm:text-xl font-semibold text-secondary mb-2">No trips found</h3>
                            <p className="text-text text-sm">Try adjusting your search</p>
                            <button
                                onClick={() => { setSearchQuery(""); }}
                                className="mt-5 px-6 py-2.5 bg-secondary text-white rounded-lg hover:bg-[#333] transition-colors text-sm touch-manipulation"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}
                </div>
            </main>

        </>
    );
}