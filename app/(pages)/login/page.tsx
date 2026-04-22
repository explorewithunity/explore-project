"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-hot-toast";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Logged in with Google!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to log in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col lg:flex-row">

      {/* ── LEFT PANEL — hero image (desktop only) ── */}
      <div className="hidden lg:block lg:w-[52%] relative overflow-hidden">
        <Image
          src="/auth-login.png"
          alt="Login background"
          fill
          className="object-cover scale-105 animate-in fade-in zoom-in-100 duration-[1.4s]"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-black/60 via-black/30 to-transparent" />

        {/* Floating card */}
        <div className="absolute bottom-12 left-10 right-10 animate-in slide-in-from-bottom-6 duration-700 delay-500">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8">
            <p className="text-white/70 text-xs uppercase tracking-[0.2em] font-semibold mb-3">
              Trusted by travelers worldwide
            </p>
            <h1 className="text-white text-4xl xl:text-5xl font-black tracking-tight leading-[1.1] mb-4">
              Welcome back to <br />
              <span className="">Unity Travel</span>
            </h1>
            <p className="text-white/75 text-base leading-relaxed max-w-sm">
              Your next adventure is one login away. Continue crafting unforgettable journeys.
            </p>
   
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16 xl:px-24 bg-white relative overflow-hidden">

        {/* Mobile decorative blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-secondary/5 lg:hidden" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-secondary/5 lg:hidden" />

        {/* Mobile hero strip */}
        <div className="lg:hidden relative h-44 rounded-lg overflow-hidden mb-8">
          <Image src="/auth-login.png" alt="Login" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-5">
            <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">Unity Travel</p>
            <h2 className="text-white text-2xl font-black mt-1">Welcome Back</h2>
          </div>
        </div>

        <div className="max-w-sm w-full mx-auto lg:mx-0 relative z-10">

          {/* Heading */}
          <div className="mb-8 hidden lg:block">
            <p className="text-xs text-secondary font-semibold uppercase tracking-[0.18em] mb-2">
              Sign in
            </p>
            <h2 className="text-3xl xl:text-4xl font-black text-[#1a2a3a] tracking-tight">
              Good to see <br /> you again
            </h2>
            <p className="text-[#8b9aab] text-sm mt-3">
              Enter your credentials to continue your journey.
            </p>
          </div>

          {/* Google button — prominent at top */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-[#e8e6e4] rounded-lg text-sm font-semibold text-[#2c3e4e] bg-white hover:border-secondary/40 hover:bg-secondary/3 transition-all duration-200 disabled:opacity-50 mb-5"
          >
            <FcGoogle className="h-5 w-5 shrink-0" />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-[#e8e6e4]" />
            <span className="text-xs text-[#8b9aab] font-medium tracking-wide whitespace-nowrap">or sign in with email</span>
            <div className="flex-1 h-px bg-[#e8e6e4]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email */}
            <div className="relative group">
              <label className="block text-xs font-semibold text-[#5a6b7a] mb-1.5 ml-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b9aab] group-focus-within:text-secondary transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-[#e8e6e4] rounded-lg bg-[#f8f9fa] text-[#2c3e4e] placeholder-[#b0bcca] text-sm focus:outline-none focus:border-secondary focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-xs font-semibold text-[#5a6b7a]">Password</label>
                <Link href="#" className="text-xs text-secondary font-semibold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b9aab] group-focus-within:text-secondary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 border-2 border-[#e8e6e4] rounded-lg bg-[#f8f9fa] text-[#2c3e4e] placeholder-[#b0bcca] text-sm focus:outline-none focus:border-secondary focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b9aab] hover:text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[#e8e6e4] text-secondary focus:ring-secondary cursor-pointer"
              />
              <span className="text-sm text-[#5a6b7a]">Keep me signed in</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg text-sm font-bold text-white bg-secondary hover:bg-[#1a2a3a] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-secondary/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-7 text-center text-sm text-[#5a6b7a]">
            New to Unity?{" "}
            <Link href="/signup" className="font-bold text-secondary hover:text-[#1a2a3a] transition-colors">
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}