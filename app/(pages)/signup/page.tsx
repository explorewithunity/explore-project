"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/utils/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-hot-toast";
import Image from "next/image";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        username: name.toLowerCase().replace(/\s+/g, "") + Math.floor(Math.random() * 1000),
        bio: "",
        location: "",
        website: "",
        photoURL: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success("Account created successfully!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName || "Traveler",
          email: user.email,
          username:
            (user.displayName ? user.displayName.toLowerCase().replace(/\s+/g, "") : "traveler") +
            Math.floor(Math.random() * 1000),
          bio: "",
          location: "",
          website: "",
          photoURL: user.photoURL || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      toast.success("Signed up with Google!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col lg:flex-row">

      {/* ── RIGHT PANEL — hero image (desktop only, flipped side vs login) ── */}
      <div className="hidden lg:block lg:w-[52%] relative overflow-hidden">
        <Image
          src="/auth-signup.png"
          alt="Signup background"
          fill
          className="object-cover scale-105 animate-in fade-in zoom-in-100 duration-[1.4s]"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-bl from-black/60 via-black/30 to-transparent" />

        {/* Floating card */}
        <div className="absolute bottom-12 left-10 right-10 animate-in slide-in-from-bottom-6 duration-700 delay-500">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 ">
            <p className="text-white/70 text-xs uppercase tracking-[0.2em] font-semibold mb-3">
              Start your adventure
            </p>
            <h1 className="text-white text-4xl xl:text-5xl font-black tracking-tight leading-[1.1] mb-4">
              Your journey <br />
              starts <span className="">here</span>
            </h1>
            <p className="text-white/75 text-base leading-relaxed max-w-sm">
              Join thousands of travelers crafting unforgettable memories across the globe.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-6">
              {["Trip Planner", "Location Sharing", "Travel Community", "Messaging" ].map((f) => (
                <span
                  key={f}
                  className="text-xs text-white/80 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 font-medium"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── LEFT PANEL — form ── */}
      <div className="flex-1 flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16 xl:px-24 bg-white relative overflow-hidden">

        {/* Mobile blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-secondary/5 lg:hidden" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-secondary/5 lg:hidden" />

        {/* Mobile hero strip */}
        <div className="lg:hidden relative h-44 rounded-lg overflow-hidden mb-8">
          <Image src="/auth-signup.png" alt="Signup" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-5">
            <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">Unity Travel</p>
            <h2 className="text-white text-2xl font-black mt-1">Create Account</h2>
          </div>
        </div>

        <div className="max-w-sm w-full mx-auto lg:mx-0 relative z-10">

          {/* Desktop heading */}
          <div className="mb-8 hidden lg:block">
            <p className="text-xs text-secondary font-semibold uppercase tracking-[0.18em] mb-2">
              Get started
            </p>
            <h2 className="text-3xl xl:text-4xl font-black text-[#1a2a3a] tracking-tight">
              Join the <br /> community
            </h2>
            <p className="text-[#8b9aab] text-sm mt-3">
              Create your free account and start exploring.
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-[#e8e6e4] rounded-lg text-sm font-semibold text-[#2c3e4e] bg-white hover:border-secondary/40 hover:bg-secondary/3 transition-all duration-200 disabled:opacity-50 mb-5"
          >
            <FcGoogle className="h-5 w-5 shrink-0" />
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-[#e8e6e4]" />
            <span className="text-xs text-[#8b9aab] font-medium tracking-wide whitespace-nowrap">or with email</span>
            <div className="flex-1 h-px bg-[#e8e6e4]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">

            {/* Full Name */}
            <div className="relative group">
              <label className="block text-xs font-semibold text-[#5a6b7a] mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b9aab] group-focus-within:text-secondary transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-[#e8e6e4] rounded-lg bg-[#f8f9fa] text-[#2c3e4e] placeholder-[#b0bcca] text-sm focus:outline-none focus:border-secondary focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Email */}
            <div className="relative group">
              <label className="block text-xs font-semibold text-[#5a6b7a] mb-1.5 ml-1">Email address</label>
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
              <label className="block text-xs font-semibold text-[#5a6b7a] mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b9aab] group-focus-within:text-secondary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min. 8 characters"
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

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="flex gap-1.5 mt-2 px-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        password.length >= i * 3
                          ? password.length < 6
                            ? "bg-red-400"
                            : password.length < 10
                            ? "bg-amber-400"
                            : "bg-green-400"
                          : "bg-[#e8e6e4]"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-0.5 rounded border-[#e8e6e4] text-secondary focus:ring-secondary cursor-pointer shrink-0"
              />
              <span className="text-sm text-[#5a6b7a] leading-snug">
                I agree to the{" "}
                <Link href="#" className="text-secondary font-semibold hover:underline">Terms</Link>
                {" "}and{" "}
                <Link href="#" className="text-secondary font-semibold hover:underline">Privacy Policy</Link>
              </span>
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-7 text-center text-sm text-[#5a6b7a]">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-secondary hover:text-[#1a2a3a] transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}