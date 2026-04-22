export interface Stop {
    id: string;
    title: string;
    time: string;
    day: number;
    description: string;
    location?: string;
    image?: string | null;
    imageFile?: File;
    order: number;
}

export interface TripData {
    title: string;
    departureDate: string;
    returnDate: string;
    destination: string;
    coverImage: string | null;
    coverImageFile?: File;
    stops: Stop[];
    tags: string[];
    description: string;
    maxTravelers: number;
    price: number;
    isPublic: boolean;
}

export interface TripWithId extends TripData {
    id: string;
    authorId: string;
    authorName?: string | null;
    authorAvatar?: string | null;
    authorHandle?: string | null;
    createdAt?: any;
    updatedAt?: any;
    likedBy?: string[];
    likeCount?: number;
    members?: string[]; // array of userIds
}

export interface JoinRequest {
    id: string;
    tripId: string;
    tripTitle: string;
    ownerId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    message?: string;
    status: "pending" | "accepted" | "rejected";
    createdAt: any;
}

export interface Notification {
    id: string;
    userId: string;
    type: "join_request" | "request_accepted" | "request_rejected";
    title: string;
    message: string;
    tripId: string;
    senderId: string;
    senderName?: string;
    senderAvatar?: string;
    isRead: boolean;
    createdAt: any;
}

// Extends real trip data with missing mock attributes required by the UI
export interface ExploreTripData extends TripWithId {
    user: {
        name: string;
        handle: string;
        avatar: string | null | undefined;
    };
    dates: string;
    likes: number;
    comments: number;
    rating: number;
    category: string;
    duration: string;
    travelers: number;
    timeAgo: string;
    image: string | null | undefined; // fallback for coverImage
    slug: string;  // map ID to slug
    commentsList: any[];
}

export interface ChatConversation {
    id: string;
    participantIds: string[];
    participantDetails: Record<string, { name: string, avatar: string }>;
    lastMessage: string;
    lastMessageTime: any;
    unreadCount: Record<string, number>;
    updatedAt: any;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    createdAt: any;
    status: 'sent' | 'read';
}
