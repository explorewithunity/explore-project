"use client";

import { Compass, Users, Globe, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-secondary tracking-tight mb-4">
            About Explore
          </h1>
          <p className="text-base text-text leading-relaxed italic">
            Connecting travelers through shared journeys and authentic experiences.
          </p>
        </div>

        <div className="space-y-16">
          {/* Mission */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-secondary/5 rounded-xl flex items-center justify-center text-secondary">
                <Compass size={24} />
              </div>
              <h2 className="text-2xl font-bold text-secondary tracking-tight">Our Mission</h2>
            </div>
            <p className="text-text leading-relaxed text-[15px]">
              Explore with Unity was born from a simple idea: that travel is better when shared. 
              Our mission is to create a global community where travelers can document their 
              adventures, discover new destinations through the eyes of others, and find like-minded 
              partners for their next big journey.
            </p>
          </section>

          {/* Key Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-primary/30 rounded-3xl border border-border/50">
              <Users size={24} className="text-secondary mb-4" />
              <h3 className="font-bold text-secondary mb-2">Community First</h3>
              <p className="text-sm text-text leading-relaxed">
                We believe in the power of shared experiences. Our platform is built around 
                the people who use it every day to document their lives.
              </p>
            </div>
            <div className="p-6 bg-primary/30 rounded-3xl border border-border/50">
              <Globe size={24} className="text-secondary mb-4" />
              <h3 className="font-bold text-secondary mb-2">Global Reach</h3>
              <p className="text-sm text-text leading-relaxed">
                From local hidden gems to worldwide expeditions, we cover every corner 
                of the globe through our diverse community of explorers.
              </p>
            </div>
          </div>

          {/* Vision */}
          <section className="bg-secondary p-8 rounded-4xl text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to start your journey?</h2>
            <p className="text-white/70 text-sm mb-8 max-w-md mx-auto">
              Join thousands of travelers who are already sharing their stories and 
              planning their next adventures on Explore with Unity.
            </p>
            <div className="inline-flex items-center justify-center px-8 py-3 bg-white text-secondary font-bold rounded-full hover:scale-105 transition-transform cursor-pointer">
              GO TO EXPLORE
            </div>
          </section>
        </div>

        <div className="mt-20 pt-8 border-t border-border text-center">
          <p className="text-xs text-text/60 uppercase tracking-widest font-bold">
            Explore with Unity • Established 2024
          </p>
        </div>
      </div>
    </div>
  );
}
