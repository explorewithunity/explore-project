"use client";

import { X, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import UserAvatar from "./UserAvatar";
import { FollowUser, getFollowers, getFollowing, getFollowStatus, toggleFollowUser } from "@/components/FirebaseActions";
import { useAuth } from "@/components/AuthContext";
import toast from "react-hot-toast";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
}

function UserListItem({ u, onClose }: { u: FollowUser, onClose: () => void }) {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const checkFollow = async () => {
      if (currentUser && currentUser.uid !== u.id) {
        const status = await getFollowStatus(currentUser.uid, u.id);
        setIsFollowing(status);
      }
      setIsLoading(false);
    };
    checkFollow();
  }, [currentUser, u.id]);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.error("Please log in to follow users");
      return;
    }

    setIsActionLoading(true);
    const currentlyFollowing = isFollowing;
    
    // Optimistic update
    setIsFollowing(!currentlyFollowing);

    try {
      await toggleFollowUser(currentUser.uid, u.id, currentlyFollowing);
      toast.success(currentlyFollowing ? "Unfollowed user" : "Following user!");
    } catch (error) {
      // Revert on error
      setIsFollowing(currentlyFollowing);
      toast.error("Failed to update follow status");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between hover:bg-[#f8f9fa] p-2 rounded-xl transition-colors">
      <Link
        href={`/profile/${u.id}`}
        onClick={onClose}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div className="shrink-0">
          <UserAvatar 
            src={u.avatar} 
            name={u.name} 
            size="w-10 h-10" 
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-[#2c3e4e] truncate">{u.name}</p>
          <p className="text-xs text-[#8b9aab] truncate">@{u.username}</p>
        </div>
      </Link>
      
      {currentUser && currentUser.uid !== u.id && !isLoading && (
        <button
          onClick={handleToggleFollow}
          disabled={isActionLoading}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors shadow-sm ml-2 ${
            isFollowing 
              ? "bg-[#e0e4e8] text-secondary hover:bg-[#d0d4d8]" 
              : "bg-secondary text-white hover:bg-[#1a2a3a]"
          } w-[84px] flex justify-center`}
        >
          {isActionLoading ? (
             <Loader2 size={14} className="animate-spin" />
          ) : isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}

export default function FollowListModal({
  isOpen,
  onClose,
  userId,
  type,
}: FollowListModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = type === "followers" 
          ? await getFollowers(userId) 
          : await getFollowing(userId);
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#e8e6e4]">
          <h2 className="text-lg font-bold text-[#2c3e4e] capitalize">{type}</h2>
          <button
            onClick={onClose}
            className="p-2 text-[#8b9aab] hover:text-[#2c3e4e] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center h-full pt-10">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-[#8b9aab] pt-10">
              No {type} yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {users.map((u) => (
                <UserListItem key={u.id} u={u} onClose={onClose} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
