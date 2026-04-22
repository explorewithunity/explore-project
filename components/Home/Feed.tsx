"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Users,
  ChevronRight,
  TrendingUp,
  FolderOpen,
  Save,
  Archive,
  Compass,
  User,
  Mail,
  Phone,
  X,
  Send,
  Check,
  AlertCircle,
  Loader2,
  Flame,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEffect } from "react";
import {
  getTrips,
  toggleLikeTrip,
  addTripComment,
  getTripComments,
  CommentData,
  toggleFollowUser,
  getFollowingIds,
} from "@/components/FirebaseActions";
import { useAuth } from "@/components/AuthContext";
import { useLike } from "@/components/LikeContext";
import { ExploreTripData } from "@/types/interface";
import UserAvatar from "@/components/UserAvatar";
import JoinTripModal from "@/components/JoinTripModal";

// Comment Modal Component
function CommentModal({ isOpen, onClose, post, onAddComment }: any) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && post?.id) {
      const fetchComments = async () => {
        setIsLoading(true);
        try {
          const data = await getTripComments(post.id);
          setComments(data);
        } catch (error) {
          console.error("Failed to fetch comments", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchComments();
    }
  }, [isOpen, post?.id]);

  if (!isOpen) return null;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) {
      if (!user) toast.error("Please log in to comment.");
      return;
    }

    setIsSubmitting(true);
    const commentText = newComment.trim();
    const userName = user.displayName || "Traveler";
    const userAvatar = user.photoURL || "";

    const tempId = `temp_${Date.now()}`;
    const optimisticComment: CommentData = {
      id: tempId,
      text: commentText,
      userId: user.uid,
      user: userName,
      avatar: userAvatar,
      createdAt: new Date(),
      time: "Just now",
    };

    setComments((prev) => [...prev, optimisticComment]);
    setNewComment("");

    try {
      const actualId = await addTripComment(
        post.id,
        user.uid,
        userName,
        userAvatar,
        commentText
      );
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...c, id: actualId } : c))
      );
      onAddComment(post.id);
      toast.success("Comment posted!");
    } catch (error) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      toast.error("Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-secondary" />
            <h3 className="font-bold text-secondary text-sm">
              Comments ({comments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-[200px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full pt-10">
              <div className="w-7 h-7 border-[3px] border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-12 text-gray-400 gap-2">
              <MessageCircle size={36} className="opacity-20" />
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <UserAvatar
                  src={comment.avatar}
                  name={comment.user}
                  size="w-8 h-8"
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm text-secondary">
                      {comment.user}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {comment.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed bg-gray-50 px-3 py-2 rounded-xl rounded-tl-none">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form
          onSubmit={handleSubmitComment}
          className="px-4 py-3 border-t border-gray-100 shrink-0"
        >
          <div className="flex gap-2 items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-secondary/50 focus-within:ring-2 focus-within:ring-secondary/10 transition-all">
            <textarea
              rows={1}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 bg-transparent text-sm focus:outline-none resize-none text-secondary placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="w-8 h-8 flex items-center justify-center bg-secondary text-white rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 shrink-0"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isLiked, toggleLike, getLikesCount, isPending } = useLike();
  const [selectedCommentPost, setSelectedCommentPost] = useState<any>(null);
  const [selectedJoinTrip, setSelectedJoinTrip] = useState<any>(null);
  const [posts, setPosts] = useState<ExploreTripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [isFollowingPending, setIsFollowingPending] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    if (user) {
      getFollowingIds(user.uid).then((ids) => {
        if (active) setFollowingIds(ids);
      });
    } else {
      setFollowingIds([]);
    }
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    const fetchTrips = async () => {
      setIsLoading(true);
      try {
        // Data is now enriched directly in getTrips using the caching layer
        const data = await getTrips();
        
        const feedData = data.map((trip: ExploreTripData) => ({
          ...trip,
          content: trip.description,
        }));
        setPosts(feedData as any);
      } catch (error) {
        console.error("Failed to fetch feed trips:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrips();
  }, [user]);

  const handleToggleLike = async (postId: string) => {
    await toggleLike(postId);
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) {
        toast.error("Please login to follow travelers");
        return;
    }
    if (user.uid === targetUserId) return;

    const isFollowing = followingIds.includes(targetUserId);
    
    // Optimistic update
    setIsFollowingPending(prev => [...prev, targetUserId]);
    if (isFollowing) {
        setFollowingIds(prev => prev.filter(id => id !== targetUserId));
    } else {
        setFollowingIds(prev => [...prev, targetUserId]);
    }

    try {
        await toggleFollowUser(user.uid, targetUserId, isFollowing);
        toast.success(isFollowing ? "Unfollowed" : "Following");
    } catch (error) {
        // Revert on error
        if (isFollowing) {
            setFollowingIds(prev => [...prev, targetUserId]);
        } else {
            setFollowingIds(prev => prev.filter(id => id !== targetUserId));
        }
        toast.error("Failed to update follow status");
    } finally {
        setIsFollowingPending(prev => prev.filter(id => id !== targetUserId));
    }
  };

  const handleShare = async (title: string, text: string, slug: string) => {
    const url = `${window.location.origin}/trip/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch { }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      } catch {
        toast.error("Failed to copy link.");
      }
    }
  };

  const handleAddComment = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: (post.comments || 0) + 1 }
          : post
      )
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num?.toString() ?? "0";
  };

  const trendingPosts = [...posts]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 4);

  return (
    <>


      <main className="min-h-screen bg-primary pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pt-4 pt-0">
          <div className="flex gap-7 items-start">
            {/* ── FEED ── */}
            <div className="flex-1 min-w-0">
              {/* Page title */}
              <div className="mb-5">
                <h1 className="text-2xl sm:text-3xl font-bold text-secondary leading-tight">
                  Feed
                </h1>
                <p className="text-xs text-text mt-0.5">
                  Discover journeys from travelers around the world
                </p>
              </div>

              {/* Guest Welcome Card */}
              {!user && (
                <div className="mb-8 bg-linear-to-r from-secondary/5 to-secondary/10 rounded-3xl border border-secondary/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group shadow-xl shadow-secondary/10 ">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-all duration-700" />
                  <div className="relative z-10 flex-1">
                    <h2 className="text-xl sm:text-2xl font-black text-secondary mb-2">Welcome to Explore! 🌍</h2>
                    <p className="text-sm text-text max-w-lg mb-4">
                      You're browsing the community feed. Sign up to create your own journals, follow travelers, and join exciting trips!
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-secondary text-white text-sm font-bold rounded-full hover:shadow-lg transition-all"
                    >
                      JOIN THE COMMUNITY
                    </Link>
                  </div>
                  <div className="relative z-10 hidden md:block">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md rotate-12 group-hover:rotate-0 transition-transform duration-500">
                      <Compass size={40} className="text-secondary" />
                    </div>
                  </div>
                </div>
              )}

              {/* Posts */}
              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-[3px] border-secondary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                      <Compass size={40} className="text-text/30" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-2">No travels found yet</h3>
                    <p className="text-text max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                      Our community journals are just starting to bloom. Be the first to share your journey or browse our Explore page for inspiration!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link
                        href="/explore"
                        className="px-6 py-2.5 bg-secondary text-white rounded-full font-bold text-sm hover:shadow-lg transition-all"
                      >
                        Explore Trips
                      </Link>
                      {!user && (
                        <Link
                          href="/login"
                          className="px-6 py-2.5 border border-border text-secondary rounded-full font-bold text-sm hover:bg-gray-50 transition-all"
                        >
                          Start Your Journal
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  posts.map((post: any) => (
                    <article
                      key={post.id}
                      className="bg-white max-w-md mx-auto rounded-3xl border border-gray-200 shadow-sm transition-all duration-300 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="p-4 flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/profile/${post.authorId}`);
                          }}
                        >
                          <UserAvatar
                            src={post.user.avatar}
                            name={post.user.name}
                            size="w-10 h-10"
                          />
                        </button>

                        <div className="flex-1 min-w-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/profile/${post.authorId}`);
                            }}
                            className="font-bold text-sm text-secondary hover:underline truncate block"
                          >
                            {post.user.name}
                          </button>
                          <p className="text-[11px] text-gray-400 truncate">
                            {post.user.handle} • {post.timeAgo}
                          </p>
                        </div>

                        {/* Follow Button */}
                        {user?.uid !== post.authorId && (
                           <button
                             onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               handleFollow(post.authorId);
                             }}
                             disabled={isFollowingPending.includes(post.authorId)}
                             className={`
                               text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all duration-300
                               ${followingIds.includes(post.authorId)
                                 ? "bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500"
                                 : "bg-secondary border-secondary text-white hover:opacity-90 shadow-md shadow-secondary/20"
                               }
                             `}
                           >
                             {isFollowingPending.includes(post.authorId) ? (
                               <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                             ) : (
                               followingIds.includes(post.authorId) ? "Following" : "Follow"
                             )}
                           </button>
                        )}
                      </div>

                      {/* Image */}
                      <Link href={`/trip/${post.slug}`}>
                        <div className="relative w-full lg:h-[280px] h-[200px] overflow-hidden group">
                          <Image
                            src={post.image && (post.image.startsWith('/') || post.image.startsWith('http')) ? post.image : "/card-placeholder.jpg"}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="px-4 py-3">
                        <Link href={`/trip/${post.slug}`}>
                          <h2 className="font-bold lg:text-lg text-sm text-gray-900 hover:text-secondary transition">
                            {post.title}
                          </h2>
                        </Link>

                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {post.content}
                        </p>
                      </div>

                      {/* Trip Info */}
                      <div className="mx-4 mb-3 p-3 bg-gray-50 rounded-2xl flex items-center justify-between gap-3 overflow-hidden">
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-secondary/60 shrink-0">
                            <MapPin size={12} className="text-secondary/30" />
                            <span className="truncate max-w-[80px] xs:max-w-none">{post.destination?.split(',')[0]}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-secondary/60 shrink-0">
                            <Calendar size={12} className="text-secondary/30" />
                            <span>{post.dates?.split('-')[0]}</span>
                          </div>
                        </div>

                        {(!user || post.authorId !== user.uid) && (
                          <button
                            onClick={() => {
                              if (!user) {
                                toast.error("Please login to join trips!");
                                return;
                              }
                              setSelectedJoinTrip(post);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-secondary text-white rounded-xl hover:scale-105 active:scale-95 transition shadow-sm shrink-0"
                          >
                            Join
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="px-5 py-3 flex items-center gap-4 sm:gap-6 border-t border-gray-100">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          disabled={isPending(post.id)}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors group"
                        >
                          <Heart
                            size={18}
                            className={`transition-all duration-300 ${isLiked(post.id)
                                ? "fill-red-500 text-red-500 scale-110"
                                : "group-active:scale-90"
                              }`}
                          />
                          <span className={`text-xs font-bold ${isLiked(post.id) ? "text-red-500" : ""}`}>
                            {formatNumber(getLikesCount(post.id, post.likes))}
                          </span>
                        </button>

                        <button
                          onClick={() => setSelectedCommentPost(post)}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-secondary transition-colors"
                        >
                          <MessageCircle size={18} />
                          <span className="text-xs font-bold">{formatNumber(post.comments)}</span>
                        </button>

                        <button
                          onClick={() =>
                            handleShare(post.title, post.content, post.slug)
                          }
                          className="ml-auto flex items-center gap-1.5 text-gray-400 hover:text-secondary transition-colors"
                        >
                          <Share2 size={18} />
                          <span className="text-xs font-bold hidden xs:inline">Share</span>
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
              {/* Load more */}
              {/* {!isLoading && (
                <div className="text-center mt-8">
                  <button className="text-xs font-medium text-text hover:text-secondary transition-colors px-6 py-2 rounded-full border border-border hover:border-secondary">
                    Load more
                  </button>
                </div>
              )} */}
            </div>

            {/* ── RIGHT SIDEBAR (hidden on mobile) ── */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-[76px]">
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame size={15} className="text-secondary" />
                      <h2 className="text-xs font-bold text-secondary tracking-widest uppercase">
                        Trending
                      </h2>
                    </div>
                    <Link href="/explore" className="text-[11px] font-medium text-text hover:text-secondary transition-colors flex items-center gap-0.5">
                      View all <ChevronRight size={13} />
                    </Link>
                  </div>

                  {/* List */}
                  <div className="divide-y divide-border">
                    {trendingPosts.map((trip, i) => (
                      <Link
                        key={trip.id}
                        href={`/trip/${trip.slug}`}
                        className="flex gap-3 p-3.5 hover:bg-primary/60 transition-colors group"
                      >
                        {/* Rank */}
                        <span className="text-[11px] font-bold text-text/40 w-4 shrink-0 pt-0.5">
                          {i + 1}
                        </span>
                        {/* Thumbnail */}
                        <div className="relative w-20 h-14 rounded-md overflow-hidden shrink-0">
                          <Image
                            src={trip.image && (trip.image.startsWith('/') || trip.image.startsWith('http')) ? trip.image : "/card-placeholder.jpg"}
                            alt={trip.title}
                            fill
                            className="object-cover "
                          />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-text/60 uppercase tracking-wide truncate">
                            {trip.destination?.split(",")[0] || "Global"}
                          </p>
                          <h3 className="font-semibold text-sm text-secondary leading-tight line-clamp-2 mt-0.5">
                            {trip.title}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Heart size={11} className="text-[#e0245e]" />
                            <span className="text-[11px] text-text">
                              {formatNumber(trip.likes || 0)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CommentModal
        isOpen={!!selectedCommentPost}
        onClose={() => setSelectedCommentPost(null)}
        post={selectedCommentPost}
        onAddComment={handleAddComment}
      />

      <JoinTripModal
        isOpen={!!selectedJoinTrip}
        onClose={() => setSelectedJoinTrip(null)}
        trip={selectedJoinTrip}
      />
    </>
  );
}