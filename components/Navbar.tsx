"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  User,
  Home,
  Compass,
  PlusCircle,
  MessageSquare,
  LogOut,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "@/utils/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { toast } from "react-hot-toast";
import UserAvatar from "@/components/UserAvatar";

const navLinks = [
  { label: "HOME", href: "/", icon: <Home size={18} /> },
  { label: "EXPLORE", href: "/explore", icon: <Compass size={18} /> },
    { label: "CREATE TRIP", href: "/create-trip", icon: <PlusCircle size={18} /> },
  { label: "MESSAGES", href: "/message", icon: <MessageSquare size={18} /> },
];

export default function Navbar() {
  const { user } = useAuth();
  
  // Bottom navigation links for mobile
  const bottomNavLinks = [
    { label: "HOME", href: "/", icon: <Home size={20} /> },
    { label: "EXPLORE", href: "/explore", icon: <Compass size={20} /> },
    { label: "CREATE", href: "/create-trip", icon: <PlusCircle size={20} /> },
    { label: "CHAT", href: "/message", icon: <MessageSquare size={20} /> },
    { 
      label: user ? "PROFILE" : "LOGIN", 
      href: user ? "/profile" : "/login", 
      icon: <UserAvatar src={user?.photoURL} name={user?.displayName} size="w-6 h-6" />
    },
  ];

  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        // Filter unread notifications in frontend to avoid index requirement
        const unread = snapshot.docs.filter(doc => !doc.data().isRead);
        setUnreadCount(unread.length);
      },
      (error) => {
        // Silently handle permission errors for guests/logouts
        if (error.code !== "permission-denied") {
          console.error("Notification listener error:", error);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ── DESKTOP / TABLET NAVBAR ── */}
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300
          ${scrolled ? "shadow-[0_2px_20px_rgba(0,0,0,0.08)]" : ""}
          bg-primary border-b border-border
        `}
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group select-none"
              aria-label="Explore Home"
            >
              <span
                className="
                  text-secondary font-extrabold tracking-[0.15em] text-[15px] sm:text-[17px] uppercase
                  group-hover:opacity-80 transition-opacity duration-200
                "
              >
                Explore with unity
              </span>
            </Link>

            {/* Mobile / Tablet Actions */}
            <div className="flex lg:hidden items-center gap-1.5 ml-auto mr-1 sm:mr-3">
              {/* <Link 
                href="/explore" 
                className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-secondary/5 transition-colors"
                aria-label="Search"
              >
                <Search size={18} strokeWidth={2.5} />
              </Link> */}
              
              {user && (
                <>
                  <Link
                    href="/notifications"
                    className="relative w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-secondary/5 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell size={18} strokeWidth={2.5} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white shadow-sm">
                        {unreadCount > 9 ? "!" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut size={18} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </div>

            {/* Desktop Nav Links - hidden on mobile/tablet */}
            <ul className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`
                      relative px-4 py-2 text-xs font-bold tracking-widest uppercase
                      transition-colors duration-200 rounded-sm
                      ${
                        pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                          ? "text-secondary"
                          : "text-text hover:text-secondary"
                      }
                    `}
                  >
                    {link.label}
                    {(pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))) && (
                      <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-secondary rounded-full" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
            
              {/* Notification Bell */}
              {user && (
                <Link
                  href="/notifications"
                  className="
                    relative w-8 h-8 flex items-center justify-center rounded-full
                    text-[#666] hover:text-secondary hover:bg-[#f0f0f0]
                    transition-all duration-150
                  "
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white px-1">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              <div className="h-4 w-px bg-border mx-1" />

              {/* Auth Section */}
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[12px] font-bold text-secondary leading-tight">
                      {user.displayName?.split(" ")[0]}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                    >
                      Sign out
                    </button>
                  </div>
                  <Link href="/profile">
                    <UserAvatar
                      src={user.photoURL}
                      name={user.displayName}
                      size="w-10 h-10 "
                    />
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="
                    px-5 py-2 bg-secondary text-white text-[10px] font-black tracking-widest rounded-full hover:shadow-lg transition-all
                  "
                >
                  JOIN EXPLORE
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-p-6 border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`
                  flex flex-col items-center justify-center gap-1.5
                  py-2 px-1 relative transition-all duration-300
                  ${
                    isActive
                      ? "text-secondary"
                      : "text-text/60 hover:text-text"
                  }
                `}
                aria-label={link.label}
              >
                <div
                  className={`
                    transition-all duration-300 transform
                    ${isActive ? "scale-110 -translate-y-0.5" : "scale-100"}
                  `}
                >
                  {link.icon}
                </div>
                <span className={`text-[10px] font-bold tracking-tight uppercase leading-none ${isActive ? "opacity-100" : "opacity-50"}`}>
                  {link.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-[3px] bg-secondary rounded-full shadow-[0_-2px_10px_rgba(0,0,0,0.1)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
