"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: string; // e.g., "w-10 h-10"
  className?: string;
}

export default function UserAvatar({ src, name, size = "w-10 h-10", className = "" }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const getInitials = (name?: string | null) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const initials = getInitials(name);
  const isUnsplash = src?.includes('unsplash.com');

  return (
    <div className={`relative ${size} shrink-0 rounded-full overflow-hidden border border-gray-300 bg-gray-50 flex items-center justify-center ${className}`}>
      {src && !imgError && !isUnsplash ? (
        <Image
          src={src as string}
          alt={name || "User Avatar"}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : initials ? (
        <span className="text-secondary  font-bold text-base select-none tracking-tighter ">
          {initials}
        </span>
      ) : (
        <User className="text-gray-400" size={size.includes('w-') ? parseInt(size.split('-')[1]) * 4 * 0.5 : 16} />
      )}
    </div>
  );
}
