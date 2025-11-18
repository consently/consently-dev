import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 sm:py-10 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-3 sm:mb-4">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              <span className="text-base sm:text-lg font-bold text-white">Consently</span>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed">DPDPA 2023 compliant consent management for Indian businesses.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/#features" className="hover:text-white transition-colors inline-block py-1 touch-manipulation">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors inline-block py-1 touch-manipulation">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/consulting" className="hover:text-white transition-colors inline-block py-1 touch-manipulation">
                  Consulting Services
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors inline-block py-1 touch-manipulation">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors inline-block py-1 touch-manipulation">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors inline-block py-1 touch-manipulation">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition-colors inline-block py-1 touch-manipulation">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors inline-block py-1 touch-manipulation">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors inline-block py-1 touch-manipulation">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t border-gray-800 text-center text-xs sm:text-sm">
          <p>&copy; 2025 Consently. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

