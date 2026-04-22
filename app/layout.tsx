import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MainLayout from "@/components/MainLayout";
import { AuthProvider } from "@/components/AuthContext";
import { LikeProvider } from "@/components/LikeContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Explore with unity",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <LikeProvider>
            <Toaster position="top-center" />
            <Navbar />
            <main className="flex-1">
              <MainLayout showSidebar={true}>{children}</MainLayout>
            </main>
            <Footer />
          </LikeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}