
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";


interface MainLayoutProps {
    children: React.ReactNode;
    showSidebar?: boolean; // Optional: to control sidebar visibility on different pages
}

export default function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login" || pathname === "/signup";
    const isMessagePage = pathname === "/message";

    if (!showSidebar || isLoginPage) {
        return <div className="min-h-screen bg-primary pt-[60px]">{children}</div>;
    }

    return (
        <div className="min-h-screen bg-primary pt-[60px] pb-6 lg:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* LEFT SIDEBAR */}
                    <Sidebar />

                    {/* MAIN CONTENT */}
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}