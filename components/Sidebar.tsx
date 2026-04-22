"use client";

import {
    FolderOpen,
    MessageSquare,
    Bell,
    User,
    ChevronRight,
    Compass,
    MapPin,
    Users,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getTripsByUserId, getFollowerCount } from "./FirebaseActions";
import UserAvatar from "./UserAvatar";

const dashboardItems = [
    { label: "Explore", icon: Compass, href: "/explore", gradient: "from-emerald-500 to-teal-500" },
    { label: "Messages", icon: MessageSquare, href: "/message", gradient: "from-blue-500 to-indigo-500" },
    { label: "Notifications", icon: Bell, href: "/notifications", gradient: "from-purple-500 to-pink-500" },
    { label: "Profile", icon: User, href: "/profile", gradient: "from-orange-500 to-amber-500" },
];

export default function LeftSidebar() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [tripsCount, setTripsCount] = useState(0);
    const [cityCount, setCityCount] = useState(0);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        if (user && user.uid) {
            const fetchStats = async () => {
                try {
                    const trips = await getTripsByUserId(user.uid, !user);
                    setTripsCount(trips.length);
                    const uniqueCities = new Set(trips.map((t: any) => t.destination).filter(Boolean));
                    setCityCount(uniqueCities.size);
                    const followers = await getFollowerCount(user.uid);
                    setFollowerCount(followers);
                } catch (error: any) {
                    if (error.code !== "permission-denied") {
                        console.error("Error fetching stats for sidebar:", error);
                    }
                }
            };
            fetchStats();
        } else {
            setTripsCount(0);
            setCityCount(0);
            setFollowerCount(0);
        }
    }, [user]);

    const stats = [
        { label: "Trips", value: tripsCount, icon: MapPin },
        { label: "Cities", value: cityCount, icon: MapPin },
        { label: "Followers", value: followerCount, icon: Users },
    ];

    return (
        <aside className="hidden lg:block lg:w-80 xl:w-75 shrink-0">
            <div className="bg-linear-to-t from-white via-white to-secondary/5 rounded-3xl border border-gray-200/60 p-6 sticky top-[80px] space-y-6 shadow-xl shadow-gray-200/50 backdrop-blur-sm">
                {user ? (
                    <>
                        {/* Profile Section */}
                        <div className="text-center group relative ">
                            {/* Decorative gradient orb */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-linear-to-br from-secondary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            
                            <div className="relative inline-block mb-2">
                                <div className="relative w-28 h-28 mx-auto">
                                    <div className="absolute inset-0 rounded-full bg-linear-to-tr from-white/90 to-white/50 animate-pulse group-hover:animate-none shadow-sm " />
                                    <div className="absolute inset-[2px] rounded-full bg-white p-1">
                                        <UserAvatar
                                            src={user.photoURL || undefined}
                                            name={user.displayName || "User"}
                                            size="w-full h-full"
                                            className="rounded-full object-cover"
                                        />
                                    </div>
                                </div>
                              
                            </div>
                            
                            <h2 className="text-2xl font-bold bg-linear-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
                                {user.displayName || "Traveler"}
                            </h2>
                        
                        </div>

                     

                    
                    </>
                ) : (
                    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-secondary via-secondary to-secondary/90 p-6 text-white shadow-2xl shadow-secondary/30">
                        {/* Animated background elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000" />
                        
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 mx-auto backdrop-blur-sm">
                                <Compass className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-bold text-center mb-2">Start Exploring</h2>
                            <p className="text-xs text-white/80 text-center mb-6 leading-relaxed">
                                Join thousands of travelers sharing their adventures around the world.
                            </p>
                            <Link
                                href="/login"
                                className="block w-full py-2.5 bg-white text-secondary text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-gray-50  text-center shadow-lg"
                            >
                                Get Started
                            </Link>
                           
                        </div>
                    </div>
                )}

                <div className="h-px bg-linear-to-r from-transparent via-gray-200 to-transparent " />

                {/* Navigation */}
                <nav className="space-y-1.5">
                    {dashboardItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                            <Link key={item.label} href={item.href}>
                                <div
                                    className={`
                                      relative group flex items-center gap-3 px-4 py-3 rounded-lg
                                      transition-all duration-300 cursor-pointer overflow-hidden 
                                      ${active
                                            ? "bg-linear-to-r from-secondary to-secondary text-primary shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-secondary"
                                        }
                                    `}
                                >
                                    {/* Active indicator */}
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-linear-to-b from-secondary to-secondary/60 rounded-r-full" />
                                    )}
                                    
                                    <div className={`
                                        relative z-10 transition-all duration-300
                                        ${active ? "scale-110" : "group-hover:scale-110"}
                                    `}>
                                        <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                                    </div>
                                    
                                    <span className="flex-1 text-sm font-medium ">
                                        {item.label}
                                    </span>
                                    
                                    {!active && (
                                        <ChevronRight
                                            size={16}
                                            className="opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300"
                                        />
                                    )}
                                    
                                    {active && (
                                        <div className="absolute inset-0 bg-linear-to-r from-secondary/5 to-transparent" />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

            </div>
        </aside>
    );
}