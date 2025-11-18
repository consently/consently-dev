'use client';

import { Sparkles, Zap, Shield, Rocket, Star, TrendingUp } from 'lucide-react';

const taglines = [
  {
    text: '🎉 Pre-Launch: ₹0.01 per consent — Limited Time Only',
    icon: <Rocket className="h-5 w-5" />,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    text: '🇮🇳 The ONLY DPDP-Compliant Tool with 22 Indian Languages',
    icon: <Shield className="h-5 w-5" />,
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    text: '🚀 1 Month Free Trial • No Credit Card Required',
    icon: <Sparkles className="h-5 w-5" />,
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    text: '⚡ Setup in 5 Minutes • Live Instantly',
    icon: <Zap className="h-5 w-5" />,
    gradient: 'from-green-500 to-green-600',
  },
  {
    text: '🎯 Trusted by 1000+ Indian Businesses',
    icon: <Star className="h-5 w-5" />,
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    text: '💰 Save 70% vs CookieYes & OneTrust',
    icon: <TrendingUp className="h-5 w-5" />,
    gradient: 'from-pink-500 to-pink-600',
  },
  {
    text: '🔍 100% Automated Cookie Scanning',
    icon: <Shield className="h-5 w-5" />,
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    text: '✨ Built for DPDP 2023 • Ready for Enforcement',
    icon: <Sparkles className="h-5 w-5" />,
    gradient: 'from-cyan-500 to-cyan-600',
  },
];

export function ScrollingBanner() {
  // Duplicate taglines for seamless infinite scroll
  const duplicatedTaglines = [...taglines, ...taglines];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 py-3 border-b-2 border-white/20 shadow-lg">
      <div className="flex animate-scroll whitespace-nowrap">
        {duplicatedTaglines.map((tagline, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-3 mx-8 text-white font-semibold text-sm sm:text-base"
          >
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${tagline.gradient} shadow-md`}>
              {tagline.icon}
            </div>
            <span className="whitespace-nowrap">{tagline.text}</span>
          </div>
        ))}
      </div>
      
      {/* Gradient overlays for fade effect */}
      <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-blue-600 to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-600 to-transparent pointer-events-none z-10" />
    </div>
  );
}

