"use client";

import { FileText, Shield, AlertCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
      
          <h1 className="text-3xl font-bold text-secondary tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-text mt-2 uppercase tracking-widest font-bold opacity-60">
            Last Updated: April 2026
          </p>
        </div>

        <div className="prose prose-sm prose-secondary max-w-none text-text">
          <section className="mb-10 text-pretty">
            <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-secondary text-white rounded-md flex items-center justify-center text-[10px]">01</span>
              Acceptance of Terms
            </h2>
            <p className="leading-relaxed">
              By accessing or using Explore with Unity, you agree to comply with and be bound by 
              these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-secondary text-white rounded-md flex items-center justify-center text-[10px]">02</span>
              User Accounts
            </h2>
            <p className="leading-relaxed mb-4">
              To access certain features of Explore with Unity, you must register for an account. 
              You are responsible for maintaining the confidentiality of your account password and 
              for all activities that occur under your account.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm italic">
              <li>You must be at least 13 years old to use this service.</li>
              <li>You are responsible for any content you post.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-secondary text-white rounded-md flex items-center justify-center text-[10px]">03</span>
              Content Ownership
            </h2>
            <p className="leading-relaxed">
              You retain ownership of any content you post to Explore with Unity. However, by 
              posting content, you grant us a worldwide, non-exclusive, royalty-free license 
              to use, copy, reproduce, process, adapt, modify, publish, transmit, display, 
              and distribute such content in any and all media or distribution methods.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-secondary text-white rounded-md flex items-center justify-center text-[10px]">04</span>
              Prohibited Conduct
            </h2>
            <div className="bg-primary/30 p-6 rounded-2xl border border-border">
              <div className="flex gap-3 mb-4">
                <AlertCircle size={20} className="text-secondary shrink-0" />
                <p className="text-sm font-bold text-secondary">You agree not to engage in any of the following:</p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                <li className="flex gap-2"><span>•</span> Spamming or automated and unauthorized content creation</li>
                <li className="flex gap-2"><span>•</span> Harassing or threatening other users</li>
                <li className="flex gap-2"><span>•</span> Posting illegal or prohibited content</li>
                <li className="flex gap-2"><span>•</span> Compromising the security of our platform</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
