"use client";

import React, { useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getTripById, getTripComments, addTripComment, CommentData, getUserProfileWithCache } from '@/components/FirebaseActions';
import { useAuth } from '@/components/AuthContext';
import { useLike } from '@/components/LikeContext';
import { ExploreTripData, Stop } from '@/types/interface';
import JoinTripModal from '@/components/JoinTripModal';
import { getJoinRequestsByUser } from '@/components/FirebaseActions';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Send,
  Users,
  Clock,
  Globe,
  Tag,
  DollarSign,
  Check
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import toast from 'react-hot-toast';

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [tripMatch, setTripMatch] = useState<ExploreTripData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsList, setCommentsList] = useState<CommentData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { isLiked, toggleLike, getLikesCount, isPending } = useLike();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [userRequestStatus, setUserRequestStatus] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchTrip = async () => {
      setIsLoading(true);
      const trip = await getTripById(slug);
      if (!trip) {
         notFound();
      } else {
         // Resolve latest author profile from the cache/users collection
         if (trip.authorId) {
            const latestProfile = await getUserProfileWithCache(trip.authorId);
            if (latestProfile) {
               trip.user = {
                  ...trip.user,
                  name: latestProfile.name,
                  avatar: latestProfile.avatar
               };
            }
         }

         setTripMatch(trip);
         try {
             const comments = await getTripComments(slug);
             setCommentsList(comments);
         } catch (error) {
             console.error("Failed to fetch comments", error);
         }
      }
      setIsLoading(false);
    };
    fetchTrip();
  }, [slug]);

  React.useEffect(() => {
    const checkRequestStatus = async () => {
      if (!user || !tripMatch) return;
      
      // If already a member
      if (tripMatch.members?.includes(user.uid)) {
        setUserRequestStatus("accepted");
        return;
      }

      // Check pending requests
      const myRequests = await getJoinRequestsByUser(user.uid);
      const thisTripRequest = myRequests.find((r: any) => r.tripId === tripMatch.id);
      if (thisTripRequest) {
        setUserRequestStatus(thisTripRequest.status);
      }
    };
    checkRequestStatus();
  }, [user, tripMatch]);

  const [newComment, setNewComment] = useState("");

  const handleLike = async () => {
    await toggleLike(slug);
  }

  const handleShare = async () => {
    if (!tripMatch) return;
    const url = window.location.href;
    const title = tripMatch.title;
    const text = tripMatch.description;

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
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
        toast.error("Please log in to comment.");
        return;
    }

    setIsSubmitting(true);
    const userName = user.displayName || "Traveler";
    const userAvatar = user.photoURL || "/default-avatar.png";
    const commentText = newComment.trim();
    
    const tempId = `temp_${Date.now()}`;
    const newCommentObj: CommentData = {
        id: tempId,
        text: commentText,
        userId: user.uid,
        user: userName,
        avatar: userAvatar,
        createdAt: new Date(),
        time: "Just now"
    };

    setCommentsList([...commentsList, newCommentObj]);
    setNewComment("");

    try {
        const actualId = await addTripComment(slug, user.uid, userName, userAvatar, commentText);
        setCommentsList(prev => prev.map(c => c.id === tempId ? { ...c, id: actualId } : c));
        toast.success("Comment posted!");
    } catch (error) {
        setCommentsList(prev => prev.filter(c => c.id !== tempId));
        toast.error("Failed to post comment.");
    } finally {
        setIsSubmitting(false);
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  if (isLoading || !tripMatch) {
      return (
          <div className="min-h-screen bg-white flex items-center justify-center">
  <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
</div>
      );
  }

  const coverImage = tripMatch.coverImage || "/card-placeholder.jpg";
  const avatarImage = tripMatch.user.avatar || "/default-avatar.png";
  const authorName = tripMatch.user.name || "Explorer";

  return (
    <>
      <div className="min-h-screen bg-white  font-sans text-[#1a202c]">
        
        {/* Main Content Container */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-4 pt-0">
          
          {/* Simple Header with Back Button */}
          <div className="flex items-center justify-between mb-6 sm:mb-10">
            <button 
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-gray-500 hover:text-secondary transition-colors"
            >
              <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:border-secondary/10 transition-colors">
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              </div>
              <span className="font-bold text-xs uppercase tracking-widest hidden xs:block">Back</span>
            </button>
            <div className="flex gap-2">
               <button 
                 onClick={handleShare}
                 className="h-8 px-3 sm:px-4 rounded-full border border-gray-100 font-bold text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 hover:border-secondary/10 hover:text-secondary transition-all flex items-center gap-2"
                 title="Share Trip"
               >
                 <Share2 size={14} />
                 <span>Share</span>
               </button>
            </div>
          </div>

          {/* Title and Tags */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl  font-bold text-secondary mb-4 leading-[1.1] tracking-tight">
              {tripMatch.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs sm:text-sm font-bold text-gray-400">
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-secondary/40" />
                <span className="text-secondary">{tripMatch.destination}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-secondary/40" />
                <span className="text-secondary">{tripMatch.dates}</span>
              </div>
            </div>
          </div>

          {tripMatch.tags && tripMatch.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {tripMatch.tags.map((tag: string, i: number) => (
                <span key={i} className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] text-secondary bg-secondary/5 px-2.5 py-1 rounded-lg border border-secondary/5">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Hero Image - Contained */}
          <div className="relative w-full aspect-[16/10] sm:aspect-video rounded-[24px] sm:rounded-[32px] overflow-hidden mb-10 shadow-xl shadow-secondary/5 border border-gray-100 group">
            <Image 
              src={coverImage}
              alt={tripMatch.title}
              fill
              className="object-fit group-hover:scale-105 transition-transform duration-700"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Host & Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12 pb-10 border-b border-gray-100">
            {/* Host Section */}
            <div className="md:col-span-5 lg:col-span-4 flex items-center gap-4">
              <UserAvatar 
                src={avatarImage} 
                name={authorName} 
                size="w-14 h-14" 
                className="ring-4 ring-secondary/5"
              />
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Journal by</p>
                <h3 className="font-bold text-lg text-secondary leading-none">{authorName}</h3>
                <Link href={`/profile/${tripMatch.authorId}`} className="text-[10px] font-bold text-secondary/40 hover:text-secondary transition-colors uppercase tracking-wider mt-2 block">View Profile</Link>
              </div>
            </div>
            
            {/* Stats & CTA Section */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-6 sm:gap-10">
               <div className="flex gap-8 xs:gap-12">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Duration</span>
                    <span className="font-bold text-secondary text-sm sm:text-lg">{tripMatch.duration}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Cost</span>
                    <span className="font-bold text-secondary text-sm sm:text-lg ">₹{tripMatch.price || 0}</span>
                 </div>
               </div>

               <div className="flex-1 sm:flex-none">
                {user && tripMatch.authorId !== user.uid ? (
                  <>
                    {userRequestStatus === "accepted" ? (
                      <div className="w-full sm:w-auto h-12 flex items-center justify-center px-8 bg-green-50 text-green-600 rounded-2xl font-bold gap-2 border border-green-100 transition-all">
                          <Check size={18} />
                          Joined Trip
                      </div>
                    ) : userRequestStatus === "pending" ? (
                      <div className="w-full sm:w-auto h-12 flex items-center justify-center px-8 bg-gray-50 text-gray-400 rounded-2xl font-bold gap-2 border border-gray-100">
                          Request Pending
                      </div>
                    ) : (
                      <button 
                          onClick={() => setIsJoinModalOpen(true)}
                          className="w-full sm:w-auto h-12 flex items-center justify-center px-10 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-secondary/20"
                      >
                          Apply to Join
                      </button>
                    )}
                  </>
                ) : user && tripMatch.authorId === user.uid && (
                  <div className="w-full sm:w-auto h-12 flex items-center justify-center px-8 bg-secondary/5 text-secondary rounded-2xl font-bold border border-secondary/10">
                      Your Expedition
                  </div>
                )}
               </div>
            </div>
          </div>

          {/* Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-20">
            {/* Left Column: Description & Itinerary */}
            <div className="lg:col-span-8">
              {/* About Section */}
              <div className="mb-14">
                <h2 className="text-lg sm:text-xl font-bold mb-6 text-secondary uppercase tracking-tight">The Story</h2>
                <div className="prose prose-sm sm:prose-base text-gray-600 leading-relaxed max-w-none">
                    {tripMatch.description && tripMatch.description.split('\n').map((paragraph: string, index: number) => (
                        <p key={index} className="mb-6">{paragraph}</p>
                    ))}
                </div>
              </div>

              {/* Simplified Itinerary */}
              {tripMatch.stops && tripMatch.stops.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-lg sm:text-xl font-bold mb-10 text-secondary uppercase tracking-tight">Expedition Path</h2>
                  <div className="space-y-12 pr-4">
                      {tripMatch.stops.map((stop: Stop, index: number) => (
                          <div key={stop.id} className="relative pl-10 group">
                              {/* Better timeline line */}
                              {index < tripMatch.stops.length - 1 && (
                                  <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-secondary/5 group-hover:bg-secondary/10 transition-colors" />
                              )}
                              
                              {/* Simple timeline dot */}
                              <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-[3px] border-secondary bg-white group-hover:scale-125 transition-transform" />

                              <div className="flex flex-col">
                                  <div className="flex flex-wrap items-center gap-3 mb-2">
                                      <h3 className="text-lg sm:text-xl font-bold text-secondary">{stop.title}</h3>
                                      <div className="px-2.5 py-0.5 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {stop.time}
                                      </div>
                                  </div>
                                  
                                  {stop.location && (
                                      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold mb-4 uppercase tracking-wide">
                                          <MapPin size={12} className="text-secondary/40" />
                                          {stop.location}
                                      </div>
                                  )}
                                  
                                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-6">{stop.description}</p>
                                  
                                  {stop.image && (
                                      <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl overflow-hidden border border-gray-100 mb-2 shadow-sm group/image">
                                          <Image 
                                              src={stop.image}
                                              alt={stop.title}
                                              fill
                                              className="object-cover group-hover/image:scale-105 transition-transform duration-700"
                                          />
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Interaction & Sidebar stuff (if any) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
              {/* Interaction Box */}
              <div className="bg-gray-50/50 rounded-[32px] p-6 sm:p-8 border border-gray-100 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Activity</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                         <MessageCircle size={14} className="text-gray-300" />
                         <span className="font-bold text-xs text-secondary">{formatNumber(commentsList.length)}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="flex items-center justify-between gap-4">
                   <button 
                    onClick={handleLike}
                    disabled={isPending(slug)}
                    className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 transition-all ${isLiked(slug) ? "bg-red-50 text-red-500 border border-red-100" : "bg-white text-secondary border border-gray-200 hover:border-red-200 hover:text-red-500"} ${isPending(slug) ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
                  >
                    <Heart size={20} className={isLiked(slug) ? "fill-red-500" : ""} />
                    <span className="font-black text-xs uppercase tracking-widest">
                      {formatNumber(getLikesCount(slug, tripMatch.likes || 0))} Likes
                    </span>
                  </button>

                  <button 
                  onClick={handleShare}
                  className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-secondary hover:border-secondary transition-all active:scale-95"
                >
                  <Share2 size={20} />
                </button>
                </div>
                
                <p className="text-[10px] text-center text-gray-400 font-medium leading-relaxed italic px-4">
                  Journal created on {tripMatch.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                </p>
              </div>
            </div>
          </div>

          {/* Discussion Section */}
          <div className="mt-12 sm:mt-20 pt-12 border-t border-gray-100 max-w-4xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-lg sm:text-xl font-bold  text-secondary uppercase tracking-tight">Expedition Chat</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Comment Input */}
              <div className="lg:col-span-5">
                <form onSubmit={handleAddComment} className="flex flex-col gap-4 bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 sticky top-24">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      src={user?.photoURL} 
                      name={user?.displayName} 
                      size="w-10 h-10" 
                    />
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Signed in as</p>
                      <p className="text-xs font-bold text-secondary truncate max-w-[150px]">{user?.displayName || "Explorer"}</p>
                    </div>
                  </div>
                  
                  <textarea 
                    rows={4}
                    placeholder="Ask a question or share your thoughts…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-secondary/5 focus:border-secondary/20 transition-all resize-none placeholder-gray-400"
                  />
                  
                  <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmitting}
                      className="w-full h-12 bg-secondary text-white rounded-2xl hover:opacity-90 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 shadow-md active:scale-[0.98]"
                  >   
                      Post Comment
                  </button>
                </form>
              </div>

              {/* Comments List */}
              <div className="lg:col-span-7 space-y-6">
                {commentsList.map((comment: any) => (
                  <div key={comment.id} className="flex gap-4 group">
                    <UserAvatar 
                      src={comment.avatar} 
                      name={comment.user} 
                      size="w-10 h-10" 
                      className="shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-50/30 p-5 rounded-3xl rounded-tl-none border border-gray-100 hover:border-secondary/10 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-sm text-secondary">
                            {comment.user}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {comment.time}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {commentsList.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/20 rounded-[32px] border border-dashed border-gray-200">
                        <MessageCircle size={32} className="text-gray-200 mb-4" />
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No comments yet</p>
                        <p className="text-xs text-gray-400 mt-1">Start the conversation about this journey.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
      <JoinTripModal 
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        trip={tripMatch}
      />
    </>
  )
}
