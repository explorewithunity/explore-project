import { db } from "@/utils/firebase";
import { collection, addDoc, getDocs, doc, getDoc, query, orderBy, serverTimestamp, where, updateDoc, setDoc, deleteDoc, arrayUnion, arrayRemove, getCountFromServer, runTransaction, increment } from "firebase/firestore";
import { TripData, TripWithId, ExploreTripData, JoinRequest, ChatConversation, ChatMessage } from "@/types/interface";

// Function to update user heartbeat (lastSeen)
export const updateUserHeartbeat = async (userId: string) => {
    const userRef = doc(db, "users", userId);
    try {
        await updateDoc(userRef, {
            lastSeen: serverTimestamp()
        });
    } catch (error) {
        // Fallback for new documents
        try {
            await setDoc(userRef, { lastSeen: serverTimestamp() }, { merge: true });
        } catch (e) {
            console.error("Error updating heartbeat: ", e);
        }
    }
};

// Function to upload a file to the server and return the Cloudinary URL
export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.result.secure_url;
};

// Function to create a new trip
export const createTrip = async (tripData: TripData, userId: string, userName?: string | null, userAvatar?: string | null) => {
    try {
        let coverImageUrl = tripData.coverImage;

        // 1. Upload cover image if a new one is provided
        if (tripData.coverImageFile) {
            coverImageUrl = await uploadFile(tripData.coverImageFile);
        }

        // 2. Upload images for stops and get their URLs
        const stopsWithImageUrls = await Promise.all(
            tripData.stops.map(async (stop) => {
                if (stop.imageFile) {
                    const imageUrl = await uploadFile(stop.imageFile);
                    // Create a new stop object without the imageFile property
                    const { imageFile, ...stopWithoutFile } = stop;
                    return { ...stopWithoutFile, image: imageUrl };
                }
                return stop; // Keep existing image URL or no image
            })
        );

        // 3. Prepare the final trip data for Firestore
        const tripToSave = {
            ...tripData,
            coverImage: coverImageUrl,
            stops: stopsWithImageUrls,
            authorId: userId,
            authorName: userName || "Community Explorer",
            authorAvatar: userAvatar || null,
            members: [userId], // Author is the first member
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Remove the temporary file objects before saving
        delete tripToSave.coverImageFile;

        // 4. Add the new trip document to the 'trips' collection
        const docRef = await addDoc(collection(db, "trips"), tripToSave);

        console.log("Trip created with ID: ", docRef.id);
        return docRef.id;

    } catch (error) {
        console.error("Error creating trip: ", error);
        // Re-throw original error so the caller can see the real failure reason
        throw error;
    }
};

// Function to update an existing trip
export const updateTrip = async (tripId: string, tripData: Partial<TripData>) => {
    try {
        const tripRef = doc(db, "trips", tripId);
        let coverImageUrl = tripData.coverImage;

        // 1. Upload cover image if a new one is provided
        if (tripData.coverImageFile) {
            coverImageUrl = await uploadFile(tripData.coverImageFile);
        }

        // 2. Prepare the update data
        const updateData: any = {
            ...tripData,
            updatedAt: serverTimestamp(),
        };

        if (coverImageUrl) {
            updateData.coverImage = coverImageUrl;
        }

        // Remove temporary file objects
        delete updateData.coverImageFile;
        
        // Ensure we don't accidentally overwrite with undefined if stops weren't provided in partial update
        if (updateData.stops) {
             // Handle stop images if they were updated (simplified for now, usually stops are edited in a separate flow or fully replaced)
             updateData.stops = await Promise.all(
                updateData.stops.map(async (stop: any) => {
                    if (stop.imageFile) {
                        const imageUrl = await uploadFile(stop.imageFile);
                        const { imageFile, ...stopWithoutFile } = stop;
                        return { ...stopWithoutFile, image: imageUrl };
                    }
                    return stop;
                })
            );
        }

        await updateDoc(tripRef, updateData);
        console.log("Trip updated with ID: ", tripId);
    } catch (error) {
        console.error("Error updating trip: ", error);
        throw error;
    }
};

// Function to delete a trip
export const deleteTrip = async (tripId: string) => {
    try {
        const tripRef = doc(db, "trips", tripId);
        await deleteDoc(tripRef);
        console.log("Trip deleted with ID: ", tripId);
    } catch (error) {
        console.error("Error deleting trip: ", error);
        throw error;
    }
};

// Helper to map a raw Firebase trip into the expanded UI format
export const mapTripForUI = (trip: TripWithId, commentCount: number = 0): ExploreTripData => {
    // Calculate simple duration in days
    let durationStr = "Unknown";
    if (trip.departureDate && trip.returnDate) {
        const d1 = new Date(trip.departureDate).getTime();
        const d2 = new Date(trip.returnDate).getTime();
        if (!isNaN(d1) && !isNaN(d2)) {
            const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
            durationStr = diffDays > 0 ? `${diffDays} days` : 'Day trip';
        }
    }

    // Convert dates formats (e.g. "OCT 12 - OCT 15")
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    }
    
    let datesStr = `${formatDate(trip.departureDate)} - ${formatDate(trip.returnDate)}`;
    if (trip.updatedAt && typeof trip.updatedAt.toDate === 'function') {
        datesStr = trip.updatedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
    }

    // Sanitize Unsplash logic
    const sanitizeUnsplash = (url: string | null | undefined) => {
        if (url && url.includes('unsplash.com')) return null;
        return url;
    };

    // Calculate time ago for the trip itself
    let publishedTime = "Recently";
    if (trip.createdAt && typeof trip.createdAt.toDate === 'function') {
        const date = trip.createdAt.toDate();
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) publishedTime = "Just now";
        else if (diffInSeconds < 3600) publishedTime = `${Math.floor(diffInSeconds / 60)}m ago`;
        else if (diffInSeconds < 86400) publishedTime = `${Math.floor(diffInSeconds / 3600)}h ago`;
        else if (diffInSeconds < 2592000) publishedTime = `${Math.floor(diffInSeconds / 86400)}d ago`;
        else publishedTime = date.toLocaleDateString();
    }

    return {
        ...trip,
        image: sanitizeUnsplash(trip.coverImage), 
        slug: trip.id,
        dates: datesStr,
        duration: durationStr,
        travelers: trip.maxTravelers || 0,
        timeAgo: publishedTime,
        user: {
            name: trip.authorName || "Community Explorer",
            // The handle is still generated if not stored natively
            handle: trip.authorId ? (trip.authorHandle || `@${(trip.authorName || "explorer").toLowerCase().replace(/\s+/g, "")}`) : "@explorer",
            avatar: sanitizeUnsplash(trip.authorAvatar),
        },
        likes: trip.likeCount || 0,
        likedBy: trip.likedBy || [],
        comments: commentCount,
        rating: 4.8,                                  // mock rating
        category: trip.tags && trip.tags.length > 0 ? trip.tags[0] : "Adventure",
        commentsList: []
    };
};

/**
 * Enriches a list of trips with real-time user profiles from the 'users' collection.
 * Uses the caching layer to minimize reads.
 */
export const enrichTripsWithUserProfiles = async (trips: ExploreTripData[]) => {
    return Promise.all(trips.map(async (trip) => {
        if (!trip.authorId) return trip;
        
        const latestProfile = await getUserProfileWithCache(trip.authorId);
        if (latestProfile) {
            return {
                ...trip,
                user: {
                    ...trip.user,
                    name: latestProfile.name,
                    avatar: latestProfile.avatar,
                    // Optionally update handle if desired from fresh name
                }
            };
        }
        return trip;
    }));
};

export const getJoinedTripsByUserId = async (userId: string): Promise<ExploreTripData[]> => {
    try {
        // Approach: Instead of querying the 'trips' collection directly with array-contains (which can fail with strict rules),
        // we fetch the user's accepted join requests and then fetch each trip by its specific ID.
        const requestsRef = collection(db, "joinRequests");
        const q = query(requestsRef, 
            where("senderId", "==", userId),
            where("status", "==", "accepted")
        );
        
        const requestSnapshot = await getDocs(q);
        const tripIds = requestSnapshot.docs.map(doc => doc.data().tripId);
        
        // Remove duplicates if any
        const uniqueTripIds = Array.from(new Set(tripIds));
        
        // Enrich each trip manually for now (or use the helper)
        const enrichedTrips = await Promise.all(uniqueTripIds.map(async (tripId) => {
            try {
                const trip = await getTripById(tripId);
                // getTripById already performs enrichment!
                return trip;
            } catch (err) {
                console.warn(`Could not fetch details for joined trip ${tripId}:`, err);
                return null;
            }
        }));

        const results = enrichedTrips;
        const trips = results.filter((t): t is ExploreTripData => t !== null);
        
        // Manual sort by createdAt if available
        trips.sort((a: any, b: any) => {
            const dateA = a.createdAt?.toMillis?.() || 0;
            const dateB = b.createdAt?.toMillis?.() || 0;
            return dateB - dateA;
        });

        return trips;
    } catch (error) {
        console.error("Error fetching joined trips via requests: ", error);
        // Fallback: If joinRequests query fails, try the memberships query as a last resort
        try {
            const tripsRef = collection(db, "trips");
            const q = query(tripsRef, where("members", "array-contains", userId));
            const querySnapshot = await getDocs(q);
            
            const tripsPromises = querySnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const tripWithId: TripWithId = {
                    ...(data as TripData),
                    id: doc.id,
                    authorId: data.authorId,
                    authorName: data.authorName,
                    authorAvatar: data.authorAvatar,
                    likedBy: data.likedBy || [],
                    members: data.members || [],
                    createdAt: data.createdAt
                };

                let commentCount = 0;
                try {
                    const commentsRef = collection(db, "trips", doc.id, "comments");
                    const countSnapshot = await getCountFromServer(commentsRef);
                    commentCount = countSnapshot.data().count;
                } catch (err) {
                    console.warn(`Could not fetch comment count for joined trip ${doc.id}:`, err);
                }
                
                return {
                    ...mapTripForUI(tripWithId, commentCount),
                    timestamp: data.createdAt?.toDate()?.getTime() || 0
                };
            });

            const trips = await Promise.all(tripsPromises);
            trips.sort((a: any, b: any) => b.timestamp - a.timestamp);
            return trips;
        } catch (e) {
            console.error("Critical error fetching joined trips: ", e);
            return [];
        }
    }
};

export const getTrips = async (): Promise<ExploreTripData[]> => {
    try {
        const tripsRef = collection(db, "trips");
        const q = query(tripsRef, where("isPublic", "==", true), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const tripsPromises = querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const tripWithId: TripWithId = {
                ...(data as TripData),
                id: doc.id,
                authorId: data.authorId,
                authorName: data.authorName,
                authorAvatar: data.authorAvatar,
                likedBy: data.likedBy || []
            };

            // Fetch real comment count with guest-safe error handling
            let commentCount = 0;
            try {
                const commentsRef = collection(db, "trips", doc.id, "comments");
                const countSnapshot = await getCountFromServer(commentsRef);
                commentCount = countSnapshot.data().count;
            } catch (err) {
                console.warn(`Could not fetch comment count for trip ${doc.id}:`, err);
            }
            const rawTrip = mapTripForUI(tripWithId, commentCount);
            // Dynamic enrichment from cache
            const latestProfile = await getUserProfileWithCache(tripWithId.authorId);
            if (latestProfile) {
                rawTrip.user = {
                    ...rawTrip.user,
                    name: latestProfile.name,
                    handle: latestProfile.handle,
                    avatar: latestProfile.avatar
                };
            }
            return rawTrip;
        });
        
        const trips = await Promise.all(tripsPromises);
        return trips;
    } catch (error) {
        console.error("Error fetching trips: ", error);
        return [];
    }
}

export const getTripsByUserId = async (userId: string, isPublicOnly: boolean = false): Promise<ExploreTripData[]> => {
    try {
        const tripsRef = collection(db, "trips");
        
        let q;
        if (isPublicOnly) {
            // Guests can ONLY query public trips. 
            // NOTE: This requires a composite index on authorId and isPublic.
            q = query(tripsRef, where("authorId", "==", userId), where("isPublic", "==", true));
        } else {
            q = query(tripsRef, where("authorId", "==", userId));
        }
        
        const querySnapshot = await getDocs(q);
        
        const tripsPromises = querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const tripWithId: TripWithId = {
                ...(data as TripData),
                id: doc.id,
                authorId: data.authorId,
                authorName: data.authorName,
                authorAvatar: data.authorAvatar,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                likedBy: data.likedBy || []
            };
            
            let commentCount = 0;
            try {
                const commentsRef = collection(db, "trips", doc.id, "comments");
                const countSnapshot = await getCountFromServer(commentsRef);
                commentCount = countSnapshot.data().count;
            } catch (err) {
                console.warn(`Could not fetch comment count for trip ${doc.id}:`, err);
            }
            const rawTrip = mapTripForUI(tripWithId, commentCount);
            // Dynamic enrichment from cache
            const latestProfile = await getUserProfileWithCache(tripWithId.authorId);
            if (latestProfile) {
                rawTrip.user = {
                    ...rawTrip.user,
                    name: latestProfile.name,
                    handle: latestProfile.handle,
                    avatar: latestProfile.avatar
                };
            }
            return rawTrip;
        });
        
        const trips = await Promise.all(tripsPromises);
        
        // Client-side sort by createdAt descending
        trips.sort((a, b) => {
            return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        });
        
        return trips;
    } catch (error) {
        console.error("Error fetching user trips: ", error);
        return [];
    }
}

export const getTripById = async (tripId: string): Promise<ExploreTripData | null> => {
    try {
        const docRef = doc(db, "trips", tripId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const tripWithId: TripWithId = {
                ...(data as Omit<TripData, 'coverImageFile'>),
                id: docSnap.id,
                authorId: data.authorId,
                authorName: data.authorName,
                authorAvatar: data.authorAvatar,
                coverImage: data.coverImage || null,
                likedBy: data.likedBy || []
            };
            let commentCount = 0;
            try {
                const commentsRef = collection(db, "trips", docSnap.id, "comments");
                const countSnapshot = await getCountFromServer(commentsRef);
                commentCount = countSnapshot.data().count;
            } catch (err) {
                console.warn(`Could not fetch comment count for trip ${docSnap.id}:`, err);
            }
            
            const rawTrip = mapTripForUI(tripWithId, commentCount);
            // Dynamic enrichment from cache
            const latestProfile = await getUserProfileWithCache(tripWithId.authorId);
            if (latestProfile) {
                rawTrip.user = {
                    ...rawTrip.user,
                    name: latestProfile.name,
                    handle: latestProfile.handle,
                    avatar: latestProfile.avatar
                };
            }
            return rawTrip;
        } else {
            console.log("No such trip!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching trip by ID: ", error);
        return null;
    }
}

export const toggleLikeTrip = async (tripId: string, userId: string, isLiking: boolean) => {
    const likeId = `${userId}_${tripId}`;
    const likeRef = doc(db, "likes", likeId);
    const tripRef = doc(db, "trips", tripId);

    try {
        await runTransaction(db, async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            
            if (isLiking) {
                if (!likeDoc.exists()) {
                    transaction.set(likeRef, {
                        userId,
                        tripId,
                        createdAt: serverTimestamp()
                    });
                    transaction.update(tripRef, {
                        likeCount: increment(1)
                    });
                }
            } else {
                if (likeDoc.exists()) {
                    transaction.delete(likeRef);
                    transaction.update(tripRef, {
                        likeCount: increment(-1)
                    });
                }
            }
        });
    } catch (error) {
        console.error("Error toggling like in transaction: ", error);
        throw error;
    }
};

export const checkIfLiked = async (tripId: string, userId: string) => {
    if (!userId || !tripId) return false;
    const likeId = `${userId}_${tripId}`;
    const likeRef = doc(db, "likes", likeId);
    const likeDoc = await getDoc(likeRef);
    return likeDoc.exists();
};

export const getUserLikedTrips = async (userId: string) => {
    if (!userId) return [];
    try {
        const likesRef = collection(db, "likes");
        const q = query(likesRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data().tripId);
    } catch (error) {
        console.error("Error getting user liked trips:", error);
        return [];
    }
};

export const toggleFollowUser = async (followerId: string, followingId: string, isFollowing: boolean) => {
    try {
        const docRef = doc(db, "follows", `${followerId}_${followingId}`);
        if (isFollowing) {
            await deleteDoc(docRef);
        } else {
            await setDoc(docRef, {
                followerId,
                followingId,
                createdAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error toggling follow:", error);
        throw error;
    }
};

export interface CommentData {
    id: string;
    text: string;
    userId: string;
    user: string;
    avatar: string;
    createdAt: any;
    time?: string;
}

export const addTripComment = async (tripId: string, userId: string, userName: string, userAvatar: string, text: string) => {
    try {
        const commentsRef = collection(db, "trips", tripId, "comments");
        const docRef = await addDoc(commentsRef, {
            text,
            userId,
            user: userName,
            avatar: userAvatar,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding comment: ", error);
        throw error;
    }
};

export const getTripComments = async (tripId: string): Promise<CommentData[]> => {
    try {
        const commentsRef = collection(db, "trips", tripId, "comments");
        const q = query(commentsRef, orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            let timeAgo = "Just now";
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                const date = data.createdAt.toDate();
                const now = new Date();
                const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
                
                if (diffInSeconds < 60) timeAgo = "Just now";
                else if (diffInSeconds < 3600) timeAgo = `${Math.floor(diffInSeconds / 60)}m ago`;
                else if (diffInSeconds < 86400) timeAgo = `${Math.floor(diffInSeconds / 3600)}h ago`;
                else timeAgo = `${Math.floor(diffInSeconds / 86400)}d ago`;
            }
            
            return {
                id: doc.id,
                text: data.text,
                userId: data.userId,
                user: data.user,
                avatar: data.avatar,
                createdAt: data.createdAt,
                time: timeAgo
            } as CommentData;
        });
    } catch (error) {
        console.error("Error fetching comments: ", error);
        return [];
    }
};

export const getFollowStatus = async (followerId: string, followingId: string) => {
    try {
        if (!followerId || !followingId) return false;
        const docSnap = await getDoc(doc(db, "follows", `${followerId}_${followingId}`));
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
};

export const getFollowerCount = async (userId: string) => {
    try {
        const coll = collection(db, "follows");
        const q = query(coll, where("followingId", "==", userId));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    } catch (error) {
        return 0;
    }
};

export const getFollowingCount = async (userId: string) => {
    try {
        const coll = collection(db, "follows");
        const q = query(coll, where("followerId", "==", userId));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    } catch (error) {
        return 0;
    }
};

export interface FollowUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export const getFollowers = async (userId: string): Promise<FollowUser[]> => {
    try {
        const coll = collection(db, "follows");
        const q = query(coll, where("followingId", "==", userId));
        const snapshot = await getDocs(q);
        
        const followerIds = snapshot.docs.map(doc => doc.data().followerId);
        
        const users: FollowUser[] = [];
        for (const id of followerIds) {
            const userDoc = await getDoc(doc(db, "users", id));
            if (userDoc.exists()) {
                const data = userDoc.data();
                users.push({
                    id,
                    name: data.name || "Traveler",
                    username: data.username || "traveler",
                    avatar: data.photoURL || data.avatar || "/default-avatar.png"
                });
            } else {
                users.push({
                    id,
                    name: "Traveler",
                    username: "traveler",
                    avatar: "/default-avatar.png"
                });
            }
        }
        return users;
    } catch (error) {
        console.error("Error fetching followers:", error);
        return [];
    }
};

export const getFollowing = async (userId: string): Promise<FollowUser[]> => {
    try {
        const coll = collection(db, "follows");
        const q = query(coll, where("followerId", "==", userId));
        const snapshot = await getDocs(q);
        
        const followingIds = snapshot.docs.map(doc => doc.data().followingId);
        
        const users: FollowUser[] = [];
        for (const id of followingIds) {
            const userDoc = await getDoc(doc(db, "users", id));
            if (userDoc.exists()) {
                const data = userDoc.data();
                users.push({
                    id,
                    name: data.name || "Traveler",
                    username: data.username || "traveler",
                    avatar: data.photoURL || data.avatar || "/default-avatar.png"
                });
            } else {
                users.push({
                    id,
                    name: "Traveler",
                    username: "traveler",
                    avatar: "/default-avatar.png"
                });
            }
        }
        return users;
    } catch (error) {
        console.error("Error fetching following:", error);
        return [];
    }
};

export const getFollowingIds = async (userId: string): Promise<string[]> => {
    try {
        const coll = collection(db, "follows");
        const q = query(coll, where("followerId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data().followingId);
    } catch (error) {
        console.error("Error fetching following IDs:", error);
        return [];
    }
};



// ── JOIN REQUESTS ─────────────────────────────────────────────────────────

export const hasExistingJoinRequest = async (tripId: string, userId: string) => {
    try {
        const requestsRef = collection(db, "joinRequests");
        const q = query(requestsRef, 
            where("tripId", "==", tripId), 
            where("senderId", "==", userId),
            where("status", "in", ["pending", "accepted"])
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return {
                exists: true,
                status: snapshot.docs[0].data().status
            };
        }
        return { exists: false, status: null };
    } catch (error) {
        console.error("Error checking existing join request:", error);
        return { exists: false, status: null };
    }
};

export const sendJoinRequest = async (trip: any, sender: { uid: string; name: string; avatar: string }, message?: string) => {
    try {
        const requestsRef = collection(db, "joinRequests");
        
        // 1. Check if already requested using the helper
        const { exists } = await hasExistingJoinRequest(trip.id, sender.uid);
        if (exists) {
            throw new Error("You have already sent a request for this trip.");
        }

        // 2. Create the request
        const requestData = {
            tripId: trip.id,
            tripTitle: trip.title,
            ownerId: trip.authorId,
            senderId: sender.uid,
            senderName: sender.name,
            senderAvatar: sender.avatar,
            message: message || "I'd love to join your trip!",
            status: "pending",
            createdAt: serverTimestamp()
        };

        const requestDoc = await addDoc(requestsRef, requestData);

        // 3. Create notification for owner
        await addDoc(collection(db, "notifications"), {
            userId: trip.authorId,
            type: "join_request",
            title: "New Join Request",
            message: `${sender.name} wants to join your trip: ${trip.title}`,
            tripId: trip.id,
            senderId: sender.uid,
            senderName: sender.name,
            senderAvatar: sender.avatar,
            requestId: requestDoc.id,
            isRead: false,
            createdAt: serverTimestamp()
        });

        return requestDoc.id;
    } catch (error) {
        console.error("Error sending join request:", error);
        throw error;
    }
};

export const getJoinRequestsForOwner = async (ownerId: string) => {
    try {
        const q = query(collection(db, "joinRequests"), 
            where("ownerId", "==", ownerId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching join requests:", error);
        return [];
    }
};

export const getJoinRequestsByUser = async (userId: string): Promise<JoinRequest[]> => {
    try {
        const q = query(collection(db, "joinRequests"), 
            where("senderId", "==", userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JoinRequest));
    } catch (error) {
        console.error("Error fetching my requests:", error);
        return [];
    }
};

export const respondToJoinRequest = async (requestId: string, status: "accepted" | "rejected") => {
    try {
        const requestRef = doc(db, "joinRequests", requestId);
        const requestSnap = await getDoc(requestRef);
        if (!requestSnap.exists()) throw new Error("Request not found");
        
        const requestData = requestSnap.data();

        await runTransaction(db, async (transaction) => {
            // 1. Update request status
            transaction.update(requestRef, { status, updatedAt: serverTimestamp() });

            // 2. If accepted, add to trip members
            if (status === "accepted") {
                const tripRef = doc(db, "trips", requestData.tripId);
                transaction.update(tripRef, {
                    members: arrayUnion(requestData.senderId)
                });
            }

            // 3. Notify the sender
            const notificationRef = doc(collection(db, "notifications"));
            transaction.set(notificationRef, {
                userId: requestData.senderId,
                type: status === "accepted" ? "request_accepted" : "request_rejected",
                title: status === "accepted" ? "Request Accepted!" : "Join Request Response",
                message: status === "accepted" 
                    ? `Your request to join "${requestData.tripTitle}" was accepted!`
                    : `Your request to join "${requestData.tripTitle}" was declined.`,
                tripId: requestData.tripId,
                senderId: requestData.ownerId,
                isRead: false,
                createdAt: serverTimestamp()
            });
        });
    } catch (error) {
        console.error("Error responding to join request:", error);
        throw error;
    }
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────

export const markNotificationRead = async (notificationId: string) => {
    try {
        const docRef = doc(db, "notifications", notificationId);
        await updateDoc(docRef, { isRead: true });
    } catch (error) {
        console.error("Error marking notification read:", error);
    }
};

export const deleteNotification = async (notificationId: string) => {
    try {
        await deleteDoc(doc(db, "notifications", notificationId));
    } catch (error) {
        console.error("Error deleting notification:", error);
    }
};

// ── USER PROFILE CACHING ───────────────────────────────────────────────────

// Memory-only cache to avoid redundant Reads for the same user profiles
const userCache = new Map<string, { name: string, handle: string, avatar: string | null }>();

/**
 * Fetches and caches a user profile from the 'users' collection with high efficiency.
 */
export const getUserProfileWithCache = async (uid: string) => {
    if (!uid) return null;
    
    // 1. Check memory cache first
    if (userCache.has(uid)) {
        return userCache.get(uid);
    }

    try {
        // 2. Otherwise, perform the single Firestore read
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            const profile = {
                name: data.name || data.displayName || "Traveler",
                handle: data.username || data.handle || "traveler",
                avatar: data.photoURL || data.avatar || "/card-placeholder.jpg"
            };
            // 3. Update the cache for future hits
            userCache.set(uid, profile);
            return profile;
        }
    } catch (err) {
        console.warn(`Could not resolve profile for user ${uid}:`, err);
    }
    
    return null;
};

/**
 * Synchronizes all existing trip journals for a user when they update their profile.
 * This ensures legacy data in Firestore stays clean without waiting for the cache.
 */
export const syncUserTripsInFirestore = async (uid: string, profileData: { name: string, handle: string, avatar: string | null }) => {
    if (!uid) return;

    try {
        const tripsRef = collection(db, "trips");
        const q = query(tripsRef, where("authorId", "==", uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return;

        // Perform the mass update in batches using direct updateDoc calls
        const syncPromises = querySnapshot.docs.map(async (tripDoc) => {
            const tripRef = doc(db, "trips", tripDoc.id);
            return updateDoc(tripRef, {
                authorName: profileData.name,
                authorHandle: profileData.handle,
                authorAvatar: profileData.avatar
            });
        });

        await Promise.all(syncPromises);

        // Update local cache so Feed/Explore see the changes immediately without re-fetch
        userCache.set(uid, profileData);
        
        console.log(`Successfully synced ${querySnapshot.size} trips for user ${uid}`);
    } catch (err) {
        console.error(`Failed to sync legacy trips for user ${uid}:`, err);
    }
};

// ── FILE UPLOAD & MANAGEMENT ─────────────────────────────────────────────────────────────

/**
 * Creates a unique conversation ID for two users by predictably sorting their UIDs.
 */
export const getChatId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join("_");
};

/**
 * Finds an existing conversation or creates a new one with cached participant details.
 */
export const getOrCreateConversation = async (currentUser: { uid: string, name: string, avatar: string }, targetUserId: string) => {
    try {
        const chatId = getChatId(currentUser.uid, targetUserId);
        const chatRef = doc(db, "conversations", chatId);
        let chatSnap;
        try {
            chatSnap = await getDoc(chatRef);
            if (chatSnap.exists()) {
                return chatId;
            }
        } catch (err) {
            console.warn("Could not check for existing conversation due to permissions. Attempting to create one.", err);
            // If it failed because it doesn't exist AND we don't have read permission, we try to create it anyway (the setDoc will fail if rules block it)
        }

        // Fetch target user details from 'users' collection with resilience for restrictive rules
        let targetDetail = await getUserProfileWithCache(targetUserId) || {
            name: "Traveler",
            avatar: "/default-avatar.png"
        };
        
        try {
            const targetUserDoc = await getDoc(doc(db, "users", targetUserId));
            if (targetUserDoc.exists()) {
                const data = targetUserDoc.data();
                targetDetail = {
                    name: data.name || data.displayName || "Traveler",
                    avatar: data.photoURL || data.avatar || "/card-placeholder.jpg"
                };
            }
        } catch (err) {
            console.warn("Could not fetch target user profile for conversation (likely restrictive rules), using defaults.", err);
        }

        const unreadCount: Record<string, number> = {};
        unreadCount[currentUser.uid] = 0;
        unreadCount[targetUserId] = 0;

        const conversationData = {
            id: chatId,
            participantIds: [currentUser.uid, targetUserId],
            participantDetails: {
                [currentUser.uid]: {
                    name: currentUser.name,
                    avatar: currentUser.avatar || "/default-avatar.png"
                },
                [targetUserId]: targetDetail
            },
            lastMessage: "",
            lastMessageTime: serverTimestamp(),
            unreadCount: unreadCount,
            updatedAt: serverTimestamp()
        };

        await setDoc(chatRef, conversationData);
        return chatId;
    } catch (error) {
        console.error("Error creating conversation:", error);
        throw error;
    }
};

/**
 * Sends a message and updates the parent conversation summary.
 */
export const sendMessage = async (chatId: string, senderId: string, text: string) => {
    try {
        const messagesRef = collection(db, "conversations", chatId, "messages");
        const chatRef = doc(db, "conversations", chatId);

        // 1. Add the message
        const messageData = {
            senderId,
            text,
            createdAt: serverTimestamp(),
            status: "sent"
        };

        await addDoc(messagesRef, messageData);

        // 2. Update conversation summary and increment unread counts for others
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
            const chatData = chatSnap.data();
            const newUnreadCount = { ...chatData.unreadCount };
            
            chatData.participantIds.forEach((uid: string) => {
                if (uid !== senderId) {
                    newUnreadCount[uid] = (newUnreadCount[uid] || 0) + 1;
                }
            });

            await updateDoc(chatRef, {
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                unreadCount: newUnreadCount,
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

/**
 * Resets the unread count for a specific user in a conversation.
 */
export const markConversationAsRead = async (chatId: string, userId: string) => {
    try {
        const chatRef = doc(db, "conversations", chatId);
        const chatSnap = await getDoc(chatRef);
        
        if (chatSnap.exists()) {
            const unreadCount = chatSnap.data().unreadCount || {};
            unreadCount[userId] = 0;
            
            await updateDoc(chatRef, { unreadCount });
        }
    } catch (error) {
        console.error("Error marking chat as read:", error);
    }
};
