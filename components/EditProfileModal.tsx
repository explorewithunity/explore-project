  "use client";

  import { X, Loader2 } from "lucide-react";
  import Image from "next/image";
  import { useState, useEffect } from "react";
  import { useAuth } from "@/components/AuthContext";
  import { auth, db } from "@/utils/firebase";
  import { updateProfile } from "firebase/auth";
  import { doc, getDoc, setDoc } from "firebase/firestore";
  import { toast } from "react-hot-toast";
  import UserAvatar from "@/components/UserAvatar";

  interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
  }

  export default function EditProfileModal({
    isOpen,
    onClose,
  }: EditProfileModalProps) {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [website, setWebsite] = useState("");
    const [loading, setLoading] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
      if (user) {
        setName(user.displayName || "");
        setPhotoPreview(user.photoURL || "/default-avatar.png");
        
        const fetchProfile = async () => {
          try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUsername(data.username || "");
              setBio(data.bio || "");
              setLocation(data.location || "");
              setWebsite(data.website || "");
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          }
        };
        fetchProfile();
      }
    }, [user, isOpen]);

    const handleSave = async () => {
      if (!user) return;
      setLoading(true);

      try {
        let newPhotoUrl = user.photoURL;
        if (photoFile) {
            // Assume we can import uploadFile from FirebaseActions
            const { uploadFile } = await import("@/components/FirebaseActions");
            newPhotoUrl = await uploadFile(photoFile);
        }
        
        const { syncUserTripsInFirestore } = await import("@/components/FirebaseActions");

        // 1. Update Firebase Auth Profile
        await updateProfile(user, {
          displayName: name,
          photoURL: newPhotoUrl,
        });

        // 2. Update Firestore User Document
        await setDoc(doc(db, "users", user.uid), {
          name,
          username,
          bio,
          location,
          website,
          photoURL: newPhotoUrl || null,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // 3. Synchronize old trip details (authorName, authorAvatar, authorHandle)
        await syncUserTripsInFirestore(user.uid, {
            name,
            handle: username,
            avatar: newPhotoUrl || null
        });

        toast.success("Profile updated successfully!");
        onClose();
        window.location.reload();
      } catch (error: any) {
        toast.error(error.message || "Failed to update profile");
      } finally {
        setLoading(false);
      }
    };

    // Prevent background scrolling when modal is open
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
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#e8e6e4]">
            <h2 className="text-xl font-bold text-[#2c3e4e]">Edit Profile</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 text-[#8b9aab] hover:text-[#2c3e4e] hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <UserAvatar 
                  src={photoPreview} 
                  name={name} 
                  size="w-24 h-24" 
                  className="border-2 border-[#e8e6e4]" 
                />
                <label className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity text-white disabled:cursor-not-allowed">
                  <span className="text-xs font-medium">Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={loading}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPhotoFile(e.target.files[0]);
                        setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
                Name
              </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] focus:outline-none focus:ring-2 focus:ring-[#2c3e4e]/20 focus:border-[#2c3e4e] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] focus:outline-none focus:ring-2 focus:ring-[#2c3e4e]/20 focus:border-[#2c3e4e] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={loading}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] focus:outline-none focus:ring-2 focus:ring-[#2c3e4e]/20 focus:border-[#2c3e4e] transition-all resize-none disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] focus:outline-none focus:ring-2 focus:ring-[#2c3e4e]/20 focus:border-[#2c3e4e] transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] focus:outline-none focus:ring-2 focus:ring-[#2c3e4e]/20 focus:border-[#2c3e4e] transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#e8e6e4] bg-[#faf9f8] flex justify-end gap-3 rounded-b-3xl">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-[#5a6b7a] hover:text-[#2c3e4e] hover:bg-[#e8e6e4] rounded-full transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 bg-[#2c3e4e] text-white text-sm font-medium rounded-full hover:bg-[#1a2a3a] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
