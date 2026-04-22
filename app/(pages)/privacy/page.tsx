"use client";

import { Shield, Eye, Lock, FileCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-secondary tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-text mt-2 uppercase tracking-widest font-bold opacity-60">
            Version 1.0 • April 2026
          </p>
        </div>

        <div className="prose prose-sm prose-secondary max-w-none text-text">
          <p className="leading-relaxed mb-10 text-center italic text-sm border-b border-border/50 pb-8">
            Your privacy is as important to us as your next destination. 
            We are committed to being transparent about how we collect, use, and protect your data.
          </p>

          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                <Eye size={20} className="text-secondary/40" />
                Data Collection
              </h2>
              <p className="leading-relaxed mb-4">
                We collect information you provide directly to us when you create an account, 
                post a trip, or communicate with other users. This includes:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                  Username and email address
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                  Profile photo and bio
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                  Trip details and photos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                  Communication metadata
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                <Shield size={20} className="text-secondary/40" />
                Data Security
              </h2>
              <div className="bg-primary/30 p-6 rounded-2xl border border-border italic text-[13px] leading-relaxed">
                "We use industry-standard encryption and security measures to protect your 
                personal information. Our infrastructure is designed to keep your data safe 
                and private at all times."
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                <FileCheck size={20} className="text-secondary/40" />
                Your Rights
              </h2>
              <p className="leading-relaxed">
                You have the right to access, update, or delete your personal information 
                at any time. You can also request a copy of the data we have collected about 
                you through your account settings or by contacting our support team.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
