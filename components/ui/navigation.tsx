'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile, useSafeAreaInsets } from '@/lib/hooks/useMediaQuery';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const safeAreaInsets = useSafeAreaInsets();

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen, isMobile]);

  return (
    <nav className="border-b border-blue-100 bg-white/80 dark:bg-gray-900/80 dark:border-gray-700 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Consently</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <Link href="/consulting" className="relative inline-flex items-center">
              <Button variant="ghost" size="sm" className="text-sm">Consulting</Button>
              <Badge className="absolute -top-0.5 -right-0.5 h-4 px-1.5 text-[10px] bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-md shadow-blue-500/20">
                NEW
              </Badge>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm">Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="text-sm">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-11 h-11 min-h-[44px] rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slide-in Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          top: `${safeAreaInsets.top}px`,
        }}
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
            <Shield className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Consently</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center w-11 h-11 min-h-[44px] rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation"
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Mobile Menu Content */}
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex-1 p-4 space-y-2">
            <Link href="/consulting" onClick={() => setMobileMenuOpen(false)} className="group">
              <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Consulting Services</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Expert compliance guidance</div>
                  </div>
                </div>
                <Badge className="h-5 px-1.5 text-[10px] bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-md shadow-blue-500/20">
                  NEW
                </Badge>
              </div>
            </Link>

            <div className="border-t border-gray-100 dark:border-gray-700 my-2" />

            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="group">
              <div className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-400">→</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Login</span>
              </div>
            </Link>

            <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="group">
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-medium text-white">→</span>
                </div>
                <span className="font-medium text-white">Get Started</span>
              </div>
            </Link>
          </div>

          {/* Mobile Menu Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              © 2024 Consently. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
