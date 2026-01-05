'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-blue-100 bg-white/80 dark:bg-gray-900/80 dark:border-gray-700 backdrop-blur-sm sticky top-0 z-50">
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
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-2">
              <Link href="/consulting" onClick={() => setMobileMenuOpen(false)} className="relative inline-flex items-center w-full">
                <Button variant="ghost" className="w-full justify-start text-left">
                  Consulting Services
                </Button>
                <Badge className="ml-auto h-4 px-1.5 text-[10px] bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-md shadow-blue-500/20">
                  NEW
                </Badge>
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-left">
                  Login
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
