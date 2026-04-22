"use client";

import { Search, Mail, MessageCircle, HelpCircle, ChevronDown, Play } from "lucide-react";
import { useState } from "react";

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How do I create a new trip?",
      a: "Click on the 'Create Trip' button in your dashboard or navigation bar. Follow the prompts to add destination, dates, and photos.",
    },
    {
      q: "Can I join someone else's trip?",
      a: "Yes! If a trip is marked as 'Public' or 'Open', you'll see a 'Join Trip' button on the trip details page.",
    },
    {
      q: "How do I change my profile picture?",
      a: "Go to your Profile page, click on 'Edit Profile', and upload a new photo to the avatar section.",
    },
    {
      q: "Is Explore with Unity free to use?",
      a: "Absolutely. Our basic features are free for everyone to share and discover amazing journeys.",
    },
    {
      q: "How do I reset my password?",
      a: "On the login page, click 'Forgot Password'. We'll send instructions to your registered email address.",
    },
    {
      q: "Can I delete my journal or post?",
      a: "Yes, you can edit or delete any of your own posts by navigating to the post and selecting the action menu (three dots).",
    }
  ];

  return (
    <div className="bg-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-secondary tracking-tight mb-4">
            How can we help?
          </h1>
          <p className="text-text text-sm mb-8 max-w-sm mx-auto">
            Find answers to common questions or reach out to our support team for specialized assistance.
          </p>
        </div>

        {/* Simplified FAQ List */}
        <div className="space-y-3 mb-16">
          <p className="text-[10px] font-bold text-text uppercase tracking-widest mb-4 ml-1">Frequently Asked Questions</p>
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={i} 
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen ? "border-secondary/20 shadow-sm" : "border-border hover:border-text/30"
                }`}
              >
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex justify-between items-center p-5 text-left transition-colors"
                >
                  <span className={`text-sm font-bold transition-colors ${isOpen ? "text-secondary" : "text-text"}`}>
                    {faq.q}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-text/40 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
                  />
                </button>
                <div className={`px-5 transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                }`}>
                  <p className="text-text text-[13px] leading-relaxed border-t border-border/50 pt-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Support Section */}
        <div className="p-8 bg-secondary rounded-4xl text-white overflow-hidden relative group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 text-center">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Still need help?</h3>
            <p className="text-white/70 text-sm max-w-sm mx-auto mb-8">
              Can't find the answer you're looking for? Reach out to our team at support@exploreunity.com
            </p>
            <button className="px-8 py-3 bg-white text-secondary font-bold rounded-full hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest">
              CONTACT SUPPORT
            </button>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-border text-center">
          <p className="text-[10px] text-text/40 font-bold uppercase tracking-widest">
            Explore with Unity Support Center
          </p>
        </div>
      </div>
    </div>
  );
}
